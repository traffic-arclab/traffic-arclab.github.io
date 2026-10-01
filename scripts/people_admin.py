#!/usr/bin/env python3
"""Local editor for the People page of the Traffic group.

    python3 scripts/people_admin.py          # then open http://localhost:8765

Serves the editor in admin/people/ (the same page that, online, commits to
GitHub) together with the site itself, so the preview works at
http://localhost:8765/people.html. Saving writes data/people.json and the new
photos (cropped and resized in the browser to 600x720 JPEG, saved in
images/pictures/) and rebuilds people.html through scripts/build_people.py.
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
import build_people  # noqa: E402

ROOT = build_people.ROOT
PHOTOS = os.path.join(ROOT, 'images', 'pictures')
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
        elif self.path == '/api/photos':
            self.send_json(200, sorted(os.listdir(PHOTOS)))
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
            files = {}
            for path, url in (payload.get('photos') or {}).items():
                name = os.path.basename(path)
                if path != f'images/pictures/{name}' or not re.fullmatch(r'[a-z0-9_]+\.jpg', name):
                    raise ValueError(f'unexpected photo path: {path}')
                match = re.match(r'data:image/jpeg;base64,(.+)', url, re.S)
                if not match:
                    raise ValueError(f'{name}: the photo must be a JPEG data URL')
                files[name] = base64.b64decode(match.group(1))
            for name, content in files.items():
                with open(os.path.join(PHOTOS, name), 'wb') as f:
                    f.write(content)
            with open(build_people.DATA, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write('\n')
            build_people.build()
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
