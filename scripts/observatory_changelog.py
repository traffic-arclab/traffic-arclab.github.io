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

Every record also gets its own history (the dated changes of that dataset, each with the release it belongs
to), shown in its dialog, and every release is frozen as a copy of the catalogue at that date
(observatory/releases/v<version>.json, written once and never rewritten): two works that cite the same
dataset can be compared on the state of its record at the date or release each of them used. A release
dated before "changelog_since" is frozen as the catalogue when the log began.

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
    'classes.benign': 'Benign class', 'classes.attack': 'Attack classes', 'classes.attck': 'Attack classes are MITRE ATT&CK labels',
    'size.gb': 'Size (GB)', 'size.count': 'Size',
}
# Fields that only steer the page, the emails or the curation: not changes of the catalogue.
QUIET = {'checked', 'status', 'in_release', 'notify', 'new_since', 'evidence', 'origin', 'table_row'}
# The notes are the curators' wording: a change of them is listed as "Description revised", without the text.
PRIVATE = {'notes'}

# The public labels of the coded values (as on the page)
DOMAIN_LABELS = {}   # filled by changelog() from the domains of the page
LABELS = {
    'attack_families': {'bruteforce': 'Brute force', 'botnet-c2': 'Botnet / C2', 'dos': '(D)DoS', 'exfiltration': 'Exfiltration',
                        'lateral': 'Infiltration / lateral movement', 'malware': 'Malware / backdoor / worm',
                        'scanning': 'Reconnaissance / scan', 'exploitation': 'Exploitation', 'web': 'Web', 'other': 'Other',
                        'attck': 'MITRE ATT&CK labels', 'fuzzing': 'Fuzzing', 'spoofing': 'Spoofing / fabrication / masquerade',
                        'replay': 'Replay', 'falsification': 'Data falsification', 'timing': 'Timing', 'sybil': 'Sybil',
                        'injection': 'False data / command injection', 'app': 'Application / service classes',
                        'downgrade': 'Downgrade / side-channel mimicry'},
    'acquisition': {'real': 'Real devices', 'hybrid': 'Real and simulated devices', 'emulated': 'Emulated or simulated',
                    'mix': 'Merge of sources'},
    'labeling': {'binary': 'Binary', 'multiclass': 'Multiclass', 'weak': 'Weak or heuristic', 'multilabel': 'Multi-label',
                 'none': 'None'},
    'access': {'open': 'Open', 'registration': 'Registration', 'request': 'On request',
               'restricted': 'Registration or request', 'undocumented': 'Not documented',
               'unavailable': 'Not available'},
}
# working notes that must not reach the public log
SCRUB = re.compile(r'\s*\((?:formats to )?verify\)|\s*\(tab:[^)]*\)', re.I)


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


def show(value, key=''):
    """A value as the public reads it: labels instead of codes, no working notes."""
    if isinstance(value, list):
        value = [v for v in value if not (isinstance(v, str) and v.strip().lower().startswith(('verify', 'confirm')))]
    if value is None or value == '' or value == []:
        return '–'
    if value is True:
        return 'yes'
    if value is False:
        return 'no'
    if isinstance(value, list):
        return ', '.join(show(v, key) for v in value)
    if isinstance(value, dict):
        return ', '.join(f'{k}: {show(v)}' for k, v in value.items())
    labels = DOMAIN_LABELS if key == 'category' else LABELS.get(key, {})
    text = labels.get(value, SCRUB.sub('', str(value)).strip())
    if text.endswith('?'):   # "5?" in the working tables: shown as the value, since it has been confirmed
        text = text[:-1].rstrip()
    return text if len(text) <= 160 else text[:157] + '…'


# Records loaded into the file by mistake and later deleted: they were never part of the catalogue, so the change log
# and the frozen releases leave them out of every past state as well.
NEVER_PUBLISHED = {'zero-swarm-modbus-normal-and-malicious', 'lorawan-network-attacks-guard', '6tischset-2026', 'uav-ton-iot', 'uav-ground-telemetry-ids', 'ctu-idseval-6', 'batadal', 'netresec-public-pcap-index', 'cicev2023', 'nitro-5g-cybersecurity-exercise', 'pdmfc-ai4cyber-sc3-3', 'pdmfc-shennina-hping-nmap-ddos-pcaps', 'power-system-digital-twin-mininet-traffic', 'minids-multi-domain-vehicle-networks', 'iot-communication-protocol-overhead-dataset'}


def published(records):
    """The records of the catalogue (the excluded ones stay in the file but are not published)."""
    return {r['id']: r for r in records if r.get('id') and not r.get('excluded') and r['id'] not in NEVER_PUBLISHED}


def diff(old, new):
    """What a commit changed in the catalogue: one change per dataset added, removed or edited."""
    before, after = published(old.get('records', [])), published(new.get('records', []))
    excluded = {r['id']: r['excluded'] for r in new.get('records', []) if r.get('id') and r.get('excluded')}
    changes = []
    for i, r in after.items():
        if i not in before:
            if r.get('in_release'):   # in the paper of that release but missing from the website: a correction
                changes.append({'kind': 'corrected', 'id': i, 'name': r.get('name', i), 'of_release': r['in_release'],
                                'reason': f'Listed in the paper (release {r["in_release"]}) but missing from the website: '
                                          f'added to the catalogue of that release.'})
            else:
                changes.append({'kind': 'added', 'id': i, 'name': r.get('name', i)})
    for i, r in before.items():
        if i not in after:
            changes.append({'kind': 'removed', 'id': i, 'name': r.get('name', i), 'reason': SCRUB.sub('', excluded.get(i, '')).strip()})
    for i in after.keys() & before.keys():
        a, b = flat(before[i]), flat(after[i])
        fields = [{'field': FIELDS.get(k, k), 'revised': True} if k in PRIVATE else
                  {'field': FIELDS.get(k, k), 'old': show(a.get(k), k.split('.')[0]), 'new': show(b.get(k), k.split('.')[0])}
                  for k in list(a) + [k for k in b if k not in a] if a.get(k) != b.get(k)]
        # a change that only drops working notes from a value ("verify") is not a change of the catalogue
        fields = [f for f in fields if f.get('revised') or f['old'] != f['new']]
        if fields:
            # the source stopped distributing it: still in the catalogue, flagged as withdrawn
            withdrawn = b.get('access') == 'unavailable' and a.get('access') != 'unavailable'
            changes.append({'kind': 'withdrawn' if withdrawn else 'changed', 'id': i, 'name': after[i].get('name', i), 'fields': fields})
    order = {'added': 0, 'corrected': 1, 'removed': 2, 'withdrawn': 3, 'changed': 4}
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
    if any(c['kind'] in ('added', 'removed') for e in changes for c in e['changes']):
        return f'{major}.{minor + 1}'
    return f'{major}.{minor}.{patch + 1}'


def changelog(data, root, cached, domains=None):
    """The releases, newest first, each with its entries; "Unreleased" on top when there are later changes."""
    global ROOT
    ROOT = root
    DOMAIN_LABELS.update(domains or {})
    since = data.get('changelog_since', '9999-12-31')
    try:
        entries = from_history(since)
    except (OSError, RuntimeError, subprocess.CalledProcessError):
        entries = cached.get('entries', [])   # written by an earlier build: already in public form
    releases = sorted(data.get('releases', []), key=lambda r: r['date'])
    groups = [dict(r, entries=[]) for r in releases]
    unreleased = []
    for e in entries:
        home = next((g for g in groups if e['date'] <= g['date']), None)
        (home['entries'] if home else unreleased).append(e)
    out = list(reversed(groups))
    nxt = bump(releases[-1]['version'], unreleased) if unreleased and releases else ''
    if nxt:
        out.insert(0, {'version': nxt, 'date': '', 'unreleased': True, 'entries': unreleased})
    history = {}
    for g in groups + [{'version': nxt, 'unreleased': True, 'entries': unreleased}]:
        for e in g['entries']:
            for c in e['changes']:
                event = {k: v for k, v in c.items() if k not in ('id', 'name')}
                event.update(date=e['date'], commit=e['commit'], source=e['source'], release=g['version'])
                if g.get('unreleased'):
                    event['unreleased'] = True
                history.setdefault(c['id'], []).append(event)
    return {'since': since, 'current': releases[-1]['version'] if releases else '', 'releases': out,
            'entries': entries, 'history': history,
            'first': releases[0]['version'] if releases else ''}


def freeze(data, root, out_dir):
    """observatory/releases/v<version>.json: the catalogue of each release, written once (a release is frozen)."""
    global ROOT
    ROOT = root
    since = data.get('changelog_since', '9999-12-31')
    written = []
    for r in data.get('releases', []):
        path = os.path.join(out_dir, f'v{r["version"]}.json')
        if os.path.exists(path):
            continue
        # the last state of the catalogue on the day of the release (or when the log began, for an older one)
        before = f'{r["date"]} 23:59:59' if r['date'] >= since else f'{since} 00:00:00'
        try:
            sha = git('log', '-1', '--format=%H', f'--before={before}', '--', DATA_PATH).strip()
            state = json.loads(git('show', f'{sha}:{DATA_PATH}')) if sha else None
        except (OSError, subprocess.CalledProcessError, ValueError):
            state = None
        if not state:
            continue
        records = sorted(({k: v for k, v in rec.items() if k not in QUIET} for rec in published(state['records']).values()),
                         key=lambda rec: rec['id'])
        frozen = {'title': data.get('title', ''), 'version': r['version'], 'date': r['date'],
                  'summary': r.get('summary', ''), 'state_of': sha[:7],
                  'note': ('The catalogue when the change log began (%s); the release is older.' % since
                           if r['date'] < since else 'The catalogue on the day of the release.'),
                  'records': records}
        os.makedirs(out_dir, exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(frozen, f, ensure_ascii=False, indent=1)
            f.write('\n')
        written.append(r['version'])
    return written
