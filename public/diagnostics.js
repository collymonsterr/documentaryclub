// Loaded only with ?debug in the URL (see __root). Plain ES5 so it runs on any old browser: shows the
// browser version, every script error, and whether React hydrated, so a visitor can screenshot it.
(function () {
  var errors = [];
  function add(msg) { errors.push(String(msg).slice(0, 300)); render(); }
  window.addEventListener('error', function (e) {
    var where = e.filename ? ' @ ' + e.filename.split('/').pop() + ':' + e.lineno + ':' + e.colno : '';
    add((e.message || (e.target && e.target.src ? 'Failed to load ' + e.target.src : 'error')) + where);
  }, true);
  window.addEventListener('unhandledrejection', function (e) { add('Promise: ' + (e.reason && (e.reason.stack || e.reason.message) || e.reason)); });
  var box;
  function render() {
    if (!document.body) return;
    if (!box) {
      box = document.createElement('pre');
      box.setAttribute('style', 'position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;max-height:45vh;overflow:auto;margin:0;padding:10px;background:#fff;color:#000;font:12px/1.4 monospace;white-space:pre-wrap;border:2px solid #d00;border-radius:6px');
      document.body.appendChild(box);
    }
    var features = ['Object.hasOwn', 'Array.prototype.at', 'structuredClone', 'Array.prototype.findLast', 'Promise.allSettled', 'queueMicrotask', 'ResizeObserver', 'IntersectionObserver']
      .map(function (p) { try { return p + ': ' + (eval('typeof ' + p) !== 'undefined' ? 'yes' : 'NO'); } catch (x) { return p + ': NO'; } });
    box.textContent = 'Documentary Club diagnostics\n' + navigator.userAgent + '\nScreen ' + innerWidth + 'x' + innerHeight +
      '\nApp started: ' + (window.__dcHydrated ? 'YES' : 'not yet') +
      '\n\nErrors (' + errors.length + '):\n' + (errors.join('\n\n') || 'none') + '\n\n' + features.join('\n');
  }
  document.addEventListener('DOMContentLoaded', render);
  setInterval(render, 1000);
})();
