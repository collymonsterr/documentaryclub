// `npm run netflix-availability`: records which catalogue titles TMDB (JustWatch data) lists on Netflix in each country,
// for the /netflix/x pages. Page loads read the saved file and never fetch providers catalogue-wide. Rerun monthly.
import { writeFileSync } from 'node:fs';
import { CATALOGUE } from '../src/data/catalogue';
import { NETFLIX_COUNTRIES } from '../src/data/netflix';

const token = process.env['TMDB_READ_ACCESS_TOKEN'];
if (!token) throw new Error('TMDB_READ_ACCESS_TOKEN is not set');
type Region = Record<'flatrate' | 'ads' | 'free', { provider_id: number; provider_name: string }[] | undefined>;
const onNetflix = (region?: Region) => [...(region?.flatrate ?? []), ...(region?.ads ?? []), ...(region?.free ?? [])].some(p => /^netflix/i.test(p.provider_name));

const films = CATALOGUE.filter(f => f.tmdbId && f.mediaType !== 'collection');
const found: Record<string, string[]> = Object.fromEntries(NETFLIX_COUNTRIES.map(c => [c.code, []]));
let failed = 0, next = 0;
async function worker() {
  while (next < films.length) {
    const film = films[next++]!;
    const res = await fetch(`https://api.themoviedb.org/3/${film.mediaType === 'tv' ? 'tv' : 'movie'}/${film.tmdbId}/watch/providers`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }).catch(() => undefined);
    if (!res?.ok) { failed++; continue; }
    const results = ((await res.json()) as { results?: Record<string, Region> }).results ?? {};
    for (const c of NETFLIX_COUNTRIES) if (onNetflix(results[c.code])) found[c.code]!.push(film.id);
  }
}
await Promise.all([worker(), worker(), worker()]);
if (failed > films.length / 10) throw new Error(`${failed} of ${films.length} lookups failed; keeping the old file`);
const checked = new Date().toISOString().slice(0, 10);
writeFileSync('src/data/netflix-availability.json', `${JSON.stringify({ checked, ...Object.fromEntries(Object.entries(found).map(([c, ids]) => [c, ids.sort()])) }, null, 2)}\n`);
console.log(`Checked ${films.length} titles (${failed} failed) on ${checked}: ${NETFLIX_COUNTRIES.map(c => `${c.code} ${found[c.code]!.length}`).join(', ')}`);
