// `npm run resolve-directors`: fills src/data/director-profiles.json for directors with three or more titles.
// People come from TMDB credits on catalogue films, never a name search; the Wikipedia link must match their IMDb ID. Blurbs are hand-written and kept.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { makerIndex } from '../src/data/discovery-facets';
import { details, img, tmdb, type Media } from './tmdb-pipeline';

const FILE = 'src/data/director-profiles.json';
type Profile = { tmdbPersonId: number; photo?: string; imdbId?: string; wikipedia?: string; blurb: string };
const saved: Record<string, Profile> = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {};
const norm = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

async function wikipedia(imdbId: string) {
  const query = `SELECT ?article WHERE { ?p wdt:P345 "${imdbId}". ?article schema:about ?p; schema:isPartOf <https://en.wikipedia.org/>. }`;
  const r = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'DocumentaryClubCatalogue/1.0 (private catalogue enrichment)' } });
  if (!r.ok) throw new Error('Wikidata unavailable');
  const rows = (await r.json() as any).results.bindings;
  return rows.length === 1 ? rows[0].article.value as string : undefined;
}

const out: Record<string, Profile> = {}, unresolved: string[] = [];
for (const maker of makerIndex().filter(m => m.films.length >= 3)) {
  const votes = new Map<number, number>();
  for (const film of maker.films.filter(f => f.tmdbId && f.mediaType !== 'collection')) {
    const d = await details((film.mediaType === 'tv' ? 'tv' : 'movie') as Media, film.tmdbId!).catch(() => undefined);
    const people = [...(d?.created_by ?? []), ...(d?.credits?.crew ?? []).filter((c: any) => c.job === 'Director'), ...(d?.credits?.cast ?? [])];
    const ids = new Set<number>(people.filter((p: any) => norm(p.name) === norm(maker.name)).map((p: any) => p.id));
    for (const id of ids) votes.set(id, (votes.get(id) ?? 0) + 1);
  }
  const ranked = [...votes].sort((a, b) => b[1] - a[1]);
  if (!ranked.length || ranked.length > 1 && ranked[0]![1] === ranked[1]![1]) { unresolved.push(maker.name); continue; }
  const id = ranked[0]![0], p = await tmdb<any>(`person/${id}`, { append_to_response: 'external_ids' });
  const imdbId = /^nm\d+$/.test(p.external_ids?.imdb_id ?? '') ? p.external_ids.imdb_id as string : undefined;
  const wiki = imdbId ? await wikipedia(imdbId) : undefined;
  out[maker.name] = { tmdbPersonId: id, ...(img(p.profile_path, 'w185') ? { photo: img(p.profile_path, 'w185')! } : {}), ...(imdbId ? { imdbId } : {}), ...(wiki ? { wikipedia: wiki } : {}), blurb: saved[maker.name]?.blurb ?? '' };
  console.log(`${maker.name} (${maker.films.length}): ${ranked.length > 1 ? `AMBIGUOUS ${JSON.stringify(ranked)}` : 'ok'} photo=${!!out[maker.name]!.photo} imdb=${!!imdbId} wiki=${wiki ?? 'none'} | ${maker.films.slice(0, 4).map(f => f.title).join('; ')}`);
  await new Promise(r => setTimeout(r, 400));
}
writeFileSync(FILE, `${JSON.stringify(out, null, 2)}\n`);
console.log(`${Object.keys(out).length} resolved${unresolved.length ? `; unresolved: ${unresolved.join(', ')}` : ''}`);
