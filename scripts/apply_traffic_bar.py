#!/usr/bin/env python3
"""Add (or refresh) the TRAFFIC global bar on the historical sub-sites.

The sub-sites (MIRAGE, CloudSurf, D-ITG, Hynetd, workshops, ...) keep their own
look and local navigation; this script only inserts a thin, namespaced bar at
the top of <body> plus css/traffic-bar.css and js/traffic-bar.js. The bar is
static HTML, so the way back to TRAFFIC works without JavaScript.

Run from anywhere:  python3 scripts/apply_traffic_bar.py
It is idempotent: pages that already carry the bar are refreshed in place.
"""
import glob
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SUBSITES = [
    'mirage', 'cloudsurf',
    'genxnet2026', 'genxnet2025', 'aidcs2024', 'ICT4I40ws', 'IWNTA2021',
    'ADDITIONAL', 'XInternet', 'genai_prompts',
]
# Plain legacy pages that rely on the browser's default body margins.
# (D-ITG, Hynetd and Plab now use the layout of the site and are no longer sub-sites.)
FLUSH = ()
SKIP = {
    'software/ITG/images/png/images.html',  # auto-generated icon gallery, not a page
}

LINKS = [
    ('Home', 'index.html'),
    ('People', 'people.html'),
    ('Topics', 'index.html#topics'),
    ('Publications', 'publications.html'),
    ('News', 'news.html'),
    ('Collaborations', 'collaborations.html'),
    ('Visiting', 'visiting.html'),
]

FONT = 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400..700&amp;display=swap'
START, END = '<!-- TRAFFIC global bar:START -->', '<!-- TRAFFIC global bar:END -->'
HEAD_START, HEAD_END = '<!-- TRAFFIC global bar assets:START -->', '<!-- TRAFFIC global bar assets:END -->'


def bar(prefix, flush=False):
    modifier = ' tgb--flush' if flush else ''
    items = '\n'.join(f'          <li><a href="{prefix}{href}">{label}</a></li>' for label, href in LINKS)
    return f'''{START}
<div class="tgb{modifier}" id="traffic-global-bar">
  <div class="tgb__inner">
    <a class="tgb__home" href="{prefix}index.html" aria-label="TRAFFIC Research Group, home page">
      <svg class="tgb__arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 8H3.5M7.5 3.5 3 8l4.5 4.5"/></svg>
      <img class="tgb__seal" src="{prefix}images/traffic-mark-dark.svg" alt="" width="26" height="26">
      <span class="tgb__name"><b>TRAFFIC</b><span class="tgb__name-extra"> Research Group</span></span>
      <span class="tgb__uni">Universit&agrave; degli Studi di Napoli Federico II</span>
    </a>
    <nav class="tgb__nav" aria-label="TRAFFIC Research Group">
      <ul class="tgb__links">
{items}
      </ul>
      <details class="tgb__menu">
        <summary class="tgb__summary"><span class="tgb__sr">TRAFFIC </span>Menu<svg class="tgb__chevron" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 3.5 3 3 3-3"/></svg></summary>
        <div class="tgb__panel">
          <span class="tgb__panel-title">TRAFFIC Research Group</span>
          <ul>
{items}
          </ul>
        </div>
      </details>
    </nav>
  </div>
</div>
{END}
'''


def assets(prefix):
    return (f'{HEAD_START}\n<link rel="stylesheet" href="{FONT}">\n'
            f'<link rel="stylesheet" href="{prefix}css/traffic-bar.css">\n'
            f'<script src="{prefix}js/traffic-bar.js" defer></script>\n{HEAD_END}\n')


def apply(path):
    rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
    prefix = '../' * rel.count('/')
    raw = open(path, 'rb').read()
    # latin-1 round-trips every byte, so legacy encodings are preserved untouched.
    s = raw.decode('latin-1')
    # Blocks are LF-terminated and always start at a line start, so removal is exact
    # and no stray carriage returns are left in CRLF files.
    nl = '\n'
    s = re.sub(re.escape(HEAD_START) + r'.*?' + re.escape(HEAD_END) + r'\r?\n', '', s, flags=re.S)
    s = re.sub(re.escape(START) + r'.*?' + re.escape(END) + r'\r?\n', '', s, flags=re.S)
    head_close = re.search(r'</head\s*>', s, re.I)
    body_open = re.search(r'<body\b[^>]*>(\r?\n)?', s, re.I)
    if not head_close or not body_open:
        return False
    line_start = s.rfind('\n', 0, head_close.start()) + 1
    at = line_start if not s[line_start:head_close.start()].strip() else head_close.start()
    lead = '' if at == line_start else nl
    s = s[:at] + lead + assets(prefix) + s[at:]
    body_open = re.search(r'<body\b[^>]*>(\r?\n)?', s, re.I)
    lead = '' if body_open.group(1) else nl
    block = bar(prefix, rel.startswith(FLUSH))
    s = s[:body_open.end()] + lead + block + s[body_open.end():]
    new = s.encode('latin-1')
    if new != raw:
        open(path, 'wb').write(new)
    return True


def main():
    done, skipped = 0, []
    for site in SUBSITES:
        for path in sorted(glob.glob(os.path.join(ROOT, site, '**', '*.htm*'), recursive=True)):
            rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
            if rel in SKIP or os.path.getsize(path) == 0:
                continue
            if apply(path):
                done += 1
            else:
                skipped.append(rel)
    print(f'TRAFFIC bar applied to {done} pages')
    for rel in skipped:
        print('  skipped (no <head>/<body>):', rel)


if __name__ == '__main__':
    main()
