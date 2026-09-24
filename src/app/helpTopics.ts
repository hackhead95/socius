// Sections of the beginner's guide (public/guide/index.html, built from docs/guide/guide.md) offered by
// the search palette. Each `anchor` must be an id in the guide page; tests/app/helpTopics.test.ts checks
// that, so a renamed heading in the guide shows up as a failing test instead of a dead link.
import { GUIDE_URL } from './links';

export interface HelpTopic {
  anchor: string;
  title: string;
  /** Chapter the section belongs to. */
  chapter: string;
  keywords?: string[];
}

export const HELP_TOPICS: HelpTopic[] = [
  { anchor: 'a-five-minute-tour', title: 'A five-minute tour', chapter: 'Getting started', keywords: ['tour', 'overview', 'start'] },
  { anchor: 'the-sample-survey', title: 'The sample survey', chapter: 'Getting started', keywords: ['example data', 'practice'] },
  { anchor: 'your-data-stays-on-your-computer', title: 'Your data stays on your computer', chapter: 'Welcome', keywords: ['privacy', 'upload', 'gdpr', 'ethics'] },
  { anchor: 'finding-anything-with-search', title: 'Finding anything with Search', chapter: 'Getting started', keywords: ['search', 'ctrl k', 'find', 'command'] },
  { anchor: 'coming-back-to-the-start-screen', title: 'Coming back to the start screen', chapter: 'Getting started', keywords: ['home', 'start screen', 'logo', 'welcome'] },
  { anchor: 'small-messages-and-dialogs', title: 'Small messages and dialogs', chapter: 'Getting started', keywords: ['toast', 'message', 'undo', 'show', 'dialog closes'] },
  { anchor: 'open-an-spss-file', title: 'Open an SPSS file', chapter: 'Opening your data', keywords: ['sav', 'zsav', 'import'] },
  { anchor: 'open-a-csv-or-excel-file', title: 'Open a CSV or Excel file', chapter: 'Opening your data', keywords: ['xlsx', 'import', 'spreadsheet'] },
  { anchor: 'value-labels', title: 'Value labels', chapter: 'Understanding your variables', keywords: ['labels', 'codes'] },
  { anchor: 'missing-values', title: 'Missing values', chapter: 'Understanding your variables', keywords: ['dont know', 'refused', 'sysmis'] },
  { anchor: 'measurement-level-nominal-ordinal-or-scale', title: 'Measurement level: nominal, ordinal or scale', chapter: 'Understanding your variables', keywords: ['measure', 'level of measurement'] },
  { anchor: 'rename-a-variable', title: 'Rename a variable', chapter: 'Understanding your variables', keywords: ['rename', 'variable name', 'name rules', 'cannot change name'] },
  { anchor: 'check-many-variables-at-once-define-variable-properties', title: 'Check many variables at once: Define variable properties', chapter: 'Understanding your variables', keywords: ['define variable properties', 'value labels', 'scan', 'unlabelled values', 'copy properties'] },
  { anchor: 'recode-age-into-groups', title: 'Recode age into groups', chapter: 'Preparing your data', keywords: ['recode', 'binning', 'age groups'] },
  { anchor: 'reverse-code-a-question', title: 'Reverse-code a question', chapter: 'Preparing your data', keywords: ['reverse', 'negatively worded'] },
  { anchor: 'build-a-scale-and-check-cronbach-s-alpha', title: "Build a scale and check Cronbach's alpha", chapter: 'Preparing your data', keywords: ['reliability', 'alpha', 'index'] },
  { anchor: 'select-cases', title: 'Select cases', chapter: 'Preparing your data', keywords: ['filter', 'subset'] },
  { anchor: 'weight-cases', title: 'Weight cases', chapter: 'Preparing your data', keywords: ['weight', 'weighting'] },
  { anchor: 'frequencies-how-often-does-each-answer-occur', title: 'Frequencies: how often does each answer occur?', chapter: 'Your first analyses', keywords: ['frequency table'] },
  { anchor: 'crosstabs-with-chi-square-are-two-categories-related', title: 'Crosstabs with chi-square: are two categories related?', chapter: 'Your first analyses', keywords: ['chi square', 'crosstab', 'cramers v'] },
  { anchor: 'comparing-two-groups-the-independent-samples-t-test', title: 'Comparing two groups: the independent-samples t-test', chapter: 'Your first analyses', keywords: ['t test', 'ttest'] },
  { anchor: 'comparing-several-groups-one-way-anova', title: 'Comparing several groups: one-way ANOVA', chapter: 'Your first analyses', keywords: ['anova', 'post hoc'] },
  { anchor: 'correlation-do-two-numbers-move-together', title: 'Correlation: do two numbers move together?', chapter: 'Your first analyses', keywords: ['pearson', 'spearman'] },
  { anchor: 'a-simple-linear-regression', title: 'A simple linear regression', chapter: 'Your first analyses', keywords: ['regression', 'ols'] },
  { anchor: 'a-bar-chart', title: 'A bar chart', chapter: 'Charts', keywords: ['graph', 'plot'] },
  { anchor: 'a-histogram', title: 'A histogram', chapter: 'Charts', keywords: ['graph', 'plot', 'distribution'] },
  { anchor: 'saving-a-chart', title: 'Saving a chart', chapter: 'Charts', keywords: ['png', 'svg', 'export chart'] },
  { anchor: 'apa-style-or-spss-style', title: 'APA style or SPSS style', chapter: 'Getting results into your report', keywords: ['apa', 'tables'] },
  { anchor: 'copy-one-table-into-word', title: 'Copy one table into Word', chapter: 'Getting results into your report', keywords: ['copy', 'word', 'docx'] },
  { anchor: 'copy-the-apa-sentence', title: 'Copy the APA sentence', chapter: 'Getting results into your report', keywords: ['apa', 'report', 'write up'] },
  { anchor: 'export-the-whole-report', title: 'Export the whole report', chapter: 'Getting results into your report', keywords: ['export', 'word', 'html'] },
  { anchor: 'start-with-the-worked-example', title: 'Start with the worked example', chapter: 'Coding open-ended answers', keywords: ['qualitative', 'example'] },
  { anchor: 'import-answers-from-a-survey-question', title: 'Import answers from a survey question', chapter: 'Coding open-ended answers', keywords: ['open ended', 'string variable'] },
  { anchor: 'build-a-codebook', title: 'Build a codebook', chapter: 'Coding open-ended answers', keywords: ['codes', 'themes'] },
  { anchor: 'auto-code-with-keyword-rules', title: 'Auto-code with keyword rules', chapter: 'Coding open-ended answers', keywords: ['automatic coding'] },
  { anchor: 'turn-codes-into-variables-and-crosstab-them', title: 'Turn codes into variables and crosstab them', chapter: 'Coding open-ended answers', keywords: ['export codes', 'mixed methods'] },
  { anchor: 'import-a-transcript', title: 'Import a transcript', chapter: 'Coding interviews', keywords: ['interview', 'docx'] },
  { anchor: 'highlight-and-code-a-passage', title: 'Highlight and code a passage', chapter: 'Coding interviews', keywords: ['coding', 'segment'] },
  { anchor: 'write-memos', title: 'Write memos', chapter: 'Coding interviews', keywords: ['memo', 'notes'] },
  { anchor: 'retrieve-quotes', title: 'Retrieve quotes', chapter: 'Coding interviews', keywords: ['quotes', 'segments'] },
  { anchor: 'intercoder-reliability-do-two-coders-agree', title: 'Intercoder reliability: do two coders agree?', chapter: 'Coding interviews', keywords: ['kappa', 'agreement', 'krippendorff'] },
  { anchor: 'getting-help-from-ai', title: 'Getting help from AI', chapter: 'Getting help from AI', keywords: ['ai', 'gemini', 'assistant'] },
  { anchor: 'set-it-up', title: 'Set up AI', chapter: 'Getting help from AI', keywords: ['ai', 'gemini', 'api key', 'free key', 'on device', 'test connection'] },
  { anchor: 'test-connection-step-by-step', title: 'Test connection, step by step', chapter: 'Getting help from AI', keywords: ['ai', 'test connection', 'gemini', 'not working', 'copy details', 'rate limit'] },
  { anchor: 'option-3-ollama-or-lm-studio-on-your-computer-for-experienced-users', title: 'Ollama or LM Studio on your computer', chapter: 'Getting help from AI', keywords: ['ai', 'ollama', 'lm studio', 'local', 'llama', 'ollama_origins'] },
  { anchor: 'before-you-send-anything', title: 'Before you send anything to an AI', chapter: 'Getting help from AI', keywords: ['ai', 'privacy', 'anonymise', 'ethics', 'consent'] },
  { anchor: 'where-to-find-ai-in-socius', title: 'Where to find AI in Socius', chapter: 'Getting help from AI', keywords: ['ai', 'ai menu', 'use ai'] },
  { anchor: 'explain-a-result', title: 'Explain a result with AI', chapter: 'Getting help from AI', keywords: ['ai', 'explain', 'interpret'] },
  { anchor: 'the-socius-assistant', title: 'The Socius assistant', chapter: 'Getting help from AI', keywords: ['ai', 'assistant', 'chat', 'ctrl j', 'ask'] },
  { anchor: 'ai-in-text-coding', title: 'AI in Text coding', chapter: 'Getting help from AI', keywords: ['ai', 'suggest codes', 'codebook', 'summarise'] },
  { anchor: 'reporting-ai-use', title: 'Reporting AI use', chapter: 'Getting help from AI', keywords: ['ai', 'methods section', 'disclosure'] },
  { anchor: 'save-a-project', title: 'Save a project', chapter: 'Saving and sharing your work', keywords: ['save', 'socius json'] },
  { anchor: 'save-your-data-for-spss-excel-or-r', title: 'Save your data for SPSS, Excel or R', chapter: 'Saving and sharing your work', keywords: ['export', 'sav', 'csv'] },
  { anchor: 'share-with-a-colleague', title: 'Share with a colleague', chapter: 'Saving and sharing your work', keywords: ['share'] },
  { anchor: 'what-socius-keeps-in-your-browser', title: 'What Socius keeps in your browser', chapter: 'Saving and sharing your work', keywords: ['storage', 'autosave', 'storage full', 'quota', 'api key', 'privacy'] },
  { anchor: 'troubleshooting-and-faq', title: 'Troubleshooting and FAQ', chapter: 'Help', keywords: ['problem', 'error', 'faq'] },
  { anchor: 'troubleshooting-with-the-error-log', title: 'Troubleshooting with the error log', chapter: 'Help', keywords: ['error log', 'bug', 'report a problem', 'feedback', 'copy report'] },
  { anchor: 'quick-reference-card', title: 'Quick reference card', chapter: 'Appendix', keywords: ['cheat sheet', 'which test'] },
  { anchor: 'glossary', title: 'Glossary', chapter: 'Appendix', keywords: ['definitions', 'terms'] },
];

export function helpTopicUrl(t: HelpTopic, base = GUIDE_URL): string {
  return `${base}#${t.anchor}`;
}
