// Help topics in the search palette must point at real sections of the beginner's guide.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { HELP_TOPICS, helpTopicUrl } from '../../src/app/helpTopics';

describe('help topics', () => {
  const html = readFileSync(new URL('../../public/guide/index.html', import.meta.url), 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  it.each(HELP_TOPICS.map((t) => [t.anchor, t.title]))('#%s (%s) exists in public/guide/index.html', (anchor) => {
    expect(ids.has(anchor)).toBe(true);
  });

  it('has unique anchors and builds guide links with the anchor', () => {
    expect(new Set(HELP_TOPICS.map((t) => t.anchor)).size).toBe(HELP_TOPICS.length);
    expect(helpTopicUrl(HELP_TOPICS[0], 'https://x.github.io/socius/guide/')).toBe(`https://x.github.io/socius/guide/#${HELP_TOPICS[0].anchor}`);
  });
});
