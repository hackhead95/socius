import { describe, expect, it } from 'vitest';
import { bigramFrequencies, charLength, kwic, splitParagraphs, splitSentences, tokenize, wordFrequencies, searchRegex } from '../../src/lib/coding/text';

const sentences = (t: string) => splitSentences(t).map((r) => t.slice(r.start, r.end));

describe('tokenizer', () => {
  it('handles English contractions and hyphens', () => {
    expect(tokenize("I don't like self-help books.").map((t) => t.norm)).toEqual(['i', "don't", 'like', 'self-help', 'books']);
  });
  it('keeps Bengali and Devanagari words whole, with vowel signs', () => {
    const bn = 'আমি কলকাতায় থাকি।';
    expect(tokenize(bn).map((t) => t.text)).toEqual(['আমি', 'কলকাতায়', 'থাকি']);
    const hi = 'मैं दिल्ली में रहता हूँ';
    expect(tokenize(hi).map((t) => t.text)).toEqual(['मैं', 'दिल्ली', 'में', 'रहता', 'हूँ']);
  });
  it('counts characters without combining marks', () => {
    expect(charLength('দিল্লি')).toBeLessThan('দিল্লি'.length);
    expect(charLength('abc')).toBe(3);
  });
});

describe('word frequencies', () => {
  const texts = ['The rent is too high. Rent keeps rising!', 'High rent and low wages.', 'Wages, wages, wages'];
  it('removes stopwords, applies min length and counts documents', () => {
    const w = wordFrequencies(texts, { removeStopwords: true, minLength: 3 });
    expect(w[0]).toEqual({ term: 'wages', count: 4, docs: 2 });
    expect(w.find((x) => x.term === 'rent')).toEqual({ term: 'rent', count: 3, docs: 2 });
    expect(w.find((x) => x.term === 'the')).toBeUndefined();
    expect(w.find((x) => x.term === 'is')).toBeUndefined();
  });
  it('keeps stopwords when asked', () => {
    const w = wordFrequencies(texts, { removeStopwords: false, minLength: 1 });
    expect(w.find((x) => x.term === 'the')?.count).toBe(1);
  });
  it('ignores numbers by default', () => {
    expect(wordFrequencies(['In 2019 and 2020'], { removeStopwords: false, minLength: 1 }).map((w) => w.term)).toEqual(['and', 'in']);
  });
  it('bigrams within sentences, skipping stopword pairs', () => {
    const b = bigramFrequencies(['High rent is a problem. High rent crisis.', 'rent crisis'], { removeStopwords: true, minLength: 3 });
    expect(b.find((x) => x.term === 'high rent')).toEqual({ term: 'high rent', count: 2, docs: 1 });
    expect(b.find((x) => x.term === 'rent crisis')?.count).toBe(2);
    // "problem high" crosses a sentence boundary
    expect(b.find((x) => x.term === 'problem high')).toBeUndefined();
  });
});

describe('sentence splitting', () => {
  it('handles abbreviations, initials and decimals', () => {
    expect(sentences('Dr. Sen met Mr. J. Roy at 3.5 km away. It was e.g. fine! Then? Yes.')).toEqual([
      'Dr. Sen met Mr. J. Roy at 3.5 km away.',
      'It was e.g. fine!',
      'Then?',
      'Yes.',
    ]);
  });
  it('splits at line breaks, closing quotes and the danda', () => {
    expect(sentences('He said "stop." She left.\nNew line')).toEqual(['He said "stop."', 'She left.', 'New line']);
    expect(sentences('আমি থাকি। তুমি যাও।')).toEqual(['আমি থাকি।', 'তুমি যাও।']);
  });
  it('does not split before a lower-case word', () => {
    expect(sentences('It costs approx. ten rupees. Ok.')).toEqual(['It costs approx. ten rupees.', 'Ok.']);
  });
  it('paragraphs', () => {
    const t = 'First para.\n\n  Second para.  \nThird';
    expect(splitParagraphs(t).map((r) => t.slice(r.start, r.end))).toEqual(['First para.', 'Second para.', 'Third']);
  });
});

describe('KWIC', () => {
  const texts = ['Migration changed my family. Migrants send money home.', 'No migration here; immigration is different.'];
  it('finds whole words with wildcard and gives context', () => {
    const lines = kwic(texts, 'migra*', { window: 20 });
    expect(lines.map((l) => l.match)).toEqual(['Migration', 'Migrants', 'migration']);
    expect(lines[1].left).toBe('changed my family. ');
    expect(lines[1].right.startsWith(' send money')).toBe(true);
    expect(lines[2].docIndex).toBe(1);
  });
  it('phrase search with flexible whitespace', () => {
    expect(kwic(['send  money home', 'send money'], 'send money').length).toBe(2);
  });
  it('works for Bengali', () => {
    expect(kwic(['আমি কলকাতায় থাকি। কলকাতা বড়।'], 'কলকাতা*').length).toBe(2);
  });
  it('escapes regex characters in queries', () => {
    expect(searchRegex('a+b')!.test('a+b')).toBe(true);
  });
});
