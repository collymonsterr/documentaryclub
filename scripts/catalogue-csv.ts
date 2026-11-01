// data/catalogue-master.csv is the single source of truth for editorial fields; src/data/catalogue-sheet.json is generated from it.
export const COLUMNS = ['id', 'title', 'year', 'type', 'category', 'tags', 'mood', 'director', 'tmdb_id', 'imdb_id', 'status', 'notes', 'awards'] as const;
export type CsvRow = Record<(typeof COLUMNS)[number], string>;
export type SheetJsonRow = { id: string; title: string; year: number; format: 'Film' | 'Series' | 'Collection'; director?: string; category: string; moods?: string[]; tags?: string[]; tmdbId?: number; imdbId?: string; awards?: string[] };

export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  const body = text.replace(/^﻿/, '');
  for (let i = 0; i < body.length; i++) {
    const c = body[i]!;
    if (quoted) {
      if (c === '"' && body[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  const [header, ...data] = rows;
  if (header?.join() !== COLUMNS.join()) throw new Error(`Unexpected CSV columns: ${header?.join()}`);
  return data.filter(r => r.some(Boolean)).map((r, line) => {
    if (r.length !== COLUMNS.length) throw new Error(`CSV row ${line + 2} has ${r.length} columns`);
    return Object.fromEntries(COLUMNS.map((c, i) => [c, r[i]!])) as CsvRow;
  });
}
const quote = (v: string) => /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
export const serializeCsv = (rows: CsvRow[]) => [COLUMNS.join(','), ...rows.map(r => COLUMNS.map(c => quote(r[c])).join(','))].join('\r\n') + '\r\n';

const list = (v: string) => v.split(',').map(s => s.trim()).filter(Boolean);
export const sheetRows = (rows: CsvRow[]): SheetJsonRow[] => rows.filter(r => r.status === 'live').map(r => ({
  id: r.id, title: r.title, year: Number(r.year), format: r.type as SheetJsonRow['format'], category: r.category,
  ...(r.director ? { director: r.director } : {}), ...(r.mood ? { moods: list(r.mood) } : {}), ...(r.tags ? { tags: list(r.tags) } : {}),
  ...(r.tmdb_id ? { tmdbId: Number(r.tmdb_id) } : {}), ...(r.imdb_id ? { imdbId: r.imdb_id } : {}),
  ...(r.awards ? { awards: r.awards.split(';').map(s => s.trim()).filter(Boolean) } : {}),
}));
export const sheetJson = (rows: CsvRow[]) => `[\n${sheetRows(rows).map(r => JSON.stringify(r)).join(',\n')}\n]\n`;

// Problems that would corrupt the site; the sync refuses to write until they are fixed.
export function validate(rows: CsvRow[], allowed: { tags: string[]; moods: string[]; categories: string[] }) {
  const errors: string[] = [], seen = new Set<string>();
  for (const r of rows) {
    const name = r.title || r.id;
    if (!['live', 'new', 'dropped'].includes(r.status)) errors.push(`${name}: unknown status "${r.status}"`);
    if (!['Film', 'Series', 'Collection'].includes(r.type)) errors.push(`${name}: unknown type "${r.type}"`);
    if (!/^\d{4}$/.test(r.year)) errors.push(`${name}: bad year "${r.year}"`);
    if (!allowed.categories.includes(r.category)) errors.push(`${name}: unknown category "${r.category}"`);
    for (const t of list(r.tags)) if (!allowed.tags.includes(t)) errors.push(`${name}: unknown tag "${t}"`);
    for (const m of list(r.mood)) if (!allowed.moods.includes(m)) errors.push(`${name}: unknown mood "${m}"`);
    if (r.status === 'live' && !r.id) errors.push(`${name}: live row has no id`);
    if (r.id && seen.has(r.id)) errors.push(`${name}: duplicate id "${r.id}"`);
    if (r.id) seen.add(r.id);
  }
  return errors;
}
// The "notes" column can carry import instructions; only these exact phrasings are acted on.
export const noteHints = (notes: string) => ({
  aliases: [...notes.matchAll(/(?:Also titled|as) "([^"]+)"/g)].map(m => m[1]!),
  minRuntime: Number(notes.match(/drop if under (\d+) min/i)?.[1]) || undefined,
  preferYear: Number(notes.match(/Use (\d{4}) restored/i)?.[1]) || undefined,
});
