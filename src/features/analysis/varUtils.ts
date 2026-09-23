// Pure helpers for the procedure dialog: slot suitability, placement, validation, remembered state.
import type { Dataset, Variable } from '../../core/types';
import type { OptionDef, OptionValues, ProcedureDef, SlotValues, VarSlot } from '../../core/procedure';
import { defaultOptions } from '../../core/procedure';

export const MEASURE_LABEL: Record<Variable['measure'], string> = { nominal: 'Nominal', ordinal: 'Ordinal', scale: 'Scale' };

/** Can the variable go in the slot at all (type check)? */
export function typeFits(slot: VarSlot, v: Variable): boolean {
  return !slot.types || slot.types.includes(v.type);
}

/** Is the variable's measurement level one the slot suggests? */
export function measureFits(slot: VarSlot, v: Variable): boolean {
  return !slot.measures || slot.measures.includes(v.measure);
}

export function slotCountHint(slot: VarSlot): string {
  const { min, max } = slot;
  if (max === 1) return min >= 1 ? '1 variable' : 'Optional, 1 variable';
  if (max === Infinity) return min <= 0 ? 'Optional, any number' : min === 1 ? '1 or more' : `${min} or more`;
  if (min === max) return `${min} variables`;
  return min <= 0 ? `Optional, up to ${max}` : `${min} to ${max} variables`;
}

export function slotSuitHint(slot: VarSlot): string | null {
  const parts: string[] = [];
  if (slot.measures?.length && slot.measures.length < 3) parts.push(slot.measures.map((m) => MEASURE_LABEL[m].toLowerCase()).join(' or '));
  if (slot.types?.length === 1) parts.push(slot.types[0] === 'numeric' ? 'numeric' : 'string');
  return parts.length ? parts.join(', ') : null;
}

/** Why a variable cannot go in a slot (type), or null. */
export function typeProblem(slot: VarSlot, v: Variable): string | null {
  if (typeFits(slot, v)) return null;
  const need = slot.types!.map((t) => (t === 'numeric' ? 'numeric' : 'string')).join(' or ');
  return `${v.name} is a ${v.type === 'string' ? 'string' : 'numeric'} variable; "${slot.label}" needs ${need} variables.`;
}

export function measureWarning(slot: VarSlot, v: Variable): string | null {
  if (measureFits(slot, v)) return null;
  const want = slot.measures!.map((m) => MEASURE_LABEL[m].toLowerCase()).join(' or ');
  return `${v.name} is set as ${MEASURE_LABEL[v.measure].toLowerCase()}; this box expects ${want} variables. You can still run it if that makes sense for your data.`;
}

/**
 * Add variables to a slot. Type-incompatible ones are rejected; a max-1 slot is replaced; a list keeps
 * order and ignores duplicates, up to its max. Returns the new slot values and any messages.
 */
export function addToSlot(slots: SlotValues, slot: VarSlot, vars: Variable[], at?: number): { slots: SlotValues; messages: string[] } {
  const messages: string[] = [];
  const ok = vars.filter((v) => {
    const p = typeProblem(slot, v);
    if (p) messages.push(p);
    return !p;
  });
  if (!ok.length) return { slots, messages };
  const cur = slots[slot.key] ?? [];
  let next: string[];
  if (slot.max === 1) {
    next = [ok[0].id];
    if (ok.length > 1) messages.push(`"${slot.label}" takes one variable; used ${ok[0].name}.`);
  } else {
    const add = ok.map((v) => v.id).filter((id) => !cur.includes(id));
    next = cur.slice();
    next.splice(at === undefined ? next.length : Math.max(0, Math.min(at, next.length)), 0, ...add);
    if (next.length > slot.max) {
      messages.push(`"${slot.label}" takes at most ${slot.max} variables.`);
      next = next.slice(0, slot.max);
    }
  }
  return { slots: { ...slots, [slot.key]: next }, messages };
}

export function removeFromSlot(slots: SlotValues, key: string, ids: string[]): SlotValues {
  return { ...slots, [key]: (slots[key] ?? []).filter((id) => !ids.includes(id)) };
}

export function moveWithinSlot(slots: SlotValues, key: string, id: string, toIndex: number): SlotValues {
  const cur = (slots[key] ?? []).slice();
  const from = cur.indexOf(id);
  if (from < 0) return slots;
  cur.splice(from, 1);
  cur.splice(Math.max(0, Math.min(toIndex > from ? toIndex - 1 : toIndex, cur.length)), 0, id);
  return { ...slots, [key]: cur };
}

/** The slot a double-clicked variable should go to: first with room and a matching type (preferring a measure match). */
export function bestSlotFor(def: ProcedureDef, slots: SlotValues, v: Variable): VarSlot | null {
  const room = (s: VarSlot) => (slots[s.key]?.length ?? 0) < s.max && !(slots[s.key] ?? []).includes(v.id);
  return (
    def.slots.find((s) => typeFits(s, v) && room(s) && measureFits(s, v)) ??
    def.slots.find((s) => typeFits(s, v) && room(s)) ??
    def.slots.find((s) => typeFits(s, v) && s.max === 1) ??
    null
  );
}

/** Problems that block running. */
export function validate(def: ProcedureDef, ds: Dataset, slots: SlotValues, options: OptionValues): string[] {
  const out: string[] = [];
  for (const s of def.slots) {
    const ids = slots[s.key] ?? [];
    if (ids.length < s.min) out.push(s.min === 1 ? `Add a variable to "${s.label}".` : `Add at least ${s.min} variables to "${s.label}".`);
    if (ids.length > s.max) out.push(`"${s.label}" takes at most ${s.max} variable${s.max === 1 ? '' : 's'}.`);
    for (const id of ids) {
      const v = ds.variables.find((x) => x.id === id);
      if (!v) out.push(`A variable in "${s.label}" no longer exists.`);
      else {
        const p = typeProblem(s, v);
        if (p) out.push(p);
      }
    }
  }
  for (const o of def.options) {
    const val = options[o.key];
    if (o.type === 'number') {
      if (typeof val !== 'number' || !Number.isFinite(val)) out.push(`Enter a number for "${o.label}".`);
      else if ((o.min !== undefined && val < o.min) || (o.max !== undefined && val > o.max))
        out.push(`"${o.label}" must be between ${o.min ?? '-∞'} and ${o.max ?? '∞'}.`);
    }
    if (o.type === 'groupPair' && (slots[o.slot]?.length ?? 0) > 0) {
      const pair = val as unknown[] | null;
      if (!Array.isArray(pair) || pair.length !== 2 || pair.some((x) => x === null || x === '' || (typeof x === 'number' && Number.isNaN(x)))) out.push(`Choose the two groups for "${o.label}".`);
      else if (pair[0] === pair[1]) out.push(`The two groups in "${o.label}" must be different.`);
    }
  }
  if (!out.length && def.validate) {
    try {
      const m = def.validate(ds, slots, options);
      if (m) out.push(m);
    } catch (e) {
      out.push((e as Error).message);
    }
  }
  return out;
}

export interface Remembered {
  slots: SlotValues;
  options: OptionValues;
  syntax?: string;
}

const memory = new Map<string, Remembered>();

export function remember(id: string, r: Remembered) {
  memory.set(id, r);
}

/** Last slots/options for a procedure in this session, dropping variables that no longer exist. */
export function recall(def: ProcedureDef, ds: Dataset | null): Remembered {
  const r = memory.get(def.id);
  const opts = { ...defaultOptions(def), ...(r?.options ?? {}) };
  // Drop options that no longer exist in the definition.
  for (const k of Object.keys(opts)) if (!def.options.some((o: OptionDef) => o.key === k)) delete opts[k];
  const slots: SlotValues = {};
  for (const s of def.slots) {
    const ids = (r?.slots[s.key] ?? []).filter((id) => ds?.variables.some((v) => v.id === id && typeFits(s, v)));
    slots[s.key] = ids;
  }
  return { slots, options: opts, syntax: r?.syntax };
}

export function clearMemory() {
  memory.clear();
}

/** Value for a groupPair/valueList entry typed by the user, matching the variable's type. */
export function parseValue(v: Variable, text: string): number | string | null {
  const t = text.trim();
  if (!t) return null;
  if (v.type === 'numeric') {
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return t;
}
