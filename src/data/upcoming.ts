import data from './coming-soon.json';

// The /coming-soon snapshot (`npm run coming-soon`): titles once, plus each country's two lists pointing at them.
export type UpcomingTitle = {
  tmdbId: number; type: string; slug: string; title: string; directors: string[]; overview: string; poster: string; backdrop?: string; trailer: string; filmId?: string;
  tagline?: string; runtime?: number; featuring?: string[]; genres?: string[]; language?: string; originalTitle?: string; madeIn?: string[]; imdbId?: string; network?: string;
};
export type Dated = { key: string; date: string; where: string };
export type Upcoming = UpcomingTitle & Dated;
export type CountryLists = { inCinemas: Dated[]; comingSoon: Dated[] };

export const UPCOMING_CHECKED = data.checked;
export const UPCOMING_TITLES = data.titles as Record<string, UpcomingTitle>;
export const UPCOMING_LISTS = data.countries as Record<string, CountryLists>;
export const UPCOMING_FALLBACK = 'US';
const keyBySlug = new Map(Object.entries(UPCOMING_TITLES).map(([key, t]) => [t.slug, key]));
export const upcomingKey = (slug: string) => keyBySlug.get(slug);
export const upcomingSlugs = () => [...keyBySlug.keys()];
export const resolveUpcoming = (xs: Dated[]) => xs.flatMap(x => UPCOMING_TITLES[x.key] ? [{ ...UPCOMING_TITLES[x.key]!, ...x }] : []);
// Every country that lists a title, with its date there and whether it's already in cinemas.
export const upcomingDates = (key: string) => Object.entries(UPCOMING_LISTS).flatMap(([country, l]) => {
  const now = l.inCinemas.find(x => x.key === key), soon = l.comingSoon.find(x => x.key === key);
  return now ? [{ country, ...now, now: true }] : soon ? [{ country, ...soon, now: false }] : [];
});
