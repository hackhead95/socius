// Prompt builders respect a smaller prompt budget (on-device models and strict free tiers).
import { describe, expect, it } from 'vitest';
import type { CodeDef } from '../../src/core/coding-types';
import { buildCodebookPrompt, buildSuggestBatches, buildSummaryPrompt, byteLength, PROMPT_BUDGET_BYTES } from '../../src/lib/coding/ai';

const code: CodeDef = { id: 'w', name: 'Water', description: 'Water supply', color: '#2f9be0', parentId: null, createdAt: 0 };
const texts = Array.from({ length: 150 }, (_, i) => `Response ${i}: the water supply is irregular and we buy from tankers every week, which costs a lot. `.repeat(3));

describe('prompt budgets', () => {
  it('codebook prompt: default budget unchanged, smaller budget sends fewer excerpts', () => {
    const big = buildCodebookPrompt(texts);
    const small = buildCodebookPrompt(texts, { budgetBytes: 7000 });
    expect(byteLength(big.prompt)).toBeLessThanOrEqual(PROMPT_BUDGET_BYTES);
    expect(byteLength(small.prompt)).toBeLessThanOrEqual(7000);
    expect(small.used).toBeGreaterThan(5);
    expect(small.used).toBeLessThan(big.used);
  });

  it('suggestion batches and summaries stay under the budget', () => {
    const items = texts.map((t, i) => ({ id: `r${i + 1}`, text: t }));
    const batches = buildSuggestBatches([code], items, { budgetBytes: 7000 });
    expect(batches.length).toBeGreaterThan(buildSuggestBatches([code], items).length);
    for (const b of batches) expect(byteLength(b.prompt)).toBeLessThanOrEqual(7000);
    expect(batches.flatMap((b) => b.ids)).toHaveLength(150);
    const s = buildSummaryPrompt(code, texts.map((t, i) => ({ source: `R${i}`, text: t })), { budgetBytes: 7000 });
    expect(byteLength(s.prompt)).toBeLessThanOrEqual(7000);
    expect(s.used).toBeGreaterThan(3);
  });
});
