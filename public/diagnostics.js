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

  // Tap log: what each touch lands on, and whether the browser turned it into a click.
  var taps = [];
  function describe(el) {
    if (!el || !el.tagName) return String(el);
    var text = (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').slice(0, 24);
    var cls = (el.className && el.className.toString ? el.className.toString() : '').split(' ').slice(0, 3).join('.');
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + (text ? ' "' + text + '"' : '');
  }
  function log(line) { taps.unshift(line); taps = taps.slice(0, 8); render(); }
  var pending = null;
  document.addEventListener('touchstart', function (e) {
    var t = e.touches[0]; if (!t || (box && box.contains(e.target))) return;
    var top = document.elementFromPoint(t.clientX, t.clientY);
    pending = { at: Math.round(t.clientX) + ',' + Math.round(t.clientY), target: describe(e.target), top: describe(top), clicked: false };
    var p = pending;
    setTimeout(function () { log('tap ' + p.at + ' on ' + p.target + (p.top !== p.target ? ' | topmost ' + p.top : '') + ' → click: ' + (p.clicked ? p.clicked : 'NONE')); }, 700);
  }, { capture: true, passive: true });
  document.addEventListener('touchend', function (e) { if (pending && e.defaultPrevented) pending.clicked = 'blocked (touchend prevented)'; }, true);
  document.addEventListener('click', function (e) { if (pending && !pending.clicked) pending.clicked = 'yes on ' + describe(e.target) + (e.defaultPrevented ? ' (prevented)' : ''); }, true);
  var box;
  function render() {
    if (!document.body) return;
    if (!box) {
      box = document.createElement('pre');
      box.setAttribute('style', 'position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;max-height:32vh;overflow:auto;margin:0;padding:10px;background:#fff;color:#000;font:12px/1.4 monospace;white-space:pre-wrap;border:2px solid #d00;border-radius:6px');
      document.body.appendChild(box);
    }
    var features = ['Object.hasOwn', 'Array.prototype.at', 'structuredClone', 'Array.prototype.findLast', 'Promise.allSettled', 'queueMicrotask', 'ResizeObserver', 'IntersectionObserver']
      .map(function (p) { try { return p + ': ' + (eval('typeof ' + p) !== 'undefined' ? 'yes' : 'NO'); } catch (x) { return p + ': NO'; } });
    box.textContent = 'Documentary Club diagnostics\n' + navigator.userAgent + '\nScreen ' + innerWidth + 'x' + innerHeight +
      '\nApp started: ' + (window.__dcHydrated ? 'YES' : 'not yet') +
      ' · scrollY ' + Math.round(scrollY) +
      '\n\nTaps (newest first):\n' + (taps.join('\n') || 'none yet: tap a button above') +
      '\n\nErrors (' + errors.length + '):\n' + (errors.join('\n\n') || 'none') + '\n\n' + features.join('\n');
  }
  document.addEventListener('DOMContentLoaded', render);
  setInterval(render, 1000);
})();
