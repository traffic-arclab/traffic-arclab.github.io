#!/usr/bin/env python3
"""Download the logos of the apps listed in data/datasets.json into images/apps/.

Every logo is saved as images/apps/<key>.svg (or .png), where <key> is the app name in
lowercase letters and digits only (e.g. "Microsoft Teams" -> microsoftteams.svg), which is the
name scripts/build_datasets.py looks for. Sources, in order:

  1. Simple Icons (CC0), current release, then release 9 (it still has brands removed later,
     such as Skype, Slack and Microsoft Teams): drawn as an app icon, the brand colour as a
     rounded square with the symbol in white (black on light colours);
  2. the app icon shown on its Google Play page (saved as PNG), for apps without a brand logo.

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
SI_OLD = 'https://cdn.jsdelivr.net/npm/simple-icons@9/'
PLAY = 'https://play.google.com/store/apps/details?hl=en&id='
# App name (as in the datasets) -> Simple Icons slug, when the two differ
ALIASES = {'twitter': 'x', 'webexmeetings': 'webex', 'jitsimeet': 'jitsi'}
# Apps listed under two names share one file (keep in sync with SAME_LOGO in build_datasets.py)
SAME_LOGO = {'zoomcloudmeetings': 'zoom'}


def key(name):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD', name).lower())


def si_slug(title):
    title = title.replace('+', 'plus').replace('.', 'dot').replace('&', 'and')
    return key(title)


def fetch(url, binary=False):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=30) as response:
        body = response.read()
    return body if binary else body.decode('utf-8', 'ignore')


def play_icon(package):
    """The icon of the app's Google Play page, 96 px, or None if the app is no longer listed."""
    try:
        page = fetch(PLAY + package)
    except OSError:
        return None
    m = re.search(r'<meta property="og:image" content="([^"]+)"', page)
    return fetch(re.sub(r'=[^/]*$', '', m.group(1)) + '=s96', binary=True) if m else None


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
    apps = sorted({(row[1], row[0]) for ds in data['datasets'] for row in (ds.get('apps') or {}).get('rows', []) if len(row) > 1})
    sources = []   # (icon data, base url), newest first
    for base, path in ((SI, 'data/simple-icons.json'), (SI_OLD, '_data/simple-icons.json')):
        icons = json.loads(fetch(base + path))
        icons = icons.get('icons', icons) if isinstance(icons, dict) else icons
        sources.append(({(i.get('slug') or si_slug(i['title'])): i for i in icons}, base))
    os.makedirs(OUT, exist_ok=True)
    added, missing = [], []
    for name, package in apps:
        target = os.path.join(OUT, SAME_LOGO.get(key(name), key(name)))
        if os.path.exists(target + '.svg') or os.path.exists(target + '.png'):
            continue
        slug = ALIASES.get(key(name), key(name))
        brand = next(((icons[slug], base) for icons, base in sources if slug in icons), None)
        if brand:
            path = re.search(r'<path d="([^"]+)"', fetch(f'{brand[1]}icons/{slug}.svg')).group(1)
            with open(target + '.svg', 'w', encoding='utf-8') as f:
                f.write(tile(path, brand[0]['hex']))
            added.append(name)
            continue
        icon = play_icon(package) if package else None
        if icon:
            with open(target + '.png', 'wb') as f:
                f.write(icon)
            added.append(f'{name} (Google Play)')
        else:
            missing.append(name)
    print(f'Logos added: {len(added)}' + (f' ({", ".join(added)})' if added else ''))
    if missing:
        print(f'No logo found (shown with their initial): {", ".join(missing)}')


if __name__ == '__main__':
    main()
