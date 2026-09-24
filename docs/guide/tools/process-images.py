"""Shrink and compress the raw guide screenshots into public/guide/img/.

    python docs/guide/tools/process-images.py [--raw /tmp/guide-agent/raw] [--out public/guide/img]

Only pictures referenced in docs/guide/guide.md are written. Screenshots are captured at device scale factor 2. Each image is scaled so it is at most
MAX_W pixels wide (about twice the width it is shown at on the web page, so it stays sharp on
high-density screens and in the PDF), then saved as an optimised 256-colour PNG. Interface
screenshots have few colours, so this is smaller than JPEG and keeps text crisp.
Needs Pillow.
"""
import argparse
import glob
import os
import re

from PIL import Image

MAX_W = 1600      # full-width pictures (screens, output tables)
MAX_W_SMALL = 900  # menus and small dialogs are shown smaller on the page

SMALL = {'file-menu', 'help-menu', 'save-menu', 'export-menu', 'missing-values', 'weight-chip', 'coders', 'ai-menu', 'ai-chip', 'assistant-see'}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--raw', default='/tmp/guide-agent/raw')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', '..', '..', 'public', 'guide', 'img'))
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    # Only the pictures the guide uses (the capture script takes a few spares).
    guide = open(os.path.join(os.path.dirname(__file__), '..', 'guide.md'), encoding='utf-8').read()
    used = set(re.findall(r'\(img/([\w-]+)\.png\)', guide))
    total = 0
    for f in sorted(glob.glob(os.path.join(a.raw, '*.png'))):
        name = os.path.splitext(os.path.basename(f))[0]
        if name.startswith('_') or name not in used:
            continue
        im = Image.open(f).convert('RGB')
        w, h = im.size
        cap = MAX_W_SMALL if name in SMALL else MAX_W
        if w > cap:
            im = im.resize((cap, round(h * cap / w)), Image.LANCZOS)
        q = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        dest = os.path.join(a.out, name + '.png')
        q.save(dest, 'PNG', optimize=True)
        size = os.path.getsize(dest)
        total += size
        print(f'{name:24s} {im.size[0]:5d} x {im.size[1]:5d}  {size // 1024:4d} KB')
    print(f'total {total / 1024 / 1024:.2f} MB')


if __name__ == '__main__':
    main()
