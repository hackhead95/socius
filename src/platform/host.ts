// Host abstraction. The app runs in three places:
// 1. Inside a claude.ai Artifact viewer (sandboxed iframe): plain <a download> is blocked, so files
//    go through the `downloads` capability; Claude can be asked via the `sample` capability.
// 2. A normal static host (GitHub Pages, `npm run preview`, a saved file): anchor downloads work,
//    AI help comes from a provider the user sets up (see ./ai).
// 3. Tests (node): nothing here is called.
//
// Everything that saves a file MUST go through this module; every AI request goes through ./ai.

import { isInArtifactViewer, useCapability } from './claude';

/** Extensions the artifact `downloads` capability accepts. Others must be wrapped in a .zip. */
export const ARTIFACT_SAFE_EXTENSIONS = new Set([
  'gif', 'png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm', 'txt', 'json', 'md',
  'docx', 'pptx', 'epub', 'csv', 'ttf', 'html', 'svg', 'pdf', 'xlsx', 'zip',
]);

export type SaveOutcome = 'saved' | 'declined' | 'unavailable' | 'error';

/**
 * Save a file for the user. In the artifact viewer, uses the downloads capability (the viewer
 * confirms); files with extensions the viewer does not accept (e.g. .sav) are zipped first.
 * Elsewhere, triggers a normal browser download.
 */
export async function saveFile(filename: string, data: Blob | Uint8Array | string, mime = 'application/octet-stream'): Promise<SaveOutcome> {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: mime });
  if (isInArtifactViewer()) {
    const downloads = await useCapability('downloads');
    if (downloads) {
      let name = filename;
      let payload: Blob = blob;
      const ext = (filename.split('.').pop() ?? '').toLowerCase();
      if (!ARTIFACT_SAFE_EXTENSIONS.has(ext)) {
        const { zipSync } = await import('fflate');
        const bytes = new Uint8Array(await blob.arrayBuffer());
        payload = new Blob([zipSync({ [filename]: bytes }) as BlobPart], { type: 'application/zip' });
        name = filename + '.zip';
      }
      try {
        await downloads.save({ filename: name, data: payload });
        return 'saved';
      } catch (e: any) {
        if (e?.code === 'declined') return 'declined';
        if (e?.code === 'rate_limited') return 'error';
        return 'unavailable';
      }
    }
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    return 'saved';
  } catch {
    return 'error';
  }
}

/** Copy text (and optionally HTML, for pasting formatted tables into Word). Must be called from a click handler. */
export async function copyToClipboard(text: string, html?: string): Promise<boolean> {
  try {
    if (html && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        }),
      ]);
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}

// ---------- AI assistance ----------
// Claude (artifact `sample` capability) lives in ./claude; the provider layer (Claude, on-device,
// Gemini, OpenAI-compatible services) lives in ./ai. Re-exported here so older imports keep working.

export { isInArtifactViewer } from './claude';
export { AiUnavailableError, askClaude, askClaudeJson, type ClaudeAskOptions as AskOptions } from './claude';
export { aiAvailable, aiErrorMessage, askAI, askAIJson } from './ai';
