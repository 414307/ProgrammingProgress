export type Difficulty = 'easy' | 'medium' | 'hard'
export type ProblemStatus = 'todo' | 'solving' | 'solved' | 'review'
export type UserRole = 'student' | 'teacher'

export interface CodeVersion {
  versionId: string
  versionName: string
  code: string
  timeComplexity: string
  spaceComplexity: string
  aiSuggestion: string
  createdAt: string
}

export interface Comment {
  id: string
  author: 'student' | 'teacher'
  authorName?: string
  content: string
  createdAt: string
}

export interface Problem {
  id: string
  title: string
  platform: string
  url?: string
  difficulty: Difficulty
  status: ProblemStatus
  tags: string[]
  versions: CodeVersion[]
  notes: string
  comments: Comment[]
  startedAt?: string | null
  updatedAt: string
}
