// The beginner's guide (docs/guide/guide.md, built to public/guide/index.html) must not have broken
// cross-references or missing pictures. The in-app help topics are checked in helpTopics.test.ts.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

describe('beginner guide', () => {
  const html = readFileSync(new URL('../../public/guide/index.html', import.meta.url), 'utf8');
  const md = readFileSync(new URL('../../docs/guide/guide.md', import.meta.url), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  it('every #link in the built page points at a heading that exists', () => {
    const refs = [...new Set([...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))];
    expect(refs.filter((r) => !ids.has(r))).toEqual([]);
  });

  it('every picture in guide.md exists in public/guide/img', () => {
    const imgs = [...new Set([...md.matchAll(/\]\((img\/[\w-]+\.png)\)/g)].map((m) => m[1]))];
    expect(imgs.length).toBeGreaterThan(40);
    expect(imgs.filter((f) => !existsSync(new URL(`../../public/guide/${f}`, import.meta.url)))).toEqual([]);
  });

  it('uses no em-dashes', () => {
    expect(md.includes('—')).toBe(false);
  });
});
