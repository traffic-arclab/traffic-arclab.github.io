/**
 * Receives the download form of the Datasets pages (js/datasets.js) and adds one
 * row per download to the "Downloads" sheet of the spreadsheet it is attached to.
 *
 * It also returns the list of downloads to the site editor (admin/people/, tab
 * "Downloads"), but only to whoever sends a GitHub token with write access to the
 * site repository: the same token used to sign in to the editor.
 *
 * Setup (once):
 *  1. Create a Google Sheet (e.g. "MIRAGE downloads") with the group's Google account.
 *  2. In the sheet: Extensions -> Apps Script. Replace the code with this file and save.
 *  3. Deploy -> New deployment -> type "Web app".
 *       Execute as: Me            Who has access: Anyone
 *     Authorize when asked, then copy the Web app URL (it ends with /exec).
 *  4. Paste the URL in "form_endpoint" in data/datasets.json and run
 *     python3 scripts/build_datasets.py (or just push: the workflow rebuilds the pages).
 *
 * After editing this code, publish it with Deploy -> Manage deployments -> Edit ->
 * Version: New version (the URL stays the same).
 */
const SHEET_NAME = 'Downloads';
const REPO = 'traffic-arclab/traffic-arclab.github.io';
const COLUMNS = ['Date', 'Dataset', 'First name', 'Last name', 'Organization', 'Nationality', 'Email', 'File', 'Page'];

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.action === 'list') return listDownloads(data.token);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
      sheet.setFrozenRows(1);
    }
    // Plain text only: values are cut to a sane length, and a leading = + - @ is escaped
    // so that nothing typed in the form can run as a spreadsheet formula.
    const text = value => {
      const s = String(value == null ? '' : value).slice(0, 300);
      return /^[=+\-@]/.test(s) ? "'" + s : s;
    };
    sheet.appendRow([new Date(), text(data.dataset), text(data.first_name), text(data.last_name),
      text(data.organization), text(data.nationality), text(data.email), text(data.file), text(data.page)]);
    return ContentService.createTextOutput('ok');
  } catch (error) {
    return ContentService.createTextOutput('error: ' + error);
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------- reading, for the editor
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
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'traffic-dataset-downloads' },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) return false;
  const repo = JSON.parse(response.getContentText());
  const allowed = Boolean(repo.permissions && repo.permissions.push);
  if (allowed) cache.put(key, 'yes', 600);
  return allowed;
}

function listDownloads(token) {
  if (!canRead(token)) return json({ ok: false, error: 'This GitHub account cannot read the download list.' });
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return json({ ok: true, rows: [] });
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, COLUMNS.length).getValues();
  const rows = values.map(r => ({
    date: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
    dataset: r[1], first_name: r[2], last_name: r[3], organization: r[4],
    nationality: r[5], email: r[6], file: r[7], page: r[8],
  }));
  return json({ ok: true, rows: rows });
}
