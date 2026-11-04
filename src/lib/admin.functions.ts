import { createServerFn } from '@tanstack/react-start';
import { parseCsv } from '../../scripts/catalogue-csv';
import { adminFilms, applyEdit, type AdminEdit } from '@/lib/admin-edit';
import { NotOwner, commitFiles, readFile, verifyOwner } from '@/lib/admin.server';

// The owner's editing page (/admin). Every call carries a fresh Firebase ID token and is refused unless it is the owner's.
// Data comes from GitHub, not the published build, so edits made since the last publish show up straight away.
const CSV = 'data/catalogue-master.csv', SHEET = 'src/data/catalogue-sheet.json';
type Result<T> = ({ ok: true } & T) | { ok: false; reason: string };
const refuse = (e: unknown): { ok: false; reason: string } => {
  if (e instanceof NotOwner) return { ok: false, reason: 'This page is only for the site owner.' };
  console.error(`[admin] ${e instanceof Error ? e.message : String(e)}`);
  return { ok: false, reason: String(e).includes('GITHUB_TOKEN') ? 'Saving isn’t set up yet: add the GITHUB_TOKEN secret in Lovable.' : 'Something went wrong. Try again in a minute.' };
};

export const loadAdmin = createServerFn({ method: 'POST' })
  .inputValidator((data: { token: string }) => ({ token: String(data?.token ?? '') }))
  .handler(async ({ data }): Promise<Result<{ films: ReturnType<typeof adminFilms> }>> => {
    try {
      await verifyOwner(data.token);
      return { ok: true, films: adminFilms(parseCsv((await readFile(CSV)).text)) };
    } catch (e) { return refuse(e); }
  });

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string').map((s) => s.slice(0, 60)).slice(0, 30) : []);
export const saveFilm = createServerFn({ method: 'POST' })
  .inputValidator((data: { token: string; edit: AdminEdit }) => ({
    token: String(data?.token ?? ''),
    edit: { id: String(data?.edit?.id ?? '').slice(0, 120), category: String(data?.edit?.category ?? '').slice(0, 60), tags: strings(data?.edit?.tags), moods: strings(data?.edit?.moods), trailer: String(data?.edit?.trailer ?? '').slice(0, 200) },
  }))
  .handler(async ({ data }): Promise<Result<{ summary: string }>> => {
    try {
      await verifyOwner(data.token);
      // Re-read and re-apply if main moved while saving (another save, or a push from elsewhere).
      for (let attempt = 0; attempt < 3; attempt++) {
        const { text, commit } = await readFile(CSV);
        const result = applyEdit(text, data.edit);
        if (!result.ok) return result;
        if (await commitFiles(commit, { [CSV]: result.csv, [SHEET]: result.sheet }, `Admin: ${result.summary}`)) return { ok: true, summary: result.summary };
      }
      return { ok: false, reason: 'The site changed while saving. Try again.' };
    } catch (e) { return refuse(e); }
  });
