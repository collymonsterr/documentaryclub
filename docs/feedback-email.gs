// Emails each contact form entry to the Google account that deploys this script.
// At script.google.com: New project, paste this in, then Deploy → New deployment → Web app
// (Execute as: Me, Who has access: Anyone). Put the web app URL in Lovable's secrets as FEEDBACK_WEBHOOK_URL.
function doPost(e) {
  var entry = JSON.parse(e.postData.contents);
  var subject = entry.kind === 'suggestion' ? 'Documentary Club suggestion: ' + entry.title : 'Documentary Club message from ' + (entry.name || 'a visitor');
  var lines = [
    entry.kind === 'suggestion' ? 'Suggested: ' + entry.title + ' (' + entry.year + ', ' + entry.mediaType + ', TMDB ' + entry.tmdbId + ')' : '',
    'From: ' + (entry.name || 'No name given'),
    'Email: ' + (entry.email || 'None given'),
    '',
    entry.note,
  ];
  var mail = { to: Session.getEffectiveUser().getEmail(), subject: subject.replace(/\s+/g, ' ').slice(0, 150), body: lines.join('\n') };
  if (entry.email) mail.replyTo = entry.email;
  MailApp.sendEmail(mail);
  return ContentService.createTextOutput('ok');
}
