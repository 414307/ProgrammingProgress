import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // 支援部署於 GitHub Pages 次路徑
  plugins: [
    vue(),
    tailwindcss(),
  ],
  server: {
    host: true, // 允許局域網與穿透連線
    allowedHosts: true, // 允許所有主機（包含 Cloudflare Tunnel 等穿透網域），也可填入特定網域名稱字串陣列
  },
})
