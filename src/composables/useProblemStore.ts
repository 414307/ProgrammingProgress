import { ref, computed } from 'vue'
import type { Problem, CodeVersion, Comment, UserRole, ProblemStatus } from '../types/problem'
import { INITIAL_PROBLEMS } from '../lib/mockData'
import { analyzeCodeWithAI } from '../lib/aiAnalyzer'
import { api } from '../lib/api'
import { getSavedGitHubConfig, GitHubSyncService } from '../lib/githubSync'

const STORAGE_KEY = 'code_mentor_problems_v1'
const ROLE_KEY = 'code_mentor_current_role'

// 狀態共享 Singleton
const problems = ref<Problem[]>([])
const currentRole = ref<UserRole>('student')
const selectedProblemId = ref<string>('')
const activeVersionId = ref<string>('')
const isAnalyzing = ref<boolean>(false)
const isUsingSqlite = ref<boolean>(false)
const isUsingGitHub = ref<boolean>(false)
const isGitHubSyncing = ref<boolean>(false)

// 取得 GitHub 服務實例
function getGitHubService(): GitHubSyncService | null {
  const cfg = getSavedGitHubConfig()
  return cfg ? new GitHubSyncService(cfg) : null
}

// 非同步將當前題目 commit 回 GitHub 倉庫
async function syncToGitHub(commitMsg?: string) {
  const gh = getGitHubService()
  if (!gh) return
  isGitHubSyncing.value = true
  try {
    await gh.commitProblems(problems.value, commitMsg)
  } catch (err) {
    console.error('Failed to commit to GitHub:', err)
  } finally {
    isGitHubSyncing.value = false
  }
}

// 初始化資料庫：優先依序連線 GitHub 倉庫 > 本地 SQLite > 降級 LocalStorage
async function initStore() {
  const ghConfig = getSavedGitHubConfig()
  if (ghConfig) {
    try {
      const gh = new GitHubSyncService(ghConfig)
      const remote = await gh.fetchRemoteFile()
      if (remote.problems && remote.problems.length > 0) {
        problems.value = remote.problems
        isUsingGitHub.value = true
        finishInit()
        return
      }
    } catch (e) {
      console.warn('GitHub sync failed, trying SQLite/Local fallback:', e)
    }
  }

  const hasSqlite = await api.checkHealth()
  if (hasSqlite) {
    try {
      const data = await api.getProblems()
      problems.value = data
      isUsingSqlite.value = true
    } catch {
      loadFromLocalStorage()
    }
  } else {
    loadFromLocalStorage()
  }

  finishInit()
}

function finishInit() {
  const savedRole = localStorage.getItem(ROLE_KEY) as UserRole
  if (savedRole && (savedRole === 'student' || savedRole === 'teacher')) {
    currentRole.value = savedRole
  }

  if (problems.value.length > 0) {
    selectedProblemId.value = problems.value[0].id
    if (problems.value[0].versions.length > 0) {
      activeVersionId.value = problems.value[0].versions[0].versionId
    }
  }
}

async function reloadFromGitHub() {
  const gh = getGitHubService()
  if (!gh) return
  try {
    const remote = await gh.fetchRemoteFile()
    if (remote.problems) {
      problems.value = remote.problems
      isUsingGitHub.value = true
      isUsingSqlite.value = false
    }
  } catch (err) {
    console.error('reloadFromGitHub failed:', err)
  }
}

function loadFromLocalStorage() {
  isUsingSqlite.value = false
  const savedProblems = localStorage.getItem(STORAGE_KEY)
  if (savedProblems) {
    try {
      problems.value = JSON.parse(savedProblems)
    } catch {
      problems.value = INITIAL_PROBLEMS
    }
  } else {
    problems.value = INITIAL_PROBLEMS
    saveToStorage()
  }
}

function saveToStorage() {
  if (!isUsingSqlite.value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(problems.value))
  }
  if (isUsingGitHub.value) {
    syncToGitHub()
  }
}

export function useProblemStore() {
  if (problems.value.length === 0) {
    initStore()
  }

  const currentProblem = computed(() => {
    return problems.value.find((p) => p.id === selectedProblemId.value) || problems.value[0] || null
  })

  const currentVersion = computed(() => {
    if (!currentProblem.value) return null
    return (
      currentProblem.value.versions.find((v) => v.versionId === activeVersionId.value) ||
      currentProblem.value.versions[0] ||
      null
    )
  })

  // 切換身分
  function switchRole(role: UserRole) {
    currentRole.value = role
    localStorage.setItem(ROLE_KEY, role)
  }

  // 選擇題目
  function selectProblem(id: string) {
    selectedProblemId.value = id
    const prob = problems.value.find((p) => p.id === id)
    if (prob && prob.versions.length > 0) {
      activeVersionId.value = prob.versions[prob.versions.length - 1].versionId
    }
  }

  // 選擇特定版本
  function selectVersion(vId: string) {
    activeVersionId.value = vId
  }

  // 建立新題目
  async function addProblem(data: Omit<Problem, 'id' | 'updatedAt' | 'comments' | 'versions'> & { initialCode?: string }) {
    if (isUsingSqlite.value) {
      try {
        const list = await api.addProblem(data)
        problems.value = list
        if (list.length > 0) {
          selectedProblemId.value = list[0].id
          activeVersionId.value = list[0].versions[0]?.versionId || ''
        }
        return
      } catch (e) {
        console.error('Failed to add via SQLite:', e)
      }
    }

    // LocalStorage Fallback
    const id = 'p-' + Date.now()
    const initialVersion: CodeVersion = {
      versionId: 'v-' + Date.now(),
      versionName: 'v1 - 初始實作',
      code: data.initialCode || '// 請在此撰寫您的解題程式碼\n',
      timeComplexity: '未分析',
      spaceComplexity: '未分析',
      aiSuggestion: '點擊上方「AI 分析」按鈕以獲取演算法複雜度評估與優化建議。',
      createdAt: new Date().toISOString(),
    }

    const now = new Date().toISOString()
    const startedAt = (data.status === 'solving' || data.status === 'solved') ? now : null

    const newProb: Problem = {
      id,
      title: data.title,
      platform: data.platform || 'LeetCode',
      url: data.url || '',
      difficulty: data.difficulty,
      status: data.status,
      tags: data.tags,
      notes: data.notes || '',
      versions: [initialVersion],
      comments: [],
      startedAt,
      updatedAt: now,
    }

    problems.value.unshift(newProb)
    selectedProblemId.value = id
    activeVersionId.value = initialVersion.versionId
    saveToStorage()
  }

  // 新增程式碼版本
  async function addVersion(problemId: string, versionName: string, initialCode?: string) {
    const code = initialCode !== undefined ? initialCode : (currentVersion.value?.code || '')

    if (isUsingSqlite.value) {
      try {
        const { list, newVersionId } = await api.addVersion(problemId, versionName, code)
        problems.value = list
        activeVersionId.value = newVersionId
        return
      } catch (e) {
        console.error('Failed to add version via SQLite:', e)
      }
    }

    // LocalStorage Fallback
    const prob = problems.value.find((p) => p.id === problemId)
    if (!prob) return

    const newVersion: CodeVersion = {
      versionId: 'v-' + Date.now(),
      versionName: versionName.trim() || `v${prob.versions.length + 1} - 優化版本`,
      code,
      timeComplexity: '未分析',
      spaceComplexity: '未分析',
      aiSuggestion: '新建立的版本，請執行 AI 分析。',
      createdAt: new Date().toISOString(),
    }

    prob.versions.push(newVersion)
    prob.updatedAt = new Date().toISOString()
    activeVersionId.value = newVersion.versionId
    saveToStorage()
  }

  // 更新目前版本程式碼
  async function updateCurrentVersionCode(code: string) {
    if (!currentVersion.value) return
    currentVersion.value.code = code
    if (currentProblem.value) {
      currentProblem.value.updatedAt = new Date().toISOString()
    }

    if (isUsingSqlite.value) {
      api.updateVersionCode(currentVersion.value.versionId, code, currentProblem.value?.id)
    } else {
      saveToStorage()
    }
  }

  // 更新題目筆記
  async function updateProblemNotes(notes: string) {
    if (!currentProblem.value) return
    currentProblem.value.notes = notes
    currentProblem.value.updatedAt = new Date().toISOString()

    if (isUsingSqlite.value) {
      api.updateProblemNotes(currentProblem.value.id, notes)
    } else {
      saveToStorage()
    }
  }

  // 更新題目完整資訊
  async function updateProblemDetails(id: string, updates: Partial<Pick<Problem, 'title' | 'platform' | 'url' | 'difficulty' | 'status' | 'tags'>>) {
    if (isUsingSqlite.value) {
      try {
        const list = await api.updateProblemDetails(id, updates)
        problems.value = list
        return
      } catch (e) {
        console.error('Failed to update details via SQLite:', e)
      }
    }

    const prob = problems.value.find((p) => p.id === id)
    if (!prob) return
    const now = new Date().toISOString()
    // 首次變更為 solving 或 solved 時紀錄 startedAt
    if (!prob.startedAt && (updates.status === 'solving' || updates.status === 'solved')) {
      prob.startedAt = now
    }
    Object.assign(prob, updates, { updatedAt: now })
    saveToStorage()
  }

  // 快速切換題目狀態
  async function updateProblemStatus(id: string, newStatus: ProblemStatus) {
    const prob = problems.value.find((p) => p.id === id)
    if (!prob) return
    const now = new Date().toISOString()
    // 首次變更為 solving 或 solved 時紀錄 startedAt
    if (!prob.startedAt && (newStatus === 'solving' || newStatus === 'solved')) {
      prob.startedAt = now
    }
    prob.status = newStatus
    prob.updatedAt = now

    if (isUsingSqlite.value) {
      api.updateProblemStatus(id, newStatus)
    } else {
      saveToStorage()
    }
  }

  // 執行 AI 複雜度分析
  async function triggerAIAnalysis() {
    if (!currentProblem.value || !currentVersion.value) return
    isAnalyzing.value = true
    try {
      const result = await analyzeCodeWithAI(currentVersion.value.code, currentProblem.value.title)
      currentVersion.value.timeComplexity = result.timeComplexity
      currentVersion.value.spaceComplexity = result.spaceComplexity
      currentVersion.value.aiSuggestion = result.aiSuggestion
      currentProblem.value.updatedAt = new Date().toISOString()

      if (isUsingSqlite.value) {
        await api.updateVersionAI(currentVersion.value.versionId, result, currentProblem.value.id)
      } else {
        saveToStorage()
      }
    } finally {
      isAnalyzing.value = false
    }
  }

  // 新增師生留言
  async function addComment(content: string) {
    if (!currentProblem.value || !content.trim()) return
    const author = currentRole.value

    if (isUsingSqlite.value) {
      try {
        const newC = await api.addComment(currentProblem.value.id, author, content.trim())
        currentProblem.value.comments.push(newC)
        currentProblem.value.updatedAt = newC.createdAt
        return
      } catch (e) {
        console.error('Failed to add comment via SQLite:', e)
      }
    }

    const newComment: Comment = {
      id: 'c-' + Date.now(),
      author,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    }
    currentProblem.value.comments.push(newComment)
    currentProblem.value.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  // 刪除題目
  async function deleteProblem(id: string) {
    if (isUsingSqlite.value) {
      try {
        const list = await api.deleteProblem(id)
        problems.value = list
        if (selectedProblemId.value === id) {
          selectedProblemId.value = list[0]?.id || ''
          activeVersionId.value = list[0]?.versions[0]?.versionId || ''
        }
        return
      } catch (e) {
        console.error('Failed to delete via SQLite:', e)
      }
    }

    problems.value = problems.value.filter((p) => p.id !== id)
    if (selectedProblemId.value === id) {
      selectedProblemId.value = problems.value[0]?.id || ''
      activeVersionId.value = problems.value[0]?.versions[0]?.versionId || ''
    }
    saveToStorage()
  }

  return {
    problems,
    currentRole,
    selectedProblemId,
    activeVersionId,
    isAnalyzing,
    isUsingSqlite,
    isUsingGitHub,
    isGitHubSyncing,
    reloadFromGitHub,
    syncToGitHub,
    currentProblem,
    currentVersion,
    switchRole,
    selectProblem,
    selectVersion,
    addProblem,
    addVersion,
    updateCurrentVersionCode,
    updateProblemNotes,
    updateProblemDetails,
    updateProblemStatus,
    triggerAIAnalysis,
    addComment,
    deleteProblem,
  }
}
