// STUB — owned by the App Shell agent.
import { useStore } from '../core/store';
import { OutputViewer } from '../features/output/OutputViewer';
import { CodingWorkspace } from '../features/coding/CodingWorkspace';

export function App() {
  const tab = useStore((s) => s.tab);
  return (
    <div style={{ padding: 16 }}>
      <h1>Socius</h1>
      {tab === 'output' ? <OutputViewer /> : tab === 'coding' ? <CodingWorkspace /> : <p className="muted">Data view coming.</p>}
    </div>
  );
}
