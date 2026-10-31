/**
 * The Cybersecurity Dataset Observatory (observatory/, js/observatory.js): the "Submit your dataset"
 * form (action "observatory_submission") and the email updates of the bell (action
 * "observatory_subscribe", the unsubscribe link and the weekly notifyNewDatasets()).
 *
 * The emails leave from the Google account that publishes this script: for now Gabriele
 * Mangiacapre's, later the institutional account of the Observatory. To move it, repeat the setup
 * with the new account and paste the new /exec URL in "submit_endpoint" of data/observatory.json
 * (copy the two sheets over to keep the subscribers).
 *
 * Setup (once):
 *  1. With the sending account, create a Google Sheet (e.g. "Observatory").
 *  2. In the sheet: Extensions -> Apps Script. Replace the code with this file and save.
 *  3. Deploy -> New deployment -> type "Web app".
 *       Execute as: Me            Who has access: Anyone
 *     Authorize when asked, then copy the Web app URL (it ends with /exec).
 *  4. Paste the URL in "submit_endpoint" of data/observatory.json and rebuild (or push).
 *  5. Triggers -> Add trigger -> notifyNewDatasets, Time-driven, Week timer, every Monday, 10am to 11am. Only the datasets ticked
 *     "Email the subscribers" in the Observatory tab of the site editor (admin/people/) are announced.
 * Optional Script properties (Project Settings):
 *   OBSERVATORY_FROM      a "Send mail as" alias of the account to send from (e.g. a Gmail account
 *                         with the unina address added as alias); default: the account itself
 *   OBSERVATORY_REPLY_TO  where the replies of subscribers go; default: the first of OBSERVATORY_TEAM
 *
 * After editing this code, publish it with Deploy -> Manage deployments -> Edit ->
 * Version: New version (the URL stays the same).
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.action === 'observatory_submission') return addSubmission(data);
  if (data.action === 'observatory_subscribe') return addSubscriber(data);
  // the Observatory tab of the site editor (admin/people/), only with a GitHub token that can write to the site
  if (['list_submissions', 'mark_submission', 'list_subscribers', 'notify_now'].includes(data.action)) {
    if (!canRead(data.token)) return json({ ok: false, error: 'This GitHub account cannot read the Observatory sheet.' });
    if (data.action === 'list_submissions') return json({ ok: true, rows: sheetRows(SUBMISSIONS_SHEET, SUBMISSION_COLUMNS, ['date'].concat(SUBMISSION_FIELDS, ['status'])) });
    if (data.action === 'mark_submission') return markSubmission(data);
    if (data.action === 'list_subscribers') {
      return json({ ok: true, sent: sentIds(), rows: sheetRows(SUBSCRIBERS_SHEET, SUBSCRIBER_COLUMNS,
        ['date', 'first_name', 'last_name', 'organization', 'role', 'email', 'domains', 'token', 'status']).map(r => { delete r.token; return r; }) });
    }
    return json(Object.assign({ ok: true }, notifyNewDatasets()));
  }
  return ContentService.createTextOutput('error: unknown action');
}

const REPO = 'traffic-arclab/traffic-arclab.github.io';

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

/** True when the token belongs to someone who can write to the site repository (cached for 10 minutes). */
function canRead(token) {
  if (!token || typeof token !== 'string') return false;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token);
  const key = 'gh:' + Utilities.base64EncodeWebSafe(digest);
  const cache = CacheService.getScriptCache();
  if (cache.get(key) === 'yes') return true;
  const response = UrlFetchApp.fetch('https://api.github.com/repos/' + REPO, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'traffic-observatory' },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) return false;
  const repo = JSON.parse(response.getContentText());
  const allowed = Boolean(repo.permissions && repo.permissions.push);
  if (allowed) cache.put(key, 'yes', 600);
  return allowed;
}

/** The rows of a sheet as objects with the given keys, plus "row" (the sheet row number). */
function sheetRows(name, columns, keys) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const width = Math.max(columns.length, Math.min(keys.length, sheet.getLastColumn()));
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues().map((r, i) => {
    const out = { row: i + 2 };
    keys.forEach((k, j) => { out[k] = r[j] instanceof Date ? r[j].toISOString() : (r[j] == null ? '' : String(r[j])); });
    return out;
  });
}

/** The editor marks a submission as added or rejected (last column, "Status"), if the row still holds that dataset. */
function markSubmission(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SUBMISSIONS_SHEET);
  const row = Number(data.row);
  if (!sheet || !(row >= 2) || String(sheet.getRange(row, 2).getValue()) !== String(data.dataset)) {
    return json({ ok: false, error: 'The sheet changed meanwhile: refresh and try again.' });
  }
  const status = ['new', 'added', 'rejected'].includes(data.status) ? data.status : 'new';
  sheet.getRange(1, SUBMISSION_COLUMNS.length + 1).setValue('Status');
  sheet.getRange(row, SUBMISSION_COLUMNS.length + 1).setValue(status);
  return json({ ok: true });
}

// Every email of the Observatory: from the account (or its OBSERVATORY_FROM alias), with the Observatory's name.
function sendObservatoryEmail(message) {
  const from = PropertiesService.getScriptProperties().getProperty('OBSERVATORY_FROM');
  const options = { name: OBSERVATORY_NAME, replyTo: message.replyTo || observatoryReplyTo() };
  if (message.cc) options.cc = message.cc;
  if (from) options.from = from;
  if (message.html) options.htmlBody = message.html;
  GmailApp.sendEmail(message.to, message.subject, message.body, options);
}

// ---------------------------------------------------------------- the look of the emails
// One layout for every email: the navy band of the Observatory, the text, an optional button, and the
// footer with the Traffic logo, the University and DIETI. Tables and inline styles: what email apps read.
const SITE_URL = 'https://traffic-arclab.github.io/';
const MAIL_LOGO = SITE_URL + 'images/email/traffic-brand.png';
const DOMAIN_COLOURS = { automotive: '#d9822b', uav: '#8e6bd1', industrial: '#b5543c', v2x: '#d0567f', '5g': '#1f7a5c',
  ddos: '#8c5a2b', sdn: '#2f6fb0', honeypot: '#b0782f', wireless: '#23a197', iot: '#3a8bd6', mobile: '#4f9a3a',
  malware: '#c9384a', encrypted: '#5563d9', web: '#c39a17', backbone: '#3f7f93', benign: '#8aa63a', enterprise: '#7a8695' };
const SANS = "'Source Sans 3','Segoe UI',Helvetica,Arial,sans-serif";
const SERIF = "'Source Serif 4',Georgia,'Times New Roman',serif";

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function domainPill(key, label) {
  const colour = DOMAIN_COLOURS[key] || '#7a8695';
  return '<span style="display:inline-block;margin:0 6px 6px 0;padding:3px 10px;border-radius:999px;background:' + colour
    + ';color:#ffffff;font:700 12px/1.5 ' + SANS + ';white-space:nowrap">' + escapeHtml(label || key) + '</span>';
}

function mailButton(label, url) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 4px"><tr><td style="border-radius:8px;background:#a5842c">'
    + '<a href="' + escapeHtml(url) + '" style="display:inline-block;padding:12px 22px;color:#ffffff;font:700 15px ' + SANS
    + ';text-decoration:none;border-radius:8px">' + escapeHtml(label) + '</a></td></tr></table>';
}

/** The whole email: kicker and title in the navy band, then the content (HTML) and the footer. */
function mailLayout(parts) {
  const unsubscribe = parts.unsubscribe
    ? '<p style="margin:14px 0 0;font:13px/1.5 ' + SANS + ';color:#7a8695">You receive this email because you subscribed to the Observatory updates. '
      + '<a href="' + escapeHtml(parts.unsubscribe) + '" style="color:#5f6d7c">Unsubscribe</a></p>' : '';
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;padding:0;background:#eef2f6">'
    + '<span style="display:none;max-height:0;overflow:hidden;opacity:0">' + escapeHtml(parts.preheader || '') + '</span>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6"><tr><td align="center" style="padding:28px 12px">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #dce3eb">'
    // the band
    + '<tr><td style="padding:26px 32px 24px;background:#0b2545;border-bottom:3px solid #a5842c">'
    + '<p style="margin:0 0 6px;font:700 12px/1.4 ' + SANS + ';letter-spacing:.14em;text-transform:uppercase;color:#d9c28a">Cybersecurity Dataset Observatory</p>'
    + '<h1 style="margin:0;font:600 26px/1.25 ' + SERIF + ';color:#ffffff">' + escapeHtml(parts.title) + '</h1></td></tr>'
    // the content
    + '<tr><td style="padding:28px 32px 8px;font:16px/1.6 ' + SANS + ';color:#1b2531">' + parts.content
    + (parts.button ? mailButton(parts.button.label, parts.button.url) : '') + '</td></tr>'
    + '<tr><td style="padding:8px 32px 26px;font:16px/1.6 ' + SANS + ';color:#1b2531">' + (parts.signature === false ? ''
      : '<p style="margin:16px 0 0">The Observatory team<br><span style="color:#5f6d7c">Francesco Cerasuolo, Gabriele Mangiacapre, Antonio Pescapè</span></p>') + '</td></tr>'
    // the footer: logo, University, DIETI
    + '<tr><td style="padding:22px 32px 26px;background:#f6f8fb;border-top:1px solid #dce3eb">'
    + '<a href="' + SITE_URL + '"><img src="' + MAIL_LOGO + '" width="260" alt="Traffic Research Group · Network Monitoring and Measurements" style="display:block;width:260px;max-width:100%;height:auto;border:0"></a>'
    + '<p style="margin:14px 0 0;font:14px/1.55 ' + SANS + ';color:#5f6d7c">'
    + '<a href="https://www.unina.it/" style="color:#0b2545;font-weight:700;text-decoration:none">University of Napoli Federico II</a><br>'
    + '<a href="https://www.dieti.unina.it/" style="color:#5f6d7c;text-decoration:none">Department of Electrical Engineering and Information Technology (DIETI)</a><br>'
    + 'Via Claudio 21, 80125 Napoli, Italy</p>'
    + '<p style="margin:10px 0 0;font:14px/1.5 ' + SANS + '"><a href="' + OBSERVATORY_URL + '" style="color:#1b5b93">The Observatory</a>'
    + ' &nbsp;·&nbsp; <a href="' + SITE_URL + '" style="color:#1b5b93">Traffic Research Group</a></p>'
    + unsubscribe + '</td></tr>'
    + '</table></td></tr></table></body></html>';
}

/** One dataset in an email: name, year, domain, task and its links. */
function datasetCard(d, labels) {
  const link = OBSERVATORY_URL + '?q=' + encodeURIComponent(d.name) + '#catalogue';
  const colour = DOMAIN_COLOURS[d.domain] || '#7a8695';
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;border:1px solid #dce3eb;border-left:4px solid ' + colour + ';border-radius:8px">'
    + '<tr><td style="padding:14px 16px">' + domainPill(d.domain, labels[d.domain])
    + '<p style="margin:2px 0 2px;font:600 19px/1.3 ' + SERIF + '"><a href="' + escapeHtml(link) + '" style="color:#0b2545;text-decoration:none">' + escapeHtml(d.name) + '</a>'
    + (d.year ? ' <span style="font:400 14px ' + SANS + ';color:#5f6d7c">' + escapeHtml(d.year) + '</span>' : '') + '</p>'
    + (d.task ? '<p style="margin:0;font:15px/1.5 ' + SANS + ';color:#3d4a59">' + escapeHtml(d.task) + '</p>' : '')
    + (d.paper ? '<p style="margin:4px 0 0;font:italic 14px/1.5 ' + SANS + ';color:#5f6d7c">' + escapeHtml(d.paper) + '</p>' : '')
    + '<p style="margin:8px 0 0;font:700 14px ' + SANS + '"><a href="' + escapeHtml(link) + '" style="color:#1b5b93">View in the Observatory</a>'
    + (d.url ? ' &nbsp;·&nbsp; <a href="' + escapeHtml(d.url) + '" style="color:#1b5b93">Download page</a>' : '') + '</p>'
    + '</td></tr></table>';
}

// ---------------------------------------------------------------- submissions
// The "Submit a dataset" form of observatory/ (js/observatory.js): one row per submission.
const SUBMISSIONS_SHEET = 'Observatory submissions';
const SUBMISSION_COLUMNS = ['Date', 'Dataset', 'URL', 'Paper', 'Domain', 'Access', 'Security task', 'Traffic data',
  'Description', 'Name', 'Organization', 'Email', 'Role', 'Page',
  'Year', 'Size', 'Derivation tool', 'Artifacts', 'Capture scenario', 'Labels', 'Benign traffic', 'Attack classes',
  'Attack families', 'Lineage', 'Derived from', 'Family', 'Licence'];
const SUBMISSION_FIELDS = ['dataset', 'url', 'paper', 'domain', 'access', 'task', 'data',
  'description', 'name', 'organization', 'email', 'role', 'page',
  'year', 'size', 'derivation_tool', 'artifact', 'acquisition', 'labeling', 'benign', 'attack_classes',
  'attack_families', 'lineage', 'parents', 'family', 'licence'];
// Who receives an email for every submission (the first one in To, the others in Cc).
const OBSERVATORY_TEAM = ['gabriele.mangiacapre@unina.it', 'francesco.cerasuolo@unina.it'];

function addSubmission(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(SUBMISSIONS_SHEET) || book.insertSheet(SUBMISSIONS_SHEET);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(SUBMISSION_COLUMNS);
      sheet.setFrozenRows(1);
    }
    // Same plain-text rule as the downloads; the description may be longer.
    const text = (value, size) => {
      const s = String(value == null ? '' : value).slice(0, size || 300);
      return /^[=+\-@]/.test(s) ? "'" + s : s;
    };
    sheet.appendRow([new Date()].concat(SUBMISSION_FIELDS.map(f => text(data[f], f === 'description' ? 3000 : 300))));
    // and an email to the team, with every field that was filled in
    const lines = SUBMISSION_FIELDS.map((f, i) => data[f] ? SUBMISSION_COLUMNS[i + 1] + ': ' + String(data[f]).slice(0, 3000) : '')
      .filter(Boolean);
    const rows = SUBMISSION_FIELDS.map((f, i) => data[f] && f !== 'page' ? '<tr><td style="padding:7px 12px 7px 0;vertical-align:top;white-space:nowrap;font:700 13px ' + SANS
      + ';color:#5f6d7c;text-transform:uppercase;letter-spacing:.05em">' + escapeHtml(SUBMISSION_COLUMNS[i + 1]) + '</td><td style="padding:7px 0;font:15px/1.5 ' + SANS
      + ';color:#1b2531;border-bottom:1px solid #eef2f6">' + escapeHtml(String(data[f]).slice(0, 3000)) + '</td></tr>' : '').join('');
    sendObservatoryEmail({
      to: OBSERVATORY_TEAM[0], cc: OBSERVATORY_TEAM.slice(1).join(','), replyTo: String(data.email || ''),
      subject: 'Observatory dataset submission: ' + String(data.dataset || '').slice(0, 120),
      body: lines.join('\n'),
      html: mailLayout({
        title: 'New dataset submission', preheader: String(data.dataset || '') + ' submitted by ' + String(data.name || ''), signature: false,
        content: '<p style="margin:0 0 16px"><strong>' + escapeHtml(data.name) + '</strong>' + (data.organization ? ' (' + escapeHtml(data.organization) + ')' : '')
          + ' proposed <strong>' + escapeHtml(data.dataset) + '</strong> for the Observatory. Reply to this email to write to them.</p>'
          + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + rows + '</table>',
        button: { label: 'Review it in the editor', url: SITE_URL + 'admin/people/#observatory' },
      }),
    });
    // and a thank-you to whoever submitted it
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(data.email || ''))) {
      sendObservatoryEmail({
        to: String(data.email),
        subject: 'Thank you for your submission: ' + String(data.dataset || '').slice(0, 120),
        body: 'Dear ' + String(data.name || '') + ',\n\nthank you for proposing ' + String(data.dataset || '') + ' for the Cybersecurity Dataset Observatory. '
          + 'We will review it against the eligibility criterion and write to you if we need more details.\n\n' + OBSERVATORY_URL,
        html: mailLayout({
          title: 'Thank you for your submission', preheader: 'We received ' + String(data.dataset || '') + ' and will review it soon.',
          content: '<p style="margin:0 0 14px">Dear ' + escapeHtml(data.name) + ',</p>'
            + '<p style="margin:0 0 14px">thank you for proposing <strong>' + escapeHtml(data.dataset) + '</strong> for the Cybersecurity Dataset Observatory.</p>'
            + '<p style="margin:0">We will review it against the eligibility criterion and add it to the catalogue with its paper and distribution source. '
            + 'If we need more details, we will reply to this address.</p>',
          button: { label: 'Browse the Observatory', url: OBSERVATORY_URL },
        }),
      });
    }
    return ContentService.createTextOutput('ok');
  } catch (error) {
    return ContentService.createTextOutput('error: ' + error);
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------- email updates
// The bell of observatory/ (js/observatory.js, action "observatory_subscribe"): one row per subscriber in
// "Observatory subscribers", a confirmation email, and an unsubscribe link (doGet below).
// New datasets: notifyNewDatasets() reads observatory/updates.json (written by scripts/build_observatory.py),
// which lists only the datasets ticked "Email the subscribers" in the editor, and announces each of them once.
// Add a time-driven trigger: Triggers -> Add trigger -> notifyNewDatasets, Time-driven, Week timer, Monday, 10am to 11am:
// one email a week with the datasets added since the previous Monday.
const OBSERVATORY_NAME = 'Cybersecurity Dataset Observatory';
const OBSERVATORY_URL = 'https://traffic-arclab.github.io/observatory/';
const SUBSCRIBERS_SHEET = 'Observatory subscribers';
const SUBSCRIBER_COLUMNS = ['Date', 'First name', 'Last name', 'Affiliation', 'Role', 'Email', 'Domains', 'Token', 'Status'];

function observatoryReplyTo() {
  return PropertiesService.getScriptProperties().getProperty('OBSERVATORY_REPLY_TO') || OBSERVATORY_TEAM[0];
}

function subscribersSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(SUBSCRIBERS_SHEET) || book.insertSheet(SUBSCRIBERS_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SUBSCRIBER_COLUMNS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function domainNames(domains, labels) {
  return domains === 'all' ? 'all domains' : domains.split(',').map(k => labels[k] || k).join(', ');
}

function addSubscriber(data) {
  const email = String(data.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return ContentService.createTextOutput('error: email');
  const text = value => {
    const s = String(value == null ? '' : value).slice(0, 300);
    return /^[=+\-@]/.test(s) ? "'" + s : s;
  };
  const domains = String(data.categories || '').replace(/[^a-z0-9,]/g, '') || 'all';
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let token;
  try {
    const sheet = subscribersSheet();
    // the same address subscribes again: its row is updated, not duplicated
    const rows = sheet.getDataRange().getValues();
    const at = rows.findIndex((r, i) => i > 0 && String(r[5]).toLowerCase() === email);
    token = at > 0 ? rows[at][7] : Utilities.getUuid();
    const row = [new Date(), text(data.first_name), text(data.last_name), text(data.organization), text(data.role), email,
      domains, token, 'active'];
    if (at > 0) sheet.getRange(at + 1, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  const feed = observatoryFeed();
  const labels = feed ? feed.domains : {};
  const pills = domains === 'all' ? '<p style="margin:0 0 14px">' + domainPill('enterprise', 'All domains').replace('#7a8695', '#0b2545') + '</p>'
    : '<p style="margin:0 0 14px">' + domains.split(',').map(k => domainPill(k, labels[k])).join('') + '</p>';
  sendObservatoryEmail({
    to: email,
    subject: 'You are subscribed to the Cybersecurity Dataset Observatory',
    html: mailLayout({
      title: 'Welcome, ' + String(data.first_name || '').trim() + '!',
      preheader: 'You will hear from us when new datasets are added to your domains.',
      content: '<p style="margin:0 0 14px">Thank you for subscribing to the updates of the Cybersecurity Dataset Observatory, '
        + 'the curated catalogue of network-traffic datasets for AI in cybersecurity.</p>'
        + '<p style="margin:0 0 10px">We will write to you when new datasets are added to:</p>' + pills
        + '<p style="margin:0">Every Monday we send you the datasets added during the week, with their domain, the paper that introduced them and where to download them.</p>',
      button: { label: 'Browse the catalogue', url: OBSERVATORY_URL },
      unsubscribe: unsubscribeLink(token),
    }),
    body: 'Dear ' + String(data.first_name || '').trim() + ',\n\n'
      + 'thank you for subscribing. You will receive an email when new datasets are added to: '
      + domainNames(domains, feed ? feed.domains : {}) + '.\n\n'
      + 'Browse the catalogue: ' + OBSERVATORY_URL + '\n'
      + 'Unsubscribe at any time: ' + unsubscribeLink(token) + '\n\n'
      + 'The Traffic research group, University of Napoli Federico II',
  });
  return ContentService.createTextOutput('ok');
}

function unsubscribeLink(token) {
  return ScriptApp.getService().getUrl() + '?unsubscribe=' + encodeURIComponent(token);
}

// The unsubscribe link of every email: marks the row as unsubscribed.
function doGet(e) {
  const token = e && e.parameter && e.parameter.unsubscribe;
  if (!token) return HtmlService.createHtmlOutput('Nothing to do.');
  const sheet = subscribersSheet();
  const rows = sheet.getDataRange().getValues();
  const at = rows.findIndex((r, i) => i > 0 && r[7] === token);
  if (at > 0) sheet.getRange(at + 1, 9).setValue('unsubscribed');
  return HtmlService.createHtmlOutput('<p style="font:16px sans-serif;margin:40px">'
    + (at > 0 ? 'You have been unsubscribed from the Cybersecurity Dataset Observatory updates.' : 'This link is no longer valid.')
    + ' <a href="' + OBSERVATORY_URL + '">Back to the Observatory</a></p>');
}

function observatoryFeed() {
  try {
    return JSON.parse(UrlFetchApp.fetch(OBSERVATORY_URL + 'updates.json', { muteHttpExceptions: true }).getContentText());
  } catch (error) {
    return null;
  }
}

function sentIds() {
  return JSON.parse(PropertiesService.getScriptProperties().getProperty('OBSERVATORY_SENT') || '[]');
}

// Every Monday (and "Send pending emails now" in the editor): the datasets of updates.json, which lists only the ones
// ticked "Email the subscribers" in the editor, that were never announced, sent to the subscribers of their domains.
function notifyNewDatasets() {
  const feed = observatoryFeed();
  if (!feed) return { datasets: 0, emails: 0, error: 'updates.json could not be read' };
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sent = new Set(sentIds());
    const fresh = feed.datasets.filter(d => !sent.has(d.id));
    if (!fresh.length) return { datasets: 0, emails: 0 };
    let emails = 0;
    const rows = subscribersSheet().getDataRange().getValues().slice(1).filter(r => r[8] === 'active');
    rows.forEach(r => {
      const domains = String(r[6]);
      const mine = domains === 'all' ? fresh : fresh.filter(d => domains.split(',').includes(d.domain));
      if (!mine.length) return;
      const list = mine.map(d => '- ' + d.name + (d.year ? ' (' + d.year + ')' : '') + ', ' + (feed.domains[d.domain] || d.domain)
        + (d.task ? ': ' + d.task : '') + '\n  ' + OBSERVATORY_URL + '?q=' + encodeURIComponent(d.name) + '#catalogue').join('\n');
      sendObservatoryEmail({
        to: r[5],
        subject: 'This week in the Observatory: ' + (mine.length === 1 ? mine[0].name : mine.length + ' new datasets'),
        html: mailLayout({
          title: 'This week in the Observatory',
          preheader: mine.map(d => d.name).join(', '),
          content: '<p style="margin:0 0 14px">Dear ' + escapeHtml(r[1]) + ',</p>'
            + '<p style="margin:0 0 18px">this week ' + (mine.length === 1 ? 'a new dataset has' : mine.length + ' new datasets have')
            + ' been added to the domains you follow:</p>' + mine.map(d => datasetCard(d, feed.domains)).join(''),
          button: { label: 'Explore the Observatory', url: OBSERVATORY_URL },
          unsubscribe: unsubscribeLink(r[7]),
        }),
        body: 'Dear ' + r[1] + ',\n\nthis week new datasets have been added to the domains you follow:\n\n' + list + '\n\n'
          + 'Browse the catalogue: ' + OBSERVATORY_URL + '\nUnsubscribe: ' + unsubscribeLink(r[7]) + '\n\n'
          + 'The Traffic research group, University of Napoli Federico II',
      });
      emails++;
    });
    fresh.forEach(d => sent.add(d.id));
    PropertiesService.getScriptProperties().setProperty('OBSERVATORY_SENT', JSON.stringify([...sent]));
    return { datasets: fresh.length, emails: emails };
  } finally {
    lock.releaseLock();
  }
}
