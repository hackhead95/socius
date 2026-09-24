// @vitest-environment jsdom
// Error log: redaction (no keys, tokens, data values, names or file names ever stored), the ring
// buffer (entry and size caps, repeats counted, storage failures), context and reports.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ERROR_LOG_KEY, MAX_BYTES, NUMBER_REMOVED, componentStackText, MAX_ENTRIES, SESSION_ID, __resetErrorLogForTests, clearLog, describeBrowser, fileKind, formatReport, formatSummary, getLog,
  logError, logFailure, logInfo, logIsMemoryOnly, logSlow, logWarn, looksSecret, markLogSeen, redact, setLogContextProvider, setSensitiveTermsProvider,
  subscribe, unseenErrorCount,
} from '../../src/platform/errorlog';
import { AiUnavailableError } from '../../src/platform/claude';

const KEYS = {
  gemini: 'AIzaSyD3xAmPlE_kEy-1234567890abcdEFGH',
  googleOauth: 'AQ.Ab8RN6Jx3kP0qV9mZt_2LwYb-7Hc4uQeRsTg1',
  openai: 'sk-proj-Abc123Def456Ghi789Jkl012Mno345',
  openrouter: 'sk-or-v1-0123456789abcdef0123456789abcdef0123456789abcdef',
  groq: 'gsk_Q1w2E3r4T5y6U7i8O9p0AsDfGhJkLzXc',
  jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
  random: 'Zm9vYmFyYmF6cXV4MTIzNDU2Nzg5MGFiY2RlZg9X2kQ',
};

beforeEach(() => {
  localStorage.clear();
  __resetErrorLogForTests();
});
afterEach(() => {
  __resetErrorLogForTests();
  localStorage.clear();
});

describe('redact', () => {
  it('removes API keys and tokens of every known format', () => {
    for (const [name, key] of Object.entries(KEYS)) {
      const out = redact(`Request failed with ${key} in it`, 500);
      expect(out, name).not.toContain(key);
      expect(out, name).not.toMatch(/AIza|sk-proj|sk-or|gsk_|eyJhbGci/);
    }
  });

  it('removes bearer tokens, key= parameters and key headers', () => {
    expect(redact('Authorization: Bearer abcdefghijklmnop123456')).not.toContain('abcdefghijklmnop123456');
    expect(redact('header x-goog-api-key: supersecretvalue99')).not.toContain('supersecretvalue99');
    expect(redact('call ?alt=sse&key=AB12cd34EF56 done')).not.toContain('AB12cd34EF56');
    expect(redact('api_key="hunter2hunter2"')).not.toContain('hunter2hunter2');
  });

  it('strips query strings and fragments from URLs but keeps the host, path and stack position', () => {
    const out = redact('GET https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=XYZ123secret#frag failed');
    expect(out).toContain('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?…');
    expect(out).not.toContain('XYZ123secret');
    expect(out).not.toContain('alt=sse');
    expect(redact('at run (http://localhost:5173/src/x.ts?t=1712:10:5)')).toContain('http://localhost:5173/src/x.ts?…:10:5');
    expect(redact('at run (https://hackhead95.github.io/socius/assets/index-CkL3x9aZ.js:1:2345)')).toContain('https://hackhead95.github.io/socius/assets/index-CkL3x9aZ.js:1:2345');
  });

  it('removes data: URLs, e-mail addresses, quoted text and file names', () => {
    expect(redact('bad data:text/csv;base64,YWdlLGluY29tZQ== here')).toBe('bad data:[removed] here');
    expect(redact('Contact jane.doe@uni.example.ac.uk for access')).toBe('Contact [email] for access');
    expect(redact('Unexpected token \'x\', "Maria, 42, Leeds" is not valid JSON')).toBe('Unexpected token \'…\', "…" is not valid JSON');
    expect(redact("don't stop, it's fine")).toBe("don't stop, it's fine");
    expect(redact('Could not open respondents_2024.final.sav.')).toBe('Could not open [file].sav.');
    expect(redact('Could not read interview_07.docx')).toBe('Could not read [file].docx');
  });

  it('removes the project\'s own names and labels as whole words', () => {
    const terms = ['income_hh', 'Household income (monthly)', 'Very dissatisfied'];
    const out = redact('Variable income_hh (Household income (monthly)) has value Very dissatisfied; income_hhx stays', 500, terms);
    expect(out).toBe('Variable [name] ([name]) has value [name]; income_hhx stays');
  });

  it('removes long random-looking strings but keeps words and code identifiers', () => {
    expect(looksSecret(KEYS.random)).toBe(true);
    expect(looksSecret('0123456789abcdef0123456789abcdef')).toBe(true);
    expect(looksSecret('streamGenerateContentForModels')).toBe(false);
    expect(looksSecret('internationalisation_of_things')).toBe(false);
    expect(redact(`value ${KEYS.random} end`)).toBe('value [removed] end');
  });

  it('truncates long strings and never throws', () => {
    const out = redact('x '.repeat(1000), 50);
    expect(out.length).toBe(50);
    expect(out.endsWith('…')).toBe(true);
    expect(redact(undefined)).toBe('');
    expect(redact({ toString: () => { throw new Error('no'); } })).toBe('[could not be logged safely]');
  });

  it('fileKind keeps only the extension', () => {
    expect(fileKind('My Survey 2024.SAV')).toBe('sav');
    expect(fileKind('noext')).toBe('');
  });
});

describe('redact: numbers that identify people', () => {
  it('removes Indian mobile numbers in every usual form', () => {
    for (const phone of ['+91 98765 43210', '+919876543210', '+91-98765-43210', '0091 9876543210', '09876543210', '9876543210', '98765 43210', '7012345678', '6123456789']) {
      const out = redact(`Row 12 has ${phone} in column B`, 500);
      expect(out, phone).toBe(`Row 12 has ${NUMBER_REMOVED} in column B`);
    }
  });

  it('removes Aadhaar-like 12-digit numbers, with or without groups of four', () => {
    for (const id of ['2345 6789 0123', '2345-6789-0123', '234567890123']) {
      expect(redact(`Cannot parse ${id} as a date`, 500), id).toBe(`Cannot parse ${NUMBER_REMOVED} as a date`);
    }
  });

  it('removes any other long run of digits in free text, in any script', () => {
    expect(redact('Unexpected value 123456789 in row 4', 500)).toBe(`Unexpected value ${NUMBER_REMOVED} in row 4`);
    expect(redact('value=48213377190023 rejected', 500)).toBe(`value=${NUMBER_REMOVED} rejected`);
    // Bengali and Devanagari digits.
    expect(redact('ফোন ৯৮৭৬৫৪৩২১০ দিন', 500)).toBe(`ফোন ${NUMBER_REMOVED} দিন`);
    expect(redact('मोबाइल ९८७६५४३२१० है', 500)).toBe(`मोबाइल ${NUMBER_REMOVED} है`);
  });

  it('keeps short numbers: HTTP statuses, counts, sizes, dates and stack positions', () => {
    const keep = [
      'Gemini answered 429 (rate limited)',
      'HTTP status: 503',
      'Slow: models.linear took 12.3 s',
      '500 cases x 40 variables',
      'Row 18: 4721.5 is out of range',
      'Built 2026-09-24',
      'at run (https://hackhead95.github.io/socius/assets/index-CkL3x9aZ.js:1:234567)',
      'Maximum call stack size exceeded after 10000 calls',
      'gemini-2.5-flash-preview-09-2025',
    ];
    for (const t of keep) expect(redact(t, 500), t).toBe(t);
  });

  it('never stores such numbers in the log (message, detail or service text)', () => {
    const err = Object.assign(new Error('Import failed at 9876543210'), { detail: 'Aadhaar 2345 6789 0123 and +91 91234 56789 in the file' });
    logError('import', err);
    const e = getLog()[0];
    const all = JSON.stringify(e) + (localStorage.getItem(ERROR_LOG_KEY) ?? '');
    for (const n of ['9876543210', '2345 6789 0123', '91234 56789']) expect(all, n).not.toContain(n);
    expect(e.message).toBe(`Import failed at ${NUMBER_REMOVED}`);
  });

  it('is stable: redacting twice changes nothing more', () => {
    for (const t of ['call +91 98765 43210 now', 'id 2345 6789 0123', 'x 1234567890123 y', `key ${KEYS.gemini} and 9876543210`]) {
      const once = redact(t, 500);
      expect(redact(once, 500), t).toBe(once);
    }
  });
});

describe('componentStackText', () => {
  it('keeps component names only, without file addresses', () => {
    const stack = '\n    at Boom (http://localhost:5173/src/Boom.tsx?t=1712:10:5)\n    at ErrorBoundary (http://localhost:5173/src/app/ErrorBoundary.tsx:30:1)\n    at div\n    at http://localhost:5173/src/x.ts:1:2\n    Crosstabs@https://hackhead95.github.io/socius/assets/index-Ab12.js:1:99';
    const out = componentStackText(stack)!;
    expect(out).toBe('Component stack:\n  at Boom\n  at ErrorBoundary\n  at div\n  at Crosstabs');
    expect(out).not.toMatch(/localhost|github|\.tsx|:\d/);
    expect(componentStackText('')).toBeUndefined();
    expect(componentStackText(undefined)).toBeUndefined();
    const long = Array.from({ length: 15 }, (_, i) => `    at C${i} (x.js:1:1)`).join('\n');
    expect(componentStackText(long)).toContain('(5 more)');
  });
});

describe('logging', () => {
  it('stores level, area, message, detail and context, newest first', () => {
    setLogContextProvider(() => ({ tab: 'output', dataset: '500 cases x 40 variables', provider: 'gemini', model: 'gemini-2.5-flash' }));
    logInfo('ui', 'first');
    logError('ai', new AiUnavailableError('unavailable', 'The AI service answered 500.', 'Internal error encountered.'));
    const [e, first] = getLog();
    expect(first.message).toBe('first');
    expect(e).toMatchObject({ level: 'error', area: 'ai', message: 'The AI service answered 500.', session: SESSION_ID });
    expect(e.detail).toContain('Code: unavailable');
    expect(e.detail).toContain('HTTP status: 500');
    expect(e.detail).toContain('Service said: Internal error encountered.');
    expect(e.context).toMatchObject({ tab: 'output', dataset: '500 cases x 40 variables', provider: 'gemini', model: 'gemini-2.5-flash' });
    expect(e.context?.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(new Date(e.time).toISOString()).toBe(e.time);
  });

  it('never stores keys, names or values, even in stacks, service messages or the file name', () => {
    setSensitiveTermsProvider(() => ['life_satisfaction', 'How satisfied are you with your life?']);
    const err = new Error(`Column life_satisfaction: "Very happy, lives in Leeds" failed with key ${KEYS.gemini}`);
    err.stack = `Error: boom\n    at parse (https://x.github.io/socius/assets/index-AbC12.js?key=${KEYS.gemini}:1:99)\n    at run (https://x.github.io/socius/assets/index-AbC12.js:2:10)`;
    logFailure('import', err, { file: 'Confidential Panel Wave 3.sav' });
    logError('ai', new AiUnavailableError('invalid_key', 'The AI service answered 400.', `API key not valid: ${KEYS.gemini}`));
    const all = JSON.stringify(getLog()) + (localStorage.getItem(ERROR_LOG_KEY) ?? '') + formatReport();
    for (const bad of [KEYS.gemini, 'life_satisfaction', 'Very happy', 'Leeds', 'Confidential Panel Wave 3']) expect(all, bad).not.toContain(bad);
    const imp = getLog()[1];
    expect(imp.context?.file).toBe('sav');
    expect(imp.detail).toContain('at run (https://x.github.io/socius/assets/index-AbC12.js:2:10)');
  });

  it('never serialises unknown objects', () => {
    logError('ui', { secretValue: 'Anna Smith, 1974' });
    const e = getLog()[0];
    expect(e.message).toBe('[object Object]');
    expect(JSON.stringify(e)).not.toContain('Anna');
  });

  it('skips cancelled requests and benign browser notices; not-configured AI is a warning', () => {
    logError('ai', new AiUnavailableError('cancelled', 'Stopped.'));
    logError('ui', new DOMException('The user aborted a request.', 'AbortError'));
    logError('ui', 'ResizeObserver loop completed with undelivered notifications.');
    expect(getLog()).toHaveLength(0);
    logError('ai', new AiUnavailableError('not_configured', 'AI help is not set up.'));
    expect(getLog()[0].level).toBe('warn');
  });

  it('logs the same error object once, and returns it', () => {
    const e = new Error('once');
    expect(logError('ai', e)).toBe(e);
    logError('assistant', e);
    expect(getLog()).toHaveLength(1);
  });

  it('counts repeats instead of storing them again', () => {
    for (let i = 0; i < 5; i++) logWarn('storage', 'The browser storage is full.');
    expect(getLog()).toHaveLength(1);
    expect(getLog()[0].count).toBe(5);
  });

  it('logFailure: programming errors are errors, app messages are warnings', () => {
    logFailure('analysis', new TypeError("Cannot read properties of undefined (reading 'x')"));
    logFailure('analysis', new Error('Select at least one variable.'));
    const [warn, err] = getLog();
    expect(err.level).toBe('error');
    expect(warn.level).toBe('warn');
  });

  it('logSlow records only operations over 5 seconds', () => {
    logSlow('analysis', 'crosstabs', 4000);
    expect(getLog()).toHaveLength(0);
    logSlow('analysis', 'crosstabs', 7250);
    expect(getLog()[0]).toMatchObject({ level: 'info', message: 'Slow: crosstabs took 7.3 s', context: { op: 'crosstabs', ms: 7250 } });
  });

  it('never throws, even when the context provider fails', () => {
    setLogContextProvider(() => {
      throw new Error('store broken');
    });
    setSensitiveTermsProvider(() => {
      throw new Error('store broken');
    });
    expect(() => logError('ui', new Error('still logged'))).not.toThrow();
    expect(getLog()[0].message).toBe('still logged');
  });
});

describe('ring buffer and storage', () => {
  it(`keeps the newest ${MAX_ENTRIES} entries`, () => {
    for (let i = 0; i < MAX_ENTRIES + 25; i++) logInfo('ui', `entry ${i}`);
    const log = getLog();
    expect(log).toHaveLength(MAX_ENTRIES);
    expect(log[0].message).toBe(`entry ${MAX_ENTRIES + 24}`);
    expect(log[log.length - 1].message).toBe('entry 25');
  });

  it('stays under the size cap', () => {
    for (let i = 0; i < 250; i++) {
      const e = new Error(`problem ${i} ${'word '.repeat(50)}`);
      e.stack = `Error\n${Array.from({ length: 8 }, (_, j) => `    at f${j} (https://example.org/assets/app-${i}-${j}.js:1:${j})`).join('\n')}\n${'    at g (https://example.org/a.js:1:1)\n'.repeat(3)}`;
      logError('ui', e, undefined, 'Component stack:\n' + '  at Panel\n'.repeat(60));
    }
    const stored = localStorage.getItem(ERROR_LOG_KEY)!;
    expect(stored.length).toBeLessThanOrEqual(MAX_BYTES + 100);
    expect(getLog().length).toBeGreaterThan(20);
    expect(getLog()[0].message).toContain('problem 249');
  });

  it('persists to localStorage and reloads', () => {
    logError('export', new Error('Could not write the Excel file.'));
    __resetErrorLogForTests({ reload: true });
    expect(getLog().map((e) => e.message)).toEqual(['Could not write the Excel file.']);
  });

  it('ignores a corrupt stored log', () => {
    localStorage.setItem(ERROR_LOG_KEY, '{not json');
    __resetErrorLogForTests({ reload: true });
    expect(getLog()).toEqual([]);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify({ entries: [{ id: 1 }, { id: 'a', time: 't', level: 'error', area: 'ui', message: 'ok' }] }));
    __resetErrorLogForTests({ reload: true });
    expect(getLog().map((e) => e.message)).toEqual(['ok']);
  });

  it('falls back to memory when storage is full or blocked', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException('quota', 'QuotaExceededError');
    };
    try {
      expect(() => logError('storage', new Error('first'))).not.toThrow();
      logError('storage', new Error('second'));
      expect(getLog().map((e) => e.message)).toEqual(['second', 'first']);
      expect(logIsMemoryOnly()).toBe(true);
      expect(formatReport()).toContain('memory only');
    } finally {
      Storage.prototype.setItem = orig;
    }
  });

  it('clearLog empties memory and storage and notifies subscribers', () => {
    let calls = 0;
    const off = subscribe(() => calls++);
    logError('ui', new Error('x'));
    clearLog();
    off();
    expect(getLog()).toEqual([]);
    expect(localStorage.getItem(ERROR_LOG_KEY)).toBeNull();
    expect(calls).toBe(2);
  });

  it('counts unseen errors of this session until the log is opened', () => {
    logWarn('ui', 'a warning');
    expect(unseenErrorCount()).toBe(0);
    logError('ui', new Error('an error'));
    logError('ai', new Error('another'));
    expect(unseenErrorCount()).toBe(2);
    markLogSeen();
    expect(unseenErrorCount()).toBe(0);
    logError('ui', new Error('a third'));
    expect(unseenErrorCount()).toBe(1);
  });
});

describe('reports', () => {
  it('formatReport lists version, browser and every entry in plain text', () => {
    logError('ai', new AiUnavailableError('rate_limited', 'The AI service answered 429.'), { op: 'test-connection' });
    const r = formatReport();
    expect(r).toMatch(/^Socius error report\n/);
    expect(r).toMatch(/Version: \d+\.\d+\.\d+/);
    expect(r).toContain('Browser: ');
    expect(r).toContain('ERROR  ai');
    expect(r).toContain('The AI service answered 429.');
    expect(r).toContain('Code: rate_limited');
    expect(r).toContain('operation test-connection');
  });

  it('formatSummary is short and lists the last problems', () => {
    for (let i = 0; i < 8; i++) logError('analysis', new Error(`failure ${i}`));
    logInfo('ui', 'just info');
    const s = formatSummary(5);
    expect(s).toContain('Recent problems (newest first, 5 of 8)');
    expect(s).toContain('failure 7');
    expect(s).not.toContain('failure 2');
    expect(s).not.toContain('just info');
    expect(s.length).toBeLessThan(1500);
  });

  it('describeBrowser names the browser and system only', () => {
    expect(describeBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7339.80 Safari/537.36')).toBe('Chrome 140 on Windows');
    expect(describeBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15')).toBe('Safari 18 on macOS');
    expect(describeBrowser('Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0')).toBe('Firefox 131 on Linux');
    expect(describeBrowser('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/140.0 Safari/537.36 Edg/140.0.1')).toBe('Edge 140 on Windows');
  });
});

describe('the same problem in several sessions', () => {
  it('is one entry with the total count, the number of sessions and when it was first seen', () => {
    const old = { id: 'old-1', time: '2026-09-20T10:00:00.000Z', level: 'error', area: 'storage', message: 'The quota has been exceeded.', detail: 'Type: QuotaExceededError\nCode: 22', context: { op: 'readwrite session' }, count: 4, session: 'oldsess' };
    const other = { id: 'old-2', time: '2026-09-20T10:01:00.000Z', level: 'warn', area: 'import', message: 'Something else', session: 'oldsess' };
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify({ v: 1, entries: [old, other] }));
    __resetErrorLogForTests({ reload: true });
    const err = Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError', code: 22, stack: '' });
    logError('storage', err, { op: 'readwrite session' });
    const log = getLog();
    expect(log).toHaveLength(2);
    expect(log[0]).toMatchObject({ area: 'storage', count: 5, sessions: 2, first: '2026-09-20T10:00:00.000Z', session: SESSION_ID });
    expect(formatReport()).toContain('(x5 in 2 sessions, first 2026-09-20T10:00:00.000Z)');
    // The merged old entry does not come back from storage on the next write.
    logWarn('ui', 'another');
    expect(getLog().filter((e) => e.area === 'storage')).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(ERROR_LOG_KEY)!).entries.filter((e: any) => e.area === 'storage')).toHaveLength(1);
  });
});
