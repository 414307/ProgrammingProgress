<script setup lang="ts">
import { computed } from 'vue'
import { useProblemStore } from '../composables/useProblemStore'
import {
  CheckCircle2,
  Clock,
  Code,
  GraduationCap,
  MessageSquare,
  TrendingUp
} from '@lucide/vue'

const { problems, selectProblem } = useProblemStore()

const stats = computed(() => {
  const total = problems.value.length
  const solved = problems.value.filter((p) => p.status === 'solved').length
  const solving = problems.value.filter((p) => p.status === 'solving').length
  const totalVersions = problems.value.reduce((acc, p) => acc + p.versions.length, 0)
  const totalComments = problems.value.reduce((acc, p) => acc + p.comments.length, 0)
  const easyCount = problems.value.filter((p) => p.difficulty === 'easy').length
  const medCount = problems.value.filter((p) => p.difficulty === 'medium').length
  const hardCount = problems.value.filter((p) => p.difficulty === 'hard').length

  return {
    total,
    solved,
    solving,
    totalVersions,
    totalComments,
    completionRate: total > 0 ? Math.round((solved / total) * 100) : 0,
    difficultyDist: { easy: easyCount, medium: medCount, hard: hardCount }
  }
})
</script>

<template>
  <div class="p-6 bg-slate-50 dark:bg-slate-950 flex-1 overflow-y-auto">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Banner -->
      <div class="p-5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white shadow-lg flex items-center justify-between">
        <div>
          <div class="flex items-center space-x-2 text-violet-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <GraduationCap class="w-4 h-4" />
            <span>Teacher Mode Dashboard</span>
          </div>
          <h2 class="text-xl font-bold">
            學生刷題進度與程式演進概覽
          </h2>
          <p class="text-xs text-violet-100 mt-1 max-w-xl">
            老師可以宏觀檢視學生的多版本優化歷程、演算法複雜度躍升幅度，並即時針對卡關題進行留言批改。
          </p>
        </div>
        <div class="text-right hidden sm:block">
          <div class="text-3xl font-extrabold">{{ stats.completionRate }}%</div>
          <div class="text-xs text-violet-200">題目完成解題率</div>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs text-slate-500">已解決題目</div>
            <div class="text-xl font-bold text-slate-900 dark:text-white">
              {{ stats.solved }} / {{ stats.total }}
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div class="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Code class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs text-slate-500">程式版本累計</div>
            <div class="text-xl font-bold text-slate-900 dark:text-white">
              {{ stats.totalVersions }} 個版本
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div class="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
            <MessageSquare class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs text-slate-500">師生回饋對話</div>
            <div class="text-xl font-bold text-slate-900 dark:text-white">
              {{ stats.totalComments }} 則討論
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div class="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Clock class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs text-slate-500">待指導 / 攻克中</div>
            <div class="text-xl font-bold text-slate-900 dark:text-white">
              {{ stats.solving }} 題
            </div>
          </div>
        </div>
      </div>

      <!-- Problem Review Table -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <TrendingUp class="w-4 h-4 text-indigo-500" />
            <span>學生各題優化演算法追蹤清單</span>
          </h3>
          <span class="text-xs text-slate-500">點擊題目即可快速調閱其版本程式碼與進行點評</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="p-3.5 font-semibold">題目名稱</th>
                <th class="p-3.5 font-semibold">難度</th>
                <th class="p-3.5 font-semibold">狀態</th>
                <th class="p-3.5 font-semibold">演化版本 (從暴力至最優)</th>
                <th class="p-3.5 font-semibold">師生交流</th>
                <th class="p-3.5 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="prob in problems"
                :key="prob.id"
                class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
              >
                <td class="p-3.5 font-medium text-slate-900 dark:text-white">
                  {{ prob.title }}
                </td>
                <td class="p-3.5">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                      prob.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                      prob.difficulty === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                      'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                    ]"
                  >
                    {{ prob.difficulty }}
                  </span>
                </td>
                <td class="p-3.5">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-semibold',
                      prob.status === 'solved' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300' :
                      prob.status === 'solving' ? 'text-blue-700 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300' :
                      prob.status === 'review' ? 'text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300' :
                      'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                    ]"
                  >
                    {{ prob.status === 'solved' ? '已解決' : prob.status === 'solving' ? '解題中' : prob.status === 'review' ? '待複習' : '未開始' }}
                  </span>
                </td>
                <td class="p-3.5">
                  <div class="flex items-center space-x-1.5 flex-wrap">
                    <span
                      v-for="(ver, idx) in prob.versions"
                      :key="ver.versionId"
                      class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-mono"
                    >
                      v{{ idx + 1 }}: {{ ver.timeComplexity }}
                    </span>
                  </div>
                </td>
                <td class="p-3.5">
                  <span class="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                    <MessageSquare class="w-3.5 h-3.5 text-violet-500" />
                    <span>{{ prob.comments.length }} 則留言</span>
                  </span>
                </td>
                <td class="p-3.5 text-right">
                  <button
                    @click="selectProblem(prob.id)"
                    class="px-3 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-semibold transition"
                  >
                    審閱代碼
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
