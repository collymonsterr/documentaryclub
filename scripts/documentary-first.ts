// `npm run documentary-first`: reads Documentary First's published picks sheet and records the guests' picks that are in the
// catalogue, for /documentary-first and the "Picked by … on Documentary First" line on film pages. Page loads read the saved file.
// Rows count only with Status "Pick" and a guest (never the hosts). Rerun after new episodes, then republish.
import { writeFileSync } from 'node:fs';
import { CATALOGUE } from '../src/data/catalogue';
import { DF_HOSTS, DF_SHEET, matchPick, type DfPick } from '../src/data/documentary-first';

// Their sheet is plain CSV with quoted fields; quotes inside a field are doubled.
function parse(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') quoted = false; else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header = [], ...body] = rows;
  return body.filter(r => r.some(Boolean)).map(r => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const res = await fetch(DF_SHEET);
if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}; keeping the old file`);
const rows = parse(await res.text());
for (const column of ['Pick', 'Year', 'Picked by', 'Status']) if (!(column in (rows[0] ?? {}))) throw new Error(`The sheet has no "${column}" column any more; keeping the old file`);
const hosts = new Set(DF_HOSTS.map(h => h.toLowerCase()));
const guestPicks = rows.filter(r => r['Status'] === 'Pick' && r['Picked by'] && !hosts.has(r['Picked by']!.toLowerCase()));
const picks: DfPick[] = [], missed: string[] = [];
for (const r of guestPicks) {
  const year = Number.parseInt(r['Year'] ?? '', 10) || undefined;
  const film = matchPick(r['Pick']!, year, CATALOGUE);
  if (!film) { missed.push(`${r['Pick']}${year ? ` (${year})` : ''} - ${r['Picked by']}`); continue; }
  if (picks.some(p => p.film === film.id && p.guest === r['Picked by'])) continue;
  const episode = Number.parseInt(r['Episode'] ?? '', 10) || undefined;
  picks.push({ film: film.id, title: r['Pick']!.replace(/\s*\(\d{4}\)\s*$/, ''), guest: r['Picked by']!, ...(episode ? { episode } : {}), ...(r['Air date'] ? { aired: r['Air date'] } : {}) });
}
// Newest episode first, so a film's latest guest is named first.
picks.sort((a, b) => (b.aired ?? '').localeCompare(a.aired ?? '') || a.film.localeCompare(b.film));
const checked = new Date().toISOString().slice(0, 10);
writeFileSync('src/data/documentary-first.json', `${JSON.stringify({ checked, picks }, null, 1)}\n`);
console.log(`${guestPicks.length} guest picks; ${picks.length} in the catalogue (${new Set(picks.map(p => p.film)).size} films) on ${checked}`);
console.log(`Not in the catalogue (${missed.length}):\n  ${missed.join('\n  ')}`);
