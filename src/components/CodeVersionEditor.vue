<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useProblemStore } from '../composables/useProblemStore'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import {
  Sparkles,
  Copy,
  Check,
  Plus,
  GitBranch,
  Timer,
  HardDrive,
  Edit3,
  Calendar
} from '@lucide/vue'

const {
  currentProblem,
  currentVersion,
  currentRole,
  isAnalyzing,
  selectVersion,
  addVersion,
  updateCurrentVersionCode,
  triggerAIAnalysis,
} = useProblemStore()

const isEditing = ref(false)
const editableCode = ref('')
const copied = ref(false)
const showNewVersionModal = ref(false)
const newVersionName = ref('')

// 同步編輯程式碼
watch(
  () => currentVersion.value?.code,
  (newVal) => {
    editableCode.value = newVal || ''
    nextTick(() => {
      Prism.highlightAll()
    })
  },
  { immediate: true }
)

// 複製到剪貼簿
async function copyCode() {
  if (!currentVersion.value?.code) return
  await navigator.clipboard.writeText(currentVersion.value.code)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

// 儲存修改的程式碼
function saveCode() {
  updateCurrentVersionCode(editableCode.value)
  isEditing.value = false
  nextTick(() => {
    Prism.highlightAll()
  })
}

// 建立新版本
function handleCreateVersion() {
  if (!currentProblem.value) return
  addVersion(
    currentProblem.value.id,
    newVersionName.value || `v${currentProblem.value.versions.length + 1} - 優化實作`
  )
  newVersionName.value = ''
  showNewVersionModal.value = false
}

function formatDate(isoStr: string) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden border-r border-slate-200 dark:border-slate-800">
    <!-- Version Selector Toolbar -->
    <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-slate-900/50">
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <GitBranch class="w-4 h-4 text-indigo-500" />
          <span>目前版本:</span>
        </div>

        <!-- Version Dropdown -->
        <select
          v-if="currentProblem"
          :value="currentVersion?.versionId"
          @change="(e) => selectVersion((e.target as HTMLSelectElement).value)"
          class="text-xs font-medium py-1.5 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option
            v-for="v in currentProblem.versions"
            :key="v.versionId"
            :value="v.versionId"
          >
            {{ v.versionName }}
          </option>
        </select>

        <!-- Add Version Button (Student only) -->
        <button
          v-if="currentRole === 'student'"
          @click="showNewVersionModal = true"
          class="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 transition"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>建立新版本</span>
        </button>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center flex-wrap gap-2">
        <!-- Edit Toggle (Student only) -->
        <button
          v-if="currentRole === 'student' && !isEditing"
          @click="isEditing = true"
          class="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
        >
          <Edit3 class="w-3.5 h-3.5" />
          <span>編輯程式碼</span>
        </button>

        <button
          v-if="currentRole === 'student' && isEditing"
          @click="saveCode"
          class="flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
        >
          <Check class="w-3.5 h-3.5" />
          <span>儲存版本</span>
        </button>

        <!-- AI Analyze Button -->
        <button
          @click="triggerAIAnalysis"
          :disabled="isAnalyzing"
          class="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Sparkles class="w-3.5 h-3.5 animate-pulse" />
          <span>{{ isAnalyzing ? 'AI 分析中...' : '🤖 AI 分析複雜度' }}</span>
        </button>

        <!-- Copy Code Button -->
        <button
          @click="copyCode"
          class="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
          title="複製程式碼"
        >
          <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-500" />
          <Copy v-else class="w-3.5 h-3.5" />
          <span>{{ copied ? '已複製' : '複製' }}</span>
        </button>
      </div>
    </div>

    <!-- Code Editor / Viewer Area -->
    <div class="relative flex-1 overflow-auto bg-[#2d3748] text-slate-100 font-mono text-sm">
      <!-- Edit Mode -->
      <textarea
        v-if="isEditing"
        v-model="editableCode"
        class="w-full h-full p-4 bg-transparent text-slate-100 font-mono text-sm leading-relaxed outline-none resize-none focus:ring-0"
        spellcheck="false"
        placeholder="// 請輸入程式碼..."
      ></textarea>

      <!-- View Mode with Prism Syntax Highlight -->
      <pre
        v-else
        class="m-0 p-4 h-full overflow-auto !bg-transparent !text-slate-100 !leading-relaxed"
      ><code class="language-typescript">{{ currentVersion?.code || '// 目前尚無程式碼' }}</code></pre>
    </div>

    <!-- AI Complexity & Optimization Insights Panel -->
    <div class="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 p-4">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-2">
          <Sparkles class="w-4 h-4 text-purple-500" />
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            AI 複雜度與效能診斷
          </h3>
        </div>
        <span class="text-[11px] text-slate-400 flex items-center space-x-1">
          <Calendar class="w-3 h-3" />
          <span>版本更新時間: {{ formatDate(currentVersion?.createdAt || '') }}</span>
        </span>
      </div>

      <!-- Badges -->
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="flex items-center space-x-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
          <div class="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Timer class="w-4 h-4" />
          </div>
          <div>
            <div class="text-[10px] text-slate-400">時間複雜度 (Time)</div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">
              {{ currentVersion?.timeComplexity || '未分析' }}
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
          <div class="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <HardDrive class="w-4 h-4" />
          </div>
          <div>
            <div class="text-[10px] text-slate-400">空間複雜度 (Space)</div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">
              {{ currentVersion?.spaceComplexity || '未分析' }}
            </div>
          </div>
        </div>
      </div>

      <!-- AI Suggestion Content -->
      <div class="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
        {{ currentVersion?.aiSuggestion || '點擊上方「🤖 AI 分析複雜度」讓 AI 評估該演算法版本！' }}
      </div>
    </div>

    <!-- Create Version Modal -->
    <div
      v-if="showNewVersionModal"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 dark:border-slate-700">
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">
          建立新的程式碼版本
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          將複製當前程式碼作為新起點，並為此解法命名（例如："v2 - DP 記憶化搜尋"）。
        </p>

        <input
          v-model="newVersionName"
          type="text"
          placeholder="例如：v2 - 雙指標夾擠優化"
          class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
        />

        <div class="flex justify-end space-x-2">
          <button
            @click="showNewVersionModal = false"
            class="px-3 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            取消
          </button>
          <button
            @click="handleCreateVersion"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
          >
            確定建立
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
