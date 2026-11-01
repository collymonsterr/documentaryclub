import { CATALOGUE, SHEET, SNAPSHOT } from './catalogue';
import type { Film } from './films';
import { awardBody, awardRank, type AwardBody } from './award-bodies';

export const MOODS = [
  { id: 'funny', label: 'Funny' }, { id: 'feelgood', label: 'Feel-good' },
  { id: 'gripping', label: 'Gripping' }, { id: 'harrowing', label: 'Harrowing' },
  { id: 'infuriating', label: 'Infuriating' }, { id: 'mindblowing', label: 'Mind-blowing' },
  { id: 'weird', label: 'Gloriously weird' },
] as const;
export const PICKS = [{ id: 'makers', label: 'Great documentary makers' }] as const;
export const AWARDS = [
  { id: 'oscar-win', label: 'Academy Award winners' }, { id: 'oscar-nominee', label: 'Academy Award nominees' },
  { id: 'sundance-win', label: 'Sundance winners' }, { id: 'other-win', label: 'Other award winners' },
] as const;

// Editorial moods come from the catalogue sheet (reviewable judgments, not sourced accolades).
export const EDITORIAL: Record<string, { moods: string[]; picks?: string[] }> = Object.fromEntries(SHEET.filter(r => r.moods?.length)
  .map(r => [r.id, { moods: r.moods!.map(l => MOODS.find(m => m.label === l)?.id).filter((m): m is (typeof MOODS)[number]['id'] => !!m) }]));
export const credits = (film: Film) => [...film.director.split(', '), ...(film.presenter ? [film.presenter] : [])].map(n => n.trim()).filter(Boolean);

export type Accolade = { facet: string; label: string; result: 'Won' | 'Nominated'; source: 'Curated' | 'OMDb'; body: AwardBody };
const accolade = (label: string, source: Accolade['source']): Accolade => {
  const nominated = /nominee|nominated/i.test(label), body = awardBody(label);
  const facet = nominated ? body === 'oscar' ? 'oscar-nominee' : 'other-nominee' : body === 'oscar' ? 'oscar-win' : body === 'sundance' ? 'sundance-win' : 'other-win';
  return { facet, label, result: nominated ? 'Nominated' : 'Won', source, body };
};
export function accolades(film: Film, aggregate = SNAPSHOT[film.id]?.omdb?.awards): Accolade[] {
  const records = film.awards.map(label => accolade(label, 'Curated'));
  // Named Oscar, BAFTA and Primetime Emmy evidence only. Never infer category/year or other prizes from aggregate counts.
  const named = aggregate?.match(/\b(Won|Nominated for) \d+ (Oscar|BAFTA|Primetime Emmy)/i);
  if (named) {
    const won = /^won/i.test(named[1]!), label = `${named[2]!.replace('Primetime ', '')} ${won ? 'Winner' : 'Nominee'}`, body = awardBody(label);
    if (!records.some(a => a.body === body && (!won || a.result === 'Won'))) records.push(accolade(label, 'OMDb'));
  }
  // Wins by prestige, then nominations by the same order.
  return records.map((a, i) => [a, i] as const).sort(([a, i], [b, j]) => (a.result === 'Won' ? 0 : 1) - (b.result === 'Won' ? 0 : 1) || awardRank(a.body) - awardRank(b.body) || i - j).map(([a]) => a);
}
// A card shows one icon per awarding body, best first.
export const topAwards = (film: Film, limit = 3) => accolades(film).filter((a, i, all) => all.findIndex(b => b.body === a.body) === i).slice(0, limit);

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
  return (!selection.award || accolades(film).some(a => a.facet === selection.award))
    && (!selection.mood || EDITORIAL[film.id]?.moods.includes(selection.mood) === true)
    && (!selection.pick || (selection.pick === 'makers' ? prolific.has(film.id) : EDITORIAL[film.id]?.picks?.includes(selection.pick) === true))
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
// Short enough to share a gallery card line with the ratings.
export const cardCommitment = (film: Film) => film.mediaType === 'tv' ? (film.episodes ? `${film.episodes} eps` : 'Series') : formatCommitment(film);
export function formatCommitment(film: Film, runtime = SNAPSHOT[film.id]?.runtime ?? film.minutes) {
  if (film.mediaType === 'collection') return film.parts?.length ? `${film.parts.length} films` : 'Film collection';
  if (film.mediaType === 'tv') return film.episodes ? `Series · ${film.episodes} episodes${runtime ? ` · ${runtime} min / ep` : ''}` : 'Series';
  return runtime ? `${Math.floor(runtime / 60) ? `${Math.floor(runtime / 60)}h ` : ''}${runtime % 60 ? `${runtime % 60}m` : ''}`.trim() : '';
}