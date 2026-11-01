import { CATALOGUE, SHEET, SNAPSHOT } from './catalogue';
import type { Film } from './films';

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
export function formatCommitment(film: Film, runtime = SNAPSHOT[film.id]?.runtime ?? film.minutes) {
  if (film.mediaType === 'collection') return film.parts?.length ? `${film.parts.length} films` : 'Film collection';
  if (film.mediaType === 'tv') return film.episodes ? `Series · ${film.episodes} episodes${runtime ? ` · ${runtime} min / ep` : ''}` : 'Series';
  return runtime ? `${Math.floor(runtime / 60) ? `${Math.floor(runtime / 60)}h ` : ''}${runtime % 60 ? `${runtime % 60}m` : ''}`.trim() : '';
}