<script setup lang="ts">
import { ref } from 'vue'
import { useProblemStore } from '../composables/useProblemStore'
import type { Difficulty, ProblemStatus } from '../types/problem'
import { X, PlusCircle } from '@lucide/vue'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { addProblem } = useProblemStore()

const title = ref('')
const platform = ref('LeetCode')
const url = ref('')
const difficulty = ref<Difficulty>('medium')
const status = ref<ProblemStatus>('todo')
const tagsInput = ref('')
const notes = ref('')
const initialCode = ref(`function solve() {
  // 請在此實作程式碼
}
`)

function handleSubmit() {
  if (!title.value.trim()) return

  const tags = tagsInput.value
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  addProblem({
    title: title.value.trim(),
    platform: platform.value.trim() || 'LeetCode',
    url: url.value.trim(),
    difficulty: difficulty.value,
    status: status.value,
    tags: tags.length > 0 ? tags : ['Algorithm'],
    notes: notes.value.trim(),
    initialCode: initialCode.value,
  })

  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
        <div class="flex items-center space-x-2">
          <PlusCircle class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 class="text-base font-bold text-slate-900 dark:text-white">
            新增刷題記錄
          </h2>
        </div>
        <button
          @click="emit('close')"
          class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form Inputs (Scrollable) -->
      <form @submit.prevent="handleSubmit" class="space-y-3.5 flex-1 overflow-y-auto pr-1">
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
              placeholder="例如：300. 最長遞增子序列 (LIS)"
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
            placeholder="例如：https://leetcode.com/problems/longest-increasing-subsequence/"
            class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <!-- Difficulty & Status -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              難度
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
              初始狀態
            </label>
            <select
              v-model="status"
              class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="todo">未開始 (Todo - 暫不紀錄開始時間)</option>
              <option value="solving">解題中 (Solving - 立即紀錄開始時間)</option>
              <option value="solved">已解決 (Solved - 立即紀錄開始時間)</option>
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
            placeholder="例如：DP, Binary Search, Array"
            class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <!-- Initial Code -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            初始版本 (Version 1) 程式碼
          </label>
          <textarea
            v-model="initialCode"
            rows="5"
            class="w-full font-mono p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          ></textarea>
        </div>

        <!-- Initial Notes -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            個人解題心得筆記 (選填)
          </label>
          <textarea
            v-model="notes"
            rows="2"
            placeholder="記錄思考方向或解題卡關點..."
            class="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          ></textarea>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
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
            儲存並建立
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
