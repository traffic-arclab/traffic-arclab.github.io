"""
The change log of the Cybersecurity Dataset Observatory (observatory/changelog.html), read from the git
history of data/observatory.json: every commit that changes the catalogue, whether made in the repository
(by Claude Code or by hand) or with the site editor (admin/people/), becomes one entry per dataset it adds,
removes or changes, with the fields that changed and their old and new values.

The entries start on "changelog_since" of data/observatory.json and are grouped by release ("releases":
version, date, summary). A change belongs to the first release dated on or after it; the changes after the
last release are listed as "Unreleased", with the version they will need:
  - patch (1.0.1): corrections to existing records only;
  - minor (1.1):   datasets added to or removed from the catalogue;
  - major (2.0):   a change of the taxonomy (axes, domains, vocabularies), decided by hand.

The history needs a full clone (fetch-depth: 0 in the workflow). Without it, the entries are taken from
observatory/changelog.json, which every build writes.
"""

import json
import os
import re
import subprocess

DATA_PATH = 'data/observatory.json'

# The commits of the site editor: "Update Observatory page", "Update People and Observatory pages"...
EDITOR_MESSAGE = re.compile(r'^Update .+ (page|pages|section)$')

FIELDS = {
    'name': 'Name', 'url': 'Distribution source', 'task': 'Security task', 'domain': 'Domain labels',
    'data': 'Traffic data', 'category': 'Domain', 'representation': 'Representation', 'year': 'Year',
    'artifact': 'Artifacts', 'labeling': 'Labels', 'classes': 'Classes', 'attack_families': 'Attack families',
    'acquisition': 'Acquisition', 'size': 'Size', 'derivation_tool': 'Derivation tool', 'family': 'Family',
    'notes': 'Description', 'access': 'Access', 'parents': 'Derived from', 'parents_text': 'Derived from',
    'derived': 'Derived datasets', 'table_row': 'Own row in the table', 'evidence': 'Verification',
    'origin': 'Origin', 'excluded': 'Exclusion', 'new_since': 'New since', 'notify': 'Email the subscribers',
    'paper.cite': 'Paper', 'paper.title': 'Paper title', 'paper.doi': 'Paper DOI', 'paper.url': 'Paper link',
    'artifact.traces': 'Network traces', 'artifact.derived': 'Derived information',
    'classes.benign': 'Benign class', 'classes.attack': 'Attack classes',
    'size.gb': 'Size (GB)', 'size.count': 'Size',
}
# Fields that only steer the page or the emails: not changes of the catalogue.
QUIET = {'notify', 'new_since'}


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout


def flat(rec):
    """The fields of a record, one level of nested objects spelled out (paper.title, classes.attack...)."""
    out = {}
    for k, v in rec.items():
        if k == 'id' or k in QUIET:
            continue
        if isinstance(v, dict) and k in ('paper', 'artifact', 'classes', 'size'):
            for sub, w in v.items():
                out[f'{k}.{sub}'] = w
        else:
            out[k] = v
    return out


def show(value):
    if value is None or value == '' or value == []:
        return '–'
    if value is True:
        return 'yes'
    if value is False:
        return 'no'
    if isinstance(value, list):
        return ', '.join(show(v) for v in value)
    if isinstance(value, dict):
        return ', '.join(f'{k}: {show(v)}' for k, v in value.items())
    text = str(value)
    return text if len(text) <= 160 else text[:157] + '…'


def published(records):
    """The records of the catalogue (the excluded ones stay in the file but are not published)."""
    return {r['id']: r for r in records if r.get('id') and not r.get('excluded')}


def diff(old, new):
    """What a commit changed in the catalogue: one change per dataset added, removed or edited."""
    before, after = published(old.get('records', [])), published(new.get('records', []))
    excluded = {r['id']: r['excluded'] for r in new.get('records', []) if r.get('id') and r.get('excluded')}
    changes = []
    for i, r in after.items():
        if i not in before:
            changes.append({'kind': 'added', 'id': i, 'name': r.get('name', i)})
    for i, r in before.items():
        if i not in after:
            changes.append({'kind': 'removed', 'id': i, 'name': r.get('name', i), 'reason': excluded.get(i, '')})
    for i in after.keys() & before.keys():
        a, b = flat(before[i]), flat(after[i])
        fields = [{'field': FIELDS.get(k, k), 'old': show(a.get(k)), 'new': show(b.get(k))}
                  for k in list(a) + [k for k in b if k not in a] if a.get(k) != b.get(k)]
        if fields:
            changes.append({'kind': 'changed', 'id': i, 'name': after[i].get('name', i), 'fields': fields})
    order = {'added': 0, 'removed': 1, 'changed': 2}
    return sorted(changes, key=lambda c: (order[c['kind']], c['name'].lower()))


def from_history(since):
    """Every change of the catalogue since the given date, oldest first, read from git."""
    if git('rev-parse', '--is-shallow-repository').strip() == 'true':
        raise RuntimeError('shallow clone')
    log = git('log', '--reverse', '--no-merges', '--format=%H%x1f%cs%x1f%s',
              f'--since={since} 00:00:00', '--', DATA_PATH)
    entries = []
    for line in log.splitlines():
        sha, day, subject = line.split('\x1f')
        if day < since:
            continue
        try:
            old = json.loads(git('show', f'{sha}^:{DATA_PATH}'))
        except subprocess.CalledProcessError:
            old = {}
        new = json.loads(git('show', f'{sha}:{DATA_PATH}'))
        changes = diff(old, new)
        if changes:
            entries.append({'date': day, 'commit': sha[:7],
                            'source': 'editor' if EDITOR_MESSAGE.match(subject) else 'repository',
                            'message': subject, 'changes': changes})
    return entries


def bump(version, changes):
    major, minor, *patch = [int(p) for p in version.split('.')]
    patch = patch[0] if patch else 0
    if any(c['kind'] != 'changed' for e in changes for c in e['changes']):
        return f'{major}.{minor + 1}'
    return f'{major}.{minor}.{patch + 1}'


def changelog(data, root, cached):
    """The releases, newest first, each with its entries; "Unreleased" on top when there are later changes."""
    global ROOT
    ROOT = root
    since = data.get('changelog_since', '9999-12-31')
    try:
        entries = from_history(since)
    except (OSError, RuntimeError, subprocess.CalledProcessError):
        entries = cached.get('entries', [])
    releases = sorted(data.get('releases', []), key=lambda r: r['date'])
    groups = [dict(r, entries=[]) for r in releases]
    unreleased = []
    for e in entries:
        home = next((g for g in groups if e['date'] <= g['date']), None)
        (home['entries'] if home else unreleased).append(e)
    out = list(reversed(groups))
    if unreleased and releases:
        out.insert(0, {'version': bump(releases[-1]['version'], unreleased), 'date': '', 'unreleased': True,
                       'entries': unreleased})
    return {'since': since, 'current': releases[-1]['version'] if releases else '', 'releases': out,
            'entries': entries}
