import { CATALOGUE, SHEET, SNAPSHOT } from './catalogue';
import type { Film } from './films';
import { awardBody, awardRank, type AwardBody } from './award-bodies';
import { TOPIC_TAGS } from './tags';
import { LIKE_PAGES } from './like-pages';
import { NETFLIX_PICK, onNetflix } from './netflix';

export const MOODS = [
  { id: 'funny', label: 'Funny' }, { id: 'feelgood', label: 'Feel-good' },
  { id: 'gripping', label: 'Gripping' }, { id: 'harrowing', label: 'Harrowing' },
  { id: 'infuriating', label: 'Infuriating' }, { id: 'mindblowing', label: 'Mind-blowing' },
  { id: 'breathtaking', label: 'Breathtaking' }, { id: 'weird', label: 'Gloriously weird' },
] as const;
export const PICKS = [{ id: 'makers', label: 'Great documentary makers' }] as const;
export const AWARDS = [
  { id: 'oscar', label: 'Oscars', slug: 'oscars' }, { id: 'bafta', label: 'BAFTA', slug: 'bafta' }, { id: 'emmy', label: 'Emmys', slug: 'emmys' },
  { id: 'sundance', label: 'Sundance', slug: 'sundance' }, { id: 'tribeca', label: 'Tribeca', slug: 'tribeca' }, { id: 'ida', label: 'IDA', slug: 'ida' }, { id: 'cannes', label: 'Cannes', slug: 'cannes' },
] as const;
// Links from before Awards was grouped by body.
export const OLD_AWARD_IDS: Record<string, string> = { 'oscar-win': 'oscar', 'oscar-nominee': 'oscar', 'sundance-win': 'sundance' };

// Editorial moods come from the catalogue sheet (reviewable judgments, not sourced accolades).
export const EDITORIAL: Record<string, { moods: string[]; picks?: string[] }> = Object.fromEntries(SHEET.filter(r => r.moods?.length)
  .map(r => [r.id, { moods: r.moods!.map(l => MOODS.find(m => m.label === l)?.id).filter((m): m is (typeof MOODS)[number]['id'] => !!m) }]));
export const credits = (film: Film) => [...film.director.split(', '), ...(film.presenter ? [film.presenter] : [])].map(n => n.trim()).filter(Boolean);

export type Accolade = { label: string; result: 'Won' | 'Nominated'; source: 'Curated' | 'OMDb'; body: AwardBody };
const accolade = (label: string, source: Accolade['source']): Accolade => {
  const nominated = /nominee|nominated/i.test(label), body = awardBody(label);
  return { label, result: nominated ? 'Nominated' : 'Won', source, body };
};
export function accolades(film: Film, aggregate = SNAPSHOT[film.id]?.omdb?.awards): Accolade[] {
  const records = film.awards.map(label => accolade(label, 'Curated'));
  // Named Oscar wins and nominations, BAFTA and Primetime Emmy wins only. Never infer category/year or other prizes from aggregate counts.
  const named = aggregate?.match(/\b(Won|Nominated for) \d+ (Oscar|BAFTA|Primetime Emmy)/i);
  if (named && (/^won/i.test(named[1]!) || /oscar/i.test(named[2]!))) {
    const won = /^won/i.test(named[1]!), label = `${named[2]!.replace('Primetime ', '')} ${won ? 'Winner' : 'Nominee'}`, body = awardBody(label);
    if (!records.some(a => a.body === body && (!won || a.result === 'Won'))) records.push(accolade(label, 'OMDb'));
  }
  // Wins by prestige, then nominations by the same order.
  return records.map((a, i) => [a, i] as const).sort(([a, i], [b, j]) => (a.result === 'Won' ? 0 : 1) - (b.result === 'Won' ? 0 : 1) || awardRank(a.body) - awardRank(b.body) || i - j).map(([a]) => a);
}
// A card shows one icon per awarding body, best first.
export const topAwards = (film: Film, limit = 3) => accolades(film).filter((a, i, all) => all.findIndex(b => b.body === a.body) === i).slice(0, limit);

// The film's best award from one body, and a list led by winners, newest first.
export const awardFor = (film: Film, body: string) => accolades(film).find(a => a.body === body);
export const byAward = (films: Film[], body: string) => [...films].sort((a, b) =>
  (awardFor(a, body)?.result === 'Won' ? 0 : 1) - (awardFor(b, body)?.result === 'Won' ? 0 : 1) || b.year - a.year);

export function makerIndex(films: Film[] = CATALOGUE) {
  const map = new Map<string, Film[]>();
  for (const film of films) for (const name of credits(film)) {
    const previous = map.get(name) ?? [];
    if (!previous.some(f => f.id === film.id)) map.set(name, [...previous, film]);
  }
  return [...map].map(([name, titles]) => ({ name, films: titles.sort((a, b) => b.year - a.year) }))
    .sort((a, b) => b.films.length - a.films.length || a.name.localeCompare(b.name));
}
// Featured means three titles in the catalogue, minus credits that don't make someone one of the documentary world's best directors.
const NOT_FEATURED = new Set(['David Alexanian', 'Russ Malkin', 'Adam Carolla', 'Nate Adams', 'Mark Neale', 'Jason Wise', 'Peter Mortimer', 'Tiller Russell', 'Julia Willoughby Nason']);
export const isFeatured = (maker: { name: string; films: Film[] }) => maker.films.length >= 3 && !NOT_FEATURED.has(maker.name);
const prolific = new Set(makerIndex().filter(isFeatured).flatMap(m => m.films.map(f => f.id)));
export type FacetSelection = { award: string; mood: string; pick: string; maker: string; tag?: string };
export function matchesFacets(film: Film, selection: FacetSelection) {
  return (!selection.award || accolades(film).some(a => a.body === selection.award))
    && (!selection.mood || EDITORIAL[film.id]?.moods.includes(selection.mood) === true)
    && (!selection.pick || (selection.pick === 'makers' ? prolific.has(film.id) : selection.pick === NETFLIX_PICK ? onNetflix(film.id) : EDITORIAL[film.id]?.picks?.includes(selection.pick) === true))
    && (!selection.maker || credits(film).includes(selection.maker))
    && (!selection.tag || film.tags?.includes(selection.tag) === true);
}
export function discoveryShelves(films: Film[]) {
  const definitions = [
    ...PICKS.map(p => ({ ...p, selection: { award: '', mood: '', pick: p.id, maker: '' } })),
    ...AWARDS.slice(0, 3).map(a => ({ ...a, selection: { award: a.id, mood: '', pick: '', maker: '' } })),
    ...MOODS.map(m => ({ ...m, selection: { award: '', mood: m.id, pick: '', maker: '' } })),
  ];
  return definitions.map(d => ({ ...d, films: films.filter(f => matchesFacets(f, d.selection)) })).filter(s => s.films.length >= 3);
}
// The film page's "More from" row: the first director with at least two other catalogue titles.
export function moreFromDirector(film: Film, films: Film[] = CATALOGUE) {
  for (const name of film.director.split(', ').map(n => n.trim()).filter(Boolean)) {
    const others = films.filter(f => f.id !== film.id && credits(f).includes(name)).sort((a, b) => b.year - a.year);
    if (others.length >= 2) return { name, films: others };
  }
  return undefined;
}
// Topic tags say what a film is about; availability, audience and style tags (Family, Presenter-led, Go in blind) don't.
const SIMILAR_TAGS = new Set<string>(TOPIC_TAGS.map(t => t.id).filter(t => !['free-on-youtube', 'netflix-original', 'family'].includes(t)));
// "More like this": two or more shared topic tags, then one, then the same category; random within each tier.
export function moreLikeThis(film: Film, exclude: Set<string>, rng: () => number = Math.random, limit = 8, films: Film[] = CATALOGUE) {
  const tags = new Set((film.tags ?? []).filter(t => SIMILAR_TAGS.has(t)));
  const tier = (f: Film) => {
    const shared = (f.tags ?? []).filter(t => tags.has(t)).length;
    return shared >= 2 ? 0 : shared ? 1 : f.categories.some(c => film.categories.includes(c)) ? 2 : 3;
  };
  return films.filter(f => f.id !== film.id && !exclude.has(f.id))
    .map(f => ({ f, tier: tier(f), r: rng() })).filter(x => x.tier < 3)
    .sort((a, b) => a.tier - b.tier || a.r - b.r).slice(0, limit).map(x => x.f);
}
// The same "random" sequence for the same film, so server and browser render one list and crawlers see stable links.
export function seededRandom(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
// "Best" lists: Editor's Choice, then Essential, then a blend of IMDb and RT; titles without either rank last.
export function rankScore(film: Film, snap = SNAPSHOT[film.id]) {
  const o = snap?.omdb, imdb = o?.imdb !== undefined ? o.imdb * 10 : undefined, rt = o?.rottenTomatoes;
  const quality = imdb !== undefined && rt !== undefined ? 0.6 * imdb + 0.4 * rt : imdb ?? rt ?? (snap?.tmdbRating ?? 5) * 10 - 10;
  return quality + (film.tags?.includes('editors-choice') ? 8 : 0) + (film.tags?.includes('essential') ? 5 : 0);
}
export const rankFilms = <T extends Film>(films: T[]) =>
  films.map(f => ({ f, s: rankScore(f) })).sort((a, b) => b.s - a.s || b.f.year - a.f.year || a.f.id.localeCompare(b.f.id)).map(x => x.f);
// "Documentaries like X" pages: hand-picked titles first, then by shared topic tags, category, Go in blind and moods, best ranked first.
export const LIKE_SIZE = 12;
export function documentariesLike(film: Film, films: Film[] = CATALOGUE) {
  const page = LIKE_PAGES[film.id], drop = new Set([film.id, ...(page?.drop ?? [])]);
  const tags = (film.tags ?? []).filter(t => SIMILAR_TAGS.has(t) || t === 'go-in-blind'), moods = EDITORIAL[film.id]?.moods ?? [];
  const score = (f: Film) => 3 * (f.tags ?? []).filter(t => tags.includes(t)).length + (f.categories.some(c => film.categories.includes(c)) ? 3 : 0)
    + (EDITORIAL[f.id]?.moods ?? []).filter(m => moods.includes(m)).length;
  const picked = (page?.add ?? []).map(id => films.find(f => f.id === id)).filter((f): f is Film => !!f && !drop.has(f.id));
  const chosen = new Set(picked.map(f => f.id));
  const matched = films.filter(f => !drop.has(f.id) && !chosen.has(f.id)).map(f => ({ f, s: score(f) })).filter(x => x.s >= 4)
    .sort((a, b) => b.s - a.s || rankScore(b.f) - rankScore(a.f) || a.f.id.localeCompare(b.f.id)).map(x => x.f);
  return [...picked, ...matched].slice(0, LIKE_SIZE);
}
// Short enough to share a gallery card line with the ratings.
export const cardCommitment = (film: Film) => film.mediaType === 'tv' ? (film.episodes ? `${film.episodes} eps` : 'Series') : formatCommitment(film);
export function formatCommitment(film: Film, runtime = SNAPSHOT[film.id]?.runtime ?? film.minutes) {
  if (film.mediaType === 'collection') return film.parts?.length ? `${film.parts.length} films` : 'Film collection';
  if (film.mediaType === 'tv') return film.episodes ? `Series · ${film.episodes} episodes${runtime ? ` · ${runtime} min / ep` : ''}` : 'Series';
  return runtime ? `${Math.floor(runtime / 60) ? `${Math.floor(runtime / 60)}h ` : ''}${runtime % 60 ? `${runtime % 60}m` : ''}`.trim() : '';
}