// `npm run coming-soon`: snapshots upcoming documentaries (and ones in cinemas now) from TMDB for the /coming-soon page.
// Only titles with a YouTube trailer and a confirmed cinema or digital release date in Ireland, the UK or the US are kept;
// festival premieres don't count. Hide a title by adding its TMDB id to data/coming-soon-hide.txt. Rerun monthly.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { CATALOGUE } from '../src/data/catalogue';

const token = process.env['TMDB_READ_ACCESS_TOKEN'];
if (!token) throw new Error('TMDB_READ_ACCESS_TOKEN is not set');
const COUNTRIES = ['IE', 'GB', 'US'] as const;
const COUNTRY_NAME: Record<string, string> = { IE: 'Ireland', GB: 'the UK', US: 'the US' };
const countryName = (c: string) => COUNTRY_NAME[c] ?? c;
const MAX_SOON = 40, MAX_CINEMA = 16, MIN_POPULARITY = 0.5;
const DAY = 86_400_000;
const today = new Date(new Date().toISOString().slice(0, 10));
const iso = (d: Date) => d.toISOString().slice(0, 10);
const hide = new Set(existsSync('data/coming-soon-hide.txt') ? readFileSync('data/coming-soon-hide.txt', 'utf8').split('\n').map(l => l.replace(/#.*/, '').trim()).filter(Boolean) : []);
const inCatalogue = new Map(CATALOGUE.filter(f => f.tmdbId).map(f => [`${f.mediaType === 'tv' ? 'tv' : 'movie'}:${f.tmdbId}`, f.id]));

async function tmdb<T>(path: string): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://api.themoviedb.org/3/${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }).catch(() => undefined);
    if (res?.ok) return res.json() as Promise<T>;
    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
  }
  throw new Error(`TMDB failed: ${path}`);
}

type Listed = { id: number; title?: string; name?: string; popularity: number; poster_path: string | null; backdrop_path: string | null; overview: string; original_language: string };
type Video = { key: string; site: string; type: string; official: boolean; iso_639_1: string; published_at: string };
type ReleaseDates = { results: { iso_3166_1: string; release_dates: { type: number; release_date: string; note: string }[] }[] };
export type Upcoming = {
  tmdbId: number; type: 'movie' | 'tv'; title: string; date: string; where: string; directors: string[];
  overview: string; poster: string; backdrop?: string; trailer: string; filmId?: string;
};

// Movies with a cinema (2, 3) or digital (4) release in one of our countries between the two dates.
async function discoverMovies(from: Date, to: Date, types: string, countries: readonly string[], pages: number) {
  const seen = new Map<number, Listed>();
  for (const region of countries) for (let page = 1; page <= pages; page++) {
    const r = await tmdb<{ results: Listed[]; total_pages: number }>(`discover/movie?with_genres=99&region=${region}&with_release_type=${types}&release_date.gte=${iso(from)}&release_date.lte=${iso(to)}&sort_by=popularity.desc&include_adult=false&page=${page}`);
    for (const x of r.results) if (!seen.has(x.id)) seen.set(x.id, x);
    if (page >= r.total_pages) break;
  }
  return [...seen.values()].filter(keep).sort((a, b) => b.popularity - a.popularity);
}
async function discoverSeries(from: Date, to: Date, pages: number) {
  const out: Listed[] = [];
  for (let page = 1; page <= pages; page++) {
    const r = await tmdb<{ results: Listed[]; total_pages: number }>(`discover/tv?with_genres=99&first_air_date.gte=${iso(from)}&first_air_date.lte=${iso(to)}&sort_by=popularity.desc&page=${page}`);
    out.push(...r.results);
    if (page >= r.total_pages) break;
  }
  return out.filter(keep);
}
const keep = (r: Listed) => r.popularity >= MIN_POPULARITY && !hide.has(String(r.id)) && Boolean(r.poster_path);

function pickTrailer(videos: Video[]) {
  const yt = videos.filter(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser') && (!v.iso_639_1 || v.iso_639_1 === 'en'));
  const score = (v: Video) => (v.type === 'Trailer' ? 2 : 0) + (v.official ? 1 : 0);
  return yt.sort((a, b) => score(b) - score(a) || b.published_at.localeCompare(a.published_at))[0]?.key;
}

// TMDB's release notes are free text: only trust ones that name a service we recognise.
const SERVICE_NOTE = /^(netflix|disney\+(?: \/ hulu)?|hulu|hbo max|max|prime video|amazon prime video|apple tv\+?|peacock|paramount\+|bbc iplayer|channel 4|itvx|youtube|pbs|mubi|curzon home cinema|rt[eé] player)$/i;
const serviceNote = (note: string) => SERVICE_NOTE.test(note.trim()) ? note.trim() : '';
const list = (xs: string[]) => xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0] ?? '';

// Confirmed releases in IE/GB/US only: theatrical (2, 3) and digital (4). Type 1 is a festival premiere and is ignored.
function releases(rd: ReleaseDates) {
  const rows: { country: string; date: string; cinema: boolean; note: string }[] = [];
  for (const c of rd.results) {
    if (!(COUNTRIES as readonly string[]).includes(c.iso_3166_1)) continue;
    for (const r of c.release_dates) if ([2, 3, 4].includes(r.type)) rows.push({ country: c.iso_3166_1, date: r.release_date.slice(0, 10), cinema: r.type !== 4, note: r.note.trim() });
  }
  return rows;
}

async function movie(m: Listed, mode: 'soon' | 'cinema'): Promise<Upcoming | undefined> {
  const [rd, videos, credits] = await Promise.all([
    tmdb<ReleaseDates>(`movie/${m.id}/release_dates`), tmdb<{ results: Video[] }>(`movie/${m.id}/videos`), tmdb<{ crew: { job: string; name: string }[] }>(`movie/${m.id}/credits`),
  ]);
  const trailer = pickTrailer(videos.results);
  if (!trailer) return;
  const rows = releases(rd);
  let date: string, where: string;
  if (mode === 'cinema') {
    const playing = rows.filter(r => r.cinema && r.country !== 'US' && r.date <= iso(today) && r.date >= iso(new Date(+today - 42 * DAY)));
    if (!playing.length) return;
    date = playing.map(r => r.date).sort()[0]!;
    where = `In cinemas in ${list([...new Set(playing.map(r => countryName(r.country)))])}`;
  } else {
    const future = rows.filter(r => r.date > iso(today)).sort((a, b) => a.date.localeCompare(b.date));
    const first = future[0];
    // Already out somewhere in IE/GB/US? Then it isn't "coming soon".
    if (!first || rows.some(r => r.date <= iso(today))) return;
    date = first.date;
    const same = future.filter(r => r.date === first.date && r.cinema === first.cinema);
    const countries = list([...new Set(same.map(r => countryName(r.country)))]);
    where = first.cinema ? `In cinemas in ${countries}` : `${serviceNote(first.note) || 'Streaming'} in ${countries}`;
  }
  return {
    tmdbId: m.id, type: 'movie', title: m.title ?? '', date, where, overview: m.overview,
    directors: [...new Set(credits.crew.filter(c => c.job === 'Director').map(c => c.name))].slice(0, 3),
    poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`, ...(m.backdrop_path ? { backdrop: `https://image.tmdb.org/t/p/w780${m.backdrop_path}` } : {}),
    trailer, ...(inCatalogue.has(`movie:${m.id}`) ? { filmId: inCatalogue.get(`movie:${m.id}`)! } : {}),
  };
}

async function series(t: Listed): Promise<Upcoming | undefined> {
  const [details, videos] = await Promise.all([
    tmdb<{ first_air_date: string; networks: { name: string }[]; created_by: { name: string }[] }>(`tv/${t.id}`), tmdb<{ results: Video[] }>(`tv/${t.id}/videos`),
  ]);
  const trailer = pickTrailer(videos.results);
  if (!trailer || !details.first_air_date || details.first_air_date <= iso(today)) return;
  return {
    tmdbId: t.id, type: 'tv', title: t.name ?? '', date: details.first_air_date, where: details.networks[0] ? `Series on ${details.networks[0].name}` : 'Series',
    directors: details.created_by.map(c => c.name).slice(0, 3), overview: t.overview,
    poster: `https://image.tmdb.org/t/p/w342${t.poster_path}`, ...(t.backdrop_path ? { backdrop: `https://image.tmdb.org/t/p/w780${t.backdrop_path}` } : {}),
    trailer, ...(inCatalogue.has(`tv:${t.id}`) ? { filmId: inCatalogue.get(`tv:${t.id}`)! } : {}),
  };
}

async function pool<T, R>(items: T[], fn: (x: T) => Promise<R | undefined>, limit: number) {
  const out: R[] = [];
  let next = 0;
  const work = async () => { while (next < items.length && out.length < limit * 3) { const r = await fn(items[next++]!).catch(() => undefined); if (r) out.push(r); } };
  await Promise.all([work(), work(), work()]);
  return out;
}

const horizon = new Date(+today + 180 * DAY);
const soonMovies = await discoverMovies(new Date(+today + DAY), horizon, '2|3|4', COUNTRIES, 5);
const soonTv = await discoverSeries(new Date(+today + DAY), horizon, 3);
const cinemaMovies = await discoverMovies(new Date(+today - 42 * DAY), today, '2|3', ['IE', 'GB'], 3);
const popularity = new Map([...soonMovies, ...soonTv, ...cinemaMovies].map(x => [x.id, x.popularity]));
const byPopularity = (a: Upcoming, b: Upcoming) => (popularity.get(b.tmdbId) ?? 0) - (popularity.get(a.tmdbId) ?? 0);

const soon = [...await pool(soonMovies, m => movie(m, 'soon'), MAX_SOON), ...await pool(soonTv, series, 10)]
  .sort(byPopularity).slice(0, MAX_SOON).sort((a, b) => a.date.localeCompare(b.date));
const cinema = (await pool(cinemaMovies, m => movie(m, 'cinema'), MAX_CINEMA)).sort(byPopularity).slice(0, MAX_CINEMA);

const checked = iso(today);
writeFileSync('src/data/coming-soon.json', `${JSON.stringify({ checked, inCinemas: cinema, comingSoon: soon }, null, 1)}\n`);
console.log(`Checked ${checked}: ${cinema.length} in cinemas, ${soon.length} coming soon`);
for (const x of cinema) console.log(`  NOW  ${x.tmdbId}  ${x.title} | ${x.where}`);
for (const x of soon) console.log(`  ${x.date}  ${x.tmdbId}  ${x.title} | ${x.where}`);
