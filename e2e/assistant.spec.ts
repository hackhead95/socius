// The Socius assistant end to end: floating button and Ctrl+J, the panel on every tab, Gemini
// function calling against a mocked API (tool calls run on the live data, results go back as
// functionResponse parts), Add to Output, a proposed recode applied only on click and undone, Stop,
// the phone layout, and opening it from search.
import { expect, test, type Page, type Route } from '@playwright/test';
import { openWithSample } from './helpers';

const GEMINI = 'https://generativelanguage.googleapis.com/**';
const cors = { 'Access-Control-Allow-Origin': '*' };

type Part = Record<string, unknown>;
interface Seen {
  body: any;
}

/** Gemini with a free key set up in this browser. */
async function withGemini(page: Page) {
  await page.addInitScript(() => localStorage.setItem('socius.ai', JSON.stringify({ provider: 'gemini', gemini: { apiKey: 'AIza-e2e', model: '' } })));
}

/**
 * Mock Gemini: `script(body, round)` returns the model parts for each generateContent request.
 * Replies are sent as one server-sent event (the assistant streams).
 */
async function mockGemini(page: Page, script: (body: any, round: number) => Part[] | Promise<Part[]>, opts: { delayMs?: number } = {}): Promise<Seen[]> {
  const seen: Seen[] = [];
  await page.route(GEMINI, async (route: Route) => {
    const req = route.request();
    if (req.method() === 'GET')
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ models: [{ name: 'models/gemini-3.6-flash', supportedGenerationMethods: ['generateContent'] }] }) });
    const body = req.postDataJSON();
    seen.push({ body });
    if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
    const parts = await script(body, seen.length - 1);
    const sse = `data: ${JSON.stringify({ candidates: [{ content: { role: 'model', parts }, finishReason: 'STOP' }] })}\r\n\r\n`;
    return route.fulfill({ status: 200, headers: { ...cors, 'Content-Type': 'text/event-stream' }, body: sse }).catch(() => undefined);
  });
  return seen;
}

const lastParts = (body: any): any[] => body.contents[body.contents.length - 1].parts;

test('floating button, Ctrl+J, starters, set-up prompt and privacy line without AI', async ({ page }) => {
  await openWithSample(page);
  const fab = page.getByTestId('assistant-fab');
  await expect(fab).toBeVisible();
  await expect(fab).toHaveAccessibleName(/Assistant \((Ctrl|Cmd)\+J\)/);
  await page.keyboard.press('Control+j');
  const panel = page.getByTestId('assistant-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Set up AI' }).first()).toBeVisible();
  await expect(panel.getByRole('listitem')).toHaveText(['Describe my dataset', 'Which variables need cleaning?', /Which test should I use to compare .* across gender\?/, 'Build a trust scale']);
  await expect(page.getByTestId('assistant-privacy')).toContainText('nothing is sent anywhere');
  // "What the assistant can see": individual cases start off.
  await panel.getByRole('button', { name: 'What the assistant can see' }).click();
  await expect(page.getByTestId('see-cases')).not.toBeChecked();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(fab).toBeFocused();
  // Available on every tab.
  await page.getByRole('tab', { name: 'Output' }).click();
  await expect(fab).toBeVisible();
  await fab.click();
  await expect(panel.getByRole('listitem').first()).toHaveText('Describe my dataset');
  // Without AI, a question explains how to set it up.
  await panel.getByRole('listitem').first().click();
  await expect(panel.getByTestId('assistant-message')).toContainText('AI help is not set up yet');
});

test('Gemini function calling: tools run on the live data, results go back, Add to Output', async ({ page }) => {
  await withGemini(page);
  const seen = await mockGemini(page, (body, round) => {
    if (round === 0)
      return [
        { text: 'Let me check.' },
        { functionCall: { name: 'describe_variables', args: { names: ['trust5', 'gender'] } }, thoughtSignature: 'sig-1' },
        { functionCall: { name: 'run_analysis', args: { procedure_id: 'crosstabs', variables: { rows: ['gender'], columns: ['trust5'] } } } },
      ];
    const results = lastParts(body).map((p: any) => p.functionResponse);
    const apa = /APA sentence: (.*)/.exec(results[1].response.result)?.[1] ?? 'missing';
    return [{ text: `## Short answer\nWomen feel **less safe** after dark.\n\n| Group | Agree |\n|---|--:|\n| Man | 44.8% |\n| Woman | 29.3% |\n\n${apa}\n\n1. Add the table to Output.` }];
  });
  await openWithSample(page);
  await page.keyboard.press('Control+j');
  const panel = page.getByTestId('assistant-panel');
  await panel.getByLabel('Message to the assistant').fill('Is gender related to feeling safe after dark?');
  await page.keyboard.press('Enter');
  const msg = panel.getByTestId('assistant-message');
  await expect(msg).toHaveAttribute('data-status', 'done', { timeout: 20_000 });
  await expect(msg.locator('.as-md h4')).toHaveText('Short answer');
  await expect(msg.locator('table.as-table')).toContainText('29.3%');
  await expect(msg).toContainText('χ²(8, N = 630) = 35.02, p < .001');
  await msg.locator('.as-trace summary').click();
  await expect(msg.locator('.as-trace li')).toHaveText(['Let me check.', /Looked at trust5, gender/, /Ran Crosstabs: gender by trust5/]);
  // What was sent: tools, system instruction, then both results with the model's parts replayed.
  expect(seen).toHaveLength(2);
  const first = seen[0].body;
  expect(first.tools[0].functionDeclarations.map((d: any) => d.name)).toEqual(expect.arrayContaining(['get_dataset_overview', 'run_analysis', 'propose_transform', 'search_help', 'get_cases']));
  expect(first.systemInstruction.parts[0].text).toContain('Never invent numbers');
  expect(first.systemInstruction.parts[0].text).toContain('individual cases OFF');
  const second = seen[1].body;
  expect(second.contents[1].parts[1].thoughtSignature).toBe('sig-1');
  const responses = lastParts(second).map((p: any) => p.functionResponse.name);
  expect(responses).toEqual(['describe_variables', 'run_analysis']);
  expect(lastParts(second)[0].functionResponse.response.result).toContain('trust5 "I would feel safe walking alone here after dark" [numeric, ordinal]');
  // Not in Output until clicked.
  await expect(page.locator('.tab-badge')).toHaveCount(0);
  await msg.getByRole('button', { name: 'Add this analysis to Output' }).click();
  await expect(msg.getByTestId('assistant-output-card')).toContainText('Added to Output');
  await expect(page.locator('.tab-badge')).toHaveText('1');
  await expect(page.getByTestId('assistant-privacy')).toContainText('Answers use Google Gemini (gemini-3.6-flash)');
});

test('a proposed recode changes nothing until Apply, and Undo reverses it', async ({ page }) => {
  await withGemini(page);
  await mockGemini(page, (_body, round) =>
    round === 0
      ? [{ functionCall: { name: 'propose_transform', args: { kind: 'recode', source: 'age', target: 'agegrp', label: 'Age group', rules: [{ from: 'missing', to: 'sysmis' }, { from: 'lowest thru 29', to: '1' }, { from: '30 thru 44', to: '2' }, { from: '45 thru 64', to: '3' }, { from: '65 thru highest', to: '4' }] } } }]
      : [{ text: 'I prepared **agegrp**. Check the preview and click Apply.' }],
  );
  await openWithSample(page);
  await expect(page.locator('.dataset-size')).toContainText('34 variables');
  await page.getByTestId('assistant-fab').click();
  const panel = page.getByTestId('assistant-panel');
  await panel.getByLabel('Message to the assistant').fill('Recode age into four groups');
  await panel.getByRole('button', { name: 'Send' }).click();
  const card = panel.getByTestId('assistant-proposal-card');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText('Nothing changes until you click Apply');
  await expect(card.locator('th')).toHaveText(['Case', 'age', 'agegrp (new)']);
  await card.getByText('SPSS syntax').click();
  await expect(card.locator('pre')).toContainText('RECODE age (MISSING=SYSMIS) (LOWEST THRU 29=1)');
  await expect(page.locator('.dataset-size')).toContainText('34 variables');
  await card.getByRole('button', { name: 'Apply' }).click();
  await expect(card).toContainText('Applied');
  await expect(page.locator('.dataset-size')).toContainText('35 variables');
  await page.getByTestId('assistant-panel').getByRole('button', { name: 'Close assistant' }).click();
  await page.locator('.grid-scroll').click({ position: { x: 200, y: 60 } });
  await page.keyboard.press('Control+z');
  await expect(page.locator('.dataset-size')).toContainText('34 variables');
});

test('Stop ends a slow answer; Retry asks again', async ({ page }) => {
  await withGemini(page);
  let slow = true;
  await mockGemini(page, async () => {
    if (slow) await new Promise((r) => setTimeout(r, 8000));
    return [{ text: 'A quick answer.' }];
  });
  await openWithSample(page);
  await page.keyboard.press('Control+j');
  const panel = page.getByTestId('assistant-panel');
  await panel.getByRole('listitem').first().click();
  await expect(panel.getByRole('button', { name: 'Stop' })).toBeVisible();
  await panel.getByRole('button', { name: 'Stop' }).click();
  await expect(panel.getByTestId('assistant-message')).toHaveAttribute('data-status', 'stopped');
  slow = false;
  await panel.getByRole('button', { name: 'Retry' }).click();
  await expect(panel.getByTestId('assistant-message')).toContainText('A quick answer.', { timeout: 20_000 });
});

test('phone: a smaller button and a full-screen sheet', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 820 });
  await openWithSample(page);
  const fab = page.getByTestId('assistant-fab');
  const box = (await fab.boundingBox())!;
  expect(box.width).toBeLessThanOrEqual(46);
  expect(box.x + box.width).toBeGreaterThan(380);
  await fab.click();
  const panel = page.getByTestId('assistant-panel');
  const pb = (await panel.boundingBox())!;
  expect(pb.x).toBe(0);
  expect(pb.width).toBe(400);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(400);
  await expect(panel.getByLabel('Message to the assistant')).toBeVisible();
});

test('search can hand a question to the assistant', async ({ page }) => {
  await withGemini(page);
  await mockGemini(page, () => [{ text: 'Use the Independent-Samples T Test.' }]);
  await openWithSample(page);
  await page.keyboard.press('Control+k');
  await page.keyboard.type('which test compares two groups');
  await page.getByText(/Ask the assistant: which test compares two groups/).click();
  const panel = page.getByTestId('assistant-panel');
  await expect(panel.locator('.as-bubble')).toHaveText('which test compares two groups');
  await expect(panel.getByTestId('assistant-message')).toContainText('Independent-Samples T Test', { timeout: 20_000 });
});
