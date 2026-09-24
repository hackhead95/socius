// Shared types for the Socius assistant: tools, the context they read, what they hand back to the UI.
import type { CodingProject } from '../../core/coding-types';
import type { OutputItem } from '../../core/output';
import type { OptionValues, SlotValues } from '../../core/procedure';
import type { MainTab } from '../../core/store';
import type { Dataset } from '../../core/types';
import type { JsonSchema } from '../../platform/ai-tools';

/** What the user allows the assistant to read ("What the assistant can see"). */
export interface AssistantPermissions {
  /** Variable information (names, labels, codes) and summary statistics. On by default. */
  stats: boolean;
  /** Individual cases (raw rows). Off by default. */
  cases: boolean;
  /** Excerpts and quotes from Text coding documents. On by default. */
  texts: boolean;
}

export const DEFAULT_PERMISSIONS: AssistantPermissions = { stats: true, cases: false, texts: true };

/** A live view of the app, read at the moment a tool runs. */
export interface AppSnapshot {
  dataset: Dataset | null;
  outputs: OutputItem[];
  coding: CodingProject;
  tab: MainTab;
}

export interface ToolContext {
  state: () => AppSnapshot;
  permissions: AssistantPermissions;
  /** Budget for one tool result sent to the model, in bytes. */
  maxResultBytes: number;
  signal?: AbortSignal;
}

/** A change the assistant proposes. Nothing happens until the user clicks Apply / Open. */
export type Proposal =
  | {
      id: string;
      kind: 'transform';
      title: string;
      summary: string;
      syntax: string;
      warnings: string[];
      preview: { columns: string[]; rows: string[][] };
      /** Re-run against the data current at the time the user applies it. */
      spec: TransformSpec;
      /** Name of the variable it creates (or changes). */
      target: string;
    }
  | {
      id: string;
      kind: 'dialog';
      title: string;
      summary: string;
      procedureId: string;
      slots: SlotValues;
      options: OptionValues;
    };

export type TransformSpec =
  | { kind: 'compute'; target: string; label?: string; expression: string; condition?: string }
  | {
      kind: 'recode';
      source: string;
      target: string;
      label?: string;
      rules: Array<{ from: string; to: string }>;
      valueLabels?: Array<{ value: string; label: string }>;
    }
  | { kind: 'reverse'; items: string[]; suffix?: string }
  | { kind: 'scale'; items: string[]; target: string; label?: string; method?: 'mean' | 'sum'; minValid?: number };

/** Things a tool produced that the UI can offer as buttons. */
export type Artifact = { kind: 'output'; item: OutputItem } | { kind: 'proposal'; proposal: Proposal };

export interface ToolOutput {
  /** What the model reads. */
  text: string;
  /** Short line for the activity trace, e.g. "Ran Crosstabs: gender by trust5". */
  summary?: string;
  ok?: boolean;
  artifacts?: Artifact[];
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: JsonSchema;
  /** 'read' tools only look; 'action' tools only ever propose. */
  kind: 'read' | 'action';
  /** Plain-language line shown while it runs, e.g. "Looking at trust5". */
  label: (args: Record<string, unknown>) => string;
  run: (args: Record<string, unknown>, ctx: ToolContext) => ToolOutput | Promise<ToolOutput>;
  /** Compact tool list for the on-device model (fewer tools, shorter text). */
  compact?: boolean;
}

/** One line in the activity trace under an answer. */
export interface TraceStep {
  id: string;
  kind: 'tool' | 'note' | 'wait';
  label: string;
  tool?: string;
  args?: Record<string, unknown>;
  status: 'running' | 'done' | 'error';
  detail?: string;
}
