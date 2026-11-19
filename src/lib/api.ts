import type { Problem, ProblemStatus, UserRole } from '../types/problem'

const API_BASE = 'http://localhost:3001/api'

export const api = {
  // 檢查後端 SQLite 服務是否可用
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/problems`, { method: 'GET', signal: AbortSignal.timeout(1500) })
      return res.ok
    } catch {
      return false
    }
  },

  async getProblems(): Promise<Problem[]> {
    const res = await fetch(`${API_BASE}/problems`)
    if (!res.ok) throw new Error('Failed to fetch problems')
    return res.json()
  },

  async addProblem(data: {
    title: string
    platform: string
    url?: string
    difficulty: string
    status: ProblemStatus
    tags: string[]
    notes: string
    initialCode?: string
  }): Promise<Problem[]> {
    const res = await fetch(`${API_BASE}/problems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to add problem')
    return res.json()
  },

  async updateProblemDetails(
    id: string,
    updates: Partial<Pick<Problem, 'title' | 'platform' | 'url' | 'difficulty' | 'status' | 'tags'>>
  ): Promise<Problem[]> {
    const res = await fetch(`${API_BASE}/problems/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update problem details')
    return res.json()
  },

  async updateProblemStatus(id: string, status: ProblemStatus) {
    const res = await fetch(`${API_BASE}/problems/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) throw new Error('Failed to update status')
    return res.json()
  },

  async updateProblemNotes(id: string, notes: string) {
    const res = await fetch(`${API_BASE}/problems/${id}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    if (!res.ok) throw new Error('Failed to update notes')
    return res.json()
  },

  async addVersion(problemId: string, versionName: string, code: string): Promise<{ list: Problem[]; newVersionId: string }> {
    const res = await fetch(`${API_BASE}/problems/${problemId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionName, code }),
    })
    if (!res.ok) throw new Error('Failed to add version')
    return res.json()
  },

  async updateVersionCode(versionId: string, code: string, problemId?: string) {
    const res = await fetch(`${API_BASE}/versions/${versionId}/code`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, problemId }),
    })
    if (!res.ok) throw new Error('Failed to update code')
    return res.json()
  },

  async updateVersionAI(
    versionId: string,
    aiData: { timeComplexity: string; spaceComplexity: string; aiSuggestion: string },
    problemId?: string
  ) {
    const res = await fetch(`${API_BASE}/versions/${versionId}/ai`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...aiData, problemId }),
    })
    if (!res.ok) throw new Error('Failed to update AI analysis')
    return res.json()
  },

  async addComment(problemId: string, author: UserRole, content: string) {
    const res = await fetch(`${API_BASE}/problems/${problemId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content }),
    })
    if (!res.ok) throw new Error('Failed to add comment')
    return res.json()
  },

  async deleteProblem(id: string): Promise<Problem[]> {
    const res = await fetch(`${API_BASE}/problems/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete problem')
    return res.json()
  },
}
