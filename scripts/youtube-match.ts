// Rules for accepting a YouTube video as the full film. Kept apart from the API calls so they can be tested.
export const TOLERANCE_MINUTES = 10, MIN_AGE_DAYS = 183, REGIONS = ['IE', 'US', 'GB'];
export type Video = { id: string; title: string; channelId: string; channelTitle: string; minutes: number; publishedAt: string; views: number; public: boolean; blocked: string[]; allowed?: string[] };
export type Film = { title: string; aliases?: string[]; minutes?: number | undefined };
export type Verdict = 'confirmed' | 'review';

const normalize = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
export const namesFilm = (videoTitle: string, film: Film) => {
  const video = ` ${normalize(videoTitle)} `;
  return [film.title, ...(film.aliases ?? [])].some(t => normalize(t) && video.includes(` ${normalize(t)} `));
};
export const parseDuration = (iso: string) => {
  const m = iso.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  return m ? Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) + Number(m[4] ?? 0) / 60 : 0;
};
// Long videos that talk about a film rather than being it.
const ABOUT_THE_FILM = /\b(podcast|commentary|review|reaction|interview|discussion|case study|episode|ep \d+|breakdown|explained|analysis|facts|in conversation|deep dive)\b/;
const opensWith = (videoTitle: string, film: Film) => [film.title, ...(film.aliases ?? [])].some(t => ` ${normalize(videoTitle)} `.startsWith(` ${normalize(t)} `));
// A film free on YouTube in any one main region is worth linking: people want to watch there, even if it's blocked elsewhere.
export const playsIn = (v: Pick<Video, 'blocked' | 'allowed'>) => REGIONS.filter(r => !v.blocked.includes(r) && (!v.allowed || v.allowed.includes(r)));
export const playable = (v: Video) => v.public && playsIn(v).length > 0;
const distinctive = (title: string) => normalize(title).split(' ').length >= 2;

// Official channels are tagged; anything else needs the owner's yes, and only once it has stayed up for months.
export function judge(film: Film, video: Video, trusted: Set<string>, now = Date.now()): Verdict | null {
  if (!namesFilm(video.title, film) || !playable(video) || ABOUT_THE_FILM.test(normalize(video.title))) return null;
  if (film.minutes && Math.abs(video.minutes - film.minutes) > TOLERANCE_MINUTES) return null;
  if (trusted.has(video.channelId)) return film.minutes && distinctive(film.title) && opensWith(video.title, film) ? 'confirmed' : 'review';
  const days = (now - Date.parse(video.publishedAt)) / 86_400_000;
  return days >= MIN_AGE_DAYS ? 'review' : null;
}
