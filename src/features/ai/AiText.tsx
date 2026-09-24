// Renders an AI reply written in light Markdown (headings, **bold**, "-" and "1." lists) as plain React
// elements. No HTML from the model is ever inserted into the page.
import type { ReactNode } from 'react';

const SECTION = /^(what was tested|what the numbers mean|assumptions and warnings|how to report it|cautions)\s*:?\s*$/i;

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[1] !== undefined ? <strong key={`${key}-${i++}`}>{m[1]}</strong> : <code key={`${key}-${i++}`}>{m[2]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function AiText({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flushPara = () => {
    if (para.length) blocks.push(<p key={`p${blocks.length}`}>{inline(para.join(' '), `p${blocks.length}`)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it, `l${blocks.length}-${i}`)}</li>);
    blocks.push(list.ordered ? <ol key={`l${blocks.length}`}>{items}</ol> : <ul key={`l${blocks.length}`}>{items}</ul>);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    const h = /^#{1,6}\s+(.*)$/.exec(line);
    const boldHead = /^\*\*([^*]+)\*\*:?$/.exec(line);
    if (h || boldHead || SECTION.test(line)) {
      flushPara();
      flushList();
      const t = (h?.[1] ?? boldHead?.[1] ?? line).replace(/\*\*/g, '').replace(/:$/, '');
      blocks.push(<h4 key={`h${blocks.length}`}>{t}</h4>);
      continue;
    }
    const ul = /^[-*•]\s+(.*)$/.exec(line);
    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara();
      const ordered = !!ol;
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((ul?.[1] ?? ol?.[1])!);
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return <div className={`ai-text ${className ?? ''}`}>{blocks}</div>;
}
