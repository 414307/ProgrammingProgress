import type { Problem, ProblemStatus } from '../types/problem'
import { INITIAL_PROBLEMS } from './mockData'

const TURSO_URL = import.meta.env.VITE_TURSO_DATABASE_URL || 'https://programming-progress-gaming8728.aws-ap-northeast-1.turso.io'
const TURSO_TOKEN = import.meta.env.VITE_TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTUxODMxNzAsImlkIjoiMDFhMWY5M2YtNGMwMS03NWVkLTk3YTktZDU2OGY4YTZiZTA4Iiwia2lkIjoiVE9SLTFRUEh4dEd0NElJaktCdVFyWG5PczMyVWg4UVhKbDBNdm8yeGM0VSIsInJpZCI6ImVkYWFmMzA5LWU3MWQtNDFhZi05MDRiLTY3MDliMTJmZGNhNSJ9.k1UcJ-rACkGEvdXZ4xSgJLoMxExJLu2GCUlyn-4_JqkSqw_iawGMRGpt2RU9lw2djM4VtmWA4l3SVXA9i8yrCw'

const PIPELINE_URL = `${TURSO_URL.replace('libsql://', 'https://')}/v2/pipeline`

interface SqlParam {
  type: 'text' | 'integer' | 'null'
  value: string | null
}

function toTursoParam(val: any): SqlParam {
  if (val === null || val === undefined) {
    return { type: 'null', value: null }
  }
  return { type: 'text', value: String(val) }
}

async function executeTursoQueries(statements: Array<{ sql: string; args?: any[] }>) {
  const requests = statements.map((s) => ({
    type: 'execute',
    stmt: {
      sql: s.sql,
      args: s.args ? s.args.map(toTursoParam) : [],
    },
  }))
  requests.push({ type: 'close' } as any)

  const res = await fetch(PIPELINE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TURSO_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  })

  if (!res.ok) {
    throw new Error(`Turso HTTP request failed: ${res.statusText}`)
  }

  const data = await res.json()
  return data.results
}

function parseRows(executeResult: any): any[] {
  if (!executeResult || !executeResult.cols || !executeResult.rows) return []
  const cols = executeResult.cols.map((c: any) => c.name)
  return executeResult.rows.map((row: any[]) => {
    const obj: any = {}
    cols.forEach((col: string, idx: number) => {
      obj[col] = row[idx]?.value !== undefined ? row[idx].value : null
    })
    return obj
  })
}

export const turso = {
  async initTables() {
    try {
      await executeTursoQueries([
        {
          sql: `
            CREATE TABLE IF NOT EXISTS problems (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              platform TEXT DEFAULT 'LeetCode',
              url TEXT DEFAULT '',
              difficulty TEXT NOT NULL,
              status TEXT NOT NULL,
              tags TEXT NOT NULL DEFAULT '[]',
              notes TEXT DEFAULT '',
              started_at TEXT,
              updated_at TEXT NOT NULL
            );
          `,
        },
        {
          sql: `
            CREATE TABLE IF NOT EXISTS code_versions (
              version_id TEXT PRIMARY KEY,
              problem_id TEXT NOT NULL,
              version_name TEXT NOT NULL,
              code TEXT NOT NULL,
              time_complexity TEXT DEFAULT '未分析',
              space_complexity TEXT DEFAULT '未分析',
              ai_suggestion TEXT DEFAULT '',
              created_at TEXT NOT NULL
            );
          `,
        },
        {
          sql: `
            CREATE TABLE IF NOT EXISTS comments (
              id TEXT PRIMARY KEY,
              problem_id TEXT NOT NULL,
              author TEXT NOT NULL,
              content TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
          `,
        },
      ])

      // 檢查是否為空，若為空則寫入種子預設題目
      const countRes = await executeTursoQueries([{ sql: 'SELECT count(*) as count FROM problems;' }])
      const rows = parseRows(countRes[0]?.response?.result)
      const count = Number(rows[0]?.count || 0)

      if (count === 0) {
        await this.seedInitialProblems()
      }
    } catch (err) {
      console.error('[Turso] initTables error:', err)
    }
  },

  async seedInitialProblems() {
    const queries: Array<{ sql: string; args: any[] }> = []
    for (const prob of INITIAL_PROBLEMS) {
      queries.push({
        sql: `INSERT INTO problems (id, title, platform, url, difficulty, status, tags, notes, started_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          prob.id,
          prob.title,
          prob.platform,
          prob.url || '',
          prob.difficulty,
          prob.status,
          JSON.stringify(prob.tags || []),
          prob.notes || '',
          prob.startedAt || null,
          prob.updatedAt,
        ],
      })

      for (const ver of prob.versions) {
        queries.push({
          sql: `INSERT INTO code_versions (version_id, problem_id, version_name, code, time_complexity, space_complexity, ai_suggestion, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          args: [
            ver.versionId,
            prob.id,
            ver.versionName,
            ver.code,
            ver.timeComplexity,
            ver.spaceComplexity,
            ver.aiSuggestion,
            ver.createdAt,
          ],
        })
      }

      for (const comm of prob.comments) {
        queries.push({
          sql: `INSERT INTO comments (id, problem_id, author, content, created_at) VALUES (?, ?, ?, ?, ?);`,
          args: [comm.id, prob.id, comm.author, comm.content, comm.createdAt],
        })
      }
    }

    if (queries.length > 0) {
      await executeTursoQueries(queries)
    }
  },

  async getProblems(): Promise<Problem[]> {
    const results = await executeTursoQueries([
      { sql: 'SELECT * FROM problems ORDER BY updated_at DESC;' },
      { sql: 'SELECT * FROM code_versions ORDER BY created_at ASC;' },
      { sql: 'SELECT * FROM comments ORDER BY created_at ASC;' },
    ])

    const problemsRows = parseRows(results[0]?.response?.result)
    const versionsRows = parseRows(results[1]?.response?.result)
    const commentsRows = parseRows(results[2]?.response?.result)

    return problemsRows.map((p) => ({
      id: p.id,
      title: p.title,
      platform: p.platform || 'LeetCode',
      url: p.url || '',
      difficulty: p.difficulty,
      status: p.status,
      tags: JSON.parse(p.tags || '[]'),
      notes: p.notes || '',
      startedAt: p.started_at || null,
      updatedAt: p.updated_at,
      versions: versionsRows
        .filter((v) => v.problem_id === p.id)
        .map((v) => ({
          versionId: v.version_id,
          versionName: v.version_name,
          code: v.code,
          timeComplexity: v.time_complexity,
          spaceComplexity: v.space_complexity,
          aiSuggestion: v.ai_suggestion,
          createdAt: v.created_at,
        })),
      comments: commentsRows
        .filter((c) => c.problem_id === p.id)
        .map((c) => ({
          id: c.id,
          author: c.author,
          content: c.content,
          createdAt: c.created_at,
        })),
    }))
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
    const problemId = 'p-' + Date.now()
    const versionId = 'v-' + Date.now()
    const now = new Date().toISOString()
    const startedAt = (data.status === 'solving' || data.status === 'solved') ? now : null

    await executeTursoQueries([
      {
        sql: `INSERT INTO problems (id, title, platform, url, difficulty, status, tags, notes, started_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          problemId,
          data.title,
          data.platform || 'LeetCode',
          data.url || '',
          data.difficulty,
          data.status,
          JSON.stringify(data.tags || []),
          data.notes || '',
          startedAt,
          now,
        ],
      },
      {
        sql: `INSERT INTO code_versions (version_id, problem_id, version_name, code, time_complexity, space_complexity, ai_suggestion, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          versionId,
          problemId,
          'v1 - 初始實作',
          data.initialCode || '// 請在此撰寫您的解題程式碼\n',
          '未分析',
          '未分析',
          '點擊上方「AI 分析」按鈕以獲取演算法複雜度評估與優化建議。',
          now,
        ],
      },
    ])

    return this.getProblems()
  },

  async updateProblemDetails(
    id: string,
    updates: Partial<Pick<Problem, 'title' | 'platform' | 'url' | 'difficulty' | 'status' | 'tags'>>
  ): Promise<Problem[]> {
    const now = new Date().toISOString()
    const queries = []

    // 檢查是否有 started_at 需要更新
    if (updates.status === 'solving' || updates.status === 'solved') {
      queries.push({
        sql: `UPDATE problems SET started_at = COALESCE(started_at, ?) WHERE id = ?;`,
        args: [now, id],
      })
    }

    const setClauses: string[] = ['updated_at = ?']
    const args: any[] = [now]

    if (updates.title !== undefined) {
      setClauses.push('title = ?')
      args.push(updates.title)
    }
    if (updates.platform !== undefined) {
      setClauses.push('platform = ?')
      args.push(updates.platform)
    }
    if (updates.url !== undefined) {
      setClauses.push('url = ?')
      args.push(updates.url)
    }
    if (updates.difficulty !== undefined) {
      setClauses.push('difficulty = ?')
      args.push(updates.difficulty)
    }
    if (updates.status !== undefined) {
      setClauses.push('status = ?')
      args.push(updates.status)
    }
    if (updates.tags !== undefined) {
      setClauses.push('tags = ?')
      args.push(JSON.stringify(updates.tags))
    }

    args.push(id)
    queries.push({
      sql: `UPDATE problems SET ${setClauses.join(', ')} WHERE id = ?;`,
      args,
    })

    await executeTursoQueries(queries)
    return this.getProblems()
  },

  async updateProblemStatus(id: string, status: ProblemStatus) {
    const now = new Date().toISOString()
    const queries = []

    if (status === 'solving' || status === 'solved') {
      queries.push({
        sql: `UPDATE problems SET started_at = COALESCE(started_at, ?) WHERE id = ?;`,
        args: [now, id],
      })
    }

    queries.push({
      sql: `UPDATE problems SET status = ?, updated_at = ? WHERE id = ?;`,
      args: [status, now, id],
    })

    await executeTursoQueries(queries)
  },

  async updateProblemNotes(id: string, notes: string) {
    const now = new Date().toISOString()
    await executeTursoQueries([
      {
        sql: `UPDATE problems SET notes = ?, updated_at = ? WHERE id = ?;`,
        args: [notes, now, id],
      },
    ])
  },

  async addVersion(problemId: string, versionName: string, code: string): Promise<{ list: Problem[]; newVersionId: string }> {
    const versionId = 'v-' + Date.now()
    const now = new Date().toISOString()

    await executeTursoQueries([
      {
        sql: `INSERT INTO code_versions (version_id, problem_id, version_name, code, time_complexity, space_complexity, ai_suggestion, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          versionId,
          problemId,
          versionName || '優化版本',
          code || '',
          '未分析',
          '未分析',
          '新建立的版本，請執行 AI 分析。',
          now,
        ],
      },
      {
        sql: `UPDATE problems SET updated_at = ? WHERE id = ?;`,
        args: [now, problemId],
      },
    ])

    const list = await this.getProblems()
    return { list, newVersionId: versionId }
  },

  async updateVersionCode(versionId: string, code: string, problemId?: string) {
    const now = new Date().toISOString()
    const queries = [
      {
        sql: `UPDATE code_versions SET code = ? WHERE version_id = ?;`,
        args: [code, versionId],
      },
    ]
    if (problemId) {
      queries.push({
        sql: `UPDATE problems SET updated_at = ? WHERE id = ?;`,
        args: [now, problemId],
      })
    }
    await executeTursoQueries(queries)
  },

  async updateVersionAI(
    versionId: string,
    aiData: { timeComplexity: string; spaceComplexity: string; aiSuggestion: string },
    problemId?: string
  ) {
    const now = new Date().toISOString()
    const queries = [
      {
        sql: `UPDATE code_versions SET time_complexity = ?, space_complexity = ?, ai_suggestion = ? WHERE version_id = ?;`,
        args: [aiData.timeComplexity, aiData.spaceComplexity, aiData.aiSuggestion, versionId],
      },
    ]
    if (problemId) {
      queries.push({
        sql: `UPDATE problems SET updated_at = ? WHERE id = ?;`,
        args: [now, problemId],
      })
    }
    await executeTursoQueries(queries)
  },

  async addComment(problemId: string, author: string, content: string) {
    const commentId = 'c-' + Date.now()
    const now = new Date().toISOString()

    await executeTursoQueries([
      {
        sql: `INSERT INTO comments (id, problem_id, author, content, created_at) VALUES (?, ?, ?, ?, ?);`,
        args: [commentId, problemId, author, content, now],
      },
      {
        sql: `UPDATE problems SET updated_at = ? WHERE id = ?;`,
        args: [now, problemId],
      },
    ])

    return { id: commentId, author, content, createdAt: now }
  },

  async deleteProblem(id: string): Promise<Problem[]> {
    await executeTursoQueries([
      { sql: `DELETE FROM code_versions WHERE problem_id = ?;`, args: [id] },
      { sql: `DELETE FROM comments WHERE problem_id = ?;`, args: [id] },
      { sql: `DELETE FROM problems WHERE id = ?;`, args: [id] },
    ])
    return this.getProblems()
  },
}
