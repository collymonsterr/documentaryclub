// `npm run refresh-netflix`, then `npm run sync-catalogue`: sets the on-netflix tag from TMDB's streaming data, in any country.
// A title whose lookup fails keeps its tag, so an outage can't empty the list.
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv, serializeCsv } from './catalogue-csv';
import { tmdb } from './tmdb-pipeline';

const CSV = 'data/catalogue-master.csv', TAG = 'on-netflix';
const rows = parseCsv(readFileSync(CSV, 'utf8')), titles = rows.filter(r => r.status === 'live' && r.tmdb_id && r.type !== 'Collection');
let added = 0, removed = 0, failed = 0;
for (let i = 0; i < titles.length; i += 3) await Promise.all(titles.slice(i, i + 3).map(async r => {
  const data = await tmdb<any>(`${r.type === 'Series' ? 'tv' : 'movie'}/${r.tmdb_id}/watch/providers`).catch(() => undefined);
  if (!data) { failed++; return; }
  const onNetflix = Object.values<any>(data.results ?? {}).some(c => c.flatrate?.some((p: any) => p.provider_name === 'Netflix'));
  const tags = r.tags.split(',').map(t => t.trim()).filter(Boolean), has = tags.includes(TAG);
  if (onNetflix === has) return;
  r.tags = (onNetflix ? [...tags, TAG] : tags.filter(t => t !== TAG)).join(', ');
  if (onNetflix) added++; else removed++;
}));
writeFileSync(CSV, serializeCsv(rows));
console.log(`${added} added, ${removed} removed, ${failed} failed; ${rows.filter(r => r.tags.includes(TAG)).length} on Netflix.`);
