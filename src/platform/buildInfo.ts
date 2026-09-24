// Build information injected by Vite (`define` in vite.config.ts): the package.json version, the short
// git commit when the build ran in a git checkout, and the build date. Shown in Help > About Socius
// and in error reports. Every value has a fallback, so tests and unusual builds still work.

declare const __APP_VERSION__: string | undefined;
declare const __APP_COMMIT__: string | undefined;
declare const __APP_BUILD_DATE__: string | undefined;

function read(get: () => string | undefined, fallback: string): string {
  try {
    const v = get();
    return typeof v === 'string' && v ? v : fallback;
  } catch {
    return fallback;
  }
}

export interface BuildInfo {
  /** package.json version, e.g. "0.1.0". */
  version: string;
  /** Short git commit, or '' when unknown. */
  commit: string;
  /** Build date (YYYY-MM-DD), or '' when unknown. */
  date: string;
  /** "0.1.0 (abc1234, built 2026-09-24)". */
  label: string;
}

const version = read(() => __APP_VERSION__, '0.1.0');
const commit = read(() => __APP_COMMIT__, '');
const date = read(() => __APP_BUILD_DATE__, '');

export const BUILD_INFO: BuildInfo = {
  version,
  commit,
  date,
  label: commit || date ? `${version} (${[commit, date ? `built ${date}` : ''].filter(Boolean).join(', ')})` : version,
};
