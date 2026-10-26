import { createServerFn } from '@tanstack/react-start';
import { getCatalogueEnrichment } from './tmdb.server';
import { getOmdbEnrichment } from './omdb.server';
import { FILMS } from '@/data/films';

export const getTmdbCatalogue = createServerFn({ method: 'GET' }).handler(async () => {
  // Runtime-injected secrets are read only inside this stripped server handler, never from client env or module scope.
  return getCatalogueEnrichment({ token: process.env['TMDB_READ_ACCESS_TOKEN'], apiKey: process.env['TMDB_API_KEY'] });
});

export const getOmdbCatalogue = createServerFn({ method: 'GET' }).handler(async () => {
  const omdbKey = process.env['OMDB_API_KEY'];
  const ratings: Record<string, Awaited<ReturnType<typeof getOmdbEnrichment>>> = {};
  if (omdbKey) {
    const result = await getCatalogueEnrichment({ token: process.env['TMDB_READ_ACCESS_TOKEN'], apiKey: process.env['TMDB_API_KEY'] });
    for (let i = 0; i < FILMS.length; i += 3) {
      await Promise.all(FILMS.slice(i, i + 3).map(async film => {
        const extra = result[film.id];
        ratings[film.id] = await getOmdbEnrichment(film, omdbKey, extra?.imdbId);
      }));
    }
  }
  return ratings;
});