<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProblemStore } from '../composables/useProblemStore'
import type { Problem, Difficulty, ProblemStatus } from '../types/problem'
import { X, Edit2, Trash2 } from '@lucide/vue'

const props = defineProps<{
  problem: Problem
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { updateProblemDetails, deleteProblem } = useProblemStore()

const title = ref(props.problem.title)
const platform = ref(props.problem.platform)
const url = ref(props.problem.url || '')
const difficulty = ref<Difficulty>(props.problem.difficulty)
const status = ref<ProblemStatus>(props.problem.status)
const tagsInput = ref(props.problem.tags.join(', '))

watch(() => props.problem, (newProb) => {
  if (newProb) {
    title.value = newProb.title
    platform.value = newProb.platform
    url.value = newProb.url || ''
    difficulty.value = newProb.difficulty
    status.value = newProb.status
    tagsInput.value = newProb.tags.join(', ')
  }
})

function handleSave() {
  if (!title.value.trim()) return

  const tags = tagsInput.value
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  updateProblemDetails(props.problem.id, {
    title: title.value.trim(),
    platform: platform.value.trim() || 'LeetCode',
    url: url.value.trim(),
    difficulty: difficulty.value,
    status: status.value,
    tags: tags.length > 0 ? tags : ['Algorithm'],
  })

  emit('close')
}

function handleDelete() {
  if (confirm(`確定要刪除題目「${props.problem.title}」及其所有版本嗎？此操作不可復原。`)) {
    deleteProblem(props.problem.id)
    emit('close')
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
        <div class="flex items-center space-x-2">
          <Edit2 class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 class="text-base font-bold text-slate-900 dark:text-white">
            編輯題目資訊與狀態
          </h2>
        </div>
        <button
          @click="emit('close')"
          class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form Inputs -->
      <form @submit.prevent="handleSave" class="space-y-4">
        <!-- Title & Platform -->
        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-2">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              題目名稱 *
            </label>
            <input
              v-model="title"
              required
              type="text"
              class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              題目來源名稱
            </label>
            <input
              v-model="platform"
              type="text"
              placeholder="LeetCode / ZeroJudge"
              class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <!-- Problem URL -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            題目原始網址連結 (URL)
          </label>
          <input
            v-model="url"
            type="url"
            placeholder="例如：https://leetcode.com/problems/two-sum/"
            class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <!-- Difficulty & Status (重點：可自由變更狀態) -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              題目難度
            </label>
            <select
              v-model="difficulty"
              class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="easy">Easy (簡單)</option>
              <option value="medium">Medium (中等)</option>
              <option value="hard">Hard (困難)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              解題狀態
            </label>
            <select
              v-model="status"
              class="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-indigo-50/50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="todo">⚪ 未開始 (Todo)</option>
              <option value="solving">🔵 解題中 (Solving)</option>
              <option value="solved">🟢 已解決 (Solved)</option>
              <option value="review">🟠 待複習 (Review)</option>
            </select>
          </div>
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            分類標籤 (以逗號分隔)
          </label>
          <input
            v-model="tagsInput"
            type="text"
            placeholder="例如：Array, Hash Table, DP"
            class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            @click="handleDelete"
            class="flex items-center space-x-1 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>刪除題目</span>
          </button>

          <div class="flex space-x-2">
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              儲存變更
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
