#!/usr/bin/env python3
"""Import the dataset list of the Cybersecurity Observatory from the Excel file.

    python3 scripts/import_observatory.py "AI_Cybersecurity_Dataset_Observatory_Elenco_Semplificato.xlsx"

The first sheet must have three columns: dataset name, access/download URL and a
short description written as

    Dataset per <task>. Ambito: <domain>; dati: <formats separated by ;>.

Every row becomes a record of data/observatory.json. Records already in the file
keep what was added by hand (evidence state, family, paper, notes...): only name,
URL, task, domain and formats are refreshed from the spreadsheet. Records that are
no longer in the spreadsheet are dropped, except those found online and added by hand
("origin": "web"): they stay until they are removed from the JSON or added to the sheet. Run scripts/build_observatory.py afterwards
(or push: the workflow rebuilds the page).

Needs openpyxl (pip install openpyxl); the build script itself uses the standard library only.
"""
import json
import os
import re
import sys

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'observatory.json')
DESCRIPTION = re.compile(r'^Dataset per (?P<task>.*?)\. Ambito: (?P<domain>.*?); dati: (?P<data>.*?)\.?$', re.S)
REQUEST = re.compile(r'\.?\s*Accesso soggetto a richiesta', re.I)


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def parse(name, url, description):
    record = {'id': slug(name), 'name': name.strip(), 'url': (url or '').strip()}
    m = DESCRIPTION.match((description or '').strip())
    if not m:
        record.update(task='', domain='', data=[], description=(description or '').strip())
        return record
    formats = m['data']
    if REQUEST.search(formats):
        record['access'] = 'request'
        formats = REQUEST.sub('', formats)
    record.update(task=m['task'].strip(), domain=m['domain'].strip(),
                  data=[f.strip() for f in formats.split(';') if f.strip()])
    return record


def main(path):
    sheet = openpyxl.load_workbook(path, read_only=True, data_only=True).worksheets[0]
    rows = [r for r in list(sheet.iter_rows(values_only=True))[1:] if r and r[0]]
    with open(DATA, encoding='utf-8') as f:
        data = json.load(f)
    old = {r['id']: r for r in data.get('records', [])}
    records = []
    for name, url, description, *_ in rows:
        fresh = parse(str(name), url, description)
        kept = old.get(fresh['id'], {})
        if 'access' not in fresh and kept.get('access') == 'request':
            fresh['access'] = 'request'
        records.append({**kept, **fresh})
    ids = {r['id'] for r in records}
    kept_web = [r for r in data.get('records', []) if r.get('origin') == 'web' and r['id'] not in ids]
    data['records'] = records + kept_web
    with open(DATA, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    removed = len(set(old) - ids) - len(kept_web)
    print(f'{len(records)} records imported, {len(kept_web)} found online kept ({removed} removed)')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
