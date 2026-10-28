import { defineConfig } from 'vite';

export default defineConfig({
  // Root-relative base path for Vercel deployment
  base: '/',
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    // Babylon.js core + loaders are large 3D modules (~2.5 MB uncompressed)
    // Raising chunkSizeWarningLimit prevents build warning logs on Vercel
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ['@babylonjs/core', '@babylonjs/loaders']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
