// Declarative procedure definitions. A statistics module registers a ProcedureDef; the UI renders a
// generic dialog from `slots` + `options`, then calls `run`. This keeps statistics and UI decoupled.

import type { Dataset, MeasureLevel, VarType } from './types';
import type { OutputItem } from './output';

export type ProcedureMenu =
  | 'Descriptive Statistics'
  | 'Compare Means'
  | 'Nonparametric Tests'
  | 'Correlate'
  | 'Regression'
  | 'Scale'
  | 'Dimension Reduction'
  | 'Graphs';

/** A box in the dialog that receives variables (like SPSS "Dependent List", "Row(s)", "Grouping Variable"). */
export interface VarSlot {
  key: string;
  label: string;
  /** Minimum and maximum number of variables (max Infinity = list). */
  min: number;
  max: number;
  /** Allowed variable types; omit for any. */
  types?: VarType[];
  /** Suggested measurement levels; the UI warns (does not block) on others. */
  measures?: MeasureLevel[];
  help?: string;
}

export type OptionDef =
  | { key: string; label: string; type: 'checkbox'; default: boolean; group?: string; help?: string }
  | { key: string; label: string; type: 'select'; default: string; choices: Array<{ value: string; label: string }>; group?: string; help?: string }
  | { key: string; label: string; type: 'number'; default: number; min?: number; max?: number; step?: number; group?: string; help?: string }
  | { key: string; label: string; type: 'text'; default: string; placeholder?: string; group?: string; help?: string }
  /**
   * Two values of the grouping variable to compare (independent t-test, Mann-Whitney).
   * `slot` names the VarSlot whose variable's values are offered. Value is [a, b] (numbers or strings).
   */
  | { key: string; label: string; type: 'groupPair'; slot: string; group?: string; help?: string }
  /** Several values of a variable (e.g. category order). Value is an array. */
  | { key: string; label: string; type: 'valueList'; slot: string; group?: string; help?: string };

export type OptionValues = Record<string, unknown>;
/** Selected variable ids per slot key. */
export type SlotValues = Record<string, string[]>;

export interface ProcedureDef {
  id: string;
  menu: ProcedureMenu;
  title: string;
  /** One sentence, shown in the menu and dialog: when would a sociologist use this? */
  description: string;
  /** Optional longer guidance (assumptions, when to prefer an alternative). */
  guidance?: string;
  slots: VarSlot[];
  options: OptionDef[];
  /**
   * Validate beyond slot counts. Return a message to block running, or null.
   */
  validate?: (ds: Dataset, vars: SlotValues, opts: OptionValues) => string | null;
  /** Pure: must not mutate ds. Throw Error with a user-readable message on failure. */
  run: (ds: Dataset, vars: SlotValues, opts: OptionValues) => OutputItem;
}

/** Fill option defaults. */
export function defaultOptions(def: ProcedureDef): OptionValues {
  const o: OptionValues = {};
  for (const opt of def.options) {
    if ('default' in opt) o[opt.key] = opt.default;
    else o[opt.key] = null;
  }
  return o;
}
