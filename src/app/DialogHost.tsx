// Renders the dialog requested in the store (procedure, transform, file, coding, help).
import { useStore } from '../core/store';
import { ProcedureDialog } from '../features/analysis/ProcedureDialog';
import { CodingDialog } from '../features/coding/CodingDialog';
import { TransformDialog } from '../features/transform/TransformDialogs';
import { CopyPropertiesDialog } from '../features/data/VarDialogs';
import { ImportDialog, RecentProjectsDialog } from '../features/project/FileDialogs';
import { AboutDialog, GettingStartedDialog, ShortcutsDialog } from './HelpDialogs';
import { AiPrereqDialog, ExplainPickDialog } from '../features/ai/AiFeatureDialogs';

export function DialogHost() {
  const dialog = useStore((s) => s.dialog);
  const ds = useStore((s) => s.dataset);
  const close = useStore((s) => s.closeDialog);
  if (!dialog) return null;
  switch (dialog.kind) {
    case 'procedure':
      return <ProcedureDialog key={dialog.id} procedureId={dialog.id} onClose={close} />;
    case 'coding':
      return <CodingDialog key={dialog.id} id={dialog.id} params={dialog.params} onClose={close} />;
    case 'transform':
      if (dialog.id === 'copy-properties')
        return ds ? <CopyPropertiesDialog ds={ds} sourceId={typeof dialog.params?.sourceId === 'string' ? dialog.params.sourceId : null} onClose={close} /> : null;
      return <TransformDialog key={dialog.id} id={dialog.id} params={dialog.params} onClose={close} />;
    case 'file':
      if (dialog.id === 'import') return <ImportDialog params={dialog.params} onClose={close} />;
      if (dialog.id === 'recent') return <RecentProjectsDialog onClose={close} />;
      return null;
    case 'custom':
      if (dialog.id === 'getting-started') return <GettingStartedDialog onClose={close} />;
      if (dialog.id === 'shortcuts') return <ShortcutsDialog onClose={close} />;
      if (dialog.id === 'about') return <AboutDialog onClose={close} />;
      if (dialog.id === 'ai-prereq') return <AiPrereqDialog key={String(dialog.params?.feature)} params={dialog.params} onClose={close} />;
      if (dialog.id === 'ai-explain-pick') return <ExplainPickDialog onClose={close} />;
      return null;
  }
}
