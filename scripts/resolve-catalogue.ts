// One-off import resolver: `bun scripts/resolve-catalogue.ts`. Reads TMDB/OMDb credentials from the sandbox env,
// writes ONLY public normalized metadata. Never prints URLs, credentials or upstream bodies.
import { writeFileSync } from 'node:fs';
import { FILMS } from '../src/data/films';
import { EXPECTED_PEOPLE, IMPORT_LIST, MERGED_INTO, MEDIA_HINTS, SEARCH_ALIASES, importSlug } from '../src/data/import-list';
import { getCatalogueEnrichment } from '../src/lib/tmdb.server';
import { BATCH2_COLLECTIONS, BATCH2_PINS, BATCH2_RAW, reconcileBatch } from '../src/data/import-batch2';
import { BATCH3_ALIASES, BATCH3_PINS, BATCH3_RAW } from '../src/data/import-batch3';
import { readFileSync } from 'node:fs';
import { importTitleMatches, parseOmdb, selectAnyTrailer, selectTrailer, selectYouTubeTrailer, validImdbId, type OmdbResponse, type YouTubeItem } from '../src/lib/discovery';

const token = process.env['TMDB_READ_ACCESS_TOKEN'], omdbKey = process.env['OMDB_API_KEY'];
if (!token) throw new Error('TMDB credential missing');
type Media = 'movie' | 'tv';
async function tmdb<T>(path: string, query: Record<string, string> = {}): Promise<T> {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    if (r.ok) return await r.json() as T;
    await new Promise(res => setTimeout(res, 800));
  }
  throw new Error('TMDB unavailable');
}
const img = (p: string | undefined, size: string) => p && /^\/[\w.-]+$/.test(p) ? `https://image.tmdb.org/t/p/${size}${p}` : undefined;
type Cand = { id: number; media: Media; title: string; alt?: string; year: number; genre_ids?: number[] };
type Detail = Record<string, any>;

async function omdb(imdbId: string | undefined, media: Media) {
  if (!omdbKey || !validImdbId(imdbId)) return undefined;
  const url = new URL('https://www.omdbapi.com/');
  url.searchParams.set('apikey', omdbKey); url.searchParams.set('i', imdbId);
  try {
    const r = await fetch(url); if (!r.ok) return undefined;
    const d = await r.json() as OmdbResponse;
    return d.Response === 'True' && d.imdbID === imdbId && d.Type === (media === 'tv' ? 'series' : 'movie') ? parseOmdb(d) : undefined;
  } catch { return undefined; }
}
function summarize(media: Media, d: Detail) {
  const people: string[] = media === 'movie'
    ? (d.credits?.crew ?? []).filter((c: any) => c.job === 'Director').map((c: any) => c.name)
    : (d.created_by ?? []).map((c: any) => c.name);
  return {
    mediaType: media, tmdbId: d.id as number, imdbId: validImdbId(d.external_ids?.imdb_id) ? d.external_ids.imdb_id as string : undefined,
    canonicalTitle: (media === 'movie' ? d.title : d.name) as string, people: [...new Set(people)],
    runtime: media === 'movie' ? (d.runtime > 0 ? d.runtime : undefined) : (d.episode_run_time?.[0] > 0 ? d.episode_run_time[0] : undefined),
    episodes: media === 'tv' && d.number_of_episodes > 0 ? d.number_of_episodes as number : undefined,
    poster: img(d.poster_path, 'w500'), overview: (d.overview as string | undefined)?.trim() || undefined,
    trailer: selectTrailer(d.videos),
    backdrops: [...new Set<string>((d.images?.backdrops ?? []).map((b: any) => img(b.file_path, 'w1280')).filter(Boolean))].slice(0, 3),
    tmdbRating: d.vote_count > 0 ? Math.round(d.vote_average * 10) / 10 : undefined, votes: d.vote_count > 0 ? d.vote_count : undefined,
  };
}
const details = (media: Media, id: number) => tmdb<Detail>(`${media}/${id}`, { append_to_response: 'credits,videos,images,external_ids', language: 'en-US', include_image_language: 'en,null' });

async function resolve(title: string, year: number) {
  const key = `${title}|${year}`;
  const queries = [...new Set([title, title.split(':')[0]!.trim(), ...(SEARCH_ALIASES[key] ?? [])])];
  const found = new Map<string, Cand>();
  for (const q of queries) for (const media of ['movie', 'tv'] as Media[]) {
    const res = await tmdb<{ results?: any[] }>(`search/${media}`, { query: q, include_adult: 'false' });
    for (const r of res.results ?? []) {
      const c: Cand = { id: r.id, media, title: media === 'movie' ? r.title : r.name, alt: media === 'movie' ? r.original_title : r.original_name, year: Number((media === 'movie' ? r.release_date : r.first_air_date)?.slice(0, 4)), genre_ids: r.genre_ids };
      if (c.genre_ids?.includes(99) && Math.abs(c.year - year) <= 1 && (importTitleMatches(title, [c.title, c.alt]) || (SEARCH_ALIASES[key] ?? []).some(a => importTitleMatches(a, [c.title, c.alt], true)))) found.set(`${media}:${c.id}`, c);
    }
  }
  const verified: { c: Cand; d: Detail; exact: boolean }[] = [];
  for (const c of [...found.values()].slice(0, 8)) {
    const d = await details(c.media, c.id);
    if (d.id === c.id && (d.genres ?? []).some((g: any) => g.id === 99)) verified.push({ c, d, exact: importTitleMatches(title, [c.title, c.alt], true) });
  }
  let pick = verified, reason = 'unique verified documentary match';
  const person = EXPECTED_PEOPLE[key];
  if (person) { pick = pick.filter(v => summarize(v.c.media, v.d).people.includes(person)); reason = `verified credited filmmaker ${person}`; }
  const hint = MEDIA_HINTS[key];
  if (pick.length > 1 && hint && pick.filter(v => v.c.media === hint).length === 1) { pick = pick.filter(v => v.c.media === hint); reason = `approved ${hint === 'tv' ? 'series' : 'film'} format among verified candidates`; }
  if (pick.length > 1 && pick.filter(v => v.exact).length === 1) { pick = pick.filter(v => v.exact); reason = 'only exact-title documentary among verified candidates'; }
  if (pick.length > 1 && pick.filter(v => v.c.year === year).length === 1) { pick = pick.filter(v => v.c.year === year); reason = 'only exact-year documentary among verified candidates'; }
  const candidates = verified.map(v => ({ mediaType: v.c.media, tmdbId: v.c.id, title: v.c.title, year: v.c.year }));
  if (pick.length !== 1) return { status: verified.length ? 'pending-ambiguous' : 'pending-not-found', reason: verified.length ? 'multiple verified documentary candidates' : 'no documentary candidate with matching title and year ±1', candidates };
  const v = pick[0]!;
  const meta = summarize(v.c.media, v.d);
  return { status: 'resolved', reason, candidates, year: v.c.year, meta: { ...meta, omdb: await omdb(meta.imdbId, v.c.media) } };
}

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
