#!/usr/bin/env python3
"""Build the Datasets section of the Traffic site from data/datasets.json.

Generates datasets/index.html (overview of the MIRAGE datasets) and one page
per dataset (datasets/<slug>.html) with the site layout: header, menu and
footer are taken from collaborations.html. Every download button opens a short
form (js/datasets.js); the answers are sent to the Google Apps Script web app
set in "form_endpoint" and then the download starts. The dataset files stay on
the university server.

The original MIRAGE website in mirage/ is not touched.

Standard library only.
"""
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'datasets.json')
TEMPLATE = os.path.join(ROOT, 'collaborations.html')
OUT = os.path.join(ROOT, 'datasets')
PREFIX = '../'


def esc(text):
    return html.escape(str(text or ''), quote=True)


def local(url):
    """Links in the data are relative to the site root; pages live one folder down."""
    if not url or re.match(r'(https?:|mailto:|#|/)', url):
        return url
    return PREFIX + url


def ext(url):
    return ' target="_blank" rel="noopener"' if re.match(r'https?://', url or '') else ''


# --------------------------------------------------------------------------
# Page frame from an existing page of the site
# --------------------------------------------------------------------------

def frame(title, description, main):
    with open(TEMPLATE, encoding='utf-8') as f:
        page = f.read()
    head, rest = page.split('<main id="main">', 1)
    _, tail = rest.split('</main>', 1)
    # The template is a root page: point its relative links one folder up (the content is already right).
    up = lambda part: re.sub(r'(\s(?:href|src))="(?!https?:|//|/|#|mailto:|data:|\.\./)([^"]*)"',
                             lambda m: f'{m.group(1)}="{PREFIX}{m.group(2)}"', part)
    page = up(head) + '<main id="main">\n' + main + '\n  </main>' + up(tail)

    page = re.sub(r'<title>.*?</title>', f'<title>{esc(title)}</title>', page, count=1, flags=re.S)
    page = re.sub(r'<meta name="description" content="[^"]*">',
                  f'<meta name="description" content="{esc(description)}">', page, count=1)
    page = page.replace(' aria-current="page"', '')
    page = page.replace('class="nav-link">Datasets</a>', 'class="nav-link" aria-current="page">Datasets</a>')
    page = re.sub(r'(<script src="\.\./js/site\.js(?:\?v=[0-9a-f]*)?" defer></script>)',
                  lambda m: m.group(1) + f'\n  <script src="{PREFIX}js/datasets.js" defer></script>', page, count=1)
    return page


def hero(crumbs, title, lead=''):
    trail = ' <span class="crumb-sep" aria-hidden="true">/</span> '.join(
        f'<a href="{esc(href)}">{esc(label)}</a>' if href else f'<span>{esc(label)}</span>' for label, href in crumbs)
    lead_html = f'\n        <p class="page-lead">{esc(lead)}</p>' if lead else ''
    return f'''    <section class="page-hero">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">{trail}</nav>
        <h1 class="page-title">{esc(title)}</h1>{lead_html}
      </div>
    </section>'''


def download_button(ds, label='Download'):
    return (f'<button type="button" class="btn btn-primary" data-download="{esc(ds["file"])}" '
            f'data-dataset="{esc(ds["name"])}">{esc(label)}'
            + (f' <span class="btn-note">{esc(ds["size"])}</span>' if ds.get('size') else '') + '</button>')


def gate(data):
    """The form shown before every download (one per page, filled in by js/datasets.js)."""
    lic = data['license']
    return f'''
    <dialog class="gate" id="download-gate" data-endpoint="{esc(data.get('form_endpoint'))}" aria-labelledby="gate-title">
      <form class="gate-form" method="dialog" novalidate>
        <button type="button" class="gate-close" data-gate-close aria-label="Close">×</button>
        <p class="card-kicker">Download</p>
        <h2 id="gate-title" class="gate-title">Before downloading <span data-gate-dataset></span></h2>
        <p class="gate-intro">Please fill in the form below to download the dataset.</p>
        <div class="gate-grid">
          <label>First name *<input name="first_name" autocomplete="given-name" required></label>
          <label>Last name *<input name="last_name" autocomplete="family-name" required></label>
          <label class="gate-wide">Company, university or institution *<input name="organization" autocomplete="organization" required placeholder="Where you work or study"></label>
          <label>Nationality *<input name="nationality" list="gate-countries" autocomplete="country-name" required></label>
          <label><span>Email <small>(optional)</small></span><input name="email" type="email" autocomplete="email"></label>
        </div>
        <datalist id="gate-countries"></datalist>
        <label class="gate-check"><input type="checkbox" name="consent" required>
          <span>I will use the dataset under the <a href="{esc(lic['url'])}" target="_blank" rel="noopener">{esc(lic['short'])}</a> license
          and I agree that these details are stored by the Traffic research group only to keep statistics on dataset downloads.</span></label>
        <p class="gate-error" role="alert" hidden></p>
        <div class="gate-actions">
          <button type="submit" class="btn btn-primary">Download</button>
          <button type="button" class="btn btn-ghost" data-gate-close>Cancel</button>
        </div>
      </form>
    </dialog>'''


# --------------------------------------------------------------------------
# Pages
# --------------------------------------------------------------------------

def index_page(data):
    cards = []
    for ds in data['datasets']:
        facts = ''.join(f'<li><span>{esc(k)}</span> {esc(v)}</li>' for k, v in ds.get('facts', []))
        new = '<span class="tag tag-accent">New</span>' if ds.get('new') else ''
        cards.append(f'''          <article class="dataset-card">
            <a class="dataset-card-media" href="{esc(ds['slug'])}.html" tabindex="-1" aria-hidden="true"><img src="{esc(local(ds['image']))}" alt="" loading="lazy"></a>
            <div class="dataset-card-body">
              <div class="card-tags">{new}<span class="tag">{esc(data['license']['short'])}</span></div>
              <h2 class="dataset-card-title"><a href="{esc(ds['slug'])}.html">{esc(ds['name'])}</a></h2>
              <p>{esc(ds['summary'])}</p>
              <ul class="dataset-facts">{facts}</ul>
              <div class="dataset-actions">
                {download_button(ds)}
                <a href="{esc(ds['slug'])}.html" class="btn btn-ghost">Details</a>
              </div>
            </div>
          </article>''')
    main = f'''{hero([('Home', '../index.html'), ('Datasets', '')], 'Datasets', data['intro'])}

    <section class="section page-body">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title">MIRAGE datasets</h2>
          <p class="section-intro">Human-generated mobile-app traffic with ground truth, captured with the MIRAGE architecture.</p>
        </div>
        <div class="dataset-grid">
{chr(10).join(cards)}
        </div>
      </div>
    </section>

    <section class="section page-body section-alt">
      <div class="container">
        <div class="dataset-about">
          <div class="award">
            <svg class="award-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="16" cy="12" r="8.5"/><path d="M11 19 9 29l7-3 7 3-2-10"/><path d="m16 7 1.6 3.2 3.5.5-2.5 2.5.6 3.5L16 15l-3.2 1.7.6-3.5-2.5-2.5 3.5-.5Z"/></svg>
            <p><strong>Best Paper Award</strong> — {esc(data['award'].replace('The MIRAGE paper won the Best Paper Award at the ', ''))}</p>
          </div>
          <ul class="dataset-links">
            <li><a href="{esc(data['paper'])}" target="_blank" rel="noopener">Read the MIRAGE paper ↗</a></li>
            <li><a href="{esc(data['mailing_list'])}" target="_blank" rel="noopener">Join the MIRAGE mailing list ↗</a></li>
            <li><a href="mailto:{esc(data['contact'])}">Contact us about MIRAGE</a></li>
            <li><a href="../mirage/">Original MIRAGE website</a></li>
          </ul>
        </div>
      </div>
    </section>
{gate(data)}'''
    return frame('Datasets | Traffic', 'MIRAGE human-generated mobile-app traffic datasets released by the Traffic research group.', main)


def apps_table(apps):
    head = ''.join(f'<th scope="col">{esc(c)}</th>' for c in apps['columns'])
    rows = []
    for row in apps['rows']:
        cells = []
        for i, cell in enumerate(row):
            if isinstance(cell, dict):
                cells.append(f'<td><a href="{esc(cell["link"])}" target="_blank" rel="noopener">Google Play ↗</a></td>')
            elif i == 0:
                cells.append(f'<td><code>{esc(cell)}</code></td>')
            else:
                cells.append(f'<td>{esc(cell)}</td>')
        rows.append('              <tr>' + ''.join(cells) + '</tr>')
    return f'''          <div class="table-wrap">
            <table class="data-table">
              <thead><tr>{head}</tr></thead>
              <tbody>
{chr(10).join(rows)}
              </tbody>
            </table>
          </div>'''


def dataset_page(data, ds):
    lic = data['license']
    facts = ''.join(f'<div class="dataset-stat"><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>' for k, v in ds.get('facts', []))
    paragraphs = '\n'.join(f'          <p>{esc(p)}</p>' for p in ds['description'])
    c = ds['citation']
    links = ' '.join(f'<a href="{esc(local(link["url"]))}"{ext(link["url"])}>{esc(link["label"])}{" ↗" if ext(link["url"]) else ""}</a>'
                     for link in c.get('links', []))
    new = '<span class="tag tag-accent">New</span>' if ds.get('new') else ''
    main = f'''{hero([('Home', '../index.html'), ('Datasets', 'index.html'), (ds['name'], '')], ds['name'], ds['summary'])}

    <section class="section page-body">
      <div class="container">
        <div class="dataset-hero">
          <div class="dataset-hero-copy">
            <div class="card-tags">{new}<span class="tag">{esc(lic['short'])}</span></div>
{paragraphs}
            <div class="dataset-actions">
              {download_button(ds, 'Download the dataset')}
              <a href="#cite" class="btn btn-ghost">How to cite</a>
            </div>
          </div>
          <figure class="dataset-figure"><img src="{esc(local(ds['image']))}" alt="{esc(ds['name'])}"></figure>
        </div>
        <dl class="dataset-stats">{facts}</dl>
      </div>
    </section>

    <section class="section page-body section-alt" aria-labelledby="apps-title">
      <div class="container">
        <div class="section-head">
          <h2 id="apps-title" class="section-title">{esc(ds['apps_title'])}</h2>
          <p class="section-intro">{len(ds['apps']['rows'])} apps in the downloadable release.</p>
        </div>
{apps_table(ds['apps'])}
      </div>
    </section>

    <section class="section page-body" id="cite" aria-labelledby="cite-title">
      <div class="container two-col">
        <div>
          <h2 id="cite-title" class="section-title">How to cite</h2>
          <p>If you use {esc(ds['name'])} for scientific papers, academic lectures, project reports or technical documents,
          please help us increase its impact by citing:</p>
          <blockquote class="citation">
            <p>{esc(c['authors'])}, “{esc(c['title'])}”, <em>{esc(c['venue'])}</em>.</p>
            {f'<p class="citation-links">{links}</p>' if links else ''}
          </blockquote>
        </div>
        <aside class="openings">
          <p class="card-kicker">License</p>
          <p>{esc(ds['name'])} is released under a <a href="{esc(lic['url'])}" target="_blank" rel="noopener">{esc(lic['name'])}</a>.</p>
          <div class="openings-actions">{download_button(ds)}</div>
          <p class="openings-how"><a href="index.html">← All MIRAGE datasets</a></p>
        </aside>
      </div>
    </section>
{gate(data)}'''
    return frame(f'{ds["name"]} | Datasets | Traffic', ds['summary'], main)


def build():
    with open(DATA, encoding='utf-8') as f:
        data = json.load(f)
    os.makedirs(OUT, exist_ok=True)
    pages = {'index.html': index_page(data)}
    for ds in data['datasets']:
        pages[f'{ds["slug"]}.html'] = dataset_page(data, ds)
    for name, page in pages.items():
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
            f.write(page)
    return len(pages)


if __name__ == '__main__':
    print(f'Datasets section rebuilt: {build()} pages in datasets/')
