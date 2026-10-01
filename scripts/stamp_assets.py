#!/usr/bin/env python3
"""Add a version to the links of the shared CSS and JS files in every page.

    <link rel="stylesheet" href="css/site.css?v=3f2a91c0">

The version is a short hash of the file content: when a stylesheet or a script
changes, its links change too and browsers download the new file instead of
showing the old one from their cache. Run it after editing css/ or js/ (the
"Build pages from data" workflow runs it on every push).

Standard library only.
"""
import hashlib
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = ['css/site.css', 'css/traffic-bar.css', 'js/site.js', 'js/theme-init.js', 'js/datasets.js',
          'js/traffic-bar.js', 'js/publications.js']
SKIP_DIRS = {'.git', '.github', 'data', 'scripts', 'node_modules'}


def versions():
    out = {}
    for asset in ASSETS:
        path = os.path.join(ROOT, asset)
        if os.path.exists(path):
            with open(path, 'rb') as f:
                out[asset] = hashlib.sha1(f.read()).hexdigest()[:8]
    return out


def stamp():
    vers = versions()
    pattern = re.compile(r'((?:href|src)="(?:\.\./)*)(' + '|'.join(re.escape(a) for a in vers) + r')(?:\?v=[0-9a-f]*)?"')
    changed = 0
    for folder, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if not name.endswith('.html'):
                continue
            path = os.path.join(folder, name)
            with open(path, 'rb') as f:
                raw = f.read()
            if not any(a.encode() in raw for a in vers):
                continue
            try:
                page = raw.decode('utf-8')
            except UnicodeDecodeError:
                continue
            updated = pattern.sub(lambda m: f'{m.group(1)}{m.group(2)}?v={vers[m.group(2)]}"', page)
            if updated != page:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(updated)
                changed += 1
    return changed


if __name__ == '__main__':
    print(f'Asset versions updated in {stamp()} pages')
