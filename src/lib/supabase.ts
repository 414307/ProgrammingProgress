import { createClient } from '@supabase/supabase-js'

// 支援從 .env 讀取，若無則降級為本地 LocalStorage 模式，確保無配置也能立即運行開箱即用
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
