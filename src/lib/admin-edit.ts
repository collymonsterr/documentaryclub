// What the owner can change from /admin, and the rules every change must pass. Pure, so it is tested without GitHub.
import { parseCsv, serializeCsv, sheetJson, validate, type CsvRow } from '../../scripts/catalogue-csv';
import { CATEGORIES } from '@/data/films';
import { TAGS } from '@/data/tags';
import { MOODS } from '@/data/discovery-facets';

// free-on-youtube follows the youtube_id column (set by `npm run youtube`), so it isn't edited by hand here.
export const ADMIN_TAGS = TAGS.filter((t) => t.id !== 'free-on-youtube');
export type AdminFilm = { id: string; title: string; year: string; type: string; category: string; tags: string[]; moods: string[]; trailer: string };
export type AdminEdit = { id: string; category: string; tags: string[]; moods: string[]; trailer: string };

const list = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);
export const adminFilms = (rows: CsvRow[]): AdminFilm[] => rows.filter((r) => r.status === 'live').map((r) => ({
  id: r.id, title: r.title, year: r.year, type: r.type, category: r.category, tags: list(r.tags), moods: list(r.mood), trailer: r.trailer,
}));

// Accepts a bare video id or any usual YouTube link (watch?v=, youtu.be/, /embed/, /shorts/).
export function trailerId(input: string) {
  const v = input.trim();
  if (!v) return '';
  if (/^[\w-]{11}$/.test(v)) return v;
  const m = v.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

// Applies one film's edit to the CSV text and returns the new CSV and sheet JSON, or the reason it was refused.
export function applyEdit(csv: string, edit: AdminEdit): { ok: true; csv: string; sheet: string; summary: string } | { ok: false; reason: string } {
  const rows = parseCsv(csv);
  const row = rows.find((r) => r.id === edit.id && r.status === 'live');
  if (!row) return { ok: false, reason: 'That film is not in the catalogue.' };
  const trailer = trailerId(edit.trailer);
  if (trailer === null) return { ok: false, reason: "That trailer link isn't a YouTube video." };
  // free-on-youtube stays exactly as the CSV has it; the rest keep the approved list's order.
  const keepYouTube = list(row.tags).includes('free-on-youtube') ? ['free-on-youtube'] : [];
  const tags = [...new Set([...edit.tags.filter((t) => t !== 'free-on-youtube'), ...keepYouTube])];
  const before = { category: row.category, tags: row.tags, mood: row.mood, trailer: row.trailer };
  Object.assign(row, { category: edit.category, tags: tags.join(', '), mood: [...new Set(edit.moods)].join(', '), trailer });
  const errors = validate([row], { tags: TAGS.map((t) => t.id), moods: MOODS.map((m) => m.label), categories: CATEGORIES.map((c) => c.label) });
  if (errors.length) return { ok: false, reason: errors.join('; ') };
  const changed = (['category', 'tags', 'mood', 'trailer'] as const).filter((k) => before[k] !== row[k]);
  if (!changed.length) return { ok: false, reason: 'Nothing changed.' };
  return { ok: true, csv: serializeCsv(rows), sheet: sheetJson(rows), summary: `${row.title}: ${changed.join(', ')}` };
}
