<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  getSavedGitHubConfig,
  saveGitHubConfig,
  clearGitHubConfig,
  GitHubSyncService,
  type GitHubSyncConfig
} from '../lib/githubSync'
import { useProblemStore } from '../composables/useProblemStore'
import {
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CloudUpload,
  Key,
  FolderGit2,
  Lock
} from '@lucide/vue'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { problems, reloadFromGitHub } = useProblemStore()

const owner = ref('')
const repo = ref('')
const branch = ref('main')
const path = ref('data/problems.json')
const token = ref('')

const isConnecting = ref(false)
const syncStatus = ref<'idle' | 'success' | 'error'>('idle')
const statusMessage = ref('')

onMounted(() => {
  const cfg = getSavedGitHubConfig()
  if (cfg) {
    owner.value = cfg.owner
    repo.value = cfg.repo
    branch.value = cfg.branch || 'main'
    path.value = cfg.path || 'data/problems.json'
    token.value = cfg.token
  }
})

async function handleTestAndSave() {
  if (!owner.value.trim() || !repo.value.trim() || !token.value.trim()) {
    syncStatus.value = 'error'
    statusMessage.value = '請完整填寫 GitHub 帳號、倉庫名稱與 Access Token！'
    return
  }

  isConnecting.value = true
  syncStatus.value = 'idle'
  statusMessage.value = '連線測試中...'

  const config: GitHubSyncConfig = {
    owner: owner.value.trim(),
    repo: repo.value.trim(),
    branch: branch.value.trim() || 'main',
    path: path.value.trim() || 'data/problems.json',
    token: token.value.trim(),
  }

  try {
    const service = new GitHubSyncService(config)
    const result = await service.fetchRemoteFile()

    saveGitHubConfig(config)
    syncStatus.value = 'success'

    if (result.problems && result.problems.length > 0) {
      statusMessage.value = `連線成功！倉庫中已有 ${result.problems.length} 道題目，將自動同步至本機。`
      await reloadFromGitHub()
    } else {
      statusMessage.value = `連線成功！遠端檔案尚未建立，正在執行初次推播...`
      await service.commitProblems(problems.value, 'Initial commit: CodeMentor problems')
      statusMessage.value = `連線成功並已完成初次資料推播！`
    }
  } catch (err: any) {
    syncStatus.value = 'error'
    statusMessage.value = `連線失敗: ${err.message || '請確認 Token 權限或倉庫名稱'}`
  } finally {
    isConnecting.value = false
  }
}

function handleDisconnect() {
  if (confirm('確定要中斷與 GitHub 倉庫的連線設定嗎？')) {
    clearGitHubConfig()
    owner.value = ''
    repo.value = ''
    token.value = ''
    syncStatus.value = 'idle'
    statusMessage.value = '已中斷連線。'
    window.location.reload()
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
        <div class="flex items-center space-x-2.5">
          <div class="p-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 flex items-center justify-center">
            <FolderGit2 class="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">
              GitHub 倉庫雲端儲存設定
            </h2>
            <p class="text-[11px] text-slate-500">
              透過 GitHub REST API 直接將刷題記錄 Commit 至你的倉庫
            </p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Instructions / Alert -->
      <div class="p-3 mb-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed flex items-start space-x-2">
        <FolderGit2 class="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <span>
            當你在網頁中新增題目、程式碼版本或留下評語時，系統會自動在你的 GitHub 倉庫進行 <strong>Git Commit</strong>，永久保存並支援跨裝置同步！
          </span>
        </div>
      </div>

      <!-- Form Inputs -->
      <form @submit.prevent="handleTestAndSave" class="space-y-3.5 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GitHub 帳號 (Owner) *
            </label>
            <input
              v-model="owner"
              required
              type="text"
              placeholder="例如：my-username"
              class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              倉庫名稱 (Repository) *
            </label>
            <input
              v-model="repo"
              required
              type="text"
              placeholder="例如：code-problems-repo"
              class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              分支 (Branch)
            </label>
            <input
              v-model="branch"
              type="text"
              placeholder="main"
              class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              儲存檔案路徑 (Path)
            </label>
            <input
              v-model="path"
              type="text"
              placeholder="data/problems.json"
              class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <Key class="w-3.5 h-3.5 text-amber-500" />
              <span>Personal Access Token (PAT) *</span>
            </label>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=CodeMentor+AI+Storage"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-0.5"
            >
              <span>點此產生 Token (需勾選 repo 權限)</span>
            </a>
          </div>
          <input
            v-model="token"
            required
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <p class="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
            <Lock class="w-3 h-3 text-slate-400" />
            <span>此 Token 僅保存在您瀏覽器本機的 LocalStorage 中，絕不上傳第三方伺服器。</span>
          </p>
        </div>

        <!-- Status Message Banner -->
        <div
          v-if="statusMessage"
          :class="[
            'p-2.5 rounded-lg border text-xs flex items-start space-x-2 transition',
            syncStatus === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' :
            syncStatus === 'error' ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300' :
            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          ]"
        >
          <component
            :is="syncStatus === 'success' ? CheckCircle2 : syncStatus === 'error' ? AlertCircle : RefreshCw"
            :class="['w-4 h-4 flex-shrink-0 mt-0.5', syncStatus === 'idle' ? 'animate-spin' : '']"
          />
          <div class="flex-1 whitespace-pre-wrap">{{ statusMessage }}</div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            @click="handleDisconnect"
            class="text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs font-medium"
          >
            中斷連線
          </button>

          <div class="flex space-x-2">
            <button
              type="button"
              @click="emit('close')"
              class="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="isConnecting"
              class="flex items-center space-x-1.5 px-4 py-1.5 font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-sm transition active:scale-95"
            >
              <CloudUpload class="w-3.5 h-3.5" />
              <span>{{ isConnecting ? '驗證連線中...' : '測試並連接倉庫' }}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
