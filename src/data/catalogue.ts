import { CATEGORIES, FILMS, type Film } from './films';
import { IMPORT_LIST, MERGED_INTO, importSlug } from './import-list';
import snapshotJson from './catalogue-snapshot.json';
import manifestJson from './import-manifest.json';
import manifest2Json from './import-manifest-2.json';
import { CATEGORY_OVERRIDES } from './import-batch2';

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
const SECTION: Record<string, string> = { 'Strange but True': 'strange', 'Cults, Psychology and Manipulation': 'psychology', 'Scams and Grifts': 'scams', 'Technology, Internet and Ideas': 'tech', 'Crime, Investigations and Injustice': 'crime', 'Politics and Geopolitics': 'politics', 'Economics, Corporations and Inequality': 'economics', 'Survival and Extraordinary Feats': 'survival', 'Nature and Science': 'nature', 'Cults, High-Control Groups & Manipulation': 'psychology', 'Strange True Stories & Twists': 'strange', 'Politics, History & Systemic Injustice': 'politics' };

const label = (id: string) => CATEGORIES.find(c => c.id === id)?.label ?? id;
const batch2 = MANIFEST2.entries.filter(e => e.status === 'resolved' || e.status.startsWith('pending')).map(e => ({ title: e.input.title, year: e.input.year, yearEnd: e.input.yearEnd, category: SECTION[e.input.section] ?? 'strange' }));
const imported: Film[] = [...IMPORT_LIST.filter(e => !MERGED_INTO[`${e.title}|${e.year}`]), ...batch2].map((e: { title: string; year: number; category: string; yearEnd?: number }) => {
  const id = importSlug(e.title), s = SNAPSHOT[id], resolved = s?.status === 'resolved';
  const categories = (CATEGORY_OVERRIDES[e.title] ?? [e.category]) as Film['categories'];
  const aliases = s?.canonicalTitle && s.canonicalTitle !== e.title ? [s.canonicalTitle] : [];
  return {
    id, title: e.title, year: e.year, director: s?.people?.join(', ') ?? '', genre: s?.mediaType === 'collection' ? 'Film series' : label(categories[0]!), categories,
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
export const CATALOGUE: Film[] = [...originals, ...imported];

export function searchCatalogue(films: Film[], query: string, type: 'all' | 'movie' | 'tv') {
  const words = query.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
  return films.filter(f => (type === 'all' || (f.mediaType === 'collection' ? 'movie' : f.mediaType ?? 'movie') === type) && words.every(w =>
    [f.title, ...(f.aliases ?? []), f.director].join(' ').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').includes(w)));
}
