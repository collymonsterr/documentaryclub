import { CATEGORIES, FILMS, type Film } from './films';
import { IMPORT_LIST, MERGED_INTO, importSlug } from './import-list';
import snapshotJson from './catalogue-snapshot.json';
import manifestJson from './import-manifest.json';

// Public metadata resolved once at import (scripts/resolve-catalogue.ts). Contains no credentials.
export type Snapshot = {
  status: 'resolved' | 'pending'; mediaType?: 'movie' | 'tv'; tmdbId?: number; imdbId?: string; canonicalTitle?: string;
  people?: string[]; runtime?: number; episodes?: number; poster?: string; overview?: string; trailer?: string;
  backdrops?: string[]; tmdbRating?: number; votes?: number; omdb?: { imdb?: number; rottenTomatoes?: number; awards?: string };
};
export const SNAPSHOT = snapshotJson as Record<string, Snapshot>;
export type ManifestEntry = { input: { title: string; year: number; category: string }; id: string; status: string; reason?: string; chosen?: { mediaType: 'movie' | 'tv'; tmdbId: number; imdbId?: string; canonicalTitle: string; year: number; people: string[] } };
export const MANIFEST = manifestJson as { submitted: number; entries: ManifestEntry[] };

const label = (id: string) => CATEGORIES.find(c => c.id === id)?.label ?? id;
const imported: Film[] = IMPORT_LIST.filter(e => !MERGED_INTO[`${e.title}|${e.year}`]).map(e => {
  const id = importSlug(e.title), s = SNAPSHOT[id], resolved = s?.status === 'resolved';
  const aliases = s?.canonicalTitle && s.canonicalTitle !== e.title ? [s.canonicalTitle] : [];
  return {
    id, title: e.title, year: e.year, director: s?.people?.join(', ') ?? '', genre: label(e.category), categories: [e.category],
    synopsis: s?.overview ?? 'Approved title awaiting verified synopsis.', awards: [], hue: 0, aliases,
    mediaType: s?.mediaType ?? 'movie', pending: !resolved,
    ...(s?.runtime ? { minutes: s.runtime } : {}), ...(s?.tmdbId ? { tmdbId: s.tmdbId } : {}), ...(s?.imdbId ? { imdbId: s.imdbId } : {}), ...(s?.episodes ? { episodes: s.episodes } : {}),
  };
});
const originals: Film[] = FILMS.map(f => {
  const s = SNAPSHOT[f.id];
  return { ...f, mediaType: 'movie', ...(s?.tmdbId ? { tmdbId: s.tmdbId } : {}), ...(s?.imdbId ? { imdbId: s.imdbId } : {}) };
});
export const CATALOGUE: Film[] = [...originals, ...imported];

export function searchCatalogue(films: Film[], query: string, type: 'all' | 'movie' | 'tv') {
  const words = query.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
  return films.filter(f => (type === 'all' || (f.mediaType ?? 'movie') === type) && words.every(w =>
    [f.title, ...(f.aliases ?? []), f.director].join(' ').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').includes(w)));
}
