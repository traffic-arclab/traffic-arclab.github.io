#!/usr/bin/env python3
"""Rebuild the publication list of the Traffic group.

Every publication of the group is co-authored by Antonio Pescapè, so the list
is taken from OpenAlex filtering by his ORCID (this also catches the split
author profiles OpenAlex sometimes creates). Missing venue/volume/pages are
completed from Crossref. The hand-curated entries of the legacy site
(data/publications_legacy.json) are merged in: matching entries lend their
PDF link, the others are kept as they were. Finally the works found only on
Google Scholar (data/publications_scholar.json, curated by hand) are added
unless OpenAlex or the legacy list already has them.

Outputs:
  data/publications.json   normalised records
  publications.html        full list, grouped by year
  index.html               "Latest publications" block between markers

Standard library only: it runs as-is in GitHub Actions.
"""
import datetime
import difflib
import html
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

ORCID = '0000-0002-0221-7444'           # Antonio Pescapè
CONTACT = 'trafficarclab@gmail.com'      # polite-pool identification for the APIs
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LATEST_START = '<!-- LATEST-PUBLICATIONS:START -->'
LATEST_END = '<!-- LATEST-PUBLICATIONS:END -->'
LATEST_COUNT = 5

INCLUDED_TYPES = {
    'article': 'journal', 'review': 'journal', 'letter': 'journal',
    'conference-paper': 'conference', 'conference-abstract': 'conference', 'proceedings-article': 'conference',
    'book-chapter': 'book', 'book': 'book',
    'preprint': 'preprint',
}
CATEGORY_LABELS = {
    'journal': 'Journal', 'conference': 'Conference', 'book': 'Book chapter', 'preprint': 'Preprint',
    'other': 'Other',
}
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
          'August', 'September', 'October', 'November', 'December']
PARTICLES = {'de', 'di', 'da', 'del', 'della', 'dei', 'van', 'von', 'der', 'le', 'la', 'dos', 'du', 'des'}


# --------------------------------------------------------------------------
# Fetching
# --------------------------------------------------------------------------

def get_json(url, retries=3):
    req = urllib.request.Request(url, headers={'User-Agent': f'traffic-arclab-site/1.0 (mailto:{CONTACT})'})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as e:  # network hiccups: retry, then give up on this item
            if attempt == retries - 1:
                print(f'  ! {url[:90]}: {e}', file=sys.stderr)
                return None
            time.sleep(2 * (attempt + 1))


def fetch_openalex():
    works, cursor = [], '*'
    while cursor:
        q = urllib.parse.urlencode({'filter': f'authorships.author.orcid:{ORCID}', 'per_page': 200,
                                    'cursor': cursor, 'mailto': CONTACT})
        data = get_json(f'https://api.openalex.org/works?{q}')
        if data is None:
            sys.exit('OpenAlex is not reachable: keeping the current files.')
        works += data['results']
        cursor = data['meta'].get('next_cursor') if data['results'] else None
    return works


def fetch_crossref(doi):
    data = get_json(f'https://api.crossref.org/works/{urllib.parse.quote(doi)}?mailto={CONTACT}')
    return data['message'] if data else None


# --------------------------------------------------------------------------
# Normalisation
# --------------------------------------------------------------------------

def strip_accents(s):
    return unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode()


def norm_title(t):
    return re.sub(r'[^a-z0-9]', '', strip_accents(t).lower())


def clean_text(s):
    s = html.unescape(re.sub(r'<[^>]+>', '', s or ''))
    return re.sub(r'\s+', ' ', s).strip()


def short_name(full):
    """'Walter de Donato' -> 'W. de Donato', 'Kimberly C. Claffy' -> 'K. C. Claffy'."""
    tokens = clean_text(full).replace(',', ' ').split()
    if not tokens:
        return ''
    if tokens[0].isupper() and len(tokens[0]) > 2:           # 'PESCAPÈ ANTONIO'
        tokens = [t.capitalize() for t in tokens]
    if strip_accents(tokens[0]).lower().startswith('pescap'):  # 'Pescape Antonio'
        tokens = tokens[1:] + tokens[:1]
    split = len(tokens) - 1
    for i, t in enumerate(tokens[1:], 1):
        if t.lower() in PARTICLES:
            split = i
            break
    given, family = tokens[:split], tokens[split:]
    if strip_accents(family[-1]).lower().startswith('pescap'):
        family = ['Pescapè']

    def initial(g):
        return '-'.join(p[0].upper() + '.' for p in g.split('-') if p)
    return ' '.join([initial(g) for g in given] + family)


def pick_venue(w, cr):
    loc = w.get('primary_location') or {}
    src = loc.get('source') or {}
    if src.get('display_name') and src.get('type') != 'repository':
        return src['display_name']
    for loc in w.get('locations') or []:
        src = loc.get('source') or {}
        if src.get('display_name') and src.get('type') not in ('repository',):
            return src['display_name']
    if cr:
        for key in ('container-title', 'event'):
            v = cr.get(key)
            if isinstance(v, list) and v:
                return v[0]
            if isinstance(v, dict) and v.get('name'):
                return v['name']
    src = (w.get('primary_location') or {}).get('source') or {}
    return src.get('display_name') or ''


def to_record(w, cr):
    b = w.get('biblio') or {}
    first, last = b.get('first_page'), b.get('last_page')
    if cr and not first and cr.get('page'):
        first, _, last = cr['page'].partition('-')
    date = w.get('publication_date') or f"{w.get('publication_year')}-01-01"
    doi = (w.get('doi') or '').replace('https://doi.org/', '')
    oa = w.get('best_oa_location') or {}
    return {
        'id': w['id'].rsplit('/', 1)[-1],
        'title': clean_text(w.get('title') or w.get('display_name')),
        'authors': [short_name(a['author']['display_name']) for a in w.get('authorships', [])],
        'venue': clean_text(pick_venue(w, cr)),
        'volume': b.get('volume') or (cr or {}).get('volume') or '',
        'issue': b.get('issue') or (cr or {}).get('issue') or '',
        'pages': f'{first}-{last}' if first and last and first != last else (first or ''),
        'date': date,
        'year': int(date[:4]),
        'category': INCLUDED_TYPES[w['type']],
        'doi': doi,
        'url': f'https://doi.org/{doi}' if doi else (w.get('primary_location') or {}).get('landing_page_url') or '',
        'pdf': oa.get('pdf_url') or '',
        'source': 'openalex',
    }


def dedupe(records):
    """Same DOI or same title: keep the published version with the richest metadata."""
    def score(r):
        return (r['category'] != 'preprint', bool(r['venue']), bool(r['doi']), bool(r['pages']))
    best = {}
    for r in records:
        key = r['doi'].lower() or norm_title(r['title'])
        tkey = norm_title(r['title'])
        for k in (key, tkey):
            if k in best and score(best[k]) >= score(r):
                break
        else:
            best[key] = best[tkey] = r
    seen, out = set(), []
    for r in best.values():
        if id(r) not in seen:
            seen.add(id(r))
            out.append(r)
    return out


def merge_legacy(records):
    path = os.path.join(ROOT, 'data', 'publications_legacy.json')
    if not os.path.exists(path):
        return records
    by_title = {norm_title(r['title']): r for r in records}
    keys = list(by_title)
    for old in json.load(open(path, encoding='utf-8')):
        key = norm_title(old['title'])
        match = by_title.get(key)
        if not match and key:
            close = difflib.get_close_matches(key, keys, n=1, cutoff=0.9)
            match = by_title[close[0]] if close else None
        pdf = next((l for l in old['links'] if l.lower().endswith('.pdf')), '')
        if match:
            if pdf and not match['pdf']:
                match['pdf'] = pdf
            continue
        records.append({
            'id': 'legacy-' + (key[:40] or str(len(records))), 'title': old['title'], 'authors': [], 'venue': '',
            'volume': '', 'issue': '', 'pages': '', 'date': f"{old['year'] or 1900}-01-01",
            'year': old['year'] or 0, 'category': old['category'], 'doi': '', 'url': '', 'pdf': '',
            'source': 'legacy', 'html': old['html'],
        })
    return records


def merge_scholar(records):
    path = os.path.join(ROOT, 'data', 'publications_scholar.json')
    if not os.path.exists(path):
        return records
    keys = [norm_title(r['title']) for r in records]
    dois = {r['doi'].lower() for r in records if r['doi']}
    for r in json.load(open(path, encoding='utf-8')):
        key = norm_title(r['title'])
        if (r['doi'] and r['doi'].lower() in dois) or key in keys or \
                difflib.get_close_matches(key, keys, n=1, cutoff=0.9):
            continue
        records.append(r)
    return records


# --------------------------------------------------------------------------
# Rendering
# --------------------------------------------------------------------------

def esc(s):
    return html.escape(s or '', quote=True)


def when(r):
    y, m = r['date'][:4], int(r['date'][5:7] or 1)
    return f'{MONTHS[m - 1]} {y}' if r['date'][5:10] != '01-01' else y


def citation(r):
    if r['source'] == 'legacy':
        return r['html']
    title = f'<a href="{esc(r["url"])}">{esc(r["title"])}</a>' if r['url'] else esc(r['title'])
    parts = [esc(', '.join(r['authors'])), f'&ldquo;{title}&rdquo;']
    if r['venue']:
        parts.append(f'<i>{esc(r["venue"])}</i>')
    if r['volume']:
        parts.append(f'Vol. {esc(r["volume"])}')
    if r['issue']:
        parts.append(f'No. {esc(r["issue"])}')
    if r['pages']:
        parts.append(f'pp. {esc(r["pages"])}')
    parts.append(esc(when(r)))
    out = ', '.join(p for p in parts if p) + '.'
    if r['pdf']:
        out += f' <a class="pub-pdf" href="{esc(r["pdf"])}">PDF</a>'
    return out


def template():
    s = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    head, rest = s.split('<main id="main">', 1)
    foot = rest.split('</main>', 1)[1]
    head = head.replace(' aria-current="page"', '').replace('href="#topics"', 'href="index.html#topics"')
    head = head.replace('<a href="publications.html" class="nav-link">',
                        '<a href="publications.html" class="nav-link" aria-current="page">')
    head = re.sub(r'<title>.*?</title>', '<title>Publications | Traffic</title>', head, flags=re.S)
    head = re.sub(r'<meta name="description" content="[^"]*">',
                  '<meta name="description" content="Publications of the Traffic research group, '
                  'University of Napoli Federico II.">', head)
    return head, foot.replace('href="#topics"', 'href="index.html#topics"')


def render_page(records, updated):
    head, foot = template()
    years = sorted({r['year'] for r in records if r['year']}, reverse=True)
    counts = {c: sum(1 for r in records if r['category'] == c) for c in CATEGORY_LABELS}
    filters = ''.join(f'<button type="button" class="pub-filter" data-cat="{c}" aria-pressed="false">'
                      f'{CATEGORY_LABELS[c]}s <span>{counts[c]}</span></button>'
                      for c in CATEGORY_LABELS if counts[c])
    groups = []
    for y in years:
        items = sorted((r for r in records if r['year'] == y), key=lambda r: r['date'], reverse=True)
        lis = '\n'.join(f'            <li class="pub" data-cat="{r["category"]}">'
                        f'<span class="pub-kind">{CATEGORY_LABELS[r["category"]]}</span> {citation(r)}</li>'
                        for r in items)
        groups.append(f'''        <section class="pub-year" id="y{y}" data-year="{y}">
          <h2>{y}</h2>
          <ol class="pub-list">
{lis}
          </ol>
        </section>''')
    jump = ' '.join(f'<a href="#y{y}">{y}</a>' for y in years)
    main = f'''<main id="main">

    <section class="page-hero">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> <span class="crumb-sep" aria-hidden="true">/</span> <span>Publications</span></nav>
        <h1 class="page-title">Publications</h1>
        <p class="page-intro">{len(records)} publications, updated automatically every week from
          <a href="https://openalex.org/">OpenAlex</a> and <a href="https://www.crossref.org/">Crossref</a>.
          Last update: {updated}. (ACM/IEEE and other copyrights where applicable.)</p>
      </div>
    </section>

    <section class="section page-body">
      <div class="container">
        <div class="pub-tools">
          <label class="visually-hidden" for="pub-search">Search publications</label>
          <input id="pub-search" type="search" placeholder="Search by title, author, venue…" autocomplete="off">
          <div class="pub-filters" role="group" aria-label="Filter by type">{filters}</div>
          <button id="pub-clear" class="pub-clear" type="button" hidden>Clear filters</button>
          <p class="pub-count" aria-live="polite"></p>
        </div>
        <p class="pub-empty" hidden>No publications match your search. Try another term or clear the filters.</p>
        <nav class="pub-jump" aria-label="Years">{jump}</nav>
{chr(10).join(groups)}
      </div>
    </section>

  </main>'''
    script = '  <script src="js/publications.js" defer></script>\n</head>'
    head = head.replace('</head>', script, 1)
    return head + main + foot


def render_latest(records):
    today = datetime.date.today().isoformat()
    pool = [r for r in records if r['source'] == 'openalex' and r['category'] != 'preprint'
            and r['date'] <= today and r['url']]
    latest = sorted(pool, key=lambda r: r['date'], reverse=True)[:LATEST_COUNT]
    cards = []
    for r in latest:
        authors = ', '.join(r['authors'])
        month = MONTHS[int(r['date'][5:7]) - 1][:3] if r['date'][5:10] != '01-01' else ''
        cards.append(f'''          <li>
            <a class="pub-card" href="{esc(r["url"])}">
              <span class="pub-card-date"><span class="pub-card-month">{month}</span><span class="pub-card-year">{r["year"]}</span></span>
              <span class="pub-card-body">
                <span class="pub-card-kind">{CATEGORY_LABELS[r["category"]]}</span>
                <span class="pub-card-title">{esc(r["title"])}</span>
                <span class="pub-card-venue">{esc(r["venue"])}</span>
                <span class="pub-card-authors">{esc(authors)}</span>
              </span>
            </a>
          </li>''')
    return f'''{LATEST_START}
    <section class="section section-latest" aria-labelledby="latest-title">
      <div class="container">
        <div class="section-head">
          <h2 id="latest-title" class="section-title">Latest publications</h2>
          <a href="publications.html" class="section-more">All publications →</a>
        </div>
        <ol class="latest-pubs">
{chr(10).join(cards)}
        </ol>
      </div>
    </section>
    {LATEST_END}'''


def update_home(records):
    path = os.path.join(ROOT, 'index.html')
    s = open(path, encoding='utf-8').read()
    block = render_latest(records)
    if LATEST_START in s:
        s = re.sub(re.escape(LATEST_START) + r'.*?' + re.escape(LATEST_END), lambda _: block, s, flags=re.S)
    else:  # first run: right after the Highlights section
        anchor = '    <!-- Research topics -->'
        s = s.replace(anchor, f'    <!-- Latest publications (generated by scripts/update_publications.py) -->\n    {block}\n\n{anchor}', 1)
    open(path, 'w', encoding='utf-8').write(s)


# --------------------------------------------------------------------------

def main():
    works = [w for w in fetch_openalex() if w.get('type') in INCLUDED_TYPES]
    print(f'OpenAlex: {len(works)} works')
    enriched = 0
    records = []
    for w in works:
        cr = None
        if w.get('doi') and not pick_venue(w, None):
            cr = fetch_crossref(w['doi'].replace('https://doi.org/', ''))
            enriched += cr is not None
            time.sleep(0.1)
        records.append(to_record(w, cr))
    print(f'Crossref: {enriched} records completed')
    records = merge_scholar(merge_legacy(dedupe(records)))
    records.sort(key=lambda r: (r['date'], r['title']), reverse=True)
    print(f'Total after de-duplication and legacy merge: {len(records)}')

    data = os.path.join(ROOT, 'data', 'publications.json')
    if os.path.exists(data) and json.load(open(data, encoding='utf-8')) == records and '--force' not in sys.argv:
        print('No changes.')
        return
    os.makedirs(os.path.dirname(data), exist_ok=True)
    json.dump(records, open(data, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    updated = datetime.date.today().strftime('%d %B %Y')
    open(os.path.join(ROOT, 'publications.html'), 'w', encoding='utf-8').write(render_page(records, updated))
    update_home(records)


if __name__ == '__main__':
    main()
