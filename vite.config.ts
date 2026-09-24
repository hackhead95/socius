import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Build information for Help > About and error reports (read through src/platform/buildInfo.ts):
// the package.json version, the short git commit when building in a checkout, and the build date.
function buildInfo(): { version: string; commit: string; date: string } {
  let version = '0.0.0';
  let commit = '';
  try {
    version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version ?? version;
  } catch {
    /* keep the fallback */
  }
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    commit = (process.env.GITHUB_SHA ?? '').slice(0, 7);
  }
  return { version, commit, date: new Date().toISOString().slice(0, 10) };
}
const build = buildInfo();

// `--mode artifact` inlines every asset into one HTML file (for claude.ai Artifact hosting).
// The default build is a normal static site (GitHub Pages, any static host), with relative paths.
// The on-device AI library (@mlc-ai/web-llm, several MB) is a lazy chunk on the static site and is
// replaced by a tiny stub in the artifact build, which does not offer on-device AI.
export default defineConfig(({ mode }) => ({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(build.version),
    __APP_COMMIT__: JSON.stringify(build.commit),
    __APP_BUILD_DATE__: JSON.stringify(build.date),
  },
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
