#!/usr/bin/env python3
"""Local editor for the People, News, research Topics and Collaborations of the Traffic group.

    python3 scripts/people_admin.py          # then open http://localhost:8765

Serves the editor in admin/people/ (the same page that, online, commits to
GitHub) together with the site itself, so the preview works at
http://localhost:8765/people.html. Saving writes data/people.json,
data/news.json, data/topics.json, data/collaborations.json and the new photos (cropped and resized in
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
import build_news  # noqa: E402
import build_people  # noqa: E402
import build_topics  # noqa: E402

ROOT = build_people.ROOT
PHOTOS = os.path.join(ROOT, 'images', 'pictures')
LOGOS = os.path.join(ROOT, 'images', 'logos')
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
    areas = []
    for area in raw.get('areas') or []:
        title = str(area.get('title') or '').strip()
        if not title:
            raise ValueError('every area needs a title')
        topics = []
        for topic in area.get('topics') or []:
            name = str(topic.get('name') or '').strip()
            if not name:
                raise ValueError(f'{title}: every topic needs a name')
            tools = []
            for tool in topic.get('tools') or []:
                tool_name = str(tool.get('name') or '').strip()
                if not tool_name:
                    raise ValueError(f'{name}: every tool needs a name')
                tools.append({'name': tool_name, 'link': link(tool.get('link'), tool_name)})
            topics.append({'name': name, 'link': link(topic.get('link'), name), 'tools': tools})
        areas.append({'title': title, 'topics': topics})
    return {'intro': str(raw.get('intro') or '').strip(), 'areas': areas}


def clean_collaborations(raw):
    groups = {}
    for group in ('current', 'past'):
        items = []
        for item in raw.get(group) or []:
            entry = {key: ' '.join(str(item.get(key) or '').split())
                     for key in ('name', 'type', 'link', 'organization', 'topic', 'logo')}
            entry['type'] = 'company' if entry['type'] == 'company' else 'academic'
            if entry['logo'] and not re.fullmatch(r'images/logos/[a-z0-9_]+\.png', entry['logo']):
                raise ValueError(f'{entry["name"]}: unexpected logo path')
            if not entry['name']:
                raise ValueError('every collaboration needs a contact person')
            if entry['link'] and not re.match(r'https?://', entry['link']):
                raise ValueError(f'{entry["name"]}: the link must start with http:// or https://')
            items.append(entry)
        groups[group] = sorted(items, key=lambda i: i['type'] != 'company')   # companies first
    return groups


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
            # Uploads: people photos (JPEG) and collaboration logos (PNG).
            kinds = {'images/pictures': (PHOTOS, 'jpg', 'jpeg'), 'images/logos': (LOGOS, 'png', 'png')}
            files = {}
            for path, url in (payload.get('photos') or {}).items():
                folder, name = os.path.split(path)
                if folder not in kinds or not re.fullmatch(rf'[a-z0-9_]+\.{kinds[folder][1]}', name):
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
