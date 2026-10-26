import { createServerFn } from '@tanstack/react-start';
import { getCatalogueEnrichment } from './tmdb.server';

export const getTmdbCatalogue = createServerFn({ method: 'GET' }).handler(async () => {
  return getCatalogueEnrichment({ token: process.env['TMDB_READ_ACCESS_TOKEN'], apiKey: process.env['TMDB_API_KEY'] });
});