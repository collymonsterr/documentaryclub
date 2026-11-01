// Paste into Extensions → Apps Script in your private Google Sheet, then Deploy → New deployment → Web app
// (Execute as: Me, Who has access: Anyone). Put the web app URL in Lovable's secrets as FEEDBACK_WEBHOOK_URL.
function doPost(e) {
  var entry = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(['Received', 'Type', 'Title', 'Year', 'TMDB ID', 'Format', 'Name', 'Note']);
  // A leading apostrophe stops a spreadsheet treating submitted text as a formula.
  var safe = function (v) { return /^[=+\-@]/.test(String(v)) ? "'" + v : v; };
  sheet.appendRow([new Date(), entry.kind, safe(entry.title), entry.year, entry.tmdbId, entry.mediaType, safe(entry.name), safe(entry.note)]);
  return ContentService.createTextOutput('ok');
}
