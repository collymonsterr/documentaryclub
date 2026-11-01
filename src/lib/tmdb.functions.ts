import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { getLiveProviders } from './tmdb.server';
import { isCountry } from './countries';
import { CATALOGUE } from '@/data/catalogue';

// Only catalogue IDs are accepted, so the endpoint cannot be used as an open TMDB proxy.
export const getProviders = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string; country: string }) => ({ id: String(data?.id ?? '').slice(0, 80), country: isCountry(data?.country) ? data.country : 'US' }))
  .handler(async ({ data }) => {
    const film = CATALOGUE.find(f => f.id === data.id);
    if (!film?.tmdbId || film.mediaType === 'collection') return { known: false, flatrate: [], rent: [], buy: [] };
    // Runtime-injected secrets are read only inside this server handler.
    return getLiveProviders(film.mediaType === 'tv' ? 'tv' : 'movie', film.tmdbId, { token: process.env['TMDB_READ_ACCESS_TOKEN'], apiKey: process.env['TMDB_API_KEY'] }, data.country);
  });

// Cloudflare adds the visitor's country to every request; nothing about them is stored.
export const getVisitorCountry = createServerFn({ method: 'GET' }).handler(async () => {
  const country = getRequestHeader('cf-ipcountry')?.toUpperCase();
  return isCountry(country) ? country : null;
});
