import { CATALOGUE, SNAPSHOT } from './catalogue';
import type { Film } from './films';

export const MOODS = [
  { id: 'funny', label: 'Funny' }, { id: 'uplifting', label: 'Uplifting' },
  { id: 'wholesome', label: 'Wholesome' }, { id: 'gripping', label: 'Gripping' },
  { id: 'harrowing', label: 'Harrowing' }, { id: 'mindblowing', label: 'Mind-blowing' },
  { id: 'weird', label: 'Gloriously weird' },
] as const;
export const PICKS = [{ id: 'hidden', label: 'Hidden gems' }, { id: 'makers', label: 'Great documentary makers' }] as const;
export const AWARDS = [
  { id: 'oscar-win', label: 'Academy Award winners' }, { id: 'oscar-nominee', label: 'Academy Award nominees' },
  { id: 'sundance-win', label: 'Sundance winners' }, { id: 'other-win', label: 'Other award winners' },
] as const;

// Reviewable editorial judgments, not audience endorsements or sourced accolades.
export const EDITORIAL: Record<string, { moods: string[]; picks?: string[] }> = {
  'pez-outlaw': { moods: ['funny', 'weird'], picks: ['hidden'] },
  'best-worst-movie': { moods: ['funny'], picks: ['hidden'] },
  'winnebago-man': { moods: ['funny', 'weird'], picks: ['hidden'] },
  'american-movie': { moods: ['funny', 'weird'], picks: ['hidden'] },
  'the-king-of-kong': { moods: ['funny', 'gripping'] },
  ibelin: { moods: ['uplifting'] }, 'fantastic-fungi': { moods: ['uplifting'] },
  'man-on-wire': { moods: ['uplifting', 'gripping'] },
  'searching-for-sugar-man': { moods: ['uplifting'] },
  'the-rescue': { moods: ['uplifting', 'gripping'] },
  contestant: { moods: ['weird', 'gripping'] }, tickled: { moods: ['weird', 'gripping'] },
  'room-237': { moods: ['weird'], picks: ['hidden'] },
  'f-for-fake': { moods: ['weird'], picks: ['hidden'] },
  'my-kid-could-paint-that': { moods: ['weird'], picks: ['hidden'] },
  'beyond-utopia': { moods: ['gripping'] }, mariupol: { moods: ['gripping'] },
  'perfect-neighbor': { moods: ['gripping'] }, 'free-solo': { moods: ['gripping'] },
  meru: { moods: ['gripping'] }, 'the-last-narc': { moods: ['gripping'] },
};
// Added moods (editorial, reviewable): merged into EDITORIAL below.
const MORE_MOODS: Record<string, string[]> = {
  wholesome: ['ibelin', 'fantastic-fungi', 'my-octopus-teacher', 'the-speed-cubers', 'searching-for-sugar-man', 'daughters'],
  harrowing: ['mariupol', 'for-sama', 'the-act-of-killing', 'the-look-of-silence', 'last-men-in-aleppo', 'restrepo', 'beyond-utopia', 'sugarcane'],
  mindblowing: ['particle-fever', 'the-farthest', 'fantastic-fungi', 'apollo-11', 'the-imposter', 'cave-of-forgotten-dreams', 'tims-vermeer'],
};
for (const [mood, list] of Object.entries(MORE_MOODS)) for (const id of list) {
  const e = (EDITORIAL[id] ??= { moods: [] }); if (!e.moods.includes(mood)) e.moods.push(mood);
}
export const credits = (film: Film) => [...film.director.split(', '), ...(film.presenter ? [film.presenter] : [])].map(n => n.trim()).filter(Boolean);

export type Accolade = { facet: string; label: string; result: 'Won' | 'Nominated'; source: 'Curated' | 'OMDb' };
export function accolades(film: Film, aggregate = SNAPSHOT[film.id]?.omdb?.awards): Accolade[] {
  const records: Accolade[] = film.awards.map(label => {
    const nominated = /nominee|nominated/i.test(label);
    const facet = /Oscar/i.test(label) ? nominated ? 'oscar-nominee' : 'oscar-win'
      : /Sundance/i.test(label) ? 'sundance-win' : 'other-win';
    return { facet, label, result: nominated ? 'Nominated' : 'Won', source: 'Curated' };
  });
  // Named Oscar evidence only. Never infer category/year or other prizes from aggregate counts.
  const facet = /\bWon \d+ Oscars?\b/i.test(aggregate ?? '') ? 'oscar-win'
    : /\bNominated for \d+ Oscars?\b/i.test(aggregate ?? '') ? 'oscar-nominee' : undefined;
  if (facet && !records.some(a => a.facet === facet)) records.push({ facet,
    label: facet === 'oscar-win' ? 'Academy Award winner' : 'Academy Award nominee',
    result: facet === 'oscar-win' ? 'Won' : 'Nominated', source: 'OMDb' });
  return records;
}

export function makerIndex(films: Film[] = CATALOGUE) {
  const map = new Map<string, Film[]>();
  for (const film of films) for (const name of credits(film)) {
    const previous = map.get(name) ?? [];
    if (!previous.some(f => f.id === film.id)) map.set(name, [...previous, film]);
  }
  return [...map].map(([name, titles]) => ({ name, films: titles.sort((a, b) => b.year - a.year) }))
    .sort((a, b) => b.films.length - a.films.length || a.name.localeCompare(b.name));
}
const prolific = new Set(makerIndex().filter(m => m.films.length >= 3).flatMap(m => m.films.map(f => f.id)));
export type FacetSelection = { award: string; mood: string; pick: string; maker: string };
export function matchesFacets(film: Film, selection: FacetSelection) {
  return (!selection.award || accolades(film).some(a => a.facet === selection.award))
    && (!selection.mood || EDITORIAL[film.id]?.moods.includes(selection.mood) === true)
    && (!selection.pick || (selection.pick === 'makers' ? prolific.has(film.id) : EDITORIAL[film.id]?.picks?.includes(selection.pick) === true))
    && (!selection.maker || credits(film).includes(selection.maker));
}
export function discoveryShelves(films: Film[]) {
  const definitions = [
    ...PICKS.map(p => ({ ...p, selection: { award: '', mood: '', pick: p.id, maker: '' } })),
    ...AWARDS.slice(0, 3).map(a => ({ ...a, selection: { award: a.id, mood: '', pick: '', maker: '' } })),
    ...MOODS.map(m => ({ ...m, selection: { award: '', mood: m.id, pick: '', maker: '' } })),
  ];
  return definitions.map(d => ({ ...d, films: films.filter(f => matchesFacets(f, d.selection)) })).filter(s => s.films.length >= 3);
}
export function formatCommitment(film: Film, runtime = SNAPSHOT[film.id]?.runtime ?? film.minutes) {
  if (film.mediaType === 'collection') return film.parts?.length ? `${film.parts.length} films` : 'Film collection';
  if (film.mediaType === 'tv') return film.episodes ? `${film.episodes} episodes${runtime ? ` · ${runtime} min / ep` : ''}` : 'Series';
  return runtime ? `${Math.floor(runtime / 60) ? `${Math.floor(runtime / 60)}h ` : ''}${runtime % 60 ? `${runtime % 60}m` : ''}`.trim() : '';
}