// Qualitative text-coding project model (lives in the main store, saved with the project).

export interface CodeDef {
  id: string;
  name: string;
  description: string;
  /** Hex colour used for highlights. */
  color: string;
  /** Parent code id for hierarchical codebooks (themes > sub-codes), or null for top level. */
  parentId: string | null;
  /** Optional inclusion/exclusion criteria and example, as in a proper codebook. */
  inclusion?: string;
  exclusion?: string;
  example?: string;
  /** Optional keyword/regex auto-coding rules (one per line, /regex/i allowed). */
  rules?: string[];
  createdAt: number;
}

export interface TextDoc {
  id: string;
  name: string;
  /** 'variable' = one open-ended survey answer linked to a dataset case. */
  kind: 'document' | 'response';
  text: string;
  /** For responses: dataset row index and the string variable id they came from. */
  caseIndex?: number;
  varId?: string;
  /** Free attributes (respondent id, interview date, site...). */
  attributes?: Record<string, string>;
  createdAt: number;
}

export interface CodedSegment {
  id: string;
  docId: string;
  codeId: string;
  /** Character offsets into TextDoc.text, [start, end). Whole-response coding uses 0..text.length. */
  start: number;
  end: number;
  /** Coder name (for intercoder reliability). */
  coder: string;
  memo?: string;
  /** How it was created. */
  origin: 'manual' | 'auto-rule' | 'ai-suggested';
  createdAt: number;
}

export interface Memo {
  id: string;
  title: string;
  text: string;
  /** Optional link to a code or document. */
  codeId?: string;
  docId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CodingProject {
  codes: CodeDef[];
  docs: TextDoc[];
  segments: CodedSegment[];
  memos: Memo[];
  coders: string[];
  activeCoder: string;
}

export function emptyCodingProject(): CodingProject {
  return { codes: [], docs: [], segments: [], memos: [], coders: ['Coder 1'], activeCoder: 'Coder 1' };
}
