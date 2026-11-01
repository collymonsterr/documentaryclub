// `npm run sync-catalogue`: rebuilds site data from data/catalogue-master.csv. Editing tags, moods or categories needs no keys;
// status=new rows are matched on TMDB (title + year + type), filled in and set live, and anything uncertain is listed, never guessed.
import { readFileSync, writeFileSync } from 'node:fs';
import { CATEGORIES } from '../src/data/films';
import { importSlug } from '../src/data/import-list';
import { selectAnyTrailer } from '../src/lib/discovery';
import { TAGS } from '../src/data/tags';
import { MOODS } from '../src/data/discovery-facets';
import { noteHints, parseCsv, serializeCsv, sheetJson, validate, type CsvRow } from './catalogue-csv';
import { details, omdb, resolve, summarize, type Media } from './tmdb-pipeline';

const CSV = 'data/catalogue-master.csv', SHEET = 'src/data/catalogue-sheet.json', SNAPSHOT = 'src/data/catalogue-snapshot.json';
const rows = parseCsv(readFileSync(CSV, 'utf8'));
const snapshot: Record<string, any> = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
const errors = validate(rows, { tags: TAGS.map(t => t.id), moods: MOODS.map(m => m.label), categories: CATEGORIES.map(c => c.label) });
if (errors.length) { console.error(`Nothing written. Fix these rows in ${CSV}:\n  ${errors.join('\n  ')}`); process.exit(1); }

const mediaOf = (r: CsvRow): Media => r.type === 'Series' ? 'tv' : 'movie';
const enrich = async (media: Media, id: number) => {
  const d = await details(media, id), meta = summarize(media, d);
  if (d.id !== id) throw new Error('TMDB identity mismatch');
  return { status: 'resolved', ...meta, trailer: meta.trailer ?? selectAnyTrailer(d.videos), omdb: await omdb(meta.imdbId, media) };
};
const hasToken = Boolean(process.env['TMDB_READ_ACCESS_TOKEN']);
const added: string[] = [], skipped: string[] = [], dropped: string[] = [], needsMood: string[] = [], refreshed: string[] = [];

async function addNew(r: CsvRow) {
  const name = `${r.title} (${r.year})`, hints = noteHints(r.notes), media = mediaOf(r);
  const preferred = hints.preferYear ? await resolve(r.title, hints.preferYear, [], { media, aliases: hints.aliases }) : undefined;
  const res: any = preferred?.status === 'resolved' ? preferred : await resolve(r.title, Number(r.year), [], { media, aliases: hints.aliases });
  if (res.status !== 'resolved') {
    const candidates = (res.candidates ?? []).map((c: any) => `${c.title} (${c.year}, ${c.mediaType} ${c.tmdbId})`).join('; ');
    skipped.push(`${name}: ${res.reason}${candidates ? ` — ${candidates}` : ''}`); return;
  }
  const clash = Object.entries(snapshot).find(([, s]) => s.tmdbId === res.meta.tmdbId && s.mediaType === media)?.[0];
  if (clash) { skipped.push(`${name}: already in the catalogue as "${clash}"`); return; }
  if (hints.minRuntime) {
    if (!res.meta.runtime) { skipped.push(`${name}: TMDB has no runtime, so the ${hints.minRuntime}-minute rule can't be checked`); return; }
    if (res.meta.runtime < hints.minRuntime) { r.status = 'dropped'; dropped.push(`${name}: ${res.meta.runtime} min is under ${hints.minRuntime}`); return; }
  }
  const id = importSlug(r.title);
  if (rows.some(o => o !== r && o.id === id) || snapshot[id]) { skipped.push(`${name}: id "${id}" is already taken`); return; }
  snapshot[id] = await enrich(media, res.meta.tmdbId);
  Object.assign(r, { id, status: 'live', tmdb_id: String(res.meta.tmdbId), imdb_id: res.meta.imdbId ?? '', director: r.director || res.meta.people.join(', ') });
  added.push(`${name} → ${res.meta.canonicalTitle} (${res.year}, TMDB ${media} ${res.meta.tmdbId}), ${res.reason}`);
}

for (const r of rows) {
  try {
    if (r.status === 'new') {
      if (!hasToken) { skipped.push(`${r.title} (${r.year}): no TMDB token in .env.local`); continue; }
      await addNew(r);
    } else if (r.status === 'live' && r.type !== 'Collection' && r.tmdb_id && snapshot[r.id]?.status !== 'resolved' && hasToken) {
      snapshot[r.id] = await enrich(mediaOf(r), Number(r.tmdb_id));
      refreshed.push(r.title);
    }
  } catch { skipped.push(`${r.title} (${r.year}): metadata service unavailable`); }
  if (r.status === 'live' && !r.mood) needsMood.push(r.title);
}
writeFileSync(CSV, serializeCsv(rows));
writeFileSync(SNAPSHOT, JSON.stringify(snapshot) + '\n');
writeFileSync(SHEET, sheetJson(rows));

const section = (title: string, items: string[]) => { if (items.length) console.log(`\n${title} (${items.length}):\n  ${items.join('\n  ')}`); };
section('Added', added); section('Enrichment fetched', refreshed); section('Dropped', dropped); section('Skipped, check these', skipped); section('Live with no mood', needsMood);
const live = rows.filter(r => r.status === 'live');
console.log(`\n${live.length} live titles.`);
for (const t of TAGS) console.log(`  ${t.label}: ${live.filter(r => r.tags.split(',').map(s => s.trim()).includes(t.id)).length}`);
if (!process.env['OMDB_API_KEY'] && added.length) console.log('\nNo OMDb key: new titles have no IMDb or Rotten Tomatoes scores.');
