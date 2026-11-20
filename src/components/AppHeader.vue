<script setup lang="ts">
import { ref } from 'vue'
import { useProblemStore } from '../composables/useProblemStore'
import {
  Code2,
  GraduationCap,
  UserCheck,
  Moon,
  Sun,
  Plus,
  Sparkles,
  Cloud
} from '@lucide/vue'

const { currentRole, switchRole, isUsingTurso } = useProblemStore()
const emit = defineEmits<{
  (e: 'open-create-modal'): void
}>()

const isDark = ref(document.documentElement.classList.contains('dark'))

function toggleDarkMode() {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3 transition-colors">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <!-- Logo & Title -->
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Code2 class="w-6 h-6" />
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              CodeMentor AI
            </h1>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
              <Sparkles class="w-3 h-3" /> 多版本刷題
            </span>
            <span
              :class="[
                'text-[11px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 transition',
                isUsingTurso
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              ]"
              :title="isUsingTurso ? '已連接 Turso 雲端 SQLite 資料庫 (多人即時同步)' : '離線 LocalStorage 模式'"
            >
              <Cloud class="w-3 h-3" />
              <span>{{ isUsingTurso ? 'Turso 雲端同步中' : 'LocalStorage' }}</span>
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            智慧型師生刷題與演算法版本管理平台
          </p>
        </div>
      </div>

      <!-- Action & Controls -->
      <div class="flex items-center space-x-3">
        <!-- Add Problem (Student Mode Only) -->
        <button
          v-if="currentRole === 'student'"
          @click="emit('open-create-modal')"
          class="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-sm transition-all active:scale-95"
        >
          <Plus class="w-4 h-4" />
          <span>新增題目</span>
        </button>

        <!-- Role Switcher -->
        <div class="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            @click="switchRole('student')"
            :class="[
              'flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all',
              currentRole === 'student'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            ]"
          >
            <UserCheck class="w-3.5 h-3.5" />
            <span>學生模式</span>
          </button>
          <button
            @click="switchRole('teacher')"
            :class="[
              'flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all',
              currentRole === 'teacher'
                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            ]"
          >
            <GraduationCap class="w-3.5 h-3.5" />
            <span>老師審閱</span>
          </button>
        </div>

        <!-- Dark Mode Toggle -->
        <button
          @click="toggleDarkMode"
          class="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          aria-label="Toggle Theme"
        >
          <Moon v-if="!isDark" class="w-4 h-4" />
          <Sun v-else class="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  </header>
</template>
