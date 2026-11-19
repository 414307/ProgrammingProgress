import type { Problem } from '../types/problem'

export interface GitHubSyncConfig {
  owner: string
  repo: string
  branch?: string
  path?: string
  token: string
}

const GITHUB_CONFIG_KEY = 'codementor_github_config'

export function getSavedGitHubConfig(): GitHubSyncConfig | null {
  const data = localStorage.getItem(GITHUB_CONFIG_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function saveGitHubConfig(cfg: GitHubSyncConfig) {
  localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(cfg))
}

export function clearGitHubConfig() {
  localStorage.removeItem(GITHUB_CONFIG_KEY)
}

// UTF-8 相容 Base64 編解碼，避免中文/特殊符號亂碼
function utf8ToBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

function base64ToUtf8(b64: string): string {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))))
}

export class GitHubSyncService {
  private config: GitHubSyncConfig

  constructor(config: GitHubSyncConfig) {
    this.config = {
      ...config,
      branch: config.branch || 'main',
      path: config.path || 'data/problems.json',
    }
  }

  private get baseUrl() {
    return `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}`
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.config.token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    }
  }

  // 測試連線與取得檔案資訊 (含 sha 與 content)
  async fetchRemoteFile(): Promise<{ sha: string | null; problems: Problem[] | null }> {
    try {
      const url = `${this.baseUrl}?ref=${this.config.branch || 'main'}&_t=${Date.now()}`
      const res = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      })

      if (res.status === 404) {
        // 檔案尚不存在（初次使用）
        return { sha: null, problems: null }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `GitHub API 回傳錯誤: ${res.status}`)
      }

      const data = await res.json()
      const jsonStr = base64ToUtf8(data.content)
      const problems: Problem[] = JSON.parse(jsonStr)
      return { sha: data.sha, problems }
    } catch (err: any) {
      console.error('[GitHubSync] fetchRemoteFile failed:', err)
      throw err
    }
  }

  // 透過 GitHub Commit 寫入/更新題目 JSON
  async commitProblems(problems: Problem[], commitMessage?: string): Promise<{ sha: string }> {
    // 1. 先取得最新的 sha (若存在)
    let currentSha: string | null = null
    try {
      const fileInfo = await this.fetchRemoteFile()
      currentSha = fileInfo.sha
    } catch {
      // 忽略 404 或初次建立的情形
    }

    const contentStr = JSON.stringify(problems, null, 2)
    const body: Record<string, any> = {
      message: commitMessage || `Update code problems data via CodeMentor AI [skip ci]`,
      content: utf8ToBase64(contentStr),
      branch: this.config.branch || 'main',
    }

    if (currentSha) {
      body.sha = currentSha
    }

    const res = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `GitHub Commit 失敗: ${res.status}`)
    }

    const result = await res.json()
    return { sha: result.content.sha }
  }
}
