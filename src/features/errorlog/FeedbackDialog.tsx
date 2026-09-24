// Help > Send feedback or report a problem (also the top bar's Feedback button): before opening the
// form on GitHub, offer to copy the error report, and fill a short diagnostic summary into the form.
import { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { FEEDBACK_URL, openExternal } from '../../app/links';
import { SESSION_ID, formatSummary } from '../../platform/errorlog';
import { copyErrorReport, openErrorLog, prefilledFeedbackUrl, useErrorLog } from './actions';
import './errorlog.css';

export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const log = useErrorLog();
  const problems = log.filter((e) => e.level !== 'info');
  const nSession = problems.filter((e) => e.session === SESSION_ID).length;
  const [include, setInclude] = useState(true);
  const [copied, setCopied] = useState<boolean | null>(null);

  const open = () => {
    openExternal(prefilledFeedbackUrl(FEEDBACK_URL, include));
    onClose();
  };

  return (
    <Modal
      title="Send feedback or report a problem"
      subtitle="The form opens on GitHub in a new tab (a free GitHub account is needed)."
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={() => openExternal(FEEDBACK_URL)} title="Choose between reporting a problem and suggesting an idea">Suggest an idea instead</button>
          <button className="btn btn-primary" onClick={open}>Open the feedback form</button>
        </>
      }
    >
      <div className="stack feedback">
        <section className="stack" style={{ gap: 6 }}>
          <h3 className="eyebrow">1. Copy the error report</h3>
          <p className="help" style={{ margin: 0 }}>
            {problems.length
              ? `The error log has ${problems.length} ${problems.length === 1 ? 'problem' : 'problems'}${nSession ? ` (${nSession} from this session)` : ''}. Copy the error report to paste into your message: it helps us find the cause quickly.`
              : 'No problems are in the error log. You can still copy the report: it says which version and browser you use.'}
          </p>
          <div className="row">
            <button
              className="btn"
              onClick={async () => {
                setCopied(await copyErrorReport());
              }}
            >
              Copy error report
            </button>
            <button className="btn btn-ghost" onClick={openErrorLog}>Open the error log</button>
            {copied === true ? <span className="help" role="status">Copied. Paste it into the form.</span> : null}
          </div>
        </section>
        <section className="stack" style={{ gap: 6 }}>
          <h3 className="eyebrow">2. Open the feedback form</h3>
          <label className="check">
            <input type="checkbox" checked={include} onChange={(e) => setInclude(e.target.checked)} />
            <span>Fill in a short summary: version, browser and the last 5 problems</span>
          </label>
          {include ? <pre className="errlog-detail feedback-preview" aria-label="Summary that will be filled in">{formatSummary(5)}</pre> : null}
          <p className="help" style={{ margin: 0 }}>
            The report and summary never include your data values, variable names or labels, file names, text excerpts or keys. Please do not paste confidential or identifiable research data into the form.
          </p>
        </section>
      </div>
    </Modal>
  );
}
