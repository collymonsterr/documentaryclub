import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { CATALOGUE } from '@/data/catalogue';
import { NotOwner, verifyOwner } from '@/lib/admin.server';
import { foldEvents, isBot, statDay, statKey, summariseKit, type KitSubscriber, type StatEvent } from '@/lib/stats';

// Anonymous counts (see stats.ts). The browser sends a small batch; this adds the visitor's country to a visit,
// drops bots and junk, and writes one Firestore commit. Failures are silent: counting must never affect the page.
const FIRESTORE = 'https://firestore.googleapis.com/v1/projects/documentary-club/databases/(default)/documents';
// Public web key (the same one the browser uses for sign-in); the Firestore rules decide what it may do.
const WEB_KEY = 'AIzaSyDaKhoCYO5fmfKg3VPcXKMLQNyZhjYUfC0';
let films: Set<string> | null = null;
const filmIds = () => (films ??= new Set(CATALOGUE.map((f) => f.id)));

const recent = new Map<string, number[]>();
const LIMIT = 200, WINDOW = 10 * 60_000;
function allowed(ip: string, n: number) {
  const now = Date.now(), hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (recent.size > 5000) recent.clear();
  if (hits.length + n > LIMIT) return false;
  recent.set(ip, [...hits, ...Array<number>(n).fill(now)]);
  return true;
}

export const recordStats = createServerFn({ method: 'POST' })
  .inputValidator((data: { events: StatEvent[] }) => ({ events: Array.isArray(data?.events) ? data.events.slice(0, 30) : [] }))
  .handler(async ({ data }) => {
    if (isBot(getRequestHeader('user-agent') ?? '')) return { ok: false };
    const events = [...data.events];
    const country = statKey(getRequestHeader('cf-ipcountry') ?? '');
    if (events.some((e) => e?.m === 'visit') && /^[a-z]{2}$/.test(country) && country !== 'xx' && country !== 't1') events.push({ m: 'country', k: country });
    const docs = foldEvents(events, filmIds(), statDay());
    if (!docs.length || !allowed(getRequestHeader('cf-connecting-ip') ?? 'unknown', docs.length)) return { ok: false };
    const writes = docs.map(({ d, m, k, n }) => ({
      update: { name: `projects/documentary-club/databases/(default)/documents/stats/${d}~${m}~${k}`, fields: { d: { stringValue: d }, m: { stringValue: m }, k: { stringValue: k } } },
      updateMask: { fieldPaths: ['d', 'm', 'k'] },
      updateTransforms: [{ fieldPath: 'n', increment: { integerValue: String(n) } }],
    }));
    try {
      const res = await fetch(`${FIRESTORE}:commit?key=${WEB_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ writes }), signal: AbortSignal.timeout(6000) });
      if (!res.ok) console.error(`[stats] ${res.status} ${(await res.text()).slice(0, 200)}`);
      return { ok: res.ok };
    } catch (e) {
      console.error(`[stats] unreachable (${e instanceof Error ? e.name : 'error'})`);
      return { ok: false };
    }
  });

// Owner only: Kit's subscriber list folded into counts (KIT_API_KEY). Addresses never leave the server.
export const kitStats = createServerFn({ method: 'POST' })
  .inputValidator((data: { token: string }) => ({ token: String(data?.token ?? '') }))
  .handler(async ({ data }) => {
    try {
      await verifyOwner(data.token);
    } catch (e) {
      return { ok: false as const, reason: e instanceof NotOwner ? 'This page is only for the site owner.' : 'Sign-in check failed.' };
    }
    const key = process.env['KIT_API_KEY'];
    if (!key) return { ok: false as const, reason: 'KIT_API_KEY is not set.' };
    const subs: KitSubscriber[] = [];
    let after = '';
    try {
      for (let page = 0; page < 20; page++) {
        const res = await fetch(`https://api.kit.com/v4/subscribers?status=all&per_page=1000${after ? `&after=${encodeURIComponent(after)}` : ''}`, { headers: { 'X-Kit-Api-Key': key }, signal: AbortSignal.timeout(10000) });
        if (!res.ok) return { ok: false as const, reason: `Kit returned ${res.status}.` };
        const body = (await res.json()) as { subscribers?: KitSubscriber[]; pagination?: { has_next_page?: boolean; end_cursor?: string } };
        subs.push(...(body.subscribers ?? []).map((s) => ({ state: s.state, created_at: s.created_at, fields: s.fields ?? null })));
        if (!body.pagination?.has_next_page || !body.pagination.end_cursor) break;
        after = body.pagination.end_cursor;
      }
    } catch {
      return { ok: false as const, reason: "Couldn't reach Kit." };
    }
    return { ok: true as const, ...summariseKit(subs) };
  });
