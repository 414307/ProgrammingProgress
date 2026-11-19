<script setup lang="ts">
import { computed } from 'vue'
import { useProblemStore } from '../composables/useProblemStore'
import type { Difficulty, ProblemStatus } from '../types/problem'
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Eye,
  GitBranch,
  Search,
  MessageSquare
} from '@lucide/vue'
import { ref } from 'vue'

const { problems, selectedProblemId, selectProblem } = useProblemStore()

const searchQuery = ref('')
const selectedDifficulty = ref<string>('all')
const selectedStatus = ref<string>('all')

const filteredProblems = computed(() => {
  return problems.value.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchDiff = selectedDifficulty.value === 'all' || p.difficulty === selectedDifficulty.value
    const matchStatus = selectedStatus.value === 'all' || p.status === selectedStatus.value
    return matchSearch && matchDiff && matchStatus
  })
})

const difficultyBadge = (diff: Difficulty) => {
  switch (diff) {
    case 'easy':
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    case 'medium':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    case 'hard':
      return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800'
  }
}

const statusBadge = (status: ProblemStatus) => {
  switch (status) {
    case 'solved':
      return { text: '已解決', icon: CheckCircle2, class: 'text-emerald-500' }
    case 'solving':
      return { text: '解題中', icon: Clock, class: 'text-blue-500' }
    case 'review':
      return { text: '待複習', icon: Eye, class: 'text-amber-500' }
    default:
      return { text: '未開始', icon: HelpCircle, class: 'text-slate-400' }
  }
}
</script>

<template>
  <aside class="w-80 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-[calc(100vh-61px)]">
    <!-- Filter Bar -->
    <div class="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
      <div class="relative">
        <Search class="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋題目或標籤..."
          class="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="selectedDifficulty"
          class="flex-1 text-xs px-2 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
        >
          <option value="all">難度 (全部)</option>
          <option value="easy">Easy 簡單</option>
          <option value="medium">Medium 中等</option>
          <option value="hard">Hard 困難</option>
        </select>
        <select
          v-model="selectedStatus"
          class="flex-1 text-xs px-2 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
        >
          <option value="all">狀態 (全部)</option>
          <option value="solved">已解決</option>
          <option value="solving">解題中</option>
          <option value="review">待複習</option>
          <option value="todo">未開始</option>
        </select>
      </div>
    </div>

    <!-- Problem List -->
    <div class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
      <div
        v-for="problem in filteredProblems"
        :key="problem.id"
        @click="selectProblem(problem.id)"
        :class="[
          'p-3.5 cursor-pointer transition-all border-l-4 text-left select-none',
          selectedProblemId === problem.id
            ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-600 dark:border-indigo-500'
            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
        ]"
      >
        <div class="flex items-start justify-between gap-2">
          <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
            {{ problem.title }}
          </h2>
          <span
            :class="[
              'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border flex-shrink-0',
              difficultyBadge(problem.difficulty)
            ]"
          >
            {{ problem.difficulty }}
          </span>
        </div>

        <div class="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div class="flex items-center space-x-1.5">
            <component :is="statusBadge(problem.status).icon" :class="['w-3.5 h-3.5', statusBadge(problem.status).class]" />
            <span>{{ statusBadge(problem.status).text }}</span>
          </div>

          <div class="flex items-center space-x-3 text-[11px]">
            <span class="flex items-center space-x-1 text-slate-500 dark:text-slate-400" title="版本數量">
              <GitBranch class="w-3 h-3 text-indigo-500" />
              <span>{{ problem.versions.length }} 個版本</span>
            </span>
            <span v-if="problem.comments.length > 0" class="flex items-center space-x-0.5 text-violet-500" title="師生討論">
              <MessageSquare class="w-3 h-3" />
              <span>{{ problem.comments.length }}</span>
            </span>
          </div>
        </div>

        <!-- Tags -->
        <div class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="tag in problem.tags"
            :key="tag"
            class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            #{{ tag }}
          </span>
        </div>
      </div>

      <div v-if="filteredProblems.length === 0" class="p-8 text-center text-slate-400 text-sm">
        查無符合條件的題目
      </div>
    </div>
  </aside>
</template>
