import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

// `--mode artifact` inlines every asset into one HTML file (for claude.ai Artifact hosting).
// The default build is a normal static site (GitHub Pages, any static host), with relative paths.
// The on-device AI library (@mlc-ai/web-llm, several MB) is a lazy chunk on the static site and is
// replaced by a tiny stub in the artifact build, which does not offer on-device AI.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'artifact' ? [viteSingleFile()] : [])],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      ...(mode === 'artifact' ? { '@mlc-ai/web-llm': fileURLToPath(new URL('./src/platform/webllm-stub.ts', import.meta.url)) } : {}),
    },
  },
  build: {
    outDir: mode === 'artifact' ? 'dist-artifact' : 'dist',
    assetsInlineLimit: mode === 'artifact' ? 100_000_000 : 4096,
    // The lazy on-device AI chunk (@mlc-ai/web-llm) is about 6 MB; it only loads when that option is used.
    chunkSizeWarningLimit: 6500,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    testTimeout: 30000,
  },
}));
