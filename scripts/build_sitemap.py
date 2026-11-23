#!/usr/bin/env python3
"""Write sitemap.xml: every public page of the site, with the date its content last changed.

    <url><loc>https://traffic-arclab.github.io/observatory/</loc><lastmod>2026-11-23</lastmod></url>

The pages are the HTML files in the repository that have the layout of the site (js/theme-init.js) or the
TRAFFIC bar of the older sub-sites (js/traffic-bar.js), except the ones that ask search engines not to index
them, the redirects, and the folders closed in robots.txt (admin/, Tools/).

"lastmod" is the day of the last commit that changed the content of the page: the commits that only update
the versions of the shared CSS and JS links (scripts/stamp_assets.py touches every page) are not counted,
otherwise every page would look changed on the same day. A page changed in the working tree and not yet
committed (a build in progress) gets today's date. Run it after the other builds (the workflow does).

Standard library only.
"""
import datetime
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://traffic-arclab.github.io/'
OUT = os.path.join(ROOT, 'sitemap.xml')
CLOSED = ('admin/', 'Tools/')                       # Disallow in robots.txt
LAYOUT = ('js/theme-init.js', 'js/traffic-bar.js')  # pages of the site, not loose files
STAMP = re.compile(r'\?v=[0-9a-f]+')
FIRST = ['', 'observatory/', 'observatory/changelog.html']   # listed first, then the rest in alphabetical order


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout


def pages():
    out = []
    for path in git('ls-files', '*.html').splitlines():
        name = os.path.basename(path)
        if path.startswith(CLOSED) or name.startswith(('_', 'google')):
            continue
        try:
            with open(os.path.join(ROOT, path), encoding='utf-8') as f:
                page = f.read()
        except (OSError, UnicodeDecodeError):
            continue
        if not any(a in page for a in LAYOUT):
            continue
        if re.search(r'<meta[^>]+name="robots"[^>]+noindex', page) or 'http-equiv="refresh"' in page:
            continue
        out.append(path)
    return out


def real_change(patch):
    """True when a patch (git diff -U0) changes more than the asset versions."""
    removed, added = [], []
    for line in patch.splitlines():
        if line.startswith(('---', '+++')):
            continue
        if line.startswith('-'):
            removed.append(STAMP.sub('', line[1:]))
        elif line.startswith('+'):
            added.append(STAMP.sub('', line[1:]))
    return sorted(removed) != sorted(added)


def lastmod(path):
    if real_change(git('diff', '-U0', 'HEAD', '--', path)):
        return datetime.date.today().isoformat()
    log = git('log', '-n', '60', '--format=@@commit %cs', '-U0', '--', path)
    day = ''
    for block in log.split('@@commit ')[1:]:
        day, _, patch = block.partition('\n')
        if real_change(patch):
            return day
    return day or datetime.date.today().isoformat()


def url(path):
    return SITE + (path[:-len('index.html')] if path.endswith('index.html') else path)


def build():
    entries = sorted(((url(p), lastmod(p)) for p in pages()),
                     key=lambda e: (FIRST.index(e[0][len(SITE):]) if e[0][len(SITE):] in FIRST else len(FIRST), e[0]))
    xml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, day in entries:
        xml += ['  <url>', f'    <loc>{loc}</loc>', f'    <lastmod>{day}</lastmod>', '  </url>']
    xml.append('</urlset>')
    text = '\n'.join(xml) + '\n'
    old = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
    if text != old:
        with open(OUT, 'w', encoding='utf-8') as f:
            f.write(text)
    return len(entries), text != old


if __name__ == '__main__':
    n, changed = build()
    print(f'sitemap.xml: {n} pages' + ('' if changed else ' (unchanged)'))
