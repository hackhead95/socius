// Menubar model: File, Edit, View, Data, Transform, Analyze, Graphs, Text coding, Help.
import { useStore } from '../core/store';
import type { ProcedureMenu } from '../core/procedure';
import { procedures } from '../procedures';
import { aiMenuAvailable, codingMenuItems } from '../features/coding/menu';
import type { MenuItem } from '../ui/Menu';
import { useUi, type ThemePref } from './ui-store';
import {
  exportCodebook, exportCsvFile, exportSavFile, exportXlsxFile, loadSample, newDataset, openDataFile, openProjectFile, saveProject, startFresh,
} from '../features/project/fileActions';
import { samples } from '../samples';
import { turnFilterOff, turnWeightOff } from '../features/transform/common';
import { modKey } from './shortcuts';
import { FEEDBACK_URL, GUIDE_URL, openExternal } from './links';
import { openAiSettings } from '../features/ai/hooks';

export interface TopMenu {
  id: string;
  label: string;
  items: MenuItem[];
}

const NEED_DATA = 'Open or create a dataset first';

const ANALYZE_ORDER: ProcedureMenu[] = ['Descriptive Statistics', 'Compare Means', 'Correlate', 'Regression', 'Nonparametric Tests', 'Scale', 'Dimension Reduction'];

export function useMenus(): TopMenu[] {
  const hasData = useStore((s) => !!s.dataset);
  const hasCases = useStore((s) => (s.dataset?.nCases ?? 0) > 0);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const filterOn = useStore((s) => !!s.dataset?.filterVarId);
  const weightOn = useStore((s) => !!s.dataset?.weightVarId);
  const showLabels = useStore((s) => s.showValueLabels);
  const tab = useStore((s) => s.tab);
  const nOutputs = useStore((s) => s.outputs.length);
  const theme = useUi((s) => s.theme);
  const sidebarOpen = useUi((s) => s.sidebarOpen);
  const currentVarId = useUi((s) => s.currentVarId);
  const st = useStore.getState;
  const mod = modKey();

  const needData = (it: MenuItem): MenuItem => (hasData ? it : { ...it, disabled: true, title: NEED_DATA });
  const openT = (id: string, params?: Record<string, unknown>) => () => st().openDialog({ kind: 'transform', id, params });
  const toData = () => {
    if (st().tab !== 'data') st().setTab('data');
  };

  const file: MenuItem[] = [
    { id: 'new', label: 'New dataset', onSelect: () => void newDataset() },
    { id: 'open', label: 'Open data file...', shortcut: `${mod}+O`, onSelect: () => void openDataFile() },
    { id: 'open-proj', label: 'Open project...', onSelect: () => void openProjectFile() },
    { id: 'recent', label: 'Recent projects...', onSelect: () => st().openDialog({ kind: 'file', id: 'recent' }) },
    samples.length ? { id: 'sample', label: 'Load sample survey', onSelect: () => void loadSample() } : null,
    { id: 'save', label: 'Save project', shortcut: `${mod}+S`, separator: true, onSelect: () => void saveProject() },
    needData({
      id: 'save-as',
      label: 'Save data as',
      children: [
        { id: 'sav', label: 'SPSS data (.sav)', onSelect: () => void exportSavFile('sav') },
        { id: 'zsav', label: 'SPSS compressed (.zsav)', onSelect: () => void exportSavFile('zsav') },
        { id: 'csv', label: 'CSV with codes', separator: true, onSelect: () => void exportCsvFile('codes') },
        { id: 'csv-l', label: 'CSV with value labels', onSelect: () => void exportCsvFile('labels') },
        { id: 'xlsx', label: 'Excel with codes', separator: true, onSelect: () => void exportXlsxFile('codes') },
        { id: 'xlsx-l', label: 'Excel with value labels', onSelect: () => void exportXlsxFile('labels') },
      ],
    }),
    needData({
      id: 'codebook',
      label: 'Export codebook',
      children: [
        { id: 'cb-x', label: 'Excel (.xlsx)', onSelect: () => void exportCodebook('xlsx') },
        { id: 'cb-c', label: 'CSV', onSelect: () => void exportCodebook('csv') },
      ],
    }),
    {
      id: 'close',
      label: 'Close data and start fresh...',
      separator: true,
      danger: true,
      onSelect: async () => {
        const ok = await useUi.getState().confirm({
          title: 'Close everything?',
          message: 'The data, the output and the text-coding project will be closed and the saved session in this browser is cleared. Save a project first if you want to keep them.',
          confirmLabel: 'Close and start fresh',
          danger: true,
        });
        if (ok) await startFresh();
      },
    },
  ].filter(Boolean) as MenuItem[];

  const edit: MenuItem[] = [
    { id: 'undo', label: 'Undo', shortcut: `${mod}+Z`, disabled: !canUndo, title: canUndo ? undefined : 'Nothing to undo', onSelect: () => st().undo() },
    { id: 'redo', label: 'Redo', shortcut: `${mod}+Y`, disabled: !canRedo, title: canRedo ? undefined : 'Nothing to redo', onSelect: () => st().redo() },
    needData({ id: 'find', label: 'Find in data...', shortcut: `${mod}+F`, separator: true, onSelect: () => { toData(); useUi.getState().requestFind(); } }),
    hasCases ? { id: 'goto', label: 'Go to case...', onSelect: () => { toData(); useUi.getState().requestGoto(); } } : { id: 'goto', label: 'Go to case...', disabled: true, title: hasData ? 'There are no cases yet' : NEED_DATA },
    {
      id: 'clear-out',
      label: 'Clear output...',
      separator: true,
      disabled: !nOutputs,
      title: nOutputs ? undefined : 'The output is empty',
      onSelect: async () => {
        const ok = await useUi.getState().confirm({ title: 'Clear all output?', message: `All ${nOutputs} output item${nOutputs === 1 ? '' : 's'} will be removed. This cannot be undone.`, confirmLabel: 'Clear output', danger: true });
        if (ok) st().clearOutputs();
      },
    },
  ];

  const themeItem = (t: ThemePref, label: string): MenuItem => ({ id: `theme-${t}`, label, checked: theme === t, onSelect: () => useUi.getState().setTheme(t) });
  const view: MenuItem[] = [
    needData({ id: 'v-data', label: 'Data View', checked: tab === 'data', onSelect: () => st().setTab('data') }),
    needData({ id: 'v-vars', label: 'Variable View', checked: tab === 'variables', onSelect: () => st().setTab('variables') }),
    { id: 'v-out', label: 'Output', checked: tab === 'output', onSelect: () => st().setTab('output') },
    { id: 'v-code', label: 'Text coding', checked: tab === 'coding', onSelect: () => st().setTab('coding') },
    { id: 'v-labels', label: 'Value labels in Data View', separator: true, checked: showLabels, onSelect: () => st().setShowValueLabels(!showLabels) },
    { id: 'v-side', label: 'Variable list', checked: sidebarOpen, onSelect: () => useUi.getState().setSidebarOpen(!sidebarOpen) },
    { id: 'v-theme', label: 'Theme', separator: true, children: [themeItem('system', 'Match my system'), themeItem('light', 'Light'), themeItem('dark', 'Dark')] },
  ];

  const data: MenuItem[] = [
    needData({ id: 'd-props', label: 'Define variable properties', onSelect: () => st().setTab('variables') }),
    needData({ id: 'd-copy', label: 'Copy variable properties...', onSelect: openT('copy-properties', { sourceId: currentVarId }) }),
    needData({ id: 'd-sort', label: 'Sort cases...', separator: true, onSelect: openT('sort') }),
    needData({ id: 'd-select', label: 'Select cases...', onSelect: openT('select') }),
    needData({ id: 'd-weight', label: 'Weight cases...', onSelect: openT('weight') }),
    needData({
      id: 'd-merge',
      label: 'Merge files',
      separator: true,
      children: [
        { id: 'm-cases', label: 'Add cases...', onSelect: openT('merge-cases') },
        { id: 'm-vars', label: 'Add variables...', onSelect: openT('merge-variables') },
      ],
    }),
    needData({ id: 'd-agg', label: 'Aggregate...', onSelect: openT('aggregate') }),
    filterOn ? { id: 'd-filter-off', label: 'Turn filter off (use all cases)', separator: true, onSelect: turnFilterOff } : null,
    weightOn ? { id: 'd-weight-off', label: 'Turn weighting off', separator: !filterOn, onSelect: turnWeightOff } : null,
  ].filter(Boolean) as MenuItem[];

  const transform: MenuItem[] = [
    needData({ id: 't-compute', label: 'Compute variable...', onSelect: openT('compute') }),
    needData({ id: 't-count', label: 'Count values within cases...', onSelect: openT('count') }),
    needData({ id: 't-same', label: 'Recode into same variables...', separator: true, onSelect: openT('recode-same') }),
    needData({ id: 't-diff', label: 'Recode into different variables...', onSelect: openT('recode-different') }),
    needData({ id: 't-auto', label: 'Automatic recode...', onSelect: openT('autorecode') }),
    needData({ id: 't-bin', label: 'Visual binning...', onSelect: openT('binning') }),
    needData({ id: 't-rev', label: 'Reverse-code items...', separator: true, onSelect: openT('reverse') }),
    needData({ id: 't-scale', label: 'Create scale / index...', onSelect: openT('scale') }),
    needData({ id: 't-z', label: 'Standardize (z-scores)...', onSelect: openT('standardize') }),
    needData({ id: 't-rank', label: 'Rank cases...', onSelect: openT('rank') }),
  ];

  const openProc = (id: string) => () => st().openDialog({ kind: 'procedure', id });
  const analyze: MenuItem[] = [];
  const groups = new Map<string, MenuItem[]>();
  for (const p of procedures) {
    if (p.menu === 'Graphs') continue;
    if (!groups.has(p.menu)) groups.set(p.menu, []);
    groups.get(p.menu)!.push(needData({ id: p.id, label: `${p.title}...`, title: hasData ? p.description : NEED_DATA, onSelect: openProc(p.id) }));
  }
  const menuNames = [...ANALYZE_ORDER.filter((m) => groups.has(m)), ...[...groups.keys()].filter((m) => !ANALYZE_ORDER.includes(m as ProcedureMenu))];
  for (const m of menuNames) analyze.push(needData({ id: `a-${m}`, label: m, children: groups.get(m)! }));
  if (!analyze.length) analyze.push({ id: 'a-none', label: 'No analyses are available in this build', disabled: true });

  const graphs: MenuItem[] = procedures
    .filter((p) => p.menu === 'Graphs')
    .map((p) => needData({ id: p.id, label: `${p.title}...`, title: hasData ? p.description : NEED_DATA, onSelect: openProc(p.id) }));
  if (!graphs.length) graphs.push({ id: 'g-none', label: 'No charts are available in this build', disabled: true });

  const coding: MenuItem[] = codingMenuItems.filter((c) => !c.ai || aiMenuAvailable()).map((c) => ({
    id: `c-${c.id}`,
    label: c.label,
    separator: c.separator,
    onSelect: () => {
      st().setTab('coding');
      if (!c.tabOnly) st().openDialog({ kind: 'coding', id: c.id });
    },
  }));

  const help: MenuItem[] = [
    { id: 'h-start', label: 'Getting started', onSelect: () => st().openDialog({ kind: 'custom', id: 'getting-started' }) },
    { id: 'h-guide', label: 'User guide', title: 'Opens the full guide in a new tab', onSelect: () => openExternal(GUIDE_URL) },
    { id: 'h-keys', label: 'Keyboard shortcuts', onSelect: () => st().openDialog({ kind: 'custom', id: 'shortcuts' }) },
    { id: 'h-ai', label: 'AI assistant settings...', separator: true, onSelect: openAiSettings },
    { id: 'h-feedback', label: 'Send feedback or report a problem', separator: true, title: 'Opens a form on GitHub in a new tab', onSelect: () => openExternal(FEEDBACK_URL) },
    { id: 'h-about', label: 'About Socius', separator: true, onSelect: () => st().openDialog({ kind: 'custom', id: 'about' }) },
  ];

  return [
    { id: 'file', label: 'File', items: file },
    { id: 'edit', label: 'Edit', items: edit },
    { id: 'view', label: 'View', items: view },
    { id: 'data', label: 'Data', items: data },
    { id: 'transform', label: 'Transform', items: transform },
    { id: 'analyze', label: 'Analyze', items: analyze },
    { id: 'graphs', label: 'Graphs', items: graphs },
    { id: 'coding', label: 'Text coding', items: coding },
    { id: 'help', label: 'Help', items: help },
  ];
}
