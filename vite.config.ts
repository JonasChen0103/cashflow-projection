import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages 子路徑部署用；根網域部署改回 '/'
  base: process.env.BASE_PATH ?? '/',
});
