import { createServerFn } from '@tanstack/react-start';
import { getLiveProviders } from './tmdb.server';
import { CATALOGUE } from '@/data/catalogue';

// Only catalogue IDs are accepted, so the endpoint cannot be used as an open TMDB proxy.
export const getIrishProviders = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? '').slice(0, 80) }))
  .handler(async ({ data }) => {
    const film = CATALOGUE.find(f => f.id === data.id);
    if (!film?.tmdbId || film.mediaType === 'collection') return { known: false, flatrate: [], rent: [], buy: [] };
    // Runtime-injected secrets are read only inside this server handler.
    return getLiveProviders(film.mediaType === 'tv' ? 'tv' : 'movie', film.tmdbId, { token: process.env['TMDB_READ_ACCESS_TOKEN'], apiKey: process.env['TMDB_API_KEY'] });
  });
