#!/usr/bin/env python3
"""Build the Cybersecurity Observatory page from data/observatory.json.

    observatory/index.html   catalogue of network-attack datasets
                             and the form to submit a new dataset

The home page also gets a band that presents the Observatory
(between the OBSERVATORY-FEATURE markers), with a "New" badge until "new_until".

While "hidden" is true (work in progress) the page is still built at its address, but
it is not linked anywhere: no top-bar entry, no home band, and search engines are asked
not to index it (the news items marked "hidden" are skipped by build_news.py).

The page has the site layout (header, menu and footer, through build_datasets.frame)
and its own address, https://traffic-arclab.github.io/observatory/, so it can be
shared on its own. It has its own entry, "Cybersecurity Observatory", in the top bar of every page (written by build_datasets.render_menu).

The records come from the Excel list (scripts/import_observatory.py) plus what is
added by hand in the JSON: "origin": "web" (found online, not in the reference list), "family",
"derived_from", "paper" {cite, doi} and "notes". Domain, task and data type groups
used by the filters are computed here from the free-text fields of each record.

The form sends the submissions to the Google Apps Script web app in "submit_endpoint"
(scripts/google-apps-script/dataset-downloads.gs, sheet "Observatory submissions");
while it is empty the form opens an email to "contact", with the addresses of "cc" in copy.

The search bar is AI-assisted when "ai_endpoint" is set (the same web app, action
"observatory_ai"): the web app asks a Llama model to rank the catalogue for a query, or
to suggest datasets in a chat, and returns the record ids with the reason of each choice.
The model only sees observatory/catalogue.json, written here (one line per family head),
and the page shows only ids that are in the catalogue. While "ai_endpoint" is empty
the bar is a keyword search and the chat is not shown.

Standard library only.
"""
import json
import os
import re
from datetime import date
from urllib.parse import urlparse

import build_datasets as site

ROOT = site.ROOT
DATA = os.path.join(ROOT, 'data', 'observatory.json')
OUT = os.path.join(ROOT, 'observatory')
esc = site.esc

# First matching rule wins: the order matters (e.g. "Android / Malware" is Mobile, not Malware).
DOMAINS = [
    ('vehicular', 'Vehicular (CAN, V2X)', r'CAN|V2X|Automotive|vehicle|IoV'),
    ('uav', 'UAV and drones', r'UAV|Drone|FANET'),
    ('industrial', 'Industrial and smart grid', r'ICS|\bOT\b|Modbus|DNP3|SCADA|Smart grid|Power|Water|Electrical'),
    ('healthcare', 'Healthcare (IoMT)', r'IoMT'),
    ('wireless', 'Wireless, LPWAN and 5G', r'Wi-Fi|802\.11|LoRaWAN|LPWAN|Wireless|5G|Maritime'),
    ('iot', 'IoT and IIoT', r'IoT'),
    ('mobile', 'Mobile (Android)', r'Android'),
    ('malware', 'Malware, botnet and C2', r'Malware|Botnet|C2|Sandbox'),
    ('encrypted', 'Encrypted, DNS and darknet', r'TLS|Encrypted|VPN|Tor\b|Darknet|DNS|QUIC|PQC'),
    ('web', 'Web applications', r'\bWeb\b|HTTP'),
    ('backbone', 'Internet backbone and ISP', r'backbone|ISP'),
    ('benign', 'Benign reference traffic', r'Benign'),
    ('enterprise', 'Enterprise and general networks', r''),
]
TASKS = [
    ('malware', 'Malware and C2 traffic', r'Malware|C2|Botnet|botnet'),
    ('misbehavior', 'Misbehavior, spoofing, jamming', r'Misbehavior|Spoofing|Jamming'),
    ('benign', 'Benign baseline and classification', r'Benign|baseline|Tor/nonTor|Darknet|application identification'),
    ('anomaly', 'Anomaly detection', r'^(?!.*(IDS|[Ii]ntrusion)).*anomal'),
    ('intrusion', 'Intrusion and attack detection', r''),
]
FORMATS = [
    ('packets', 'Packet captures', r'PCAP|[Pp]acket|tcpdump|[Cc]aptures|traffic traces|Network traffic'),
    ('flows', 'Flow records', r'[Ff]low|NetFlow|Argus|Zeek|Bro\b|[Cc]onnection'),
    ('messages', 'Bus and protocol messages', r'CAN|V2X|message|HTTP request'),
    ('features', 'Feature tables', r'CSV|[Ff]eature|Parquet|[Tt]abular|PKL|JSON|records|statistics'),
    ('logs', 'Logs and alerts', r'(?<!ancillary )\b[Ll]ogs?\b|LOG|Snort|Suricata|alert'),   # "ancillary logs (capture-dependent)" is not a released log
]
# Finer filters, matched on name, task, domain and data of each record (a record can have several values).
ATTACKS = [
    ('botnet', 'Botnet', r'[Bb]otnet|Bot-IoT|BaIoT'),
    ('ddos', 'DDoS and DoS', r'DDoS|\bDoS\b|Bus-Off|battery depletion'),
    ('c2', 'Command and control', r'\bC2\b|command-control|command and control'),
    ('malware', 'Malware', r'[Mm]alware|MalDroid|AndMal|[Aa]dware'),
    ('apt', 'APT and multi-stage', r'\bAPT\b|[Ll]ateral|[Mm]ulti-stage|[Rr]ed.team|ATT&CK|lifecycle'),
    ('web', 'Web attacks', r'[Ww]eb (attack|request|exploit)|WAF|HTTP request|web/QUIC attack'),
    ('spoofing', 'Spoofing and injection', r'[Ss]poof|[Ii]njection|[Mm]isbehavior'),
    ('jamming', 'Jamming', r'[Jj]amming'),
    ('exfiltration', 'Exfiltration and tunneling', r'[Ee]xfiltration|[Tt]unnel|covert'),
    ('scanning', 'Scanning', r'[Ss]canning|Nmap'),
    ('exploitation', 'Exploitation', r'[Ee]xploit|[Bb]uffer overflow|LSASS'),
]
PROTOCOLS = [
    ('modbus', 'Modbus', r'Modbus'),
    ('dnp3', 'DNP3', r'DNP3'),
    ('iec104', 'IEC 60870-5-104', r'60870'),
    ('can', 'CAN bus', r'\bCAN\b'),
    ('v2x', 'V2X', r'V2X|VANET|VeReMi'),
    ('wifi', 'Wi-Fi (802.11)', r'Wi-Fi|802\.11|\bAWID'),
    ('lorawan', 'LoRaWAN', r'LoRaWAN'),
    ('6tisch', '6TiSCH', r'6TiSCH'),
    ('mqtt', 'MQTT', r'MQTT'),
    ('tls', 'TLS', r'\bTLS\b|HTTPS'),
    ('quic', 'QUIC and HTTP/3', r'QUIC|HTTP/3'),
    ('dns', 'DNS and DoH', r'\bDNS\b|DoH|DNS-over'),
    ('http', 'HTTP', r'HTTP(?!S)'),
    ('vpn', 'VPN and Tor', r'\bVPN\b|\bTor\b|Darknet'),
    ('5g', '5G', r'\b5G\b'),
    ('ssh', 'SSH', r'\bSSH\b'),
    ('ethernet', 'Automotive Ethernet', r'Ethernet'),
]
TOOLS = [
    ('pcap', 'PCAP and PCAPNG', r'PCAP|tcpdump'),
    ('netflow', 'NetFlow', r'NetFlow'),
    ('zeek', 'Zeek (Bro)', r'Zeek|\bBro\b'),
    ('argus', 'Argus', r'Argus|binetflow'),
    ('csv', 'CSV', r'CSV'),
    ('parquet', 'Parquet', r'Parquet'),
    ('ids', 'Snort and Suricata', r'Snort|Suricata'),
]


def matches(text, rules):
    return [key for key, _, pattern in rules if re.search(pattern, text)]


# Data that is not network traffic: the record needs a check of its traffic component.
NON_TRAFFIC = re.compile(r'telemetry|sensor|time series|APK|behavior|host', re.I)
# Hosts that list datasets collected by others: a discovery source, not the official release page.
INDEX_HOSTS = {'fkie-cad.github.io': 'COMIDDS index', 'github.com/xGoldy': 'NID datasets survey list',
               'www.netresec.com': 'NETRESEC index'}


def group(text, rules):
    return next(key for key, _, pattern in rules if re.search(pattern, text or ''))


def formats_of(rec):
    text = ' '.join(rec.get('data') or [])
    return [key for key, _, pattern in FORMATS if re.search(pattern, text)]


def index_source(url):
    parsed = urlparse(url or '')
    for host, label in INDEX_HOSTS.items():
        if (parsed.netloc + parsed.path).startswith(host):
            return label
    return ''


def label_of(rules, key):
    return next(label for k, label, _ in rules if k == key)


def enrich(records):
    """Adds the groups used by the filters and the family head of every record."""
    families = {}
    for rec in records:
        rec['_domain'] = group(rec.get('domain', ''), DOMAINS)
        rec['_task'] = group(rec.get('task', ''), TASKS)
        rec['_formats'] = formats_of(rec)
        rec['_family'] = rec.get('family') or rec['name']
        rec['_index'] = index_source(rec.get('url'))
        rec['_mixed'] = bool(NON_TRAFFIC.search(' '.join(rec.get('data') or [])))
        rec['_ours'] = bool(rec.get('_ours'))
        families.setdefault(rec['_family'], []).append(rec)
    for name, members in families.items():
        head = next((r for r in members if r['name'] == name), members[0])
        for rec in members:
            rec['_head'] = rec is head
            rec['_size'] = len(members)
    return families


def our_records():
    """The datasets released by the Traffic group (data/datasets.json), listed first in the catalogue.

    They are benign mobile-app traffic with ground truth, eligible as reference traffic."""
    with open(site.DATA, encoding='utf-8') as f:
        datasets = json.load(f)['datasets']
    out = []
    for ds in datasets:
        cite = ds.get('citation') or {}
        link = next((l['url'] for l in cite.get('links', []) if l.get('label') in ('DOI', 'Article')), '')
        zen = ds.get('zenodo') or {}
        formats = [f.strip() for f in (ds.get('format') or '').split(',') if f.strip()]
        out.append({
            'id': ds['slug'], 'name': ds['name'], 'url': f'../datasets/{ds["slug"]}.html',
            'task': ('Generative AI app' if ds.get('genai') else 'Mobile-app') + ' traffic classification; benign reference traffic',
            'domain': ('Generative AI mobile apps' if ds.get('genai') else 'Mobile apps') + ' (Android)',
            'data': ['Labeled per-flow traffic'] + formats,
            'paper': {'cite': f'{cite.get("authors", "")}, {cite.get("venue", "")}'.strip(', '),
                      **({'url': link} if link else {})} if cite else None,
            'notes': (f'Released by the Traffic research group. {ds.get("summary", "")} Distributed on Zenodo'
                      + (f' (doi:{zen["doi"]}' if zen.get('doi') else ' (') + (f', {ds["size"]})' if ds.get('size') else ')') + '.'),
            '_ours': True,
        })
    return out


def all_records(data):
    return our_records() + data['records']


# --------------------------------------------------------------------------
# "New" badge and the feature band of the home page
# --------------------------------------------------------------------------

FEATURE_START, FEATURE_END = '<!-- OBSERVATORY-FEATURE:START -->', '<!-- OBSERVATORY-FEATURE:END -->'
FEATURE_PAGES = ['index.html']


def load():
    with open(DATA, encoding='utf-8') as f:
        return json.load(f)


def is_hidden(data=None):
    return bool((data or load()).get('hidden'))


def is_new(data=None):
    """The "New" badge is shown until the "new_until" date of data/observatory.json (included)."""
    until = (data or load()).get('new_until')
    return bool(until) and date.today() <= date.fromisoformat(until)


def new_badge(data=None):
    return '<span class="badge-new">New</span>' if is_new(data) else ''


def feature(prefix, data=None):
    """The band that presents the Observatory, with links relative to the page (prefix '' or '../')."""
    data = data or load()
    records = all_records(data)
    families = len({r.get('family') or r['name'] for r in records})
    snap = date.fromisoformat(data['snapshot'])
    facts = [('Catalogue records', len(records)), ('Independent families', families), ('Updated', f'{snap.day} {snap:%b %Y}')]
    facts_html = '\n'.join(f'          <div><dt>{esc(t)}</dt><dd>{esc(str(v))}</dd></div>' for t, v in facts)
    badge = new_badge(data)
    return f'''    <section class="obs-feature" aria-labelledby="obs-feature-title">
      <div class="container obs-feature-inner">
        <div class="obs-feature-copy">
          <p class="obs-feature-kicker">{esc(data['title'])}{badge}</p>
          <h2 id="obs-feature-title" class="obs-feature-title">{esc(data.get('feature_title') or data['title'])}</h2>
          <p class="obs-feature-text">{esc(data.get('feature_text') or data['lead'])}</p>
          <div class="hero-actions">
            <a href="{prefix}observatory/" class="btn btn-on-deep">Explore the Observatory</a>
            <a href="{prefix}observatory/#submit" class="btn btn-ghost-on-deep">Submit a dataset</a>
          </div>
        </div>
        <dl class="obs-feature-facts">
{facts_html}
        </dl>
      </div>
    </section>'''


def update_features(data):
    """Writes the band between the OBSERVATORY-FEATURE markers of the home page."""
    count = 0
    for rel in FEATURE_PAGES:
        path = os.path.join(ROOT, rel)
        with open(path, encoding='utf-8') as f:
            page = f.read()
        if FEATURE_START not in page:
            continue
        prefix = '../' * rel.count(os.sep)
        band = '' if is_hidden(data) else feature(prefix, data)
        updated = site.replace_block(page, FEATURE_START, FEATURE_END, band, '    ')
        if updated != page:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(updated)
        count += 1
    return count


# --------------------------------------------------------------------------
# Page parts
# --------------------------------------------------------------------------

def stats(data, records, families):
    snap = date.fromisoformat(data['snapshot'])
    items = [
        ('Catalogue records', len(records), 'versions, captures and collections'),
        ('Independent families', len(families), 'after grouping captures and derivatives'),
        ('Updated', f'{snap.day} {snap:%b %Y}', 'counts refer to this date'),
    ]
    return '\n'.join(f'''          <div class="dataset-stat"><dt>{esc(t)}</dt><dd>{esc(str(v))}</dd><p class="obs-stat-note">{esc(n)}</p></div>'''
                     for t, v, n in items)


def facet_values(rec):
    """Every filter value of a record, as group:value (the groups of FACETS)."""
    about = ' '.join([rec['name'], rec.get('task', ''), rec.get('domain', '')])
    data = ' '.join(rec.get('data') or [])
    out = {'domain': [rec['_domain']], 'attack': matches(about, ATTACKS), 'protocol': matches(f'{about} {data}', PROTOCOLS),
           'task': [rec['_task']], 'format': rec['_formats'], 'tool': matches(data, TOOLS),
           'access': [rec.get('access') or 'open'],
           'source': ['ours' if rec['_ours'] else 'index' if rec['_index'] else 'official'],
           'origin': ['group' if rec['_ours'] else 'web' if rec.get('origin') == 'web' else 'list'],
           'modality': ['mixed' if rec['_mixed'] else 'traffic'], 'paper': ['yes' if rec.get('paper') else 'no'],
           'lineage': [v for v, ok in (('original', not rec.get('derived_from') and rec['_size'] == 1),
                                       ('derived', bool(rec.get('derived_from'))), ('member', rec['_size'] > 1)) if ok]}
    return ' '.join(f'{g}:{v}' for g, values in out.items() for v in values)


def ai_catalogue(data, records):
    """What the model knows: one line per family head (members are captures of the same family, not other datasets)."""
    lines = []
    for r in records:
        if not r['_head']:
            continue
        about = ' '.join([r['name'], r.get('task', ''), r.get('domain', '')])
        tags = [label_of(ATTACKS, v) for v in matches(about, ATTACKS)]
        tags += [label_of(PROTOCOLS, v) for v in matches(f'{about} {" ".join(r.get("data") or [])}', PROTOCOLS)]
        extra = [f'family of {r["_size"]} records' if r['_size'] > 1 else '',
                 'found online, not in the reference list' if r.get('origin') == 'web' else '',
                 f'derived from {r["derived_from"]}' if r.get('derived_from') else '',
                 'access on request' if r.get('access') == 'request' else '',
                 'released by the Traffic group' if r['_ours'] else '',
                 'not only network traffic' if r['_mixed'] else '',
                 ('tags: ' + ', '.join(tags)) if tags else '',
                 (r.get('notes') or '')[:160]]
        lines.append(' | '.join([r['id'], r['name'], r.get('domain', ''), r.get('task', ''),
                                 ', '.join(r.get('data') or []), '; '.join(e for e in extra if e)]))
    return {'snapshot': data['snapshot'],
            'columns': 'id | name | domain | security task | traffic data | notes',
            'ids': [r['id'] for r in records if r['_head']], 'text': '\n'.join(lines)}


def facets():
    """The filter groups: (key, title, [(value, label)], open by default)."""
    return [
        ('domain', 'Domain', [(k, label) for k, label, _ in DOMAINS], True),
        ('attack', 'Attack type', [(k, label) for k, label, _ in ATTACKS], True),
        ('protocol', 'Protocol', [(k, label) for k, label, _ in PROTOCOLS], True),
        ('task', 'Security task', [(k, label) for k, label, _ in TASKS], False),
        ('format', 'Traffic data', [(k, label) for k, label, _ in FORMATS], True),
        ('tool', 'File format and tools', [(k, label) for k, label, _ in TOOLS], False),
        ('access', 'Access', [('open', 'Not restricted'), ('request', 'On request')], False),
        ('source', 'Source', [('ours', 'Released by the Traffic group'), ('official', 'Official page'), ('index', 'Secondary index')], True),
        ('modality', 'Modality', [('traffic', 'Network traffic only'), ('mixed', 'Mixed modality')], False),
        ('paper', 'Original publication', [('yes', 'Paper identified'), ('no', 'Not yet linked')], False),
        ('lineage', 'Lineage', [('original', 'Stand-alone dataset'), ('member', 'Part of a family'), ('derived', 'Derived dataset')], False),
        ('origin', 'Origin', [('list', 'Reference list'), ('web', 'Found online'), ('group', 'Traffic group')], False),
    ]


FACET_TOP = 6   # values shown in a filter group before "Show all"


def facet_panel(records):
    counts = {}
    for r in records:
        for gv in r['_facets'].split():
            counts[gv] = counts.get(gv, 0) + 1
    groups = []
    for key, title, values, opened in facets():
        values = [(v, label) for v, label in values if counts.get(f'{key}:{v}')]
        # long groups show their most frequent values first, and only the first ones until "Show all"
        if len(values) > FACET_TOP:
            values.sort(key=lambda vl: -counts[f'{key}:{vl[0]}'])
        options = '\n'.join(
            f'''                <label class="obs-facet{' is-extra' if i >= FACET_TOP else ''}"{f' data-domain="{esc(v)}"' if key == 'domain' else ''}><input type="checkbox" name="{key}" value="{esc(v)}">'''
            + (f'<span class="obs-dot" data-domain="{esc(v)}" aria-hidden="true"></span>' if key == 'domain' else '')
            + f'''<span class="obs-facet-label">{esc(label)}</span><span class="obs-facet-count">{counts[f"{key}:{v}"]}</span></label>'''
            for i, (v, label) in enumerate(values))
        more = (f'\n                <button type="button" class="obs-facet-more" aria-expanded="false" data-more="{len(values) - FACET_TOP}">'
                f'Show all {len(values)}</button>') if len(values) > FACET_TOP else ''
        groups.append(f'''            <details class="obs-facet-group"{' open' if opened else ''}>
              <summary>{esc(title)}<span class="obs-facet-active" data-active-count="{key}" hidden></span></summary>
              <div class="obs-facet-list">
{options}{more}
              </div>
            </details>''')
    return '\n'.join(groups)


MARK = ('<svg class="obs-engine-mark" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
        '<path d="M9 34a15 15 0 0 1 30 0Z"/><path d="M22 20v14M26 20v14" stroke-width="1.4"/>'
        '<path d="m27.5 27.2-13-13 2.8-2.8 13 13Z"/><path d="M6 40h36M12 34v6M36 34v6"/>'
        '<path d="M36 6l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" stroke-width="1.2"/></svg>')


def search_hint(data, records):
    if data.get('ai_endpoint'):
        return 'Search datasets, or describe what you need: “labelled Modbus attacks as PCAP”…'
    return 'Search datasets by name, protocol, attack, domain or data type…'


def ai_attrs(data):
    return f' data-ai="{esc(data["ai_endpoint"])}"' if data.get('ai_endpoint') else ''


def ai_modes(data):
    """Search or chat: two modes of the same bar, shown only with the AI web app."""
    if not data.get('ai_endpoint'):
        return ''
    return '''        <div class="obs-modes" role="group" aria-label="How to search">
          <button type="button" class="obs-mode" data-mode="search" aria-pressed="true"><span class="obs-ai-spark" aria-hidden="true">✦</span> AI-assisted search</button>
          <button type="button" class="obs-mode" data-mode="chat" aria-pressed="false">Chat with the assistant</button>
        </div>
'''


def ai_chat(data):
    if not data.get('ai_endpoint'):
        return ''
    return '''        <section class="obs-chat" id="obs-chat" aria-label="Chat with the Observatory assistant" hidden>
          <div class="obs-chat-log" id="obs-chat-log" aria-live="polite">
            <div class="obs-msg obs-msg-bot"><p>Tell me what you need the data for: the attack or task, the network domain, the format you can work with. I will suggest datasets from the Observatory catalogue and say why each one fits.</p></div>
          </div>
          <form class="obs-chat-form" id="obs-chat-form">
            <label for="obs-chat-q" class="visually-hidden">Your message</label>
            <textarea id="obs-chat-q" rows="2" maxlength="1500" placeholder="e.g. I need a dataset to train an IDS for IoT botnets, with labelled flows I can use without registration"></textarea>
            <button type="submit" class="btn btn-primary">Send</button>
          </form>
          <p class="obs-chat-foot"><button type="button" class="pub-clear" id="obs-chat-new">New conversation</button><span>Answers are generated by a Llama model from the catalogue records: check the source before using a dataset.</span></p>
        </section>
'''


def engine(data, records, families):
    """The opening of the page: a search engine home, on a night sky with the observatory drawing."""
    return f'''    <section class="obs-engine" aria-labelledby="obs-engine-title">
      <div class="container obs-engine-inner">
        <h1 id="obs-engine-title" class="obs-engine-title">{MARK}<span>{esc(data['title'])}</span></h1>
        <p class="obs-engine-tagline">{esc(data.get('tagline') or data['lead'])}</p>
{ai_modes(data)}        <form class="obs-search" role="search" action="#catalogue" id="obs-search-form"{ai_attrs(data)}>
          <label for="obs-q" class="visually-hidden">Search the catalogue</label>
          <input type="search" id="obs-q" name="q" placeholder="{search_hint(data, records)}" autocomplete="off" spellcheck="false" maxlength="500">
          <button type="submit" class="btn btn-primary">Search</button>
        </form>
{ai_chat(data)}
        <ul class="obs-engine-stats" aria-label="The catalogue in numbers">
          <li><strong>{len(records)}</strong> records</li>
          <li><strong>{len(families)}</strong> independent families</li>
        </ul>
        <div class="obs-engine-submit">
          <p><strong>Have you released a network-traffic dataset?</strong> Propose it for the Observatory, or tell us about one that is missing.</p>
          <a href="#submit" class="btn btn-gold"><span aria-hidden="true">+</span> Submit your dataset</a>
        </div>
      </div>
    </section>'''


def item(rec):
    """One record: a card, or a row of the table view (the same markup, laid out by css)."""
    attrs = {
        'data-id': rec['id'], 'data-family': rec['_family'],
        'data-head': 'true' if rec['_head'] else 'false', 'data-domain': rec['_domain'],
        'data-facets': rec['_facets'],
        'data-search': ' '.join([rec['name'], rec.get('task', ''), rec.get('domain', ''), ' '.join(rec.get('data') or []),
                                 rec.get('family') or '', rec.get('derived_from') or '', label_of(DOMAINS, rec['_domain']),
                                 'traffic group mirage' if rec['_ours'] else '', 'found online' if rec.get('origin') == 'web' else '',
                                 label_of(TASKS, rec['_task'])] + [label_of(FORMATS, f) for f in rec['_formats']]
                                + [label for k, label, _ in ATTACKS + PROTOCOLS if f'attack:{k}' in rec['_facets'].split()
                                   or f'protocol:{k}' in rec['_facets'].split()]).lower(),
    }
    family = ''
    if rec['_size'] > 1 and rec['_head']:
        family = (f'<button type="button" class="obs-family" data-expand="{esc(rec["_family"])}" aria-expanded="false">'
                  f'+ {rec["_size"] - 1} more in this family</button>')
    elif rec['_size'] > 1:
        family = f'<span class="obs-sub">Family: {esc(rec["_family"])}</span>'
    if rec.get('derived_from'):
        family += f'<span class="obs-sub">Derived from {esc(rec["derived_from"])}</span>'
    marks = ''
    if rec['_ours']:
        marks += '<span class="tag tag-accent">Traffic group</span>'
    if rec.get('origin') == 'web':
        marks += '<span class="tag tag-new" title="Found online, not in the reference list">Found online</span>'
    if rec.get('access') == 'request':
        marks += '<span class="tag">On request</span>'
    if rec['_mixed']:
        marks += '<span class="tag" title="Part of the data is not network traffic: the traffic component must be verified">Mixed modality</span>'
    source = (f'<a href="{esc(rec["url"])}">Our dataset page</a>' if rec['_ours'] else
              f'<a href="{esc(rec["url"])}" target="_blank" rel="noopener">{"Index" if rec["_index"] else "Official page"}<span class="visually-hidden"> (opens in a new tab)</span></a>'
              + (f'<span class="obs-sub">via {esc(rec["_index"])}</span>' if rec['_index'] else '')) if rec.get('url') else '—'
    data = rec.get('data') or []
    chips = ''.join(f'<li>{esc(d)}</li>' for d in data[:4]) + (f'<li class="obs-more">+{len(data) - 4}</li>' if len(data) > 4 else '')
    attr = ' '.join(f'{k}="{esc(v)}"' for k, v in attrs.items())
    return f'''              <article class="obs-item" {attr}>
                <p class="obs-c-domain"><span class="obs-dot" data-domain="{rec['_domain']}" aria-hidden="true"></span><span>{esc(rec.get('domain') or label_of(DOMAINS, rec['_domain']))}</span></p>
                <div class="obs-c-name"><h3><button type="button" class="obs-name" data-open="{esc(rec['id'])}">{esc(rec['name'])}</button></h3>{family}{f'<span class="obs-marks">{marks}</span>' if marks else ''}</div>
                <p class="obs-c-task">{esc(rec.get('task') or '—')}</p>
                <ul class="obs-c-data" aria-label="Traffic data">{chips or '<li>—</li>'}</ul>
                <p class="obs-c-src">{source}</p>
              </article>'''


def submit_form(data):
    domain_options = '\n'.join(f'              <option>{esc(label)}</option>' for _, label, _ in DOMAINS)
    data_boxes = '\n'.join(f'              <label class="obs-check"><input type="checkbox" name="data" value="{esc(label)}"> {esc(label)}</label>'
                           for _, label, _ in FORMATS)
    return f'''    <section class="section" id="submit">
      <div class="container obs-submit">
        <div class="obs-submit-intro">
          <div class="section-head"><h2 class="section-title">Submit your dataset</h2></div>
          <p>If you have collected and released a network-traffic dataset for cybersecurity research, propose it for the Observatory:
          it will be listed with its paper and distribution source.</p>
          <p>You can also point us to a dataset by others that is not in the catalogue, or report that the information about a listed
          dataset has changed. Every submission is reviewed against the eligibility criterion before it is added.</p>
          <p class="obs-criterion">{esc(data['eligibility'])}</p>
        </div>
        <form class="obs-form" id="obs-form" data-endpoint="{esc(data.get('submit_endpoint') or '')}" data-contact="{esc(data.get('contact') or '')}" data-cc="{esc(','.join(data.get('cc') or []))}" novalidate>
          <fieldset>
            <legend>The dataset</legend>
            <div class="gate-grid">
              <label class="gate-wide">Dataset name *<input name="dataset" required placeholder="e.g. CICIoT2023"></label>
              <label class="gate-wide">Landing page or download URL *<input name="url" type="url" required placeholder="https://"></label>
              <label class="gate-wide"><span>Paper describing it <small>(DOI or link, optional)</small></span><input name="paper"></label>
              <label>Domain<select name="domain"><option value="">Choose…</option>
{domain_options}
              </select></label>
              <label>Access<select name="access"><option value="">Choose…</option><option>Open download</option><option>Free registration</option><option>On request</option><option>Not yet public</option></select></label>
              <label class="gate-wide">Security task<input name="task" placeholder="e.g. intrusion detection, C2 detection, misbehavior detection"></label>
            </div>
            <p class="obs-form-label">Traffic data distributed</p>
            <div class="obs-checks">
{data_boxes}
            </div>
            <label class="obs-wide-label">Short description *<textarea name="description" rows="4" required placeholder="Capture environment, attacks covered, size, labels, license…"></textarea></label>
          </fieldset>
          <fieldset>
            <legend>About you</legend>
            <div class="gate-grid">
              <label>Name *<input name="name" autocomplete="name" required></label>
              <label>Organization *<input name="organization" autocomplete="organization" required></label>
              <label>Email *<input name="email" type="email" autocomplete="email" required></label>
              <label>Role<select name="role"><option>Author of the dataset</option><option>User of the dataset</option><option>Other</option></select></label>
            </div>
          </fieldset>
          <label class="gate-check"><input type="checkbox" name="consent" required>
            <span>I agree that these details are stored by the Traffic research group only to review this submission and, if needed, to contact me about it.</span></label>
          <p class="gate-error" role="alert" hidden></p>
          <p class="obs-done" role="status" hidden></p>
          <div class="gate-actions"><button type="submit" class="btn btn-primary">Submit the dataset</button></div>
        </form>
      </div>
    </section>'''


def page_data(records):
    """The record details shown in the dialog (the table carries only what the filters need)."""
    keep = ('id', 'name', 'url', 'task', 'domain', 'data', 'access', 'family', 'derived_from', 'paper', 'notes')
    out = []
    for r in records:
        item = {k: r[k] for k in keep if r.get(k)}
        item.update(size=r['_size'], index=r['_index'], mixed=r['_mixed'], ours=r['_ours'],
                    domainGroup=label_of(DOMAINS, r['_domain']))
        out.append(item)
    payload = json.dumps({'records': out}, ensure_ascii=False, separators=(',', ':'))
    return payload.replace('</', '<\\/')


def observatory_page(data):
    records = all_records(data)
    families = enrich(records)
    about = '\n'.join('          <p>' + re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', esc(p)) + '</p>' for p in data['about'])
    units = '\n'.join(f'            <li><strong>{esc(u["name"])}</strong> {esc(u["text"])}</li>' for u in data['units'])
    for r in records:
        r['_facets'] = facet_values(r)
    rows = '\n'.join(item(r) for r in records)
    hero = engine(data, records, families)

    main = f'''{hero}

    <section class="section section-alt obs-results" id="catalogue">
      <div class="container">
        <div class="obs-browse">
          <aside class="obs-facets" id="obs-facets" aria-label="Filters">
            <div class="obs-facets-head">
              <p class="obs-facets-title">Filters</p>
              <button type="button" class="pub-clear" id="obs-clear" hidden>Clear all</button>
            </div>
{facet_panel(records)}
          </aside>
          <div class="obs-main">
            <section class="obs-ai" id="obs-ai" aria-live="polite" aria-label="AI-assisted results" hidden></section>
            <div class="obs-bar">
              <button type="button" class="btn btn-ghost obs-facets-toggle" id="obs-facets-toggle" aria-controls="obs-facets" aria-expanded="false">Filters<span id="obs-facets-n"></span></button>
              <label class="obs-sort"><span>Sort by</span><select id="obs-sort"><option value="catalogue">Catalogue order</option><option value="name">Name A–Z</option></select></label>
              <div class="obs-view" role="group" aria-label="Layout">
                <button type="button" data-view="cards" aria-pressed="true" title="Cards"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1"/><rect x="9" y="9" width="5.5" height="5.5" rx="1"/></svg><span class="visually-hidden">Cards</span></button>
                <button type="button" data-view="table" aria-pressed="false" title="Table"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 3h13M1.5 8h13M1.5 13h13"/></svg><span class="visually-hidden">Table</span></button>
              </div>
            </div>
            <div class="obs-active" id="obs-active" hidden></div>
            <div class="obs-list-wrap">
              <div class="obs-list-head" aria-hidden="true"><span>Dataset</span><span>Domain</span><span>Security task</span><span>Traffic data</span><span>Source</span></div>
              <div class="obs-list" id="obs-list">
{rows}
              </div>
              <p class="pub-empty" id="obs-empty" hidden>No dataset matches this search. Try fewer words or remove a filter.</p>
            </div>
            <p class="obs-note">Counts are catalogue records of the {date.fromisoformat(data['snapshot']).day} {date.fromisoformat(data['snapshot']):%B %Y} snapshot, not estimates of how many datasets are available.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section page-body" id="about">
      <div class="container">
        <div class="section-head"><h2 class="section-title">About the Observatory</h2></div>
        <div class="obs-about">
          <div class="prose">
{about}
          </div>
          <aside class="obs-units" aria-label="Units of analysis">
            <p class="card-kicker">Units of analysis</p>
            <ul>
{units}
            </ul>
          </aside>
        </div>
        <dl class="dataset-stats obs-stats">
{stats(data, records, families)}
        </dl>
      </div>
    </section>

{submit_form(data)}

    <dialog class="gate obs-dialog" id="obs-dialog" aria-labelledby="obs-dialog-title">
      <div class="gate-form">
        <button type="button" class="gate-close" data-dialog-close aria-label="Close">×</button>
        <div data-dialog-body></div>
      </div>
    </dialog>
    <script type="application/json" id="obs-data">{page_data(records)}</script>'''

    page = site.frame(f'{data["title"]} | Traffic',
                      'Curated catalogue of network-traffic datasets for AI-based cybersecurity, linked to their papers and distribution sources.',
                      main, 'observatory')
    if is_hidden(data):
        page = page.replace('<meta name="viewport"', '<meta name="robots" content="noindex, nofollow">\n  <meta name="viewport"', 1)
    # frame() adds the Datasets script; this page has its own.
    page = re.sub(r'\n  <script src="\.\./js/datasets\.js(?:\?v=[0-9a-f]*)?" defer></script>',
                  '\n  <script src="../js/observatory.js" defer></script>', page, count=1)
    return page


def build():
    data = load()
    with open(site.DATA, encoding='utf-8') as f:   # the notes of the Datasets menu
        ds = json.load(f)
    site.MENU_NOTES.update(mirage=site.page(ds, 'menu_mirage'), genai=site.page(ds, 'menu_genai'))
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(observatory_page(data))
    records = all_records(data)
    enrich(records)
    with open(os.path.join(OUT, 'catalogue.json'), 'w', encoding='utf-8') as f:
        json.dump(ai_catalogue(data, records), f, ensure_ascii=False, indent=1)
        f.write('\n')
    return len(all_records(data)), update_features(data)


if __name__ == '__main__':
    count, bands = build()
    import stamp_assets
    stamp_assets.stamp()
    print(f'Observatory page rebuilt: {count} records in observatory/index.html, feature band in {bands} pages')
