// `npm run trailers` fills the CSV's trailer column for live titles that have no trailer (TMDB lists none and none was picked by hand).
// One YouTube search per title (100 units of the 10,000 daily quota). A pick must name the film and say trailer/teaser in its title
// (selectYouTubeTrailer), be public, embeddable, under 6 minutes, and play in Ireland, the UK and the US. Prints every pick to review.
// `npm run trailers -- check` drops hand-picked trailers that have gone. Then `npm run sync-catalogue`.
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv, serializeCsv } from './catalogue-csv';
import { selectYouTubeTrailer, type YouTubeItem } from '../src/lib/discovery';

const CSV = 'data/catalogue-master.csv', API = 'https://www.googleapis.com/youtube/v3', KEY = process.env['YOUTUBE_API_KEY'];
if (!KEY) { console.error('Needs YOUTUBE_API_KEY in .env.local'); process.exit(1); }
const rows = parseCsv(readFileSync(CSV, 'utf8'));
const snapshot = JSON.parse(readFileSync('src/data/catalogue-snapshot.json', 'utf8')) as Record<string, { trailer?: string; canonicalTitle?: string }>;
const yt = async (path: string, params: Record<string, string>) => {
  const res = await fetch(`${API}/${path}?${new URLSearchParams({ ...params, key: KEY! })}`);
  if (!res.ok) throw new Error(`YouTube ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<{ items?: any[] }>;
};
const minutes = (iso: string) => { const [, h, m, s] = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) ?? []; return Number(h ?? 0) * 60 + Number(m ?? 0) + Number(s ?? 0) / 60; };
const plays = (v: any) => {
  const r = v.contentDetails?.regionRestriction ?? {};
  return ['IE', 'GB', 'US'].every(c => !(r.blocked ?? []).includes(c) && (!r.allowed || r.allowed.includes(c)));
};
const usable = (v: any) => v && v.status?.privacyStatus === 'public' && v.status?.embeddable && minutes(v.contentDetails?.duration ?? '') < 6 && plays(v);
const details = async (ids: string[]) => ids.length ? (await yt('videos', { part: 'snippet,contentDetails,status', id: ids.join(',') })).items ?? [] : [];

if (process.argv[2] === 'check') {
  const picked = rows.filter(r => r.trailer);
  const ok = new Set<string>();
  for (let i = 0; i < picked.length; i += 50) for (const v of await details(picked.slice(i, i + 50).map(r => r.trailer))) if (usable(v)) ok.add(v.id);
  const gone = picked.filter(r => !ok.has(r.trailer));
  for (const r of gone) r.trailer = '';
  writeFileSync(CSV, serializeCsv(rows));
  console.log(`${picked.length - gone.length} trailers fine; dropped ${gone.length}: ${gone.map(r => r.title).join(', ') || 'none'}`);
} else {
  const missing = rows.filter(r => r.status === 'live' && r.type !== 'Collection' && !r.trailer && !snapshot[r.id]?.trailer);
  const found: string[] = [], none: string[] = [];
  for (const r of missing) {
    const aliases = [snapshot[r.id]?.canonicalTitle ?? ''].filter(a => a && a !== r.title);
    const search = await yt('search', { part: 'snippet', q: `${r.title} ${r.year} trailer`, type: 'video', maxResults: '10' });
    const items = (search.items ?? []) as YouTubeItem[];
    const info = new Map((await details(items.map(i => i.id?.videoId ?? '').filter(Boolean))).map(v => [v.id, v]));
    // Walk the matches in search order, skipping any that fail the playback checks.
    let pick: string | undefined, rest = items;
    while (!pick && rest.length) {
      const id = selectYouTubeTrailer(r.title, aliases, rest);
      if (!id) break;
      if (usable(info.get(id))) pick = id;
      rest = rest.filter(i => i.id?.videoId !== id);
    }
    if (pick) { r.trailer = pick; const v = info.get(pick); found.push(`${r.title} → ${pick} "${v.snippet.title}" (${v.snippet.channelTitle})`); }
    else none.push(r.title);
  }
  writeFileSync(CSV, serializeCsv(rows));
  console.log(`Found ${found.length}:\n  ${found.join('\n  ')}\n\nNo usable trailer (${none.length}): ${none.join(', ')}`);
}
