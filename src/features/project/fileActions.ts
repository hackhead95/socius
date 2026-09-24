// File menu actions: open data / projects, save, export, sample data, new dataset.
// UI-facing but component-free, so menus, shortcuts, drag-and-drop and the welcome screen share them.

import type { Dataset } from '../../core/types';
import { makeDataset } from '../../core/types';
import { emptyCodingProject } from '../../core/coding-types';
import { useStore } from '../../core/store';
import { saveFile } from '../../platform/host';
import { codebookRows, exportCsv, exportSavWithReport, exportXlsx, importFile, isPlainZip, listXlsxSheets, unopenableReason, unwrapZip, type ImportOptions } from '../../lib/io';
import { loadSampleDataset, samples } from '../../samples';
import { useUi } from '../../app/ui-store';
import { parseProject, projectFileName, serializeProject, type ProjectState } from './projectFile';
import { addRecent, clearSession, loadRecent } from './persistence';

export const DATA_ACCEPT = '.sav,.zsav,.csv,.tsv,.txt,.tab,.dat,.xlsx,.xlsm,.zip';
export const PROJECT_ACCEPT = '.json,.socius.json,application/json,.zip';

const TEXT_EXT = /\.(csv|tsv|txt|tab|dat|psv|text)$/i;

export function isProjectFileName(name: string): boolean {
  return /\.socius\.json$/i.test(name) || /\.json$/i.test(name);
}

export function isDataFileName(name: string): boolean {
  return /\.(sav|zsav|csv|tsv|txt|tab|dat|xlsx|xlsm|zip)$/i.test(name);
}

/** Open the browser file chooser. Resolves null if the user cancels. */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    let done = false;
    const finish = (f: File | null) => {
      if (done) return;
      done = true;
      input.remove();
      resolve(f);
    };
    input.addEventListener('change', () => finish(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => finish(null));
    document.body.appendChild(input);
    input.click();
  });
}

function stripExt(name: string): string {
  return name.replace(/^.*[\\/]/, '').replace(/\.socius\.json$/i, '').replace(/\.[^.]+$/, '');
}

export function isModified(): boolean {
  const ds = useStore.getState().dataset;
  const clean = useUi.getState().cleanDataset;
  return !!ds && ds !== clean && !(ds.nCases === 0 && ds.variables.length === 0);
}

/** Ask before replacing unsaved changes. Resolves true when it is fine to go ahead. */
export async function confirmReplace(what: string): Promise<boolean> {
  if (!isModified()) return true;
  const name = useStore.getState().dataset?.name ?? 'the current data';
  return useUi.getState().confirm({
    title: 'Replace the open data?',
    message: `${name} has changes that are not saved in a project. ${what} will replace it. You can save first with File > Save project.`,
    confirmLabel: 'Replace',
    danger: true,
  });
}

/** Make `ds` the active dataset (clears undo history). */
export function activateDataset(ds: Dataset, opts: { sample?: boolean; warnings?: string[]; message?: string } = {}) {
  const st = useStore.getState();
  st.setDataset(ds);
  if (st.tab !== 'coding') st.setTab('data');
  useUi.getState().markClean(ds);
  useUi.getState().setSampleBanner(!!opts.sample);
  if (opts.message) st.toast(opts.message, 'success');
  for (const w of opts.warnings ?? []) st.toast(w, 'warning');
}

function plural(n: number, word: string): string {
  return `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;
}

async function readBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

/** Import bytes as the active dataset (after the caller confirmed replacing). Resolves the import warnings, or null on failure. */
export async function importBytes(name: string, bytes: Uint8Array, opts: ImportOptions = {}, hideWarning?: (w: string) => boolean): Promise<string[] | null> {
  const ui = useUi.getState();
  const st = useStore.getState();
  ui.setBusy(`Opening ${name}...`);
  try {
    const res = await importFile(name, bytes, opts);
    const ds = { ...res.dataset, name: res.dataset.name || stripExt(name) };
    const shown = hideWarning ? res.warnings.filter((w) => !hideWarning(w)) : res.warnings;
    activateDataset(ds, {
      warnings: shown.slice(0, 4),
      message: `Opened ${name}: ${plural(ds.nCases, 'case')}, ${plural(ds.variables.length, 'variable')}.`,
    });
    if (shown.length > 4) st.toast(`${shown.length - 4} more notes about this file were not shown.`, 'info');
    return res.warnings;
  } catch (e) {
    st.toast(e instanceof Error ? e.message : `Could not open ${name}.`, 'error');
    return null;
  } finally {
    ui.setBusy(null);
  }
}

/** The SPSS reader's note when a file does not say which text encoding it uses. */
export function isEncodingGuess(warning: string): boolean {
  return /does not state its text encoding/i.test(warning);
}

/** File > Open data file (or a dropped file). CSV/TSV and multi-sheet Excel files get an options dialog. */
export async function openDataFile(file?: File | null): Promise<void> {
  const f = file ?? (await pickFile(DATA_ACCEPT));
  if (!f) return;
  const st = useStore.getState();
  let name = f.name;
  let bytes: Uint8Array;
  try {
    bytes = await readBytes(f);
  } catch {
    st.toast(`Could not read ${f.name}.`, 'error');
    return;
  }
  if (isPlainZip(bytes)) {
    // e.g. survey.sav.zip, which is how the Artifact viewer saves SPSS files.
    try {
      const inner = unwrapZip(name, bytes);
      if (isProjectFileName(inner.name)) {
        await openProjectText(inner.name, new TextDecoder().decode(inner.bytes));
        return;
      }
      name = inner.name;
      bytes = inner.bytes;
    } catch (e) {
      st.toast(e instanceof Error ? e.message : `Could not open ${f.name}.`, 'error');
      return;
    }
  }
  const why = unopenableReason(name, bytes.subarray(0, 8192));
  if (why) {
    st.toast(why, 'error');
    return;
  }
  if (TEXT_EXT.test(name)) {
    st.openDialog({ kind: 'file', id: 'import', params: { name, bytes, kind: 'text' } });
    return;
  }
  if (/\.xlsx?m?$/i.test(name)) {
    try {
      const sheets = await listXlsxSheets(bytes);
      st.openDialog({ kind: 'file', id: 'import', params: { name, bytes, kind: 'xlsx', sheets } });
      return;
    } catch {
      /* fall through: importFile reports the real problem */
    }
  }
  if (!(await confirmReplace(`Opening ${name}`))) return;
  // The encoding note is shown in the dialog below instead of a toast.
  const warnings = await importBytes(name, bytes, {}, isEncodingGuess);
  // SPSS files without an encoding record: offer to re-read the text with another encoding.
  const note = warnings?.find(isEncodingGuess);
  if (note) st.openDialog({ kind: 'file', id: 'import', params: { name, bytes, kind: 'sav', note } });
}

export function currentProjectState(): ProjectState {
  const st = useStore.getState();
  return {
    dataset: st.dataset,
    outputs: st.outputs,
    coding: st.coding,
    ui: { showValueLabels: st.showValueLabels, tab: st.tab },
  };
}

/** Replace the whole working state with a project. */
export function applyProject(p: ProjectState, message?: string) {
  const st = useStore.getState();
  useStore.setState({
    dataset: p.dataset,
    past: [],
    future: [],
    outputs: p.outputs,
    coding: p.coding,
    showValueLabels: p.ui.showValueLabels,
    tab: p.ui.tab,
    focusOutputId: null,
    dialog: null,
  });
  useUi.getState().markClean(p.dataset);
  useUi.getState().setSampleBanner(p.dataset?.source?.kind === 'sample');
  if (message) st.toast(message, 'success');
}

export async function openProjectFile(file?: File | null): Promise<void> {
  const f = file ?? (await pickFile(PROJECT_ACCEPT));
  if (!f) return;
  const st = useStore.getState();
  let text: string;
  let name = f.name;
  try {
    const bytes = await readBytes(f);
    if (isPlainZip(bytes)) {
      const inner = unwrapZip(f.name, bytes);
      if (!isProjectFileName(inner.name)) {
        // A data file in a zip picked from Open project: open it as data instead.
        await openDataFile(new File([inner.bytes as BlobPart], inner.name));
        return;
      }
      name = inner.name;
      text = new TextDecoder().decode(inner.bytes);
    } else text = new TextDecoder().decode(bytes);
  } catch (e) {
    st.toast(e instanceof Error && /zip/.test(e.message) ? e.message : `Could not read ${f.name}.`, 'error');
    return;
  }
  await openProjectText(name, text);
}

async function openProjectText(name: string, text: string): Promise<void> {
  const st = useStore.getState();
  let p: ProjectState;
  try {
    p = parseProject(text);
  } catch (e) {
    st.toast(e instanceof Error ? e.message : 'This project could not be opened.', 'error');
    return;
  }
  if (!(await confirmReplace(`Opening the project ${name}`))) return;
  applyProject(p, `Opened project ${name}.`);
  void addRecent(stripExt(name), p);
}

export async function openRecentProject(id: string, name: string): Promise<void> {
  const st = useStore.getState();
  const p = await loadRecent(id);
  if (!p) {
    st.toast('That project is no longer stored in this browser.', 'error');
    return;
  }
  if (!(await confirmReplace(`Opening ${name}`))) return;
  applyProject(p, `Opened ${name}.`);
}

function reportSave(outcome: Awaited<ReturnType<typeof saveFile>>, what: string): boolean {
  const st = useStore.getState();
  if (outcome === 'saved') {
    st.toast(`Saved ${what}.`, 'success');
    return true;
  }
  if (outcome === 'declined') st.toast('Saving was cancelled.', 'info');
  else st.toast(`Could not save ${what}. Your browser blocked the download.`, 'error');
  return false;
}

export async function saveProject(): Promise<void> {
  const st = useStore.getState();
  const state = currentProjectState();
  const name = st.dataset?.name || 'Socius project';
  let text: string;
  try {
    text = serializeProject(state);
  } catch {
    st.toast('The project is too large to save as a single file.', 'error');
    return;
  }
  const file = projectFileName(name);
  const outcome = await saveFile(file, text, 'application/json');
  if (reportSave(outcome, file)) {
    useUi.getState().markClean(st.dataset);
    void addRecent(name, state);
  }
}

function requireData(): Dataset | null {
  const ds = useStore.getState().dataset;
  if (!ds) useStore.getState().toast('Open or create a dataset first.', 'warning');
  return ds;
}

function baseName(ds: Dataset): string {
  return (ds.name || 'data').replace(/[\\/:*?"<>|]+/g, '_');
}

export async function exportSavFile(kind: 'sav' | 'zsav'): Promise<void> {
  const ds = requireData();
  if (!ds) return;
  const st = useStore.getState();
  try {
    const { bytes, warnings } = exportSavWithReport(ds, { compression: kind === 'zsav' ? 'zsav' : 'bytecode' });
    const file = `${baseName(ds)}.${kind}`;
    if (reportSave(await saveFile(file, bytes, 'application/x-spss-sav'), file)) {
      for (const w of warnings.slice(0, 3)) st.toast(w, 'warning');
    }
  } catch (e) {
    st.toast(e instanceof Error ? e.message : 'Could not write the SPSS file.', 'error');
  }
}

export async function exportCsvFile(values: 'codes' | 'labels'): Promise<void> {
  const ds = requireData();
  if (!ds) return;
  try {
    const text = exportCsv(ds, { values, bom: true });
    const file = `${baseName(ds)}${values === 'labels' ? '_labels' : ''}.csv`;
    reportSave(await saveFile(file, text, 'text/csv'), file);
  } catch (e) {
    useStore.getState().toast(e instanceof Error ? e.message : 'Could not write the CSV file.', 'error');
  }
}

export async function exportXlsxFile(values: 'codes' | 'labels'): Promise<void> {
  const ds = requireData();
  if (!ds) return;
  const st = useStore.getState();
  useUi.getState().setBusy('Preparing the Excel file...');
  try {
    const blob = await exportXlsx(ds, { values });
    const file = `${baseName(ds)}${values === 'labels' ? '_labels' : ''}.xlsx`;
    reportSave(await saveFile(file, blob, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), file);
  } catch (e) {
    st.toast(e instanceof Error ? e.message : 'Could not write the Excel file.', 'error');
  } finally {
    useUi.getState().setBusy(null);
  }
}

function csvField(s: string): string {
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportCodebook(format: 'xlsx' | 'csv'): Promise<void> {
  const ds = requireData();
  if (!ds) return;
  const st = useStore.getState();
  try {
    const rows = codebookRows(ds);
    const keys = rows.length ? Object.keys(rows[0]) : ['Name', 'Label'];
    if (format === 'csv') {
      const text = '﻿' + [keys.map(csvField).join(','), ...rows.map((r) => keys.map((k) => csvField(r[k] ?? '')).join(','))].join('\r\n') + '\r\n';
      const file = `${baseName(ds)}_codebook.csv`;
      reportSave(await saveFile(file, text, 'text/csv'), file);
      return;
    }
    const mod = await import('write-excel-file/universal');
    const writeXlsxFile = mod.default as unknown as (sheets: unknown[]) => { toBlob: () => Promise<Blob> };
    const data = [keys.map((k) => ({ value: k, fontWeight: 'bold' })), ...rows.map((r) => keys.map((k) => (r[k] ? { value: r[k] } : null)))];
    const blob = await writeXlsxFile([
      { sheet: 'Codebook', data, columns: keys.map((k) => ({ width: /label/i.test(k) ? 44 : /missing/i.test(k) ? 24 : 14 })), stickyRowsCount: 1 },
    ]).toBlob();
    const file = `${baseName(ds)}_codebook.xlsx`;
    reportSave(await saveFile(file, blob, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), file);
  } catch (e) {
    st.toast(e instanceof Error ? e.message : 'Could not export the codebook.', 'error');
  }
}

/** Load the bundled sample survey. Returns false if there is none or it fails. */
export async function loadSample(opts: { confirm?: boolean; quiet?: boolean } = {}): Promise<boolean> {
  const st = useStore.getState();
  if (!samples.length) {
    if (!opts.quiet) st.toast('No sample data is bundled with this copy of Socius.', 'warning');
    return false;
  }
  if (opts.confirm !== false && !(await confirmReplace('Loading the sample survey'))) return false;
  useUi.getState().setBusy('Loading the sample survey...');
  try {
    const ds = await loadSampleDataset(samples[0].id);
    activateDataset(ds, { sample: true, message: opts.quiet ? undefined : `Loaded ${ds.name}.` });
    return true;
  } catch (e) {
    if (!opts.quiet) st.toast(e instanceof Error ? e.message : 'The sample survey could not be loaded.', 'error');
    return false;
  } finally {
    useUi.getState().setBusy(null);
  }
}

export async function newDataset(): Promise<void> {
  if (!(await confirmReplace('A new empty dataset'))) return;
  const ds = makeDataset({ name: 'Untitled', source: { kind: 'new' } });
  activateDataset(ds, { message: 'New empty dataset. Type in the grid, or add variables in Variable View.' });
}

/** Close the data and output, back to the welcome screen. */
export async function startFresh(): Promise<void> {
  useStore.setState({ dataset: null, past: [], future: [], outputs: [], focusOutputId: null, tab: 'data', dialog: null });
  useStore.getState().setCoding(emptyCodingProject());
  useUi.getState().markClean(null);
  useUi.getState().setSampleBanner(false);
  await clearSession();
}

/** Handle any dropped file: data files open, project files open as projects. */
export async function openDroppedFile(file: File): Promise<void> {
  if (isProjectFileName(file.name)) return openProjectFile(file);
  if (isDataFileName(file.name)) return openDataFile(file);
  const why = unopenableReason(file.name);
  if (why) {
    useStore.getState().toast(why, 'warning');
    return;
  }
  useStore.getState().toast(`${file.name} is not a file Socius can open. Drop a .sav, .zsav, .csv, .tsv, .xlsx or .socius.json file.`, 'warning');
}
