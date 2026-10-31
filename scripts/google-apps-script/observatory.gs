/**
 * The Cybersecurity Dataset Observatory (observatory/, js/observatory.js): the "Submit your dataset"
 * form (action "observatory_submission") and the email updates of the bell (action
 * "observatory_subscribe", the unsubscribe link and the daily notifyNewDatasets()).
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
 *  5. Run notifyNewDatasets once by hand (it records the datasets already listed), then
 *     Triggers -> Add trigger -> notifyNewDatasets, Time-driven, Day timer.
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
  return ContentService.createTextOutput('error: unknown action');
}

// Every email of the Observatory: from the account (or its OBSERVATORY_FROM alias), with the Observatory's name.
function sendObservatoryEmail(message) {
  const from = PropertiesService.getScriptProperties().getProperty('OBSERVATORY_FROM');
  const options = { name: OBSERVATORY_NAME, replyTo: message.replyTo || observatoryReplyTo() };
  if (message.cc) options.cc = message.cc;
  if (from) options.from = from;
  GmailApp.sendEmail(message.to, message.subject, message.body, options);
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
const OBSERVATORY_TEAM = ['pescape@unina.it', 'gabriele.mangiacapre@unina.it', 'francesco.cerasuolo@unina.it'];

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
    sendObservatoryEmail({
      to: OBSERVATORY_TEAM[0], cc: OBSERVATORY_TEAM.slice(1).join(','), replyTo: String(data.email || ''),
      subject: 'Observatory dataset submission: ' + String(data.dataset || '').slice(0, 120),
      body: lines.join('\n'),
    });
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
// New datasets: notifyNewDatasets() reads observatory/updates.json (written by scripts/build_observatory.py)
// and writes to each subscriber the datasets added to their domains since the last run. Run it once by
// hand (it only records what is already there), then add a time-driven trigger: Triggers -> Add trigger ->
// notifyNewDatasets, Time-driven, Day timer.
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
  sendObservatoryEmail({
    to: email,
    subject: 'You are subscribed to the Cybersecurity Dataset Observatory',
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

// Daily: the datasets of updates.json not seen at the previous run, sent to the subscribers of their domains.
function notifyNewDatasets() {
  const feed = observatoryFeed();
  if (!feed) return;
  const props = PropertiesService.getScriptProperties();
  const seen = new Set(JSON.parse(props.getProperty('OBSERVATORY_SEEN') || '[]'));
  const first = seen.size === 0;
  const fresh = feed.datasets.filter(d => !seen.has(d.id));
  feed.datasets.forEach(d => seen.add(d.id));
  props.setProperty('OBSERVATORY_SEEN', JSON.stringify([...seen]));
  if (first || !fresh.length) return;   // the first run only records the catalogue
  const rows = subscribersSheet().getDataRange().getValues().slice(1).filter(r => r[8] === 'active');
  rows.forEach(r => {
    const domains = String(r[6]);
    const mine = domains === 'all' ? fresh : fresh.filter(d => domains.split(',').includes(d.domain));
    if (!mine.length) return;
    const list = mine.map(d => '- ' + d.name + (d.year ? ' (' + d.year + ')' : '') + ', ' + (feed.domains[d.domain] || d.domain)
      + (d.task ? ': ' + d.task : '') + '\n  ' + OBSERVATORY_URL + '?q=' + encodeURIComponent(d.name) + '#catalogue').join('\n');
    sendObservatoryEmail({
      to: r[5],
      subject: mine.length === 1 ? 'New in the Observatory: ' + mine[0].name : mine.length + ' new datasets in the Observatory',
      body: 'Dear ' + r[1] + ',\n\nnew datasets have been added to the domains you follow:\n\n' + list + '\n\n'
        + 'Browse the catalogue: ' + OBSERVATORY_URL + '\nUnsubscribe: ' + unsubscribeLink(r[7]) + '\n\n'
        + 'The Traffic research group, University of Napoli Federico II',
    });
  });
}
