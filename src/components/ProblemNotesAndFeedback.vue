<script setup lang="ts">
import { ref } from 'vue'
import { useProblemStore } from '../composables/useProblemStore'
import type { ProblemStatus } from '../types/problem'
import {
  BookOpen,
  MessageSquare,
  Send,
  GraduationCap,
  User,
  ExternalLink,
  Tag,
  Edit,
  CheckCircle2,
  Clock,
  Eye,
  HelpCircle,
  ChevronDown
} from '@lucide/vue'

const {
  currentProblem,
  currentRole,
  updateProblemNotes,
  updateProblemStatus,
  addComment
} = useProblemStore()

const emit = defineEmits<{
  (e: 'open-edit-modal'): void
}>()

const newCommentText = ref('')
const activeTab = ref<'notes' | 'comments'>('notes')

function handleAddComment() {
  if (!newCommentText.value.trim()) return
  addComment(newCommentText.value)
  newCommentText.value = ''
}

function formatDate(isoStr: string) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatFullDate(isoStr?: string | null) {
  if (!isoStr) return '尚未開始'
  const d = new Date(isoStr)
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const statusOptions: { value: ProblemStatus; label: string; icon: any; color: string }[] = [
  { value: 'solved', label: '已解決 (Solved)', icon: CheckCircle2, color: 'text-emerald-500' },
  { value: 'solving', label: '解題中 (Solving)', icon: Clock, color: 'text-blue-500' },
  { value: 'review', label: '待複習 (Review)', icon: Eye, color: 'text-amber-500' },
  { value: 'todo', label: '未開始 (Todo)', icon: HelpCircle, color: 'text-slate-400' },
]

function onStatusChange(e: Event) {
  if (!currentProblem.value) return
  const val = (e.target as HTMLSelectElement).value as ProblemStatus
  updateProblemStatus(currentProblem.value.id, val)
}
</script>

<template>
  <div class="w-96 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 h-[calc(100vh-61px)]">
    <!-- Problem Header Details -->
    <div class="p-4 border-b border-slate-200 dark:border-slate-800">
      <div class="flex items-center justify-between text-xs text-slate-500 mb-1.5">
        <!-- 題目來源平台與可點擊連結 -->
        <a
          v-if="currentProblem?.url"
          :href="currentProblem.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center space-x-1 font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors group cursor-pointer"
          :title="`前往外部題目來源: ${currentProblem.url}`"
        >
          <ExternalLink class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>{{ currentProblem?.platform || 'LeetCode' }}</span>
        </a>
        <span
          v-else
          class="flex items-center space-x-1 font-medium text-slate-500 dark:text-slate-400"
          title="尚未設定外部連結，可點擊右側「編輯」按鈕填入"
        >
          <ExternalLink class="w-3.5 h-3.5 opacity-60" />
          <span>{{ currentProblem?.platform || 'LeetCode' }}</span>
        </span>
        
        <div class="flex items-center space-x-2">
          <span class="text-[11px] text-slate-400">ID: {{ currentProblem?.id }}</span>
          <!-- 編輯題目按鈕 -->
          <button
            v-if="currentProblem && currentRole === 'student'"
            @click="emit('open-edit-modal')"
            class="flex items-center space-x-1 px-2 py-0.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded border border-indigo-200 dark:border-indigo-800 transition"
            title="編輯題目與狀態"
          >
            <Edit class="w-3 h-3" />
            <span>編輯</span>
          </button>
        </div>
      </div>

      <h2 class="text-base font-bold text-slate-900 dark:text-white leading-snug">
        {{ currentProblem?.title }}
      </h2>

      <!-- 快速狀態切換列與難度標籤 -->
      <div class="mt-3 flex items-center justify-between gap-2">
        <div class="relative flex-1">
          <label class="sr-only">變更狀態</label>
          <div class="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
            <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">狀態:</span>
            <select
              v-if="currentProblem"
              :value="currentProblem.status"
              @change="onStatusChange"
              :disabled="currentRole === 'teacher'"
              class="flex-1 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer disabled:cursor-not-allowed"
            >
              <option
                v-for="opt in statusOptions"
                :key="opt.value"
                :value="opt.value"
                class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {{ opt.label }}
              </option>
            </select>
            <ChevronDown class="w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <!-- Difficulty Badge -->
        <span
          v-if="currentProblem"
          :class="[
            'text-[10px] uppercase font-bold px-2 py-1 rounded-lg border',
            currentProblem.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
            currentProblem.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
            'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800'
          ]"
        >
          {{ currentProblem.difficulty }}
        </span>
      </div>

      <!-- 開始時間顯示 -->
      <div class="mt-2.5 flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400">
        <span class="flex items-center space-x-1">
          <Clock class="w-3.5 h-3.5 text-indigo-500" />
          <span>解題開始時間:</span>
        </span>
        <span class="font-mono font-medium text-slate-700 dark:text-slate-300">
          {{ formatFullDate(currentProblem?.startedAt) }}
        </span>
      </div>

      <!-- Tags -->
      <div class="mt-2.5 flex flex-wrap gap-1.5">
        <span
          v-for="tag in currentProblem?.tags"
          :key="tag"
          class="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
        >
          <Tag class="w-3 h-3 text-slate-400" />
          <span>{{ tag }}</span>
        </span>
      </div>
    </div>

    <!-- Tab Switching -->
    <div class="flex border-b border-slate-200 dark:border-slate-800">
      <button
        @click="activeTab = 'notes'"
        :class="[
          'flex-1 py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 border-b-2 transition',
          activeTab === 'notes'
            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        ]"
      >
        <BookOpen class="w-3.5 h-3.5" />
        <span>解題思維筆記</span>
      </button>

      <button
        @click="activeTab = 'comments'"
        :class="[
          'flex-1 py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 border-b-2 transition relative',
          activeTab === 'comments'
            ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/30 dark:bg-violet-950/20'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        ]"
      >
        <MessageSquare class="w-3.5 h-3.5" />
        <span>師生指導留言</span>
        <span
          v-if="currentProblem && currentProblem.comments.length > 0"
          class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
        >
          {{ currentProblem.comments.length }}
        </span>
      </button>
    </div>

    <!-- Tab 1: Notes -->
    <div v-show="activeTab === 'notes'" class="flex-1 p-4 flex flex-col overflow-y-auto">
      <div class="flex items-center justify-between mb-2">
        <label class="text-xs font-medium text-slate-500 dark:text-slate-400">
          學生筆記與解法思路整理
        </label>
        <span v-if="currentRole === 'teacher'" class="text-[11px] text-amber-500 font-medium">
          (老師檢視模式 - 唯讀)
        </span>
      </div>

      <textarea
        v-if="currentProblem"
        :value="currentProblem.notes"
        @input="(e) => updateProblemNotes((e.target as HTMLTextAreaElement).value)"
        :readonly="currentRole === 'teacher'"
        placeholder="記錄本題的思考歷程、解題心得或未來複習重點..."
        class="flex-1 w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none resize-none disabled:opacity-75"
      ></textarea>
    </div>

    <!-- Tab 2: Comments (師生互動) -->
    <div v-show="activeTab === 'comments'" class="flex-1 flex flex-col overflow-hidden">
      <!-- Comment List -->
      <div class="flex-1 p-4 overflow-y-auto space-y-3.5">
        <div
          v-for="comment in currentProblem?.comments"
          :key="comment.id"
          :class="[
            'p-3 rounded-xl border text-xs',
            comment.author === 'teacher'
              ? 'bg-violet-50/70 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/80 ml-2'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 mr-2'
          ]"
        >
          <div class="flex items-center justify-between mb-1.5">
            <span
              :class="[
                'flex items-center space-x-1 font-semibold text-[11px]',
                comment.author === 'teacher'
                  ? 'text-violet-700 dark:text-violet-300'
                  : 'text-slate-700 dark:text-slate-300'
              ]"
            >
              <GraduationCap v-if="comment.author === 'teacher'" class="w-3.5 h-3.5" />
              <User v-else class="w-3.5 h-3.5" />
              <span>{{ comment.author === 'teacher' ? '指導老師 (Teacher)' : '學生 (Student)' }}</span>
            </span>
            <span class="text-[10px] text-slate-400">
              {{ formatDate(comment.createdAt) }}
            </span>
          </div>

          <p class="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {{ comment.content }}
          </p>
        </div>

        <div
          v-if="!currentProblem?.comments || currentProblem.comments.length === 0"
          class="py-12 text-center text-slate-400 text-xs"
        >
          目前尚無師生討論，您可以下方留言開始交流！
        </div>
      </div>

      <!-- Add Comment Input Area -->
      <div class="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div class="flex items-center space-x-2 mb-2 text-[11px] text-slate-500">
          <span class="font-medium">以目前身分留言：</span>
          <span
            :class="[
              'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
              currentRole === 'teacher'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
            ]"
          >
            {{ currentRole === 'teacher' ? '老師 (Teacher)' : '學生 (Student)' }}
          </span>
        </div>

        <div class="flex space-x-2">
          <input
            v-model="newCommentText"
            @keyup.enter="handleAddComment"
            type="text"
            :placeholder="currentRole === 'teacher' ? '為學生留下指導評語或解答建議...' : '向老師請教問題或補充說明...'"
            class="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button
            @click="handleAddComment"
            :disabled="!newCommentText.trim()"
            class="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition flex items-center justify-center"
          >
            <Send class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
