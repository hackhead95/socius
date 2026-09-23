// Intercoder reliability: compare two coders over the sources both coded.

import { useMemo, useState } from 'react';
import { useStore } from '../../core/store';
import { compareCoders, landisKoch } from '../../lib/coding/reliability';
import { reliabilityOutput } from '../../lib/coding/outputs';
import { useOrderedCodes, plural } from './hooks';
import { jumpTo, openLocalDialog } from './uiStore';
import { Swatch } from './ui';

function fmt(x: number): string {
  if (!Number.isFinite(x)) return '.';
  return x.toFixed(2).replace(/^0\./, '.').replace(/^-0\./, '-.');
}

export function ReliabilityView() {
  const project = useStore((s) => s.coding);
  const addOutput = useStore((s) => s.addOutput);
  const nodes = useOrderedCodes();
  const codersWithSegs = useMemo(() => {
    const s = new Set(project.segments.map((x) => x.coder));
    return [...new Set([...project.coders, ...s])];
  }, [project.coders, project.segments]);
  const [a, setA] = useState(codersWithSegs[0] ?? '');
  const [b, setB] = useState(codersWithSegs[1] ?? '');
  const [codeFilter, setCodeFilter] = useState('');
  const [showN, setShowN] = useState(100);

  const codeIds = useMemo(() => {
    const used = new Set(project.segments.filter((s) => s.coder === a || s.coder === b).map((s) => s.codeId));
    return nodes.filter((n) => used.has(n.code.id)).map((n) => n.code.id);
  }, [project.segments, nodes, a, b]);

  const result = useMemo(() => (a && b && a !== b ? compareCoders(project.docs, project.segments, a, b, codeIds) : null), [project.docs, project.segments, a, b, codeIds]);
  const codeMap = useMemo(() => new Map(project.codes.map((c) => [c.id, c])), [project.codes]);
  const docMap = useMemo(() => new Map(project.docs.map((d) => [d.id, d])), [project.docs]);

  if (codersWithSegs.length < 2) {
    return (
      <div className="cw-center-empty empty">
        <h3>Intercoder reliability needs two coders</h3>
        <p>
          Add a second coder, switch to them with the coder menu in the toolbar, and code the same documents or responses independently. Then compare the two coders here.
        </p>
        <button className="btn btn-primary" onClick={() => openLocalDialog('coders')}>
          Add a coder
        </button>
      </div>
    );
  }

  const dis = result ? result.disagreements.filter((d) => !codeFilter || d.codeId === codeFilter) : [];

  return (
    <div className="cw-view cw-reliability">
      <div className="cw-view-tools">
        <label className="label" htmlFor="cw-ca">Coder A</label>
        <select id="cw-ca" className="select input-sm" value={a} onChange={(e) => setA(e.target.value)}>
          {codersWithSegs.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="label" htmlFor="cw-cb">Coder B</label>
        <select id="cw-cb" className="select input-sm" value={b} onChange={(e) => setB(e.target.value)}>
          {codersWithSegs.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="spacer" />
        <button className="btn btn-sm" onClick={() => openLocalDialog('coders')}>Manage coders</button>
        {result && result.docIds.length ? (
          <button className="btn btn-sm btn-primary" onClick={() => addOutput(reliabilityOutput(project.codes, result))}>Send to Output</button>
        ) : null}
      </div>
      {a === b ? <div className="callout callout-warn">Choose two different coders.</div> : null}
      {result && !result.docIds.length ? (
        <div className="callout callout-info">
          {a} and {b} have not coded any of the same sources yet. Each coder needs at least one code in a source for it to be compared.
        </div>
      ) : null}
      {result && result.docIds.length ? (
        <>
          <div className="cw-stats">
            <div className="cw-stat"><span className="cw-stat-v">{fmt(result.pooledAlpha)}</span><span className="cw-stat-l">Krippendorff's α (all codes)</span></div>
            <div className="cw-stat"><span className="cw-stat-v">{fmt(result.meanKappa)}</span><span className="cw-stat-l">Mean Cohen's κ · {landisKoch(result.meanKappa)}</span></div>
            <div className="cw-stat"><span className="cw-stat-v">{result.pooledAgreement.toFixed(1)}%</span><span className="cw-stat-l">Agreement (all decisions)</span></div>
            <div className="cw-stat"><span className="cw-stat-v">{result.docIds.length}</span><span className="cw-stat-l">Sources both coded</span></div>
          </div>
          <p className="help">
            Units: {[result.nResponseUnits ? plural(result.nResponseUnits, 'response') : '', result.nSentenceUnits ? plural(result.nSentenceUnits, 'sentence') : ''].filter(Boolean).join(' and ')}. Each open-ended response is one unit; interview documents are split into sentences. A unit counts as coded when the coder applied the code anywhere in it. Bands follow Landis and Koch (1977), a rule of thumb.
          </p>
          <div className="scroll-x">
            <table className="table cw-ftable">
              <thead>
                <tr>
                  <th>Code</th>
                  <th className="num">Both</th>
                  <th className="num">{a} only</th>
                  <th className="num">{b} only</th>
                  <th className="num">Neither</th>
                  <th className="num">Agreement</th>
                  <th className="num">κ</th>
                  <th className="num">α</th>
                  <th>Strength</th>
                </tr>
              </thead>
              <tbody>
                {result.perCode.map((r) => {
                  const c = codeMap.get(r.codeId);
                  const weak = Number.isFinite(r.kappa) && r.kappa < 0.6;
                  return (
                    <tr key={r.codeId}>
                      <td><span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>{c ? <Swatch color={c.color} /> : null}{c?.name}</span></td>
                      <td className="num">{r.both}</td>
                      <td className="num">{r.onlyA}</td>
                      <td className="num">{r.onlyB}</td>
                      <td className="num">{r.neither}</td>
                      <td className="num">{r.agreement.toFixed(1)}%</td>
                      <td className="num" style={weak ? { color: 'var(--warn)', fontWeight: 600 } : undefined}>{fmt(r.kappa)}</td>
                      <td className="num">{fmt(r.alpha)}</td>
                      <td>{landisKoch(r.kappa)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="row" style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 'var(--fs-md)' }}>Disagreements to review</h3>
            <span className="badge">{dis.length}</span>
            <span className="spacer" />
            <select className="select input-sm" value={codeFilter} onChange={(e) => setCodeFilter(e.target.value)} aria-label="Filter disagreements by code">
              <option value="">All codes</option>
              {result.perCode.filter((r) => r.onlyA + r.onlyB).map((r) => <option key={r.codeId} value={r.codeId}>{codeMap.get(r.codeId)?.name}</option>)}
            </select>
          </div>
          <ol className="cw-quotes">
            {dis.slice(0, showN).map((d, i) => {
              const doc = docMap.get(d.unit.docId)!;
              const c = codeMap.get(d.codeId);
              return (
                <li key={i} className="cw-quote" style={{ borderLeftColor: c?.color }}>
                  <blockquote>{doc.text.slice(d.unit.start, d.unit.end).replace(/\s+/g, ' ').trim()}</blockquote>
                  <div className="cw-quote-meta">
                    <b>{doc.name}</b>
                    <span className="cw-attr">{c?.name}</span>
                    <span>applied by <b>{d.appliedBy === 'A' ? a : b}</b>, not by {d.appliedBy === 'A' ? b : a}</span>
                    <span className="spacer" />
                    <button className="btn btn-ghost btn-sm" onClick={() => jumpTo(doc.id, d.unit.start, d.unit.end)}>Show in context</button>
                  </div>
                </li>
              );
            })}
          </ol>
          {dis.length > showN ? <button className="btn btn-sm" onClick={() => setShowN((n) => n + 100)}>Show more</button> : null}
          {!dis.length ? <p className="help">No disagreements. The two coders agree on every unit.</p> : null}
        </>
      ) : null}
    </div>
  );
}
