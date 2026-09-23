// Welcome screen (no dataset open) and the sample-data banner.
import { useEffect, useState } from 'react';
import { useStore } from '../core/store';
import { Icon } from '../ui/Icon';
import { loadSample, newDataset, openDataFile, openProjectFile, openRecentProject } from '../features/project/fileActions';
import { listRecent, type RecentEntry } from '../features/project/persistence';
import { samples } from '../samples';
import { useUi } from './ui-store';

export function Welcome() {
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const openDialog = useStore((s) => s.openDialog);
  useEffect(() => {
    void listRecent().then((r) => setRecent(r.slice(0, 4)));
  }, []);
  return (
    <div className="welcome">
      <div className="welcome-inner">
        <div className="welcome-head">
          <h1>Start with your data</h1>
          <p className="welcome-lede">Open an SPSS file, a CSV or an Excel sheet. Variable labels, value labels and missing values come with it.</p>
        </div>
        <div className="welcome-actions">
          <button type="button" className="welcome-action primary" onClick={() => void openDataFile()}>
            <Icon name="folder" size={20} />
            <span><strong>Open data file</strong><span className="help">.sav, .zsav, .csv, .tsv, .xlsx</span></span>
          </button>
          <button type="button" className="welcome-action" onClick={() => void openProjectFile()}>
            <Icon name="file" size={20} />
            <span><strong>Open project</strong><span className="help">A .socius.json file you saved</span></span>
          </button>
          {samples.length ? (
            <button type="button" className="welcome-action" onClick={() => void loadSample({ confirm: false })}>
              <Icon name="sigma" size={20} />
              <span><strong>Load sample survey</strong><span className="help">{samples[0].title}</span></span>
            </button>
          ) : null}
          <button type="button" className="welcome-action" onClick={() => void newDataset()}>
            <Icon name="plus" size={20} />
            <span><strong>New empty dataset</strong><span className="help">Type or paste data yourself</span></span>
          </button>
        </div>
        {recent.length ? (
          <div className="welcome-recent">
            <div className="eyebrow">Recent projects</div>
            {recent.map((r) => (
              <button key={r.id} type="button" className="recent-item" onClick={() => void openRecentProject(r.id, r.name)}>
                <Icon name="file" size={15} />
                <span className="recent-name">{r.name}</span>
                <span className="help num">{r.nCases.toLocaleString('en-US')} cases · {new Date(r.savedAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="welcome-guide">
          <div className="eyebrow">What you can do</div>
          <ul>
            <li><strong>Open SPSS files</strong> and keep working in the Data View and Variable View you know.</li>
            <li><strong>Run the usual analyses:</strong> frequencies, crosstabs with chi-square, t-tests, ANOVA, correlations, regression, reliability. Each result comes with a plain-language reading and an APA sentence.</li>
            <li><strong>Prepare variables:</strong> recode, compute, reverse-code items, build scales, select cases, weight.</li>
            <li><strong>Code interviews</strong> and open-ended answers with a codebook, then compare codes across groups.</li>
            <li><strong>Export</strong> data back to SPSS (.sav), Excel or CSV, and results to Word.</li>
          </ul>
          <button type="button" className="linkish" onClick={() => openDialog({ kind: 'custom', id: 'getting-started' })}>Read the six-step guide</button>
        </div>
        <p className="privacy"><Icon name="info" size={14} /> Your data stays in this browser. Nothing is uploaded.</p>
      </div>
    </div>
  );
}

export function SampleBanner() {
  const show = useUi((s) => s.sampleBanner);
  const setShow = useUi((s) => s.setSampleBanner);
  const isSample = useStore((s) => s.dataset?.source?.kind === 'sample');
  if (!show || !isSample) return null;
  return (
    <div className="sample-banner" role="note">
      <Icon name="info" size={15} />
      <span>You are exploring sample data (a fictional survey). Open your own .sav, CSV or Excel file to start.</span>
      <span className="spacer" />
      <button type="button" className="btn btn-sm" onClick={() => void openDataFile()}>Open data file</button>
      <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => setShow(false)} aria-label="Dismiss"><Icon name="x" size={13} /></button>
    </div>
  );
}
