import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // 关键配置：使用相对路径，适配 GitHub Pages
  server: {
    host: true
  }
});