import { SNAPSHOT } from '@/data/catalogue';
import type { Film } from '@/data/films';
import { SITE_NAME as NAME, SITE_ORIGIN } from '@/lib/site-urls';

// schema.org JSON-LD for search engines. Only facts we hold: no star ratings, because Google forbids marking up scores from other sites.
const url = (path: string) => `${SITE_ORIGIN}${path}`;

export const siteSchema = () => [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: url('/'), description: 'A curated guide to documentaries worth your time, with trailers, ratings and where to watch them.' },
  { '@context': 'https://schema.org', '@type': 'Organization', name: NAME, url: url('/'), logo: url('/favicon.svg') },
];

export const breadcrumbs = (items: [name: string, path: string][]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url(path) })),
});

export function filmSchema(film: Film) {
  const snap = SNAPSHOT[film.id], series = film.mediaType === 'tv', runtime = snap?.runtime ?? film.minutes;
  return {
    '@context': 'https://schema.org', '@type': series ? 'TVSeries' : 'Movie',
    name: film.title, url: url(`/film/${film.id}`), genre: 'Documentary',
    ...(film.aliases?.length ? { alternateName: film.aliases } : {}),
    ...(series ? { startDate: String(film.year), ...(film.yearEnd ? { endDate: String(film.yearEnd) } : {}), ...(film.episodes ? { numberOfEpisodes: film.episodes } : {}) } : { datePublished: String(film.year) }),
    ...(film.director ? { director: film.director.split(', ').map(name => ({ '@type': 'Person', name })) } : {}),
    ...(snap?.poster ? { image: snap.poster } : {}),
    ...(snap?.overview ?? film.synopsis ? { description: snap?.overview ?? film.synopsis } : {}),
    ...(!series && runtime ? { duration: `PT${runtime}M` } : {}),
    ...(film.imdbId ? { sameAs: [`https://www.imdb.com/title/${film.imdbId}/`] } : {}),
  };
}

// A summary page for Google's list results: each entry points at the film's own page, which carries the details.
export const itemList = (name: string, films: Film[]) => ({
  '@context': 'https://schema.org', '@type': 'ItemList', name, numberOfItems: films.length,
  itemListElement: films.map((f, i) => ({ '@type': 'ListItem', position: i + 1, url: url(`/film/${f.id}`), name: f.title })),
});
