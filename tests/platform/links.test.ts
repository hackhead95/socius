// Help menu links: derived from the GitHub Pages address, with fallbacks elsewhere.
import { describe, expect, it } from 'vitest';
import { FALLBACK_FEEDBACK_URL, FALLBACK_SITE_URL, deriveLinks } from '../../src/app/links';

const loc = (href: string) => {
  const u = new URL(href);
  return { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname };
};

describe('deriveLinks', () => {
  it('project site on GitHub Pages: owner from the subdomain, repo from the first path segment', () => {
    expect(deriveLinks(loc('https://hackhead95.github.io/socius/'), 'production')).toEqual({
      SITE_URL: 'https://hackhead95.github.io/socius/',
      GUIDE_URL: 'https://hackhead95.github.io/socius/guide/',
      FEEDBACK_URL: 'https://github.com/hackhead95/socius/issues/new/choose',
    });
  });

  it('follows a renamed repository and ignores deeper paths, index.html and hashes', () => {
    const l = deriveLinks(loc('https://SomeLab.github.io/sociology-data-analysis-tool/index.html#/coding'), 'production');
    expect(l.SITE_URL).toBe('https://somelab.github.io/sociology-data-analysis-tool/');
    expect(l.GUIDE_URL).toBe('https://somelab.github.io/sociology-data-analysis-tool/guide/');
    expect(l.FEEDBACK_URL).toBe('https://github.com/somelab/sociology-data-analysis-tool/issues/new/choose');
    expect(deriveLinks(loc('https://a-b.github.io/socius/guide/tour.html'), 'production').GUIDE_URL).toBe('https://a-b.github.io/socius/guide/');
  });

  it('user site at the root of <owner>.github.io', () => {
    const l = deriveLinks(loc('https://hackhead95.github.io/'), 'production');
    expect(l.SITE_URL).toBe('https://hackhead95.github.io/');
    expect(l.GUIDE_URL).toBe('https://hackhead95.github.io/guide/');
    expect(l.FEEDBACK_URL).toBe('https://github.com/hackhead95/hackhead95.github.io/issues/new/choose');
    expect(deriveLinks(loc('https://hackhead95.github.io/index.html'), 'production').SITE_URL).toBe('https://hackhead95.github.io/');
  });

  it('artifact build: absolute fallbacks', () => {
    const l = deriveLinks(loc('https://hackhead95.github.io/socius/'), 'artifact');
    expect(l).toEqual({ SITE_URL: FALLBACK_SITE_URL, GUIDE_URL: `${FALLBACK_SITE_URL}guide/`, FEEDBACK_URL: FALLBACK_FEEDBACK_URL });
    expect(FALLBACK_SITE_URL).toBe('https://hackhead95.github.io/socius/');
    expect(FALLBACK_FEEDBACK_URL).toBe('https://github.com/hackhead95/socius/issues/new/choose');
    expect(deriveLinks(null, 'production').SITE_URL).toBe(FALLBACK_SITE_URL);
  });

  it('localhost and other hosts: the guide next to the app, fallbacks for the rest', () => {
    const l = deriveLinks(loc('http://localhost:4173/'), 'production');
    expect(l.GUIDE_URL).toBe('http://localhost:4173/guide/');
    expect(l.SITE_URL).toBe(FALLBACK_SITE_URL);
    expect(l.FEEDBACK_URL).toBe(FALLBACK_FEEDBACK_URL);
    expect(deriveLinks(loc('https://example.org/tools/socius/index.html'), 'production').GUIDE_URL).toBe('https://example.org/tools/socius/guide/');
  });

  it('opened from disk', () => {
    const l = deriveLinks(loc('file:///home/me/socius/dist/index.html'), 'production');
    expect(l.GUIDE_URL).toBe('file:///home/me/socius/dist/guide/index.html');
    expect(l.FEEDBACK_URL).toBe(FALLBACK_FEEDBACK_URL);
  });
});
