import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages 项目页部署在 /<仓库名>/ 子路径下，base 必须匹配，否则打包后资源 404。
  // 本地开发时 Vite 会自动忽略 base，不影响 http://127.0.0.1:5173 访问。
  base: '/film-journal/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
