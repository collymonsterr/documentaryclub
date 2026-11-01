import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { CATALOGUE } from '@/data/catalogue';

export type SearchResult = { tmdbId: number; mediaType: 'movie' | 'tv'; title: string; year?: string | undefined; poster?: string | undefined; catalogueId?: string | undefined };
type Raw = { id: number; title?: string; name?: string; release_date?: string; first_air_date?: string; poster_path?: string | null; genre_ids?: number[]; popularity?: number };
const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

async function tmdbSearch(kind: 'movie' | 'tv', query: string) {
  const token = process.env['TMDB_READ_ACCESS_TOKEN'], apiKey = process.env['TMDB_API_KEY'];
  const url = new URL(`https://api.themoviedb.org/3/search/${kind}`);
  url.searchParams.set('query', query); url.searchParams.set('include_adult', 'false');
  if (!token && apiKey) url.searchParams.set('api_key', apiKey);
  const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(6000) });
  if (!response.ok) return [];
  return ((await response.json() as { results?: Raw[] }).results ?? []).map(r => ({ ...r, kind }));
}
// Documentaries only, so the search cannot be used as a general TMDB proxy.
export const searchDocumentaries = createServerFn({ method: 'GET' })
  .inputValidator((data: { query: string }) => ({ query: clean(data?.query, 80) }))
  .handler(async ({ data }): Promise<SearchResult[]> => {
    if (data.query.length < 2) return [];
    const found = (await Promise.all([tmdbSearch('movie', data.query), tmdbSearch('tv', data.query)])).flat();
    return found.filter(r => r.genre_ids?.includes(99)).sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)).slice(0, 6).map(r => ({
      tmdbId: r.id, mediaType: r.kind, title: r.title ?? r.name ?? 'Untitled', year: (r.release_date ?? r.first_air_date ?? '').slice(0, 4) || undefined,
      poster: r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : undefined, catalogueId: CATALOGUE.find(f => f.tmdbId === r.id && (f.mediaType === 'tv') === (r.kind === 'tv'))?.id,
    }));
  });

const recent = new Map<string, number[]>();
const LIMIT = 5, WINDOW = 60 * 60_000;
function allowed(ip: string) {
  const now = Date.now(), hits = (recent.get(ip) ?? []).filter(t => now - t < WINDOW);
  if (recent.size > 2000) recent.clear();
  if (hits.length >= LIMIT) return false;
  recent.set(ip, [...hits, now]);
  return true;
}
type Feedback = { kind: 'suggestion' | 'message'; name: string; note: string; title: string; year: string; tmdbId: string; mediaType: string; website: string };
// Entries go to a private Google Sheet through FEEDBACK_WEBHOOK_URL (see docs/feedback-sheet.gs).
export const sendFeedback = createServerFn({ method: 'POST' })
  .inputValidator((data: Feedback): Feedback => ({
    kind: data?.kind === 'message' ? 'message' : 'suggestion', name: clean(data?.name, 80), note: clean(data?.note, 2000), title: clean(data?.title, 200),
    year: clean(data?.year, 4), tmdbId: clean(data?.tmdbId, 12), mediaType: clean(data?.mediaType, 5), website: clean(data?.website, 100),
  }))
  .handler(async ({ data }) => {
    const { website, ...entry } = data;
    if (website) return { ok: true }; // Hidden field only bots fill in.
    if (entry.kind === 'suggestion' ? !entry.title : !entry.note) return { ok: false };
    const webhook = process.env['FEEDBACK_WEBHOOK_URL'];
    if (!webhook || !allowed(getRequestHeader('cf-connecting-ip') ?? 'unknown')) return { ok: false };
    try {
      const response = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(entry), signal: AbortSignal.timeout(8000) });
      return { ok: response.ok };
    } catch {
      return { ok: false };
    }
  });
