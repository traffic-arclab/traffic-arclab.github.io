#!/usr/bin/env python3
"""Local editor for the People, News, research Topics and Collaborations of the Traffic group.

    python3 scripts/people_admin.py          # then open http://localhost:8765

Serves the editor in admin/people/ (the same page that, online, commits to
GitHub) together with the site itself, so the preview works at
http://localhost:8765/people.html. Saving writes data/people.json,
data/news.json, data/topics.json, data/collaborations.json, data/workshops.json,
data/datasets.json and the new photos (cropped and resized in
the browser to 600x720 JPEG, saved in images/pictures/) and rebuilds the pages
through scripts/build_people.py, build_news.py, build_topics.py and
build_collaborations.py.
Nothing is committed or pushed. The server only listens on 127.0.0.1.

Standard library only.
"""
import base64
import functools
import http.server
import json
import os
import re
import sys

sys.dont_write_bytecode = True  # keep scripts/ free of __pycache__
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_collaborations  # noqa: E402
import build_datasets  # noqa: E402
import build_news  # noqa: E402
import build_people  # noqa: E402
import build_topics  # noqa: E402
import build_workshops  # noqa: E402
import stamp_assets  # noqa: E402

ROOT = build_people.ROOT
PHOTOS = os.path.join(ROOT, 'images', 'pictures')
LOGOS = os.path.join(ROOT, 'images', 'logos')
DATASET_IMAGES = os.path.join(ROOT, 'images', 'datasets')
PORT = int(os.environ.get('PORT', 8765))
FIELDS = ('name', 'role', 'photo', 'affiliation', 'phone', 'emails', 'homepage', 'scholar')


def clean_person(raw):
    person = {key: raw.get(key, '') for key in FIELDS}
    for key in FIELDS:
        if key == 'emails':
            emails = raw.get('emails') or []
            person['emails'] = [e.strip() for e in emails if isinstance(e, str) and e.strip()]
        else:
            person[key] = str(person[key] or '').strip()
    if not person['name']:
        raise ValueError('every person needs a name')
    for key in ('homepage', 'scholar'):
        if person[key] and not re.match(r'https?://', person[key]):
            raise ValueError(f'{person["name"]}: {key} must start with http:// or https://')
    return person


MONTHS = build_news.MONTHS


def clean_news(raw):
    items = []
    for item in raw.get('news') or []:
        text = ' '.join(str(item.get('text') or '').split())
        year, month = item.get('year'), item.get('month')
        if not text:
            raise ValueError('every news item needs a text')
        if not isinstance(year, int) or not 1990 <= year <= 2100:
            raise ValueError(f'"{text[:40]}...": the year is not valid')
        if month not in MONTHS:
            raise ValueError(f'"{text[:40]}...": choose a month')
        items.append({'year': year, 'month': month, 'text': text})
    return {'news': sorted(items, key=build_news.sort_key)}


def clean_topics(raw):
    def link(value, what):
        value = str(value or '').strip()
        if re.search(r'\s', value):
            raise ValueError(f'{what}: the link must not contain spaces')
        return value

    def one(value):
        return re.sub(r'\s+', ' ', str(value or '')).strip()

    areas, slugs = [], set()
    for area in raw.get('areas') or []:
        title = one(area.get('title'))
        if not title:
            raise ValueError('every area needs a title')
        topics = []
        for topic in area.get('topics') or []:
            name = one(topic.get('name'))
            if not name:
                raise ValueError(f'{title}: every topic needs a name')
            slug = str(topic.get('slug') or '')
            if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', slug) or slug in slugs:
                raise ValueError(f'{name}: the page address is missing, not valid or used twice')
            slugs.add(slug)
            tools = []
            for tool in topic.get('tools') or []:
                tool_name = one(tool.get('name'))
                if not tool_name:
                    raise ValueError(f'{name}: every tool needs a name')
                item = {'name': tool_name, 'link': link(tool.get('link'), tool_name)}
                if one(tool.get('description')):
                    item['description'] = one(tool['description'])
                tools.append(item)
            topics.append({
                'name': name, 'slug': slug, 'summary': one(topic.get('summary')), 'image': str(topic.get('image') or ''),
                'tools': tools,
                'sections': [{'title': one(x.get('title')), 'text': str(x.get('text') or '').strip()}
                             for x in topic.get('sections') or [] if one(x.get('title')) or str(x.get('text') or '').strip()],
                'people': [{k: v for k, v in {'name': one(x.get('name')), 'role': one(x.get('role')),
                                              'link': link(x.get('link'), name)}.items() if v}
                           for x in topic.get('people') or [] if one(x.get('name'))],
                'papers': [x for x in topic.get('papers') or [] if one(x.get('title')) or one(x.get('text'))],
                'links': [{'label': one(x.get('label')) or 'Link', 'url': link(x.get('url'), name)}
                          for x in topic.get('links') or [] if str(x.get('url') or '').strip()],
                'files': [x for x in topic.get('files') or [] if str(x.get('path') or '').startswith(f'files/topics/{slug}/')],
            })
        areas.append({'title': title, 'topics': topics})
    return {'intro': str(raw.get('intro') or '').strip(), 'areas': areas}


def clean_collaborations(raw):
    groups = {}
    for group in ('current', 'past'):
        items = []
        for item in raw.get(group) or []:
            entry = {key: ' '.join(str(item.get(key) or '').split())
                     for key in ('name', 'type', 'link', 'organization', 'topic', 'logo')}
            entry['type'] = entry['type'] if entry['type'] in ('company', 'university') else 'academic'
            if entry['logo'] and not re.fullmatch(r'images/logos/[a-z0-9_]+\.png', entry['logo']):
                raise ValueError(f'{entry["name"]}: unexpected logo path')
            if entry['type'] == 'university' and not entry['organization']:
                raise ValueError('every university needs its name')
            if entry['type'] != 'university' and not entry['name']:
                raise ValueError('every collaboration needs a contact person')
            what = entry['name'] or entry['organization']
            if entry['link'] and not re.match(r'https?://', entry['link']):
                raise ValueError(f'{what}: the link must start with http:// or https://')
            papers = []
            for paper in item.get('papers') or []:
                title = ' '.join(str(paper.get('title') or '').split())
                if not title:
                    continue
                url = str(paper.get('url') or '').strip()
                if url and not re.match(r'https?://', url):
                    raise ValueError(f'{what}: paper links must start with http:// or https://')
                papers.append({'title': title, 'year': int(paper['year']) if str(paper.get('year') or '').isdigit() else '', 'url': url})
            if papers:
                entry['papers'] = sorted(papers, key=lambda p: -(p['year'] or 0))
            items.append(entry)
        groups[group] = sorted(items, key=lambda i: {'company': 0, 'university': 1}.get(i['type'], 2))   # companies, then universities
    return groups


def clean_workshops(raw):
    def text(value):
        return ' '.join(str(value if value is not None else '').split())

    def year(value, what):
        if not isinstance(value, int) or not 1990 <= value <= 2100:
            raise ValueError(f'{what}: the year is not valid')
        return value

    def people(items, what):
        out = []
        for p in items or []:
            entry = {'name': text(p.get('name'))}
            if not entry['name']:
                raise ValueError(f'{what}: every person needs a name')
            for key in ('affiliation', 'role'):
                if text(p.get(key)):
                    entry[key] = text(p.get(key))
            out.append(entry)
        return out

    workshops = []
    for w in raw.get('workshops') or []:
        name = text(w.get('acronym')) or '(workshop)'
        if not text(w.get('acronym')) or not text(w.get('title')):
            raise ValueError(f'{name}: acronym and full title are required')
        workshops.append({'acronym': text(w['acronym']), 'year': year(w.get('year'), name), 'title': text(w['title']),
                          'conference': text(w.get('conference')), 'dates': text(w.get('dates')), 'place': text(w.get('place')),
                          'link': text(w.get('link')), 'chairs': people(w.get('chairs'), name)})
    issues = []
    for i in raw.get('special_issues') or []:
        name = text(i.get('title'))[:40] or '(special issue)'
        if not text(i.get('title')) or not text(i.get('journal')):
            raise ValueError(f'{name}: title and journal are required')
        links = []
        for link in i.get('links') or []:
            if not re.match(r'https?://', text(link.get('url'))):
                raise ValueError(f'{name}: links must start with http:// or https://')
            links.append({'label': text(link.get('label')) or 'Link', 'url': text(link.get('url'))})
        issues.append({'title': text(i['title']), 'kind': text(i.get('kind')) or 'Special Issue', 'journal': text(i['journal']),
                       'year': year(i.get('year'), name), 'editors': people(i.get('editors'), name), 'links': links})
    return {'intro': text(raw.get('intro')),
            'workshops': sorted(workshops, key=lambda w: -w['year']),
            'special_issues': sorted(issues, key=lambda i: -i['year'])}


def clean_datasets(raw):
    """The editor already checks every field; here only what could break the pages."""
    slugs = set()
    for ds in raw.get('datasets') or []:
        name = str(ds.get('name') or '').strip()
        if not name:
            raise ValueError('Every dataset needs a name')
        if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', str(ds.get('slug') or '')) or ds['slug'] in slugs:
            raise ValueError(f'{name}: the page address is missing, not valid or used twice')
        slugs.add(ds['slug'])
        for key in ('summary', 'image', 'file'):
            if not str(ds.get(key) or '').strip():
                raise ValueError(f'{name}: {key} is required')
    return raw


def write_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def clean_data(raw):
    return {
        'principal': clean_person(raw['principal']) if raw.get('principal') else None,
        'members': [clean_person(p) for p in raw.get('members') or []],
        'alumni': [clean_person(p) for p in raw.get('alumni') or []],
    }


class Handler(http.server.SimpleHTTPRequestHandler):
    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        if self.path in ('/', '/admin', '/admin/'):
            self.send_response(302)
            self.send_header('Location', '/admin/people/')
            self.end_headers()
        elif self.path == '/api/people':
            with open(build_people.DATA, encoding='utf-8') as f:
                self.send_json(200, json.load(f))
        elif self.path == '/api/news':
            with open(build_news.DATA, encoding='utf-8') as f:
                self.send_json(200, json.load(f))
        elif self.path == '/api/topics':
            with open(build_topics.DATA, encoding='utf-8') as f:
                self.send_json(200, json.load(f))
        elif self.path == '/api/collaborations':
            with open(build_collaborations.DATA, encoding='utf-8') as f:
                self.send_json(200, json.load(f))
        elif self.path == '/api/workshops':
            with open(build_workshops.DATA, encoding='utf-8') as f:
                self.send_json(200, json.load(f))
        elif self.path == '/api/datasets':
            with open(build_datasets.DATA, encoding='utf-8') as f:
                self.send_json(200, json.load(f))
        elif self.path == '/api/photos':
            self.send_json(200, sorted(os.listdir(PHOTOS)))
        elif self.path == '/api/logos':
            self.send_json(200, sorted(os.listdir(LOGOS)) if os.path.isdir(LOGOS) else [])
        else:
            super().do_GET()

    def do_POST(self):
        if self.path != '/api/save':
            self.send_json(404, {'ok': False, 'error': 'unknown endpoint'})
            return
        try:
            length = int(self.headers.get('Content-Length', 0))
            payload = json.loads(self.rfile.read(length) or b'{}')
            data = clean_data(payload['data'])
            news = clean_news(payload['news']) if payload.get('news') is not None else None
            topics = clean_topics(payload['topics']) if payload.get('topics') is not None else None
            collaborations = (clean_collaborations(payload['collaborations'])
                              if payload.get('collaborations') is not None else None)
            workshops = clean_workshops(payload['workshops']) if payload.get('workshops') is not None else None
            datasets = clean_datasets(payload['datasets']) if payload.get('datasets') is not None else None
            # Uploads: people photos (JPEG), collaboration logos (PNG), dataset images (JPEG) and app logos (PNG).
            kinds = {'images/pictures': (PHOTOS, 'jpg', 'jpeg'), 'images/logos': (LOGOS, 'png', 'png'),
                     'images/datasets': (DATASET_IMAGES, 'jpg', 'jpeg'),
                     'images/apps': (os.path.join(ROOT, 'images', 'apps'), 'png', 'png'),
                     'images/topics': (os.path.join(ROOT, 'images', 'topics'), 'jpg', 'jpeg')}
            files = {}
            for path, url in (payload.get('photos') or {}).items():
                if re.fullmatch(r'files/topics/[a-z0-9-]+/[A-Za-z0-9][A-Za-z0-9._-]*', path):   # any file of a topic page
                    match = re.match(r'data:[^;,]*;base64,(.+)', url, re.S)
                    if not match:
                        raise ValueError(f'{path}: unexpected file format')
                    files[os.path.join(ROOT, *path.split('/'))] = base64.b64decode(match.group(1))
                    continue
                folder, name = os.path.split(path)
                if folder not in kinds or not re.fullmatch(rf'[a-z0-9_-]+\.{kinds[folder][1]}', name):
                    raise ValueError(f'unexpected upload path: {path}')
                match = re.match(rf'data:image/{kinds[folder][2]};base64,(.+)', url, re.S)
                if not match:
                    raise ValueError(f'{name}: unexpected image format')
                files[os.path.join(kinds[folder][0], name)] = base64.b64decode(match.group(1))
            for target, content in files.items():
                os.makedirs(os.path.dirname(target), exist_ok=True)
                with open(target, 'wb') as f:
                    f.write(content)
            write_json(build_people.DATA, data)
            build_people.build()
            if news is not None:
                write_json(build_news.DATA, news)
                build_news.build()
            if topics is not None:
                write_json(build_topics.DATA, topics)
                build_topics.build()
            if collaborations is not None:
                write_json(build_collaborations.DATA, collaborations)
                build_collaborations.build()
            if workshops is not None:
                write_json(build_workshops.DATA, workshops)
                build_workshops.build()
            if datasets is not None:
                write_json(build_datasets.DATA, datasets)
                build_datasets.build()
            stamp_assets.stamp()   # generated pages get the current CSS/JS versions
            self.send_json(200, {'ok': True})
        except (ValueError, KeyError, TypeError) as error:
            self.send_json(400, {'ok': False, 'error': str(error)})

    def log_message(self, fmt, *args):
        if self.command == 'POST':
            super().log_message(fmt, *args)


if __name__ == '__main__':
    handler = functools.partial(Handler, directory=ROOT)
    server = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler)
    print(f'People editor: http://localhost:{PORT}/admin/people/  (page preview: http://localhost:{PORT}/people.html)')
    print('Press Ctrl+C to stop.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print()
