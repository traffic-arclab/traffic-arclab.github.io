#!/usr/bin/env python3
"""Move the download of a MIRAGE dataset to Zenodo.

Two ways to use it, both of which end by writing the Zenodo download link and
DOI of the dataset into data/datasets.json (then rebuild with
python3 scripts/build_datasets.py, or just push):

1. Copy the file to Zenodo (nothing is deleted from the university server):

     export ZENODO_TOKEN=...      # zenodo.org -> Settings -> Applications -> Personal access token
                                  # scopes: deposit:write and deposit:actions
     python3 scripts/zenodo_upload.py upload mirage-genai-2025

   With no path, the file is streamed from its current address ("file" in
   data/datasets.json) straight to Zenodo, without saving it on disk. A local
   path or another URL can be given after the slug instead.

   It creates a draft on Zenodo with title, description, authors, keywords and
   license taken from data/datasets.json, uploads the file and prints the link
   of the draft: check it on Zenodo and press Publish there, or add --publish
   to publish straight away (a published record cannot be deleted, only given
   new versions). The site is updated only once the record is published.

2. The dataset is already on Zenodo (uploaded by hand from the web site):

     python3 scripts/zenodo_upload.py link mirage-genai-2025 1234567

   where 1234567 is the number in the record URL (zenodo.org/records/1234567).
   No token is needed for a public record.

Add --sandbox to try everything on sandbox.zenodo.org first (it needs its own token).

Standard library only.
"""
import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'datasets.json')
AFFILIATION = 'University of Napoli Federico II'
LICENSES = {'CC BY-NC-ND 4.0': 'cc-by-nc-nd-4.0'}   # site "short" name -> Zenodo license id


class Zenodo:
    def __init__(self, sandbox, token=None):
        self.base = 'https://sandbox.zenodo.org' if sandbox else 'https://zenodo.org'
        self.token = token

    def call(self, method, url, body=None, headers=None):
        if not url.startswith('http'):
            url = self.base + url
        headers = dict(headers or {})
        if self.token:
            headers['Authorization'] = 'Bearer ' + self.token
        if isinstance(body, (dict, list)):
            body = json.dumps(body).encode()
            headers['Content-Type'] = 'application/json'
        request = urllib.request.Request(url, data=body, method=method, headers=headers)
        try:
            with urllib.request.urlopen(request) as response:
                text = response.read().decode()
        except urllib.error.HTTPError as error:
            sys.exit(f'Zenodo answered {error.code} to {method} {url}:\n{error.read().decode()[:2000]}')
        return json.loads(text) if text else {}


class Progress:
    """Local file or URL that prints how much of it has been sent (http.client reads it in blocks)."""

    def __init__(self, source):
        if re.match(r'https?://', source):
            self.file = urllib.request.urlopen(source)
            self.size = int(self.file.headers.get('Content-Length') or 0)
            if not self.size:
                sys.exit(f'{source} does not say how big it is: download it and pass the local path.')
            self.name = urllib.request.unquote(urllib.parse.urlparse(self.file.url).path.rsplit('/', 1)[-1])
        else:
            if not os.path.isfile(source):
                sys.exit(f'File not found: {source}')
            self.file = open(source, 'rb')
            self.size = os.path.getsize(source)
            self.name = os.path.basename(source)
        self.sent = 0
        self.shown = -1

    def read(self, n=-1):
        chunk = self.file.read(n)
        self.sent += len(chunk)
        percent = self.sent * 100 // max(self.size, 1)
        if percent != self.shown:
            self.shown = percent
            print(f'\r  uploading... {percent}% of {human(self.size)}', end='', flush=True)
        return chunk


def human(size):
    for unit in ('B', 'KB', 'MB', 'GB', 'TB'):
        if size < 1024 or unit == 'TB':
            return f'{size:.1f} {unit}'.replace('.0 ', ' ') if unit in ('GB', 'TB') else f'{size:.0f} {unit}'
        size /= 1024


def load():
    with open(DATA, encoding='utf-8') as f:
        return json.load(f)


def find(data, slug):
    for ds in data['datasets']:
        if ds['slug'] == slug:
            return ds
    sys.exit(f'No dataset "{slug}" in data/datasets.json. Known: ' + ', '.join(d['slug'] for d in data['datasets']))


def save(data, slug, url, doi, record_url, size):
    ds = find(data, slug)
    ds['file'] = url
    ds['zenodo'] = {'doi': doi, 'record': record_url}
    ds['size'] = size
    with open(DATA, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'data/datasets.json updated for {slug}:\n  file: {url}\n  DOI:  {doi}\n'
          'Rebuild with python3 scripts/build_datasets.py (or push: the workflow does it).')


def metadata(data, ds):
    """Zenodo metadata from the data of the site page."""
    authors = [a.strip() for a in ds['citation']['authors'].split(',') if a.strip()]
    creators = [{'name': f'{a.rsplit(" ", 1)[1]}, {a.rsplit(" ", 1)[0]}' if ' ' in a else a,
                 'affiliation': AFFILIATION} for a in authors]
    paragraphs = ''.join(f'<p>{p}</p>' for p in ds['description'])
    c = ds['citation']
    cite = f'<p>If you use {ds["name"]}, please cite: {c["authors"]}, "{c["title"]}", {c["venue"]}.</p>'
    meta = {
        'upload_type': 'dataset',
        'title': ds['name'],
        'creators': creators,
        'description': f'<p>{ds["summary"]}</p>{paragraphs}{cite}',
        'access_right': 'open',
        'license': LICENSES.get(data['license']['short'], 'cc-by-nc-nd-4.0'),
        'keywords': ['MIRAGE', 'mobile traffic', 'traffic classification', 'network traffic dataset', 'Android'],
        'prereserve_doi': True,
    }
    related = [{'identifier': link['url'], 'relation': 'isDocumentedBy', 'resource_type': 'publication-article'}
               for link in c.get('links', []) if 'doi.org/' in link['url']]
    if related:
        meta['related_identifiers'] = related
    return meta


def file_link(base, record_id, name):
    return f'{base}/records/{record_id}/files/{urllib.request.quote(name)}?download=1'


def upload(args):
    token = os.environ.get('ZENODO_TOKEN')
    if not token:
        sys.exit('Set ZENODO_TOKEN first (zenodo.org -> Settings -> Applications -> Personal access token).')
    data = load()
    ds = find(data, args.slug)
    if ds.get('zenodo') and not args.path:
        sys.exit(f'{ds["name"]} is already on Zenodo ({ds["zenodo"]["record"]}).')
    source = args.path or ds['file']
    zenodo = Zenodo(args.sandbox, token)

    if args.draft:   # resume into a draft left by an interrupted upload
        draft = zenodo.call('GET', f'/api/deposit/depositions/{args.draft}')
    else:
        print(f'Creating the Zenodo draft for {ds["name"]}...')
        draft = zenodo.call('POST', '/api/deposit/depositions', {'metadata': metadata(data, ds)})
    for attempt in range(1, 4):   # big files sometimes lose the connection: start the file again
        body = Progress(source)
        try:
            zenodo.call('PUT', f'{draft["links"]["bucket"]}/{urllib.request.quote(body.name)}', body,
                        {'Content-Type': 'application/octet-stream', 'Content-Length': str(body.size)})
            break
        except (urllib.error.URLError, OSError) as error:
            print(f'\n  attempt {attempt} failed after {human(body.sent)}: {error}')
            if attempt == 3:
                sys.exit(f'Upload failed. Try again later with: python3 scripts/zenodo_upload.py upload {args.slug} --draft {draft["id"]}')
    name = body.name
    print()
    doi = draft['metadata']['prereserve_doi']['doi']
    if not args.publish:
        print(f'Draft ready: {draft["links"]["html"]}\nReserved DOI: {doi}\n'
              f'Check it and press Publish on Zenodo, then run:\n'
              f'  python3 scripts/zenodo_upload.py link {args.slug} {draft["id"]}' + (' --sandbox' if args.sandbox else ''))
        return
    record = zenodo.call('POST', f'/api/deposit/depositions/{draft["id"]}/actions/publish')
    save(data, args.slug, file_link(zenodo.base, record['id'], name), record['doi'],
         f'{zenodo.base}/records/{record["id"]}', human(body.size))


def link(args):
    data = load()
    find(data, args.slug)
    zenodo = Zenodo(args.sandbox, os.environ.get('ZENODO_TOKEN'))
    record = zenodo.call('GET', f'/api/records/{args.record}')
    files = record.get('files') or []
    if isinstance(files, dict):            # some API versions wrap them as {"entries": {...}}
        files = list(files.get('entries', {}).values())
    if not files:
        sys.exit('The record has no public files (is it published and open access?).')
    if args.file:
        files = [f for f in files if f.get('key') == args.file] or sys.exit(f'No file "{args.file}" in the record.')
    elif len(files) > 1:
        sys.exit('The record has several files, choose one with --file: ' + ', '.join(f['key'] for f in files))
    f = files[0]
    save(data, args.slug, file_link(zenodo.base, record['id'], f['key']), record['doi'],
         f'{zenodo.base}/records/{record["id"]}', human(f['size']))


def main():
    parser = argparse.ArgumentParser(description='Move the download of a MIRAGE dataset to Zenodo.')
    parser.add_argument('--sandbox', action='store_true', help='use sandbox.zenodo.org (for tests)')
    sub = parser.add_subparsers(dest='command', required=True)
    up = sub.add_parser('upload', help='upload a file as a new Zenodo record')
    up.add_argument('slug', help='dataset slug in data/datasets.json, e.g. mirage-genai-2025')
    up.add_argument('path', nargs='?', help='local file or URL to upload (default: the current download link)')
    up.add_argument('--publish', action='store_true', help='publish right away instead of leaving a draft')
    up.add_argument('--draft', help='number of an existing draft to upload into (after an interrupted upload)')
    ln = sub.add_parser('link', help='use a record already published on Zenodo')
    ln.add_argument('slug', help='dataset slug in data/datasets.json')
    ln.add_argument('record', help='record number, as in zenodo.org/records/<number>')
    ln.add_argument('--file', help='file name, when the record has more than one')
    for p in (up, ln):   # accept --sandbox after the subcommand too
        p.add_argument('--sandbox', action='store_true', default=argparse.SUPPRESS)
    args = parser.parse_args()
    upload(args) if args.command == 'upload' else link(args)


if __name__ == '__main__':
    main()
