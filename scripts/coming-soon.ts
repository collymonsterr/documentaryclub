// `npm run coming-soon`: snapshots upcoming documentaries (and ones in cinemas now) from TMDB for the /coming-soon page,
// one list per country (the site's country list). Only titles with a YouTube trailer and a confirmed cinema or digital
// release date in that country are kept; festival premieres don't count. A country with too few titles gets no list
// and its visitors see the US one. Hide a title by adding its TMDB id to data/coming-soon-hide.txt. Rerun monthly.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { CATALOGUE } from '../src/data/catalogue';
import { COUNTRIES } from '../src/lib/countries';

const token = process.env['TMDB_READ_ACCESS_TOKEN'];
if (!token) throw new Error('TMDB_READ_ACCESS_TOKEN is not set');
const MAIN = ['IE', 'GB', 'US'];
const ALL = COUNTRIES.map(([code]) => code as string);
// Where TMDB has few dates for a country, its visitors also see its neighbour's, labelled with the neighbour's name.
const PARTNER: Record<string, string> = { IE: 'GB', NZ: 'AU', AT: 'DE', CH: 'DE' };
const PARTNER_NAME: Record<string, string> = { GB: 'the UK', AU: 'Australia', DE: 'Germany' };
const MAX_SOON = 40, MAX_CINEMA = 16, MIN_POPULARITY = 0.5, MIN_TITLES = 6, CINEMA_DAYS = 42;
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
// One record per title; each country's lists point at it with that country's date and where-to-watch line.
export type Upcoming = {
  tmdbId: number; type: 'movie' | 'tv'; title: string; directors: string[];
  overview: string; poster: string; backdrop?: string; trailer: string; filmId?: string;
};
export type Dated = { key: string; date: string; where: string };

// Movies with a cinema (2, 3) or digital (4) release in one country between the two dates.
async function discoverMovies(region: string, from: Date, to: Date, types: string, pages: number) {
  const out: Listed[] = [];
  for (let page = 1; page <= pages; page++) {
    const r = await tmdb<{ results: Listed[]; total_pages: number }>(`discover/movie?with_genres=99&region=${region}&with_release_type=${types}&release_date.gte=${iso(from)}&release_date.lte=${iso(to)}&sort_by=popularity.desc&include_adult=false&page=${page}`);
    out.push(...r.results);
    if (page >= r.total_pages) break;
  }
  return out.filter(keep);
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
const SERVICE_NOTE = /^(netflix|disney\+(?: \/ hulu)?|hulu|hbo max|max|prime video|amazon prime video|apple tv\+?|peacock|paramount\+|bbc iplayer|channel 4|itvx|youtube|pbs|mubi|curzon home cinema|rt[eé] player|crave|stan|binge|canal\+|arte|zdf|ard|movistar\+|filmin|svt play|nrk tv|dr tv|yle areena|cbc gem)$/i;
const serviceNote = (note: string) => SERVICE_NOTE.test(note.trim()) ? note.trim() : '';
// Streamers whose series launch everywhere at once; other networks' series only count in their own country.
const GLOBAL_NETWORK = /^(netflix|disney\+|prime video|amazon|apple tv\+?)$/i;

// Confirmed releases per country: theatrical (2, 3) and digital (4). Type 1 is a festival premiere and is ignored.
type Row = { date: string; cinema: boolean; note: string };
function releases(rd: ReleaseDates) {
  const rows = new Map<string, Row[]>();
  for (const c of rd.results) for (const r of c.release_dates) if ([2, 3, 4].includes(r.type))
    rows.set(c.iso_3166_1, [...(rows.get(c.iso_3166_1) ?? []), { date: r.release_date.slice(0, 10), cinema: r.type !== 4, note: r.note.trim() }]);
  return rows;
}

const image = (size: string, path: string) => `https://image.tmdb.org/t/p/${size}${path}`;
const filmId = (key: string) => inCatalogue.has(key) ? { filmId: inCatalogue.get(key)! } : {};

// Details are fetched once per title however many countries list it.
const titles = new Map<string, Upcoming>();
const movieRows = new Map<number, Map<string, Row[]>>();
const seriesInfo = new Map<number, { date: string; network: string; origin: string[] }>();
async function loadMovie(m: Listed) {
  if (movieRows.has(m.id)) return;
  movieRows.set(m.id, new Map());
  const [rd, videos, credits] = await Promise.all([
    tmdb<ReleaseDates>(`movie/${m.id}/release_dates`), tmdb<{ results: Video[] }>(`movie/${m.id}/videos`), tmdb<{ crew: { job: string; name: string }[] }>(`movie/${m.id}/credits`),
  ]);
  const trailer = pickTrailer(videos.results);
  if (!trailer) return;
  movieRows.set(m.id, releases(rd));
  titles.set(`movie:${m.id}`, {
    tmdbId: m.id, type: 'movie', title: m.title ?? '', overview: m.overview,
    directors: [...new Set(credits.crew.filter(c => c.job === 'Director').map(c => c.name))].slice(0, 3),
    poster: image('w342', m.poster_path!), ...(m.backdrop_path ? { backdrop: image('w780', m.backdrop_path) } : {}), trailer, ...filmId(`movie:${m.id}`),
  });
}
async function loadSeries(t: Listed) {
  const [details, videos] = await Promise.all([
    tmdb<{ first_air_date: string; networks: { name: string }[]; created_by: { name: string }[]; origin_country: string[] }>(`tv/${t.id}`), tmdb<{ results: Video[] }>(`tv/${t.id}/videos`),
  ]);
  const trailer = pickTrailer(videos.results);
  if (!trailer || !details.first_air_date || details.first_air_date <= iso(today)) return;
  seriesInfo.set(t.id, { date: details.first_air_date, network: details.networks[0]?.name ?? '', origin: details.origin_country });
  titles.set(`tv:${t.id}`, {
    tmdbId: t.id, type: 'tv', title: t.name ?? '', directors: details.created_by.map(c => c.name).slice(0, 3), overview: t.overview,
    poster: image('w342', t.poster_path!), ...(t.backdrop_path ? { backdrop: image('w780', t.backdrop_path) } : {}), trailer, ...filmId(`tv:${t.id}`),
  });
}

async function pool<T>(items: T[], fn: (x: T) => Promise<void>) {
  let next = 0;
  const work = async () => { while (next < items.length) await fn(items[next++]!).catch(() => undefined); };
  await Promise.all(Array.from({ length: 6 }, work));
}

// What one country's visitors can see: in cinemas there in the last six weeks, or a first cinema/streaming date there still to come.
// Without a date of its own, a title can use the partner country's, naming it.
function rowsFor(id: number, country: string) {
  const own = movieRows.get(id)?.get(country) ?? [];
  const partner = PARTNER[country];
  if (own.length || !partner) return { rows: own, suffix: '' };
  return { rows: movieRows.get(id)?.get(partner) ?? [], suffix: ` in ${PARTNER_NAME[partner]}` };
}
function inCinemas(id: number, country: string): Dated | undefined {
  const { rows: all, suffix } = rowsFor(id, country);
  const rows = all.filter(r => r.cinema && r.date <= iso(today) && r.date >= iso(new Date(+today - CINEMA_DAYS * DAY)));
  if (!rows.length || !titles.has(`movie:${id}`)) return;
  return { key: `movie:${id}`, date: rows.map(r => r.date).sort()[0]!, where: `In cinemas${suffix}` };
}
function comingSoon(id: number, country: string): Dated | undefined {
  const { rows, suffix } = rowsFor(id, country);
  // Already out there? Then it isn't "coming soon".
  if (!titles.has(`movie:${id}`) || rows.some(r => r.date <= iso(today))) return;
  const first = rows.filter(r => r.date > iso(today)).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!first) return;
  return { key: `movie:${id}`, date: first.date, where: `${first.cinema ? 'In cinemas' : serviceNote(first.note) || 'Streaming'}${suffix}` };
}

const horizon = new Date(+today + 180 * DAY);
const popularity = new Map<string, number>();
const found = new Map<string, { soon: number[]; cinema: number[] }>();
for (const country of ALL) {
  const main = MAIN.includes(country);
  const soon = await discoverMovies(country, new Date(+today + DAY), horizon, '2|3|4', main ? 5 : 2);
  const cinema = await discoverMovies(country, new Date(+today - CINEMA_DAYS * DAY), today, '2|3', main ? 3 : 1);
  for (const m of [...soon, ...cinema]) popularity.set(`movie:${m.id}`, m.popularity);
  found.set(country, { soon: soon.map(m => m.id), cinema: cinema.map(m => m.id) });
  await pool([...soon, ...cinema], loadMovie);
}
const series = await discoverSeries(new Date(+today + DAY), horizon, 3);
for (const t of series) popularity.set(`tv:${t.id}`, t.popularity);
await pool(series, loadSeries);

const byPopularity = (a: Dated, b: Dated) => (popularity.get(b.key) ?? 0) - (popularity.get(a.key) ?? 0);
const countries: Record<string, { inCinemas: Dated[]; comingSoon: Dated[] }> = {};
for (const country of ALL) {
  const own = found.get(country)!, partner = found.get(PARTNER[country] ?? '');
  const soon = [...new Set([...own.soon, ...partner?.soon ?? []])], cinema = [...new Set([...own.cinema, ...partner?.cinema ?? []])];
  const tv = [...seriesInfo].filter(([, s]) => GLOBAL_NETWORK.test(s.network) || s.origin.includes(country))
    .map(([id, s]) => ({ key: `tv:${id}`, date: s.date, where: s.network ? `Series on ${s.network}` : 'Series' }));
  const upcoming = [...soon.map(id => comingSoon(id, country)).filter(x => x !== undefined), ...tv]
    .sort(byPopularity).slice(0, MAX_SOON).sort((a, b) => a.date.localeCompare(b.date));
  const now = cinema.map(id => inCinemas(id, country)).filter(x => x !== undefined).sort(byPopularity).slice(0, MAX_CINEMA);
  // Series alone don't make a country's list: it needs its own confirmed film dates.
  if (upcoming.length - tv.length + now.length >= MIN_TITLES || MAIN.includes(country)) countries[country] = { inCinemas: now, comingSoon: upcoming };
}

const used = new Set(Object.values(countries).flatMap(c => [...c.inCinemas, ...c.comingSoon].map(x => x.key)));
const checked = iso(today);
writeFileSync('src/data/coming-soon.json', `${JSON.stringify({ checked, titles: Object.fromEntries([...titles].filter(([k]) => used.has(k))), countries }, null, 1)}\n`);
console.log(`Checked ${checked}: ${used.size} titles`);
for (const [c, l] of Object.entries(countries)) console.log(`  ${c}  ${l.inCinemas.length} in cinemas, ${l.comingSoon.length} coming soon`);
console.log(`No list (too few titles): ${ALL.filter(c => !countries[c]).join(' ')}`);
for (const x of [...countries['IE']!.inCinemas, ...countries['IE']!.comingSoon]) console.log(`  IE ${x.date}  ${x.key}  ${titles.get(x.key)!.title} | ${x.where}`);
