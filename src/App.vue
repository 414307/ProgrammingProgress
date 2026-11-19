<script setup lang="ts">
import { ref } from 'vue'
import { useProblemStore } from './composables/useProblemStore'
import AppHeader from './components/AppHeader.vue'
import ProblemSidebar from './components/ProblemSidebar.vue'
import CodeVersionEditor from './components/CodeVersionEditor.vue'
import ProblemNotesAndFeedback from './components/ProblemNotesAndFeedback.vue'
import CreateProblemModal from './components/CreateProblemModal.vue'
import EditProblemModal from './components/EditProblemModal.vue'
import GitHubSyncModal from './components/GitHubSyncModal.vue'
import TeacherDashboard from './components/TeacherDashboard.vue'
import { LayoutDashboard, Code2 } from '@lucide/vue'

const { currentRole, currentProblem } = useProblemStore()
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showGitHubModal = ref(false)
const teacherViewMode = ref<'workspace' | 'dashboard'>('workspace')
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <!-- Global Header -->
    <AppHeader
      @open-create-modal="showCreateModal = true"
      @open-github-modal="showGitHubModal = true"
    />

    <!-- Sub-navigation for Teacher Mode -->
    <div
      v-if="currentRole === 'teacher'"
      class="bg-violet-900/10 dark:bg-violet-950/40 border-b border-violet-200 dark:border-violet-900 px-6 py-2 flex items-center justify-between"
    >
      <div class="flex items-center space-x-2 text-xs text-violet-700 dark:text-violet-300">
        <span class="font-bold">🧑‍🏫 老師審閱模式已啟用</span>
        <span class="text-slate-400">|</span>
        <span>可檢視學生全版本演化歷程、查看 AI 評估報告並撰寫批改意見</span>
      </div>

      <div class="flex items-center space-x-1 bg-white/80 dark:bg-slate-800 rounded-lg p-0.5 border border-violet-200 dark:border-violet-800">
        <button
          @click="teacherViewMode = 'workspace'"
          :class="[
            'px-2.5 py-1 text-xs font-semibold rounded-md flex items-center space-x-1 transition',
            teacherViewMode === 'workspace'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          ]"
        >
          <Code2 class="w-3.5 h-3.5" />
          <span>解題工作區</span>
        </button>
        <button
          @click="teacherViewMode = 'dashboard'"
          :class="[
            'px-2.5 py-1 text-xs font-semibold rounded-md flex items-center space-x-1 transition',
            teacherViewMode === 'dashboard'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          ]"
        >
          <LayoutDashboard class="w-3.5 h-3.5" />
          <span>班級進度儀表板</span>
        </button>
      </div>
    </div>

    <!-- Main Workspace Container -->
    <main class="flex-1 flex overflow-hidden">
      <!-- When Teacher is looking at Dashboard -->
      <TeacherDashboard
        v-if="currentRole === 'teacher' && teacherViewMode === 'dashboard'"
      />

      <!-- Problem Solving & Version Compare Workspace -->
      <template v-else>
        <!-- 1. Left Sidebar: Problem List -->
        <ProblemSidebar />

        <!-- 2. Middle Editor: Multi-version Code & AI Complexity -->
        <CodeVersionEditor />

        <!-- 3. Right Panel: Notes & Teacher-Student Feedback -->
        <ProblemNotesAndFeedback @open-edit-modal="showEditModal = true" />
      </template>
    </main>

    <!-- Create Problem Modal -->
    <CreateProblemModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
    />

    <!-- Edit Problem Modal -->
    <EditProblemModal
      v-if="showEditModal && currentProblem"
      :problem="currentProblem"
      @close="showEditModal = false"
    />

    <!-- GitHub Sync Modal -->
    <GitHubSyncModal
      v-if="showGitHubModal"
      @close="showGitHubModal = false"
    />
  </div>
</template>
