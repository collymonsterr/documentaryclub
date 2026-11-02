import { CATEGORIES, FILMS, type Film } from './films';
import { IMPORT_LIST, MERGED_INTO, importSlug } from './import-list';
import snapshotJson from './catalogue-snapshot.json';
import manifestJson from './import-manifest.json';
import manifest2Json from './import-manifest-2.json';
import manifest3Json from './import-manifest-3.json';
import { CATEGORY_OVERRIDES } from './import-batch2';
import sheetJson from './catalogue-sheet.json';

// Public metadata resolved once at import (scripts/resolve-catalogue.ts). Contains no credentials.
export type Snapshot = {
  status: 'resolved' | 'pending'; mediaType?: 'movie' | 'tv' | 'collection'; yearEnd?: number; parts?: string[]; tmdbId?: number; imdbId?: string; canonicalTitle?: string;
  people?: string[]; runtime?: number; episodes?: number; poster?: string; overview?: string; trailer?: string;
  backdrops?: string[]; tmdbRating?: number; votes?: number; omdb?: { imdb?: number; rottenTomatoes?: number; awards?: string };
};
export const SNAPSHOT = snapshotJson as Record<string, Snapshot>;
export type ManifestEntry = { input: { title: string; year: number; category: string }; id: string; status: string; reason?: string; chosen?: { mediaType: 'movie' | 'tv'; tmdbId: number; imdbId?: string; canonicalTitle: string; year: number; people: string[] } };
export const MANIFEST = manifestJson as { submitted: number; entries: ManifestEntry[] };
export type Manifest2Entry = { input: { source: 'attachment' | 'inline'; section: string; raw: string; title: string; year: number; yearEnd?: number }; id: string; status: string; reason?: string; chosen?: ManifestEntry['chosen'] | { mediaType: 'collection'; tmdbId: number; canonicalTitle: string; year: number; people: string[] } };
export const MANIFEST2 = manifest2Json as unknown as { rawInputs: number; entries: Manifest2Entry[] };
export type Manifest3Entry = { input: { section: string; title: string; year: number }; id: string; status: string; reason?: string; chosen?: ManifestEntry['chosen'] };
export const MANIFEST3 = manifest3Json as unknown as { rawInputs: number; entries: Manifest3Entry[] };
const SECTION: Record<string, string> = { 'Strange but True': 'strange', 'Cults, Psychology and Manipulation': 'psychology', 'Scams and Grifts': 'scams', 'Technology, Internet and Ideas': 'tech', 'Crime, Investigations and Injustice': 'crime', 'Politics and Geopolitics': 'politics', 'Economics, Corporations and Inequality': 'economics', 'Survival and Extraordinary Feats': 'survival', 'Nature and Science': 'nature', 'Cults, High-Control Groups & Manipulation': 'psychology', 'Strange True Stories & Twists': 'strange', 'Politics, History & Systemic Injustice': 'politics' };

const label = (id: string) => CATEGORIES.find(c => c.id === id)?.label ?? id;
const batch2 = MANIFEST2.entries.filter(e => e.status === 'resolved' || e.status.startsWith('pending')).map(e => ({ title: e.input.title, year: e.input.year, yearEnd: e.input.yearEnd, category: SECTION[e.input.section] ?? 'strange' }));
const batch3 = MANIFEST3.entries.filter(e => e.status === 'resolved' || e.status.startsWith('pending')).map(e => ({ title: e.input.title, year: e.input.year, category: 'sexdrugs' }));
const imported: Film[] = [...IMPORT_LIST.filter(e => !MERGED_INTO[`${e.title}|${e.year}`]), ...batch2, ...batch3].map((e: { title: string; year: number; category: string; yearEnd?: number | undefined }) => {
  const id = importSlug(e.title), s = SNAPSHOT[id], resolved = s?.status === 'resolved';
  // Strict 1-to-1 subjects: every title has exactly one home category (primary override wins).
  const categories = [CATEGORY_OVERRIDES[e.title]?.[0] ?? e.category] as Film['categories'];
  const aliases = s?.canonicalTitle && s.canonicalTitle !== e.title ? [s.canonicalTitle] : [];
  return {
    id, title: e.title, year: e.year, director: s?.people?.join(', ') ?? '', genre: label(categories[0]!), categories,
    synopsis: s?.overview ?? 'Approved title awaiting verified synopsis.', awards: [], hue: 0, aliases,
    mediaType: s?.mediaType ?? 'movie', pending: !resolved,
    ...(s?.runtime ? { minutes: s.runtime } : {}), ...(s?.tmdbId ? { tmdbId: s.tmdbId } : {}), ...(s?.imdbId ? { imdbId: s.imdbId } : {}), ...(s?.episodes ? { episodes: s.episodes } : {}),
    ...(e.yearEnd ? { yearEnd: e.yearEnd } : {}), ...(s?.parts?.length ? { parts: s.parts } : {}),
  };
});
const originals: Film[] = FILMS.map(f => {
  const s = SNAPSHOT[f.id];
  return { ...f, mediaType: 'movie', ...(s?.tmdbId ? { tmdbId: s.tmdbId } : {}), ...(s?.imdbId ? { imdbId: s.imdbId } : {}) };
});
// 17-category restructure (user brief): explicit moves by stable ID; former Sex & Drugs titles default to Drugs.
const ids = (s: string) => s.split(' ');
export const RESTRUCTURE: Partial<Record<Film['categories'][number], string[]>> = {
  war: ids('mariupol 5-broken-cameras for-sama hearts-and-minds last-men-in-aleppo no-end-in-sight restrepo taxi-to-the-dark-side the-act-of-killing the-look-of-silence the-fog-of-war the-vietnam-war'),
  sport: ids('senna hoop-dreams icarus the-armstrong-lie the-king-of-kong ecstasy-of-order-the-tetris-masters free-to-play the-speed-cubers riding-giants the-barkley-marathons hands-on-a-hardbody'),
  science: ids('apollo-11 for-all-mankind in-the-shadow-of-the-moon the-farthest particle-fever into-eternity cave-of-forgotten-dreams'),
  life: ids('stories-we-tell eternal-memory daughters four-daughters up-series time'),
  music: ['amy'], nature: ['fantastic-fungi'], crime: ['quiet-on-set-the-dark-side-of-kids-tv'],
  sex: ids("after-porn-ends hot-girls-wanted inside-deep-throat kink louis-and-the-brothel louis-theroux-twilight-of-the-porn-stars louis-theroux-s-weird-weekends-porn money-shot-the-pornhub-story rocco scotty-and-the-secret-history-of-hollywood secrets-of-playboy silicone-soul guys-and-dolls love-me whores-glory louis-theroux-s-forbidden-america"),
};
const MOVED = new Map(Object.entries(RESTRUCTURE).flatMap(([cat, list]) => list.map(id => [id, cat] as const)));
const PRESENTED_BY_THEROUX = new Set(['louis-and-the-brothel']); // Theroux title without his name in it
const restructured: Film[] = [...originals, ...imported].map(f => {
  const cat = (MOVED.get(f.id) ?? (f.categories[0] === ('sexdrugs' as string) ? 'drugs' : f.categories[0])) as Film['categories'][number];
  const presenter = /Louis Theroux/.test(f.title) || PRESENTED_BY_THEROUX.has(f.id) ? 'Louis Theroux' : undefined;
  return { ...f, categories: [cat], ...(f.genre === label(f.categories[0]!) || f.genre === 'Sex & Drugs' ? { genre: label(cat) } : {}), ...(presenter ? { presenter } : {}) };
});

// data/catalogue-master.csv (final authority, matched by stable id) generates catalogue-sheet.json via `npm run sync-catalogue`.
// Titles not in the sheet are dropped; sheet titles with no curated source are built from the enrichment snapshot.
export type SheetRow = { id: string; title: string; year: number; format: 'Film' | 'Series' | 'Collection'; director?: string; category: string; moods?: string[]; tags?: string[]; tmdbId?: number; imdbId?: string; awards?: string[]; youtubeId?: string; netflixId?: string };
export const SHEET = sheetJson as SheetRow[];
const catId = (l: string) => CATEGORIES.find(c => c.label === l)?.id;
const known = new Set(restructured.map(f => f.id));
const created: Film[] = SHEET.filter(r => !known.has(r.id)).map(r => {
  const s = SNAPSHOT[r.id], resolved = s?.status === 'resolved';
  return { id: r.id, title: r.title, year: r.year, director: '', genre: '', categories: ['strange'], synopsis: s?.overview ?? 'Approved title awaiting verified synopsis.', awards: [], hue: 0,
    aliases: s?.canonicalTitle && s.canonicalTitle !== r.title ? [s.canonicalTitle] : [], mediaType: s?.mediaType ?? 'movie', pending: !resolved,
    ...(s?.runtime ? { minutes: s.runtime } : {}), ...(s?.episodes ? { episodes: s.episodes } : {}) };
});
const byId = new Map(SHEET.map(r => [r.id, r]));
const MEDIA = { Film: 'movie', Series: 'tv', Collection: 'collection' } as const;
export const CATALOGUE: Film[] = [...restructured, ...created].flatMap(f => {
  const r = byId.get(f.id); if (!r) return [];
  const cat = (catId(r.category) ?? f.categories[0]) as Film['categories'][number];
  const director = r.director ?? (f.director || SNAPSHOT[f.id]?.people?.join(', ') || '');
  const genre = !f.genre || f.genre === label(f.categories[0]!) ? label(cat) : f.genre;
  const { tmdbId, imdbId, ...rest } = f;
  return [{ ...rest, title: r.title, year: r.year, awards: r.awards ?? [], categories: [cat], genre, director, mediaType: MEDIA[r.format], ...(r.tmdbId ? { tmdbId: r.tmdbId } : {}), ...(r.imdbId ? { imdbId: r.imdbId } : {}), ...(r.tags?.length ? { tags: r.tags } : {}), ...(r.youtubeId ? { youtubeId: r.youtubeId } : {}), ...(r.netflixId ? { netflixId: r.netflixId } : {}) }];
});

export function searchCatalogue(films: Film[], query: string, type: 'all' | 'movie' | 'tv') {
  const words = query.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
  return films.filter(f => (type === 'all' || (f.mediaType === 'collection' ? 'tv' : f.mediaType ?? 'movie') === type) && words.every(w =>
    [f.title, ...(f.aliases ?? []), f.director].join(' ').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').includes(w)));
}
