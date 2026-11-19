import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dataDir = path.resolve(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'codementor.db')
export const db = new Database(dbPath)

// 啟用 WAL 模式與外鍵限制，提升併發讀寫效能
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      platform TEXT DEFAULT 'LeetCode',
      url TEXT DEFAULT '',
      difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
      status TEXT CHECK(status IN ('todo', 'solving', 'solved', 'review')) NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      notes TEXT DEFAULT '',
      started_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS code_versions (
      version_id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL,
      version_name TEXT NOT NULL,
      code TEXT NOT NULL,
      time_complexity TEXT DEFAULT '未分析',
      space_complexity TEXT DEFAULT '未分析',
      ai_suggestion TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL,
      author TEXT CHECK(author IN ('student', 'teacher')) NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_versions_problem ON code_versions(problem_id);
    CREATE INDEX IF NOT EXISTS idx_comments_problem ON comments(problem_id);
  `)

  // 自動資料庫欄位遷移：補齊 url 與 started_at
  const columns = db.prepare(`PRAGMA table_info(problems)`).all() as any[]
  if (!columns.some((c) => c.name === 'url')) {
    db.exec(`ALTER TABLE problems ADD COLUMN url TEXT DEFAULT ''`)
  }
  if (!columns.some((c) => c.name === 'started_at')) {
    db.exec(`ALTER TABLE problems ADD COLUMN started_at TEXT`)
  }

  // 若資料庫為空，寫入預設初始題目
  const countRow = db.prepare('SELECT count(*) as count FROM problems').get() as { count: number }
  if (countRow.count === 0) {
    seedInitialData()
  }
}

function seedInitialData() {
  const insertProblem = db.prepare(`
    INSERT INTO problems (id, title, platform, url, difficulty, status, tags, notes, started_at, updated_at)
    VALUES (@id, @title, @platform, @url, @difficulty, @status, @tags, @notes, @started_at, @updated_at)
  `)

  const insertVersion = db.prepare(`
    INSERT INTO code_versions (version_id, problem_id, version_name, code, time_complexity, space_complexity, ai_suggestion, created_at)
    VALUES (@version_id, @problem_id, @version_name, @code, @time_complexity, @space_complexity, @ai_suggestion, @created_at)
  `)

  const insertComment = db.prepare(`
    INSERT INTO comments (id, problem_id, author, content, created_at)
    VALUES (@id, @problem_id, @author, @content, @created_at)
  `)

  const seed = db.transaction(() => {
    // Problem 1: Two Sum
    insertProblem.run({
      id: 'p-1',
      title: '兩數之和 (Two Sum)',
      platform: 'LeetCode',
      url: 'https://leetcode.com/problems/two-sum/',
      difficulty: 'easy',
      status: 'solved',
      tags: JSON.stringify(['Array', 'Hash Table']),
      notes: '經典題目！面試時先給暴力解（O(N^2)），再提出 Hash Map 查表解法（O(N)），能展現出優化思維。',
      started_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    })

    insertVersion.run({
      version_id: 'v-101',
      problem_id: 'p-1',
      version_name: 'v1 - 雙重迴圈暴力法 (Brute Force)',
      code: `function twoSum(nums: number[], target: number): number[] {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`,
      time_complexity: 'O(N^2)',
      space_complexity: 'O(1)',
      ai_suggestion: '暴力法雖然不需要額外空間，但在陣列長度較大時效率不佳。建議可使用 Hash Map 記錄已訪問過的值與索引，將時間複雜度降至 O(N)。',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    })

    insertVersion.run({
      version_id: 'v-102',
      problem_id: 'p-1',
      version_name: 'v2 - Hash Map 查表優化 (Optimal)',
      code: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      time_complexity: 'O(N)',
      space_complexity: 'O(N)',
      ai_suggestion: '完美最佳解！使用 Map 實現單趟掃描（One-pass），空間換取時間的典型範例。邊界狀況如重複元素也能妥善處理。',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    })

    insertComment.run({
      id: 'c-1',
      problem_id: 'p-1',
      author: 'student',
      content: '老師，請問在 JS 中使用 new Map() 和直接用普通物件 {} 當 hash table 在性能與記憶體上有差別嗎？',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString()
    })

    insertComment.run({
      id: 'c-2',
      problem_id: 'p-1',
      author: 'teacher',
      content: '很棒的問題！若 key 是數字，Map 性能在頻繁增刪時通常更穩定，且不會有 Object 原型鏈污染問題；一般題目兩者皆可。你的 v2 優化架構非常漂亮！',
      created_at: new Date(Date.now() - 3600000 * 1).toISOString()
    })

    // Problem 2: Longest Palindrome
    insertProblem.run({
      id: 'p-2',
      title: '最長迴文子字串 (Longest Palindromic Substring)',
      platform: 'LeetCode',
      url: 'https://leetcode.com/problems/longest-palindromic-substring/',
      difficulty: 'medium',
      status: 'solving',
      tags: JSON.stringify(['String', 'Dynamic Programming', 'Two Pointers']),
      notes: '中心擴散法（Expand Around Center）比二維 DP 矩陣更省空間，且比較直覺。',
      started_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    })

    insertVersion.run({
      version_id: 'v-201',
      problem_id: 'p-2',
      version_name: 'v1 - 中心擴展雙指標法 (Expand Around Center)',
      code: `function longestPalindrome(s: string): string {
  if (s.length < 2) return s;
  let start = 0, maxLength = 1;

  function expand(left: number, right: number) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      const currentLength = right - left + 1;
      if (currentLength > maxLength) {
        maxLength = currentLength;
        start = left;
      }
      left--;
      right++;
    }
  }

  for (let i = 0; i < s.length; i++) {
    expand(i, i);
    expand(i, i + 1);
  }

  return s.substring(start, start + maxLength);
}`,
      time_complexity: 'O(N^2)',
      space_complexity: 'O(1)',
      ai_suggestion: '中心擴展法在空間複雜度上控制在 O(1)，相當優秀。如果還想挑戰極限，可以研究 Manacher演算法 (馬拉車演算法)，能做到 O(N) 線性時間複雜度！',
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    })

    insertComment.run({
      id: 'c-3',
      problem_id: 'p-2',
      author: 'teacher',
      content: '注意邊界條件！字串為空或長度為 1 的防呆有寫好，很細心。',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString()
    })
  })

  seed()
  console.log('✓ SQLite database initialized and seeded with default problems.')
}
