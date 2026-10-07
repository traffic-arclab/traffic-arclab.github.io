#!/usr/bin/env python3
"""Download the logos of the apps listed in data/datasets.json into images/apps/.

Every logo is saved as images/apps/<key>.svg, where <key> is the app name in lowercase
letters and digits only (e.g. "Microsoft Teams" -> microsoftteams.svg), which is the name
scripts/build_datasets.py looks for. Logos come from Simple Icons (CC0) and are drawn as an
app icon: the brand colour as a rounded square with the symbol in white (black on light colours).
Existing files are kept, so a logo can be replaced by hand. Apps without a logo are shown
with their initial.

Run it after adding a dataset with new apps:  python3 scripts/fetch_app_logos.py
Standard library only.
"""
import json
import os
import re
import unicodedata
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'datasets.json')
OUT = os.path.join(ROOT, 'images', 'apps')
SI = 'https://cdn.jsdelivr.net/npm/simple-icons@16/'
# App name (as in the datasets) -> Simple Icons slug, when the two differ
ALIASES = {'twitter': 'x', 'webexmeetings': 'webex', 'jitsimeet': 'jitsi'}
# Apps listed under two names share one file (keep in sync with SAME_LOGO in build_datasets.py)
SAME_LOGO = {'zoomcloudmeetings': 'zoom'}


def key(name):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD', name).lower())


def si_slug(title):
    title = title.replace('+', 'plus').replace('.', 'dot').replace('&', 'and')
    return key(title)


def fetch(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read().decode('utf-8')


def light(hex_colour):
    r, g, b = (int(hex_colour[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 170


def tile(path, colour):
    glyph = '#111111' if light(colour) else '#ffffff'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">'
            f'<rect width="48" height="48" rx="12" fill="#{colour}"/>'
            f'<g transform="translate(12 12)"><path fill="{glyph}" d="{path}"/></g></svg>\n')


def main():
    with open(DATA, encoding='utf-8') as f:
        data = json.load(f)
    apps = sorted({row[1] for ds in data['datasets'] for row in (ds.get('apps') or {}).get('rows', []) if len(row) > 1})
    icons = {(i.get('slug') or si_slug(i['title'])): i for i in json.loads(fetch(SI + 'data/simple-icons.json'))}
    os.makedirs(OUT, exist_ok=True)
    added, missing = [], []
    for name in apps:
        target = os.path.join(OUT, SAME_LOGO.get(key(name), key(name)) + '.svg')
        if os.path.exists(target):
            continue
        slug = ALIASES.get(key(name), key(name))
        if slug not in icons:
            missing.append(name)
            continue
        path = re.search(r'<path d="([^"]+)"', fetch(f'{SI}icons/{slug}.svg')).group(1)
        with open(target, 'w', encoding='utf-8') as f:
            f.write(tile(path, icons[slug]['hex']))
        added.append(name)
    print(f'Logos added: {len(added)}' + (f' ({", ".join(added)})' if added else ''))
    if missing:
        print(f'No logo found (shown with their initial): {", ".join(missing)}')


if __name__ == '__main__':
    main()
