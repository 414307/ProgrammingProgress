# CodeMentor AI - 智慧型師生刷題與多版本程式記錄網站

基於 **Vue 3 + TypeScript + Vite + Tailwind CSS + Supabase 介面** 的智慧型演算法刷題與師生互動記錄系統。

---

## 🌟 核心特色與實作亮點

### 1. 🔄 多版本程式碼管理 (Code Versions)
- **多解法記錄**：每道題目可建立多個版本（如 `v1 - 暴力破解`、`v2 - 雙指標優化`、`v3 - 動態規劃`）。
- **獨立版本歷程**：每個版本獨立維護自己的程式碼、建立時間、時間/空間複雜度與 AI 優化建議。
- **即時切換與比對**：下拉選單一鍵秒切版本，程式碼區具備 PrismJS 語法高亮與一鍵複製功能。

### 2. 🤖 AI 自動複雜度分析
- 點擊「**🤖 AI 分析複雜度**」按鈕，演算法診斷模型將自動分析當前版本的程式碼。
- 精準評估並填入：
  - `timeComplexity`（如 $O(N)$、$O(N^2)$、$O(\log N)$）
  - `spaceComplexity`（如 $O(1)$、$O(N)$）
  - 客製化 AI 優化建議與邊界條件提醒。

### 3. 👥 師生雙向互動與身分切換
- 右上角可一鍵切換 **學生模式** 與 **老師審閱模式**。
- **學生端**：新增題庫、編輯程式碼、新增版本、呼叫 AI 分析、記錄個人解題心得筆記。
- **老師端**：
  - **解題工作區**：審閱學生程式碼，在題目下方留下「老師指導留言 (Teacher Comments)」。
  - **班級進度儀表板**：一覽全班學生刷題進度、解題率、各題目演算法優化歷程（從暴力解到最優解）。

---

## 🛠️ 技術架構

- **前端框架**：Vue 3 (Composition API `<script setup>`)
- **語言型別**：TypeScript (嚴格型別定義)
- **構建工具**：Vite
- **樣式庫**：Tailwind CSS (支援深色 Dark Mode 與淺色切換)
- **圖示庫**：Lucide Icons
- **語法高亮**：PrismJS (TypeScript / JavaScript 語法支援)
- **後端架構**：Node.js + Express + `better-sqlite3`（高效能 SQLite WAL 模式，支援多表關聯與交易）
- **雙模容錯機制**：當 SQLite 後端服務運行時自動無縫接軌；若未啟動後端，前端自動優雅降級為 LocalStorage 離線模式。

---

## 🚀 啟動指南

### 一鍵啟動後端與前端（推薦）

1. **啟動 SQLite 後端 API 伺服器**（預設埠位 3001，資料庫自動儲存於 `data/codementor.db`）：
   ```powershell
   npm run server
   ```

2. **啟動 Vite 前端**（另開一個終端機）：
   ```powershell
   npm run dev
   ```

> 💡 **自動感應**：網頁頂部會顯示綠色徽章 **`SQLite 連線中`**。所有新增的題目、多版本程式碼、AI 分析評估及師生留言，皆會即時持久化於本機 SQLite 資料庫中！
   npm run dev
   ```

3. **生產打包驗證**：
   ```powershell
   npm run build
   ```

4. **連接雲端 Supabase (選填)**：
   在專案根目錄建立 `.env` 檔案並填入：
   ```env
   VITE_SUPABASE_URL=你的Supabase項目URL
   VITE_SUPABASE_ANON_KEY=你的Supabase公鑰
   ```
