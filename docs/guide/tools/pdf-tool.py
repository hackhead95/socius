"""Helpers for build-pdf.mjs (needs pypdf: pip install pypdf).

    python pdf-tool.py find-pages body.pdf headings.json [--from-start]  -> prints {"id": page, ...} as JSON
    python pdf-tool.py merge cover.pdf body.pdf out.pdf "Title" "Author"

find-pages: headings.json is a list of {"id", "title", "level"} in reading order. A heading is found
on the first page (at or after the previous heading's page) where it stands on a line of its own,
possibly wrapped over two lines, so a mention of the same words in running text does not count.
Page numbers are 1-based and match the numbers printed in the body's footer.
"""
import json
import re
import sys

from pypdf import PdfReader, PdfWriter


def norm(s: str) -> str:
    for a, b in (('\ufb01', 'fi'), ('\ufb02', 'fl'), ('\ufb00', 'ff'), ('\ufb03', 'ffi'), ('\u2019', "'"), ('\u2018', "'"), ('\u00a0', ' ')):
        s = s.replace(a, b)
    return re.sub(r'\s+', ' ', s).strip().lower()


def find_pages(pdf: str, headings_file: str, word: bool = False) -> None:
    reader = PdfReader(pdf)
    pages = []
    for p in reader.pages:
        lines = [norm(l) for l in (p.extract_text() or '').splitlines()]
        lines = [l for l in lines if l]
        pages.append(lines)
    heads = json.load(open(headings_file, encoding='utf-8'))
    result = {}
    start = 1  # skip the contents page(s): body page 1 is the table of contents
    # Contents may run over several pages; chapter 1 is the first page whose first lines hold "chapter 1".
    for i, lines in enumerate(pages):
        if any(l == 'chapter 1' for l in lines[:4]):
            start = i
            break
    if word:
        # Word file converted by LibreOffice: pages are counted from the title page, and every
        # chapter starts a new page, so a chapter heading is one of the first lines of its page.
        start = 1
    cur = start
    for h in heads:
        target = norm(h['title'])
        found = None
        for i in range(cur, len(pages)):
            lines = pages[i]
            cands = set(lines)
            cands.update(f'{a} {b}' for a, b in zip(lines, lines[1:]))
            cands.update(f'{a} {b} {c}' for a, b, c in zip(lines, lines[1:], lines[2:]))
            if word and h.get('level') == 1:
                head = lines[:3]
                cands = set(head) | {f'{a} {b}' for a, b in zip(head, head[1:])}
            if target in cands:
                found = i
                break
        if found is None:
            print(f'warning: heading not found: {h["title"]}', file=sys.stderr)
            continue
        result[h['id']] = found + 1
        cur = found
    print(json.dumps(result))


def merge(cover: str, body: str, out: str, title: str, author: str) -> None:
    w = PdfWriter()
    w.append(cover, import_outline=False)
    w.append(body, import_outline=True)
    w.add_metadata({'/Title': title, '/Author': author, '/Subject': "Beginner's guide to Socius", '/Creator': 'docs/guide/build-pdf.mjs'})
    w.page_mode = '/UseOutlines'
    w.compress_identical_objects(remove_duplicates=True, remove_unreferenced=True)
    with open(out, 'wb') as f:
        w.write(f)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'find-pages':
        find_pages(sys.argv[2], sys.argv[3], word='--from-start' in sys.argv)
    elif cmd == 'merge':
        merge(*sys.argv[2:7])
    else:
        sys.exit(f'unknown command {cmd}')
