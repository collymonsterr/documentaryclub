// `npm run streaming-availability`: records which catalogue titles TMDB (JustWatch data) lists on each service in SERVICES,
// per country, for the /netflix, /prime-video … pages. Page loads read the saved file and never fetch providers catalogue-wide.
// Rerun monthly, then republish and run IndexNow.
import { writeFileSync } from 'node:fs';
import { CATALOGUE } from '../src/data/catalogue';
import { SERVICES, STREAMING_COUNTRIES } from '../src/data/streaming';

const token = process.env['TMDB_READ_ACCESS_TOKEN'];
if (!token) throw new Error('TMDB_READ_ACCESS_TOKEN is not set');
type Region = Partial<Record<'flatrate' | 'ads' | 'free', { provider_name: string }[]>>;
const names = (region?: Region) => [...(region?.flatrate ?? []), ...(region?.ads ?? []), ...(region?.free ?? [])].map(p => p.provider_name);

const films = CATALOGUE.filter(f => f.tmdbId && f.mediaType !== 'collection');
const found: Record<string, Record<string, string[]>> = Object.fromEntries(SERVICES.map(s => [s.id, Object.fromEntries(STREAMING_COUNTRIES.map(c => [c, [] as string[]]))]));
let failed = 0, next = 0;
async function worker() {
  while (next < films.length) {
    const film = films[next++]!;
    const res = await fetch(`https://api.themoviedb.org/3/${film.mediaType === 'tv' ? 'tv' : 'movie'}/${film.tmdbId}/watch/providers`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }).catch(() => undefined);
    if (!res?.ok) { failed++; continue; }
    const results = ((await res.json()) as { results?: Record<string, Region> }).results ?? {};
    for (const c of STREAMING_COUNTRIES) {
      const here = names(results[c]);
      for (const s of SERVICES) if (here.some(n => s.match.test(n))) found[s.id]![c]!.push(film.id);
    }
  }
}
await Promise.all([worker(), worker(), worker()]);
if (failed > films.length / 10) throw new Error(`${failed} of ${films.length} lookups failed; keeping the old file`);
for (const byCountry of Object.values(found)) for (const ids of Object.values(byCountry)) ids.sort();
const checked = new Date().toISOString().slice(0, 10);
writeFileSync('src/data/streaming-availability.json', `${JSON.stringify({ checked, services: found })}\n`);
console.log(`Checked ${films.length} titles (${failed} failed) on ${checked}`);
for (const s of SERVICES) console.log(`  ${s.name}: ${STREAMING_COUNTRIES.map(c => `${c} ${found[s.id]![c]!.length}`).join(', ')}, any ${new Set(Object.values(found[s.id]!).flat()).size}`);
