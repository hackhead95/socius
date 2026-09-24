// Renders parsed Markdown as React elements (never as HTML strings).
import { Fragment, useMemo, type ReactNode } from 'react';
import { parseMarkdown, type Block, type Inline } from './markdown';

function inlines(c: Inline[], key = ''): ReactNode[] {
  return c.map((x, i) => {
    const k = `${key}${i}`;
    switch (x.t) {
      case 'text':
        return <Fragment key={k}>{x.v}</Fragment>;
      case 'strong':
        return <strong key={k}>{inlines(x.c, k + '.')}</strong>;
      case 'em':
        return <em key={k}>{inlines(x.c, k + '.')}</em>;
      case 'code':
        return <code key={k}>{x.v}</code>;
      case 'br':
        return <br key={k} />;
      case 'link':
        return (
          <a key={k} href={x.href} target="_blank" rel="noopener noreferrer">
            {inlines(x.c, k + '.')}
          </a>
        );
    }
  });
}

function blocks(bs: Block[], key = ''): ReactNode[] {
  return bs.map((b, i) => {
    const k = `${key}${i}`;
    switch (b.t) {
      case 'h': {
        // Answers sit inside the panel: map # to a modest heading size.
        const Tag = (`h${Math.min(6, b.level + 2)}` as 'h3');
        return <Tag key={k}>{inlines(b.c, k)}</Tag>;
      }
      case 'p':
        return <p key={k}>{inlines(b.c, k)}</p>;
      case 'hr':
        return <hr key={k} />;
      case 'code':
        return (
          <pre key={k} className="as-code">
            <code>{b.v}</code>
          </pre>
        );
      case 'quote':
        return <blockquote key={k}>{blocks(b.c, k + '.')}</blockquote>;
      case 'list': {
        const items = b.items.map((it, j) => {
          // Tight list items: a lone paragraph renders without <p> margins.
          const only = it.length === 1 && it[0].t === 'p' ? inlines(it[0].c, `${k}.${j}.`) : blocks(it, `${k}.${j}.`);
          return <li key={j}>{only}</li>;
        });
        return b.ordered ? (
          <ol key={k} start={b.start !== 1 ? b.start : undefined}>
            {items}
          </ol>
        ) : (
          <ul key={k}>{items}</ul>
        );
      }
      case 'table':
        return (
          <div key={k} className="as-table-wrap" tabIndex={0} role="region" aria-label="Table">
            <table className="as-table">
              <thead>
                <tr>
                  {b.head.map((h, j) => (
                    <th key={j} style={b.align[j] ? { textAlign: b.align[j]! } : undefined}>
                      {inlines(h, `${k}h${j}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, j) => (
                      <td key={j} style={b.align[j] ? { textAlign: b.align[j]! } : undefined}>
                        {inlines(c, `${k}r${ri}c${j}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  });
}

export function Markdown({ text }: { text: string }) {
  const tree = useMemo(() => parseMarkdown(text), [text]);
  return <div className="as-md">{blocks(tree)}</div>;
}
