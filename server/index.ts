import express from 'express'
import cors from 'cors'
import { db, initDatabase } from './database'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// 初始化 SQLite 資料庫
initDatabase()

// Helper: 取得完整題目清單（包含各題的所有 versions 與 comments）
function getAllProblemsWithDetails() {
  const problems = db.prepare('SELECT * FROM problems ORDER BY updated_at DESC').all() as any[]
  const versions = db.prepare('SELECT * FROM code_versions ORDER BY created_at ASC').all() as any[]
  const comments = db.prepare('SELECT * FROM comments ORDER BY created_at ASC').all() as any[]

  return problems.map((p) => {
    return {
      id: p.id,
      title: p.title,
      platform: p.platform,
      url: p.url || '',
      difficulty: p.difficulty,
      status: p.status,
      tags: JSON.parse(p.tags || '[]'),
      notes: p.notes,
      startedAt: p.started_at || null,
      updatedAt: p.updated_at,
      versions: versions
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
      comments: comments
        .filter((c) => c.problem_id === p.id)
        .map((c) => ({
          id: c.id,
          author: c.author,
          content: c.content,
          createdAt: c.created_at,
        })),
    }
  })
}

// 1. GET /api/problems - 取得所有題目
app.get('/api/problems', (_req, res) => {
  try {
    const list = getAllProblemsWithDetails()
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// 2. POST /api/problems - 新增題目
app.post('/api/problems', (req, res) => {
  const { title, platform, url, difficulty, status, tags, notes, initialCode } = req.body
  const problemId = 'p-' + Date.now()
  const versionId = 'v-' + Date.now()
  const now = new Date().toISOString()
  // 規則：創立時若狀態為進行中 (solving) 或已完成 (solved)，直接紀錄開始時間；若為未開始 (todo) 則為 null
  const startedAt = (status === 'solving' || status === 'solved') ? now : null

  const insertTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO problems (id, title, platform, url, difficulty, status, tags, notes, started_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      problemId,
      title,
      platform || 'LeetCode',
      url || '',
      difficulty,
      status,
      JSON.stringify(tags || []),
      notes || '',
      startedAt,
      now
    )

    db.prepare(`
      INSERT INTO code_versions (version_id, problem_id, version_name, code, time_complexity, space_complexity, ai_suggestion, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      versionId,
      problemId,
      'v1 - 初始實作',
      initialCode || '// 請在此撰寫您的解題程式碼\n',
      '未分析',
      '未分析',
      '點擊上方「AI 分析」按鈕以獲取演算法複雜度評估與優化建議。',
      now
    )
  })

  try {
    insertTx()
    const list = getAllProblemsWithDetails()
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// 3. PUT /api/problems/:id - 更新題目中繼資料
app.put('/api/problems/:id', (req, res) => {
  const { id } = req.params
  const { title, platform, url, difficulty, status, tags } = req.body
  const now = new Date().toISOString()

  try {
    const current = db.prepare('SELECT status, started_at FROM problems WHERE id = ?').get() as { status: string; started_at: string | null } | undefined
    let startedAt = current?.started_at

    // 規則：如果原本沒有 started_at，且狀態變為 solving 或 solved，首次紀錄開始時間
    if (!startedAt && (status === 'solving' || status === 'solved')) {
      startedAt = now
    }

    db.prepare(`
      UPDATE problems
      SET title = COALESCE(?, title),
          platform = COALESCE(?, platform),
          url = COALESCE(?, url),
          difficulty = COALESCE(?, difficulty),
          status = COALESCE(?, status),
          tags = COALESCE(?, tags),
          started_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      title,
      platform,
      url,
      difficulty,
      status,
      tags ? JSON.stringify(tags) : null,
      startedAt,
      now,
      id
    )
    const list = getAllProblemsWithDetails()
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// 4. PUT /api/problems/:id/status - 快速切換狀態
app.put('/api/problems/:id/status', (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const now = new Date().toISOString()

  try {
    const current = db.prepare('SELECT status, started_at FROM problems WHERE id = ?').get() as { status: string; started_at: string | null } | undefined
    let startedAt = current?.started_at

    // 規則：如果原本沒有 started_at，且狀態變為 solving 或 solved，首次紀錄開始時間
    if (!startedAt && (status === 'solving' || status === 'solved')) {
      startedAt = now
    }

    db.prepare(`UPDATE problems SET status = ?, started_at = ?, updated_at = ? WHERE id = ?`).run(
      status,
      startedAt !== undefined ? startedAt : null,
      now,
      id
    )
    res.json({ success: true, status, startedAt, updatedAt: now })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// 5. PUT /api/problems/:id/notes - 更新解題筆記
app.put('/api/problems/:id/notes', (req, res) => {
  const { id } = req.params
  const { notes } = req.body
  const now = new Date().toISOString()

  try {
    db.prepare(`UPDATE problems SET notes = ?, updated_at = ? WHERE id = ?`).run(notes, now, id)
    res.json({ success: true, notes, updatedAt: now })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// 6. POST /api/problems/:id/versions - 建立新程式碼版本
app.post('/api/problems/:id/versions', (req, res) => {
  const { id } = req.params
  const { versionName, code } = req.body
  const versionId = 'v-' + Date.now()
  const now = new Date().toISOString()

  const insertTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO code_versions (version_id, problem_id, version_name, code, time_complexity, space_complexity, ai_suggestion, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      versionId,
      id,
      versionName || '優化版本',
      code || '',
      '未分析',
      '未分析',
      '新建立的版本，請執行 AI 分析。',
      now
    )
    db.prepare(`UPDATE problems SET updated_at = ? WHERE id = ?`).run(now, id)
  })

  try {
    insertTx()
    const list = getAllProblemsWithDetails()
    res.json({ list, newVersionId: versionId })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// 7. PUT /api/versions/:versionId/code - 儲存版本程式碼
app.put('/api/versions/:versionId/code', (req, res) => {
  const { versionId } = req.params
  const { code, problemId } = req.body
  const now = new Date().toISOString()

  try {
    db.prepare(`UPDATE code_versions SET code = ? WHERE version_id = ?`).run(code, versionId)
    if (problemId) {
      db.prepare(`UPDATE problems SET updated_at = ? WHERE id = ?`).run(now, problemId)
    }
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// 8. PUT /api/versions/:versionId/ai - 寫入 AI 分析結果
app.put('/api/versions/:versionId/ai', (req, res) => {
  const { versionId } = req.params
  const { timeComplexity, spaceComplexity, aiSuggestion, problemId } = req.body
  const now = new Date().toISOString()

  try {
    db.prepare(`
      UPDATE code_versions
      SET time_complexity = ?, space_complexity = ?, ai_suggestion = ?
      WHERE version_id = ?
    `).run(timeComplexity, spaceComplexity, aiSuggestion, versionId)

    if (problemId) {
      db.prepare(`UPDATE problems SET updated_at = ? WHERE id = ?`).run(now, problemId)
    }
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// 9. POST /api/problems/:id/comments - 新增師生留言
app.post('/api/problems/:id/comments', (req, res) => {
  const { id } = req.params
  const { author, content } = req.body
  const commentId = 'c-' + Date.now()
  const now = new Date().toISOString()

  try {
    db.prepare(`
      INSERT INTO comments (id, problem_id, author, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(commentId, id, author, content, now)

    db.prepare(`UPDATE problems SET updated_at = ? WHERE id = ?`).run(now, id)
    res.json({ id: commentId, author, content, createdAt: now })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// 10. DELETE /api/problems/:id - 刪除題目
app.delete('/api/problems/:id', (req, res) => {
  const { id } = req.params
  try {
    db.prepare(`DELETE FROM problems WHERE id = ?`).run(id)
    const list = getAllProblemsWithDetails()
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 CodeMentor SQLite API Server is running on http://localhost:${PORT}`)
})
