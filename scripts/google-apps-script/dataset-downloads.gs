/**
 * Receives the download form of the Datasets pages (js/datasets.js) and adds one
 * row per download to the "Downloads" sheet of the spreadsheet it is attached to.
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
const COLUMNS = ['Date', 'Dataset', 'First name', 'Last name', 'Organization', 'Nationality', 'Email', 'File', 'Page'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
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
