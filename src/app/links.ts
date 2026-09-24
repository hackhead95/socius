// Links out of the app: the website, the user guide and the feedback form (GitHub issues).
//
// On GitHub Pages (https://<owner>.github.io/<repo>/) the links are derived from the address, so a
// renamed or forked repository keeps working. Elsewhere (the Claude artifact build, localhost, a
// saved file) the fallbacks below are used.

// ---- Fallbacks: change these lines if the public site moves. ----
export const FALLBACK_OWNER = 'hackhead95';
export const FALLBACK_REPO = 'socius';
export const FALLBACK_SITE_URL = `https://${FALLBACK_OWNER}.github.io/${FALLBACK_REPO}/`;
export const FALLBACK_FEEDBACK_URL = `https://github.com/${FALLBACK_OWNER}/${FALLBACK_REPO}/issues/new/choose`;
// -----------------------------------------------------------------

export interface AppLinks {
  SITE_URL: string;
  GUIDE_URL: string;
  FEEDBACK_URL: string;
}

export interface LocationLike {
  protocol: string;
  hostname: string;
  origin: string;
  pathname: string;
}

/** The page's directory (drops "index.html" and anything after the last slash). */
function pageDir(loc: LocationLike): string {
  return loc.pathname.replace(/[^/]*$/, '') || '/';
}

/** Work out the links for a page address. `mode` is the Vite build mode ('artifact' for the Claude build). */
export function deriveLinks(loc: LocationLike | null, mode: string): AppLinks {
  const fallback: AppLinks = { SITE_URL: FALLBACK_SITE_URL, GUIDE_URL: `${FALLBACK_SITE_URL}guide/`, FEEDBACK_URL: FALLBACK_FEEDBACK_URL };
  if (!loc || mode === 'artifact') return fallback;
  const host = loc.hostname.toLowerCase();
  const gh = /^([a-z0-9-]+)\.github\.io$/.exec(host);
  if (gh && /^https?:$/.test(loc.protocol)) {
    const owner = gh[1];
    const first = loc.pathname.split('/').filter(Boolean)[0];
    // A project site lives under /<repo>/; a user site (<owner>.github.io repository) at the root.
    const repo = first && !/\.[a-z0-9]+$/i.test(first) ? decodeURIComponent(first) : null;
    const site = repo ? `${loc.origin}/${encodeURIComponent(repo)}/` : `${loc.origin}/`;
    return {
      SITE_URL: site,
      GUIDE_URL: new URL('guide/', site).href,
      FEEDBACK_URL: `https://github.com/${owner}/${repo ?? `${owner}.github.io`}/issues/new/choose`,
    };
  }
  if (loc.protocol === 'http:' || loc.protocol === 'https:') {
    // Local preview or another static host: the guide sits next to the app.
    return { ...fallback, GUIDE_URL: `${loc.origin}${pageDir(loc)}guide/` };
  }
  if (loc.protocol === 'file:') {
    // Opened from disk: folders do not open index.html by themselves.
    return { ...fallback, GUIDE_URL: `file://${pageDir(loc)}guide/index.html` };
  }
  return fallback;
}

function currentLocation(): LocationLike | null {
  try {
    const l = globalThis.location;
    return l ? { protocol: l.protocol, hostname: l.hostname, origin: l.origin, pathname: l.pathname } : null;
  } catch {
    return null;
  }
}

const links = deriveLinks(currentLocation(), import.meta.env.MODE);

export const SITE_URL = links.SITE_URL;
export const GUIDE_URL = links.GUIDE_URL;
export const FEEDBACK_URL = links.FEEDBACK_URL;

/** Open a link in a new tab (works in the artifact sandbox, which allows popups). */
export function openExternal(url: string): void {
  try {
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch {
    /* popup blocked: nothing else to do */
  }
}
