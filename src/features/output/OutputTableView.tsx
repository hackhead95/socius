import { useMemo } from 'react';
import type { OutputTable } from '../../core/output';
import { formatCell, isSignificantP, layoutRows, percentColumns, stubCount, type TableStyle } from './format';

/** An output table on screen: APA (horizontal rules only) or SPSS (light grid) style. */
export function OutputTableView({ table, style, number }: { table: OutputTable; style: TableStyle; number?: number }) {
  const geo = useMemo(() => ({ head: layoutRows(table.header), body: layoutRows(table.rows), pct: percentColumns(table), stubs: stubCount(table) }), [table]);
  const rules = new Set(table.ruleBefore ?? []);
  const apa = style === 'apa';
  return (
    <figure className={`ot ot-${style}`}>
      <figcaption className="ot-caption">
        {apa && number !== undefined ? <span className="ot-number">Table {number}</span> : null}
        <span className="ot-title">{table.title}</span>
        {table.subtitle ? <span className="ot-subtitle">{table.subtitle}</span> : null}
      </figcaption>
      <div className="ot-scroll" tabIndex={0} role="region" aria-label={`${table.title} (scrolls sideways)`}>
        <table>
          {geo.head.grid.length ? (
            <thead>
              {geo.head.grid.map((row, r) => (
                <tr key={r}>
                  {row.map((g, i) => {
                    const f = formatCell(g.cell, { style, percentColumn: geo.pct[g.col] });
                    const isStub = g.col < geo.stubs;
                    const lowest = r + g.rowSpan >= geo.head.grid.length;
                    return (
                      <th
                        key={i}
                        scope="col"
                        colSpan={g.colSpan > 1 ? g.colSpan : undefined}
                        rowSpan={g.rowSpan > 1 ? g.rowSpan : undefined}
                        className={[isStub ? 'stub' : '', g.colSpan > 1 ? 'spanner' : '', lowest ? 'lowest' : ''].filter(Boolean).join(' ') || undefined}
                        style={g.cell.align ? { textAlign: g.cell.align } : undefined}
                      >
                        {f.text}
                        {f.mark ? <sup>{f.mark}</sup> : null}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
          ) : null}
          <tbody>
            {geo.body.grid.map((row, r) => (
              <tr key={r} className={rules.has(r) ? 'rule' : undefined}>
                {row.map((g, i) => {
                  const c = g.cell;
                  const f = formatCell(c, { style, percentColumn: geo.pct[g.col] });
                  const isStub = g.col < geo.stubs;
                  const tone = c.tone ?? (isSignificantP(c) ? 'good' : undefined);
                  const cls = [
                    f.numeric && !isStub ? 'num' : '',
                    tone ? `tone-${tone}` : '',
                    c.bold ? 'b' : '',
                    c.italic ? 'i' : '',
                    typeof c.v === 'number' && Number.isNaN(c.v) ? 'na' : '',
                  ].filter(Boolean).join(' ');
                  const st = { textAlign: c.align, paddingLeft: c.indent ? `calc(var(--ot-pad) + ${c.indent * 14}px)` : undefined };
                  const Tag = isStub ? 'th' : 'td';
                  const short = isStub && f.text.length <= 24;
                  return (
                    <Tag
                      key={i}
                      scope={isStub ? 'row' : undefined}
                      colSpan={g.colSpan > 1 ? g.colSpan : undefined}
                      rowSpan={g.rowSpan > 1 ? g.rowSpan : undefined}
                      className={[isStub ? 'stub' : '', short ? 'nw' : '', cls].filter(Boolean).join(' ') || undefined}
                      style={c.align || c.indent ? st : undefined}
                      title={tone === 'good' && c.fmt === 'p' ? 'Below .05' : undefined}
                    >
                      {tone ? <span className="tv">{f.text}</span> : f.text}
                      {f.mark ? <sup>{f.mark}</sup> : null}
                    </Tag>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.footnotes?.length ? (
        <div className="ot-notes">
          {table.footnotes.map((fn, i) => (
            <p key={i}>
              {apa && i === 0 ? <em>Note. </em> : null}
              {fn}
            </p>
          ))}
        </div>
      ) : null}
    </figure>
  );
}
