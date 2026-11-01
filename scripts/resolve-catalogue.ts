// One-off import resolver: `bun scripts/resolve-catalogue.ts`. Reads TMDB/OMDb credentials from the sandbox env,
// writes ONLY public normalized metadata. Never prints URLs, credentials or upstream bodies.
import { writeFileSync } from 'node:fs';
import { FILMS } from '../src/data/films';
import { getCatalogueEnrichment } from '../src/lib/tmdb.server';
import { BATCH2_COLLECTIONS, BATCH2_PINS, BATCH2_RAW, reconcileBatch } from '../src/data/import-batch2';
import { BATCH3_ALIASES, BATCH3_PINS, BATCH3_RAW } from '../src/data/import-batch3';
import { readFileSync } from 'node:fs';
import { IMPORT_LIST, MERGED_INTO, importSlug } from '../src/data/import-list';
import { selectAnyTrailer, selectYouTubeTrailer, type YouTubeItem } from '../src/lib/discovery';
import { details, img, omdb, resolve, summarize, tmdb, type Detail } from './tmdb-pipeline';

const token = process.env['TMDB_READ_ACCESS_TOKEN'];
if (!token) throw new Error('TMDB credential missing');
if (process.argv.includes('--batch2')) { await batch2(); process.exit(0); }
if (process.argv.includes('--trailers')) { await trailers(); process.exit(0); }
if (process.argv.includes('--yt-trailers')) { await ytTrailers(); process.exit(0); }
if (process.argv.includes('--batch3')) { await batch3(); process.exit(0); }
// Batch 3 (Sex & Drugs): same delta rules as batch 2 — only new titles are resolved, prior data untouched.
async function batch3() {
  const { MANIFEST2 } = await import('../src/data/catalogue');
  // Reconcile against the pre-batch catalogue only (originals + batch 1 + batch 2), so reruns never self-match.
  const before = new Set([...FILMS.map(f => f.id), ...IMPORT_LIST.map(e => MERGED_INTO[`${e.title}|${e.year}`] ?? importSlug(e.title)), ...MANIFEST2.entries.map(e => e.id)]);
  const prior: Record<string, any> = JSON.parse(readFileSync('src/data/catalogue-snapshot.json', 'utf8'));
  const priorIds = new Map<string, string>();
  for (const [id, s] of Object.entries(prior)) if (s.tmdbId && s.mediaType) priorIds.set(`${s.mediaType}:${s.tmdbId}`, id);
  let previous: any[] = []; try { previous = JSON.parse(readFileSync('src/data/import-manifest-3.json', 'utf8')).entries; } catch { /* first run */ }
  const out: any[] = []; const claimed = new Map<string, string>(); const seen = new Set<string>();
  for (const r of BATCH3_RAW) {
    const base = { input: { section: r.section, title: r.title, year: r.year } };
    const id = importSlug(r.title);
    if (seen.has(id)) { out.push({ ...base, id, status: 'duplicate-in-batch' }); continue; }
    seen.add(id);
    if (before.has(id)) { out.push({ ...base, id, status: 'existing-match' }); continue; }
    const old = previous.find(e => e.input.title === r.title);
    if (old?.status === 'resolved' && prior[id]?.status === 'resolved') { out.push(old); if (old.chosen) claimed.set(`${old.chosen.mediaType}:${old.chosen.tmdbId}`, id); continue; }
    try {
      let res: any;
      const pin = BATCH3_PINS[`${r.title}|${r.year}`];
      if (pin) {
        const d = await details(pin.media, pin.id);
        const ok = d.id === pin.id && (d.genres ?? []).some((g: any) => g.id === 99) && pin.evidence.test(`${d.title ?? d.name} ${d.overview}`);
        const meta = summarize(pin.media, d);
        res = ok ? { status: 'resolved', reason: `evidence-pinned: ${pin.why}`, year: Number((d.release_date ?? d.first_air_date)?.slice(0, 4)), meta: { ...meta, omdb: await omdb(meta.imdbId, pin.media) } } : { status: 'pending-ambiguous', reason: 'pinned identity failed verification' };
      } else res = await resolve(BATCH3_ALIASES[`${r.title}|${r.year}`] ?? r.title, r.year);
      if (res.meta) {
        const ident = `${res.meta.mediaType}:${res.meta.tmdbId}`, dup = priorIds.get(ident) ?? claimed.get(ident);
        // A match against our own earlier snapshot entry (same id) is a re-resolve, not a duplicate.
        if (dup && dup !== id) { out.push({ ...base, id: dup, status: 'existing-match-verified', reason: `same TMDB identity ${ident}` }); continue; }
        claimed.set(ident, id);
      }
      out.push({ ...base, id, status: res.status, reason: res.reason, chosen: res.meta ? { mediaType: res.meta.mediaType, tmdbId: res.meta.tmdbId, imdbId: res.meta.imdbId, canonicalTitle: res.meta.canonicalTitle, year: res.year, people: res.meta.people } : undefined, candidates: res.candidates });
      prior[id] = res.meta ? { status: 'resolved', ...res.meta } : { status: 'pending' };
    } catch { out.push({ ...base, id, status: 'pending-unavailable', reason: 'metadata service unavailable during import' }); prior[id] = { status: 'pending' }; }
    console.log(out.length, out.at(-1).status, r.title);
  }
  writeFileSync('src/data/import-manifest-3.json', JSON.stringify({ generated: new Date().toISOString().slice(0, 10), rawInputs: BATCH3_RAW.length, entries: out }, null, 1) + '\n');
  writeFileSync('src/data/catalogue-snapshot.json', JSON.stringify(prior) + '\n');
}
// YouTube backfill: for resolved entries still lacking a trailer, search YouTube and accept only
// title-verified trailer/teaser uploads. Reads GOOGLE_API_KEY from env; never prints it or request URLs.
async function ytTrailers() {
  const key = process.env['GOOGLE_API_KEY'];
  if (!key) throw new Error('YouTube credential missing');
  const snap: Record<string, any> = JSON.parse(readFileSync('src/data/catalogue-snapshot.json', 'utf8'));
  const { CATALOGUE } = await import('../src/data/catalogue');
  const missing = CATALOGUE.filter(f => { const s = snap[f.id]; return s?.status === 'resolved' && !s.trailer && (s.mediaType === 'movie' || s.mediaType === 'tv'); });
  let filled = 0;
  for (const f of missing) {
    const s = snap[f.id]!;
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet'); url.searchParams.set('type', 'video'); url.searchParams.set('maxResults', '5');
      url.searchParams.set('q', `${f.title} ${f.year} trailer`); url.searchParams.set('key', key);
      const r = await fetch(url);
      if (!r.ok) { console.log(f.id, 'search failed'); continue; }
      const data = await r.json() as { items?: YouTubeItem[] };
      const videoId = selectYouTubeTrailer(f.title, [s.canonicalTitle, ...(f.aliases ?? [])].filter(Boolean), data.items ?? []);
      if (videoId) { s.trailer = videoId; filled++; }
    } catch { /* unavailable stays unknown */ }
    console.log(f.id, s.trailer ? 'trailer' : 'none');
  }
  writeFileSync('src/data/catalogue-snapshot.json', JSON.stringify(snap) + '\n');
  console.log(`filled ${filled} of ${missing.length} missing trailers`);
}
// Trailer backfill: re-fetches videos ONLY for resolved entries lacking a trailer; all other snapshot data is untouched.
async function trailers() {
  const snap: Record<string, any> = JSON.parse(readFileSync('src/data/catalogue-snapshot.json', 'utf8'));
  const missing = Object.entries(snap).filter(([, s]) => s.status === 'resolved' && !s.trailer && s.tmdbId && (s.mediaType === 'movie' || s.mediaType === 'tv'));
  let filled = 0;
  for (const [id, s] of missing) {
    try {
      const v = await tmdb<{ results?: any[] }>(`${s.mediaType}/${s.tmdbId}/videos`, { language: 'en-US' });
      const key = selectAnyTrailer(v);
      if (key) { s.trailer = key; filled++; }
    } catch { /* unavailable stays unknown */ }
    console.log(id, s.trailer ? 'trailer' : 'none');
  }
  writeFileSync('src/data/catalogue-snapshot.json', JSON.stringify(snap) + '\n');
  console.log(`filled ${filled} of ${missing.length} missing trailers`);
}
// Delta import: only titles absent from the existing snapshot are resolved; prior data is preserved untouched.
async function batch2() {
  const { CATALOGUE } = await import('../src/data/catalogue');
  const prior: Record<string, any> = JSON.parse(readFileSync('src/data/catalogue-snapshot.json', 'utf8'));
  const priorIds = new Map<string, string>();
  for (const [id, s] of Object.entries(prior)) if (s.tmdbId && s.mediaType) priorIds.set(`${s.mediaType}:${s.tmdbId}`, id);
  // Reconcile against the catalogue as it stood before this batch (originals + first import), never against batch-2 rows themselves.
  const before = new Set([...FILMS.map(f => f.id), ...IMPORT_LIST.map(e => MERGED_INTO[`${e.title}|${e.year}`] ?? importSlug(e.title))]);
  const rows = reconcileBatch(BATCH2_RAW, CATALOGUE.filter(f => before.has(f.id)));
  let previous: any[] = []; try { previous = JSON.parse(readFileSync('src/data/import-manifest-2.json', 'utf8')).entries; } catch { /* first run */ }
  const out: any[] = []; const claimed = new Map<string, string>();
  for (const r of rows) {
    const base = { input: { source: r.source, section: r.section, raw: r.raw, title: r.title, year: r.year, ...(r.yearEnd ? { yearEnd: r.yearEnd } : {}) } };
    if (r.outcome !== 'new') { out.push({ ...base, status: r.outcome === 'existing' ? 'existing-match' : 'duplicate-in-batch', id: r.existingId ?? importSlug(r.firstTitle ?? r.title) }); continue; }
    const id = importSlug(r.title), key = `${r.title}|${r.year}`;
    const old = previous.find(e => e.input.raw === r.raw && e.input.source === r.source);
    if (old?.status === 'resolved' && prior[id]?.status === 'resolved') { out.push(old); if (old.chosen) claimed.set(`${old.chosen.mediaType}:${old.chosen.tmdbId}`, id); continue; }
    try {
      const coll = BATCH2_COLLECTIONS[key];
      if (coll) {
        const c = await tmdb<Detail>(`collection/${coll.id}`, { language: 'en-US' });
        if (!coll.name.test(c.name ?? '')) throw new Error('collection mismatch');
        const parts = (c.parts ?? []).filter((p: any) => p.genre_ids?.includes(99)).map((p: any) => ({ title: p.title as string, tmdbId: p.id as number, year: Number(p.release_date?.slice(0, 4)) }));
        const inRange = parts.filter((p: any) => !(p.year > (r.yearEnd ?? 9999)));
        const art = await tmdb<Detail>(`collection/${coll.id}/images`, { include_image_language: 'en,null' }).catch(() => ({}) as Detail);
        prior[id] = { status: 'resolved', mediaType: 'collection', tmdbId: coll.id, canonicalTitle: c.name, poster: img(c.poster_path, 'w500'), overview: c.overview?.trim() || undefined,
          backdrops: [...new Set<string>((art.backdrops ?? []).map((b: any) => img(b.file_path, 'w1280')).filter(Boolean))].slice(0, 3), yearEnd: r.yearEnd, parts: inRange.map((p: any) => p.title) };
        out.push({ ...base, id, status: 'resolved', reason: `TMDB collection ${c.name}: ${inRange.length} documentary parts within ${r.year}–${r.yearEnd}; ${parts.length - inRange.length} later part(s) excluded`, chosen: { mediaType: 'collection', tmdbId: coll.id, canonicalTitle: c.name, year: r.year, people: [] } });
        continue;
      }
      let res: any;
      const pin = BATCH2_PINS[key];
      if (pin) {
        const d = await details(pin.media, pin.id);
        const ok = d.id === pin.id && (d.genres ?? []).some((g: any) => g.id === 99) && pin.evidence.test(`${d.title ?? d.name} ${d.overview}`);
        const meta = summarize(pin.media, d);
        res = ok ? { status: 'resolved', reason: `evidence-pinned: ${pin.why}`, year: Number((d.release_date ?? d.first_air_date)?.slice(0, 4)), meta: { ...meta, omdb: await omdb(meta.imdbId, pin.media) } } : { status: 'pending-ambiguous', reason: 'pinned identity failed verification' };
      } else res = await resolve(r.title, r.year);
      if (res.meta) {
        const ident = `${res.meta.mediaType}:${res.meta.tmdbId}`, dup = priorIds.get(ident) ?? claimed.get(ident);
        if (dup) { out.push({ ...base, id: dup, status: 'existing-match-verified', reason: `same TMDB identity ${ident}` }); continue; }
        claimed.set(ident, id);
      }
      out.push({ ...base, id, status: res.status, reason: res.reason, chosen: res.meta ? { mediaType: res.meta.mediaType, tmdbId: res.meta.tmdbId, imdbId: res.meta.imdbId, canonicalTitle: res.meta.canonicalTitle, year: res.year, people: res.meta.people } : undefined, candidates: res.candidates });
      prior[id] = res.meta ? { status: 'resolved', ...res.meta } : { status: 'pending' };
    } catch { out.push({ ...base, id, status: 'pending-unavailable', reason: 'metadata service unavailable during import' }); prior[id] = { status: 'pending' }; }
    console.log(out.length, out.at(-1).status, r.title);
  }
  writeFileSync('src/data/import-manifest-2.json', JSON.stringify({ generated: new Date().toISOString().slice(0, 10), rawInputs: BATCH2_RAW.length, entries: out }, null, 1) + '\n');
  writeFileSync('src/data/catalogue-snapshot.json', JSON.stringify(prior) + '\n');
}

const manifest: any[] = [], snapshot: Record<string, any> = {};
const originals = await getCatalogueEnrichment({ token });
for (const f of FILMS) {
  const e = originals[f.id];
  if (e?.status !== 'ready') { snapshot[f.id] = { status: 'pending' }; continue; }
  snapshot[f.id] = { status: 'resolved', mediaType: 'movie', tmdbId: e.tmdbId, imdbId: e.imdbId, people: [], runtime: e.runtime, poster: e.poster, overview: e.overview, trailer: e.trailer, backdrops: e.backdrops.slice(0, 3), tmdbRating: e.rating !== undefined ? Math.round(e.rating * 10) / 10 : undefined, votes: e.votes, omdb: await omdb(e.imdbId, 'movie') };
}
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < IMPORT_LIST.length) {
    const index = i++; const entry = IMPORT_LIST[index]!;
    const merged = MERGED_INTO[`${entry.title}|${entry.year}`];
    if (merged) { manifest[index] = { input: entry, id: merged, status: 'merged-existing' }; continue; }
    const id = importSlug(entry.title);
    try {
      const r: any = await resolve(entry.title, entry.year);
      manifest[index] = { input: entry, id, status: r.status, reason: r.reason, chosen: r.meta ? { mediaType: r.meta.mediaType, tmdbId: r.meta.tmdbId, imdbId: r.meta.imdbId, canonicalTitle: r.meta.canonicalTitle, year: r.year, people: r.meta.people } : undefined, candidates: r.candidates };
      snapshot[id] = r.meta ? { status: 'resolved', ...r.meta } : { status: 'pending' };
    } catch { manifest[index] = { input: entry, id, status: 'pending-unavailable', reason: 'metadata service unavailable during import' }; snapshot[id] = { status: 'pending' }; }
    console.log(index + 1, manifest[index].status, entry.title);
  }
}));
writeFileSync('src/data/import-manifest.json', JSON.stringify({ generated: new Date().toISOString().slice(0, 10), submitted: IMPORT_LIST.length, entries: manifest }, null, 1) + '\n');
writeFileSync('src/data/catalogue-snapshot.json', JSON.stringify(snapshot) + '\n');
