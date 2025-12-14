import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important for Electron to find files using relative paths
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});