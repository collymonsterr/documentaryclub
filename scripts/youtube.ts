// `npm run youtube -- <step>` finds full films on YouTube. Needs YOUTUBE_API_KEY in .env.local. Free quota is 10,000 units a day: a search costs 100, most else costs 1.
//   channels       scan the official channels' uploads (run first, one day's quota is plenty)
//   search         spend the rest of today's quota searching for the films still missing; rerun daily
//   report         write data/youtube-results.md from everything found so far
//   approve a b c  accept the top review match for these film ids
//   apply [--prune] put confirmed and approved links in the CSV and tag them; --prune untags scanned films without one
//   check          drop links that have gone, cheap enough to run monthly
// Then `npm run sync-catalogue`. Progress lives in data/youtube-scan.json, so every step can stop and resume.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseCsv, serializeCsv, type CsvRow } from './catalogue-csv';
import { judge, namesFilm, parseDuration, type Film, type Verdict, type Video } from './youtube-match';

const CSV = 'data/catalogue-master.csv', SCAN = 'data/youtube-scan.json', RESULTS = 'data/youtube-results.md', TAG = 'free-on-youtube';
const API = 'https://www.googleapis.com/youtube/v3', DAILY_UNITS = 9_500, SEARCH_COST = 101;
// Channels that own or license what they upload. A handle that resolves to another name is skipped.
const CHANNELS: [handle: string, name: string][] = [
  ['frontline', 'FRONTLINE'], ['DWDocumentary', 'DW Documentary'], ['aljazeeraenglish', 'Al Jazeera'], ['VICE', 'VICE'], ['VICENews', 'VICE News'],
  ['PBS', 'PBS'], ['independentlens', 'Independent Lens'], ['Netflix', 'Netflix'], ['redbull', 'Red Bull'], ['nfb', 'NFB'],
  ['FreeDocumentary', 'Free Documentary'], ['Moconomy', 'Moconomy'], ['RealStories', 'Real Stories'], ['wocomoDOCS', 'wocomoDOCS'], ['GravitasDocumentaries', 'Gravitas Documentaries'],
];
type Match = Video & { verdict: Verdict };
type Scan = { channels: Record<string, string>; scannedChannels: string[]; searched: string[]; matches: Record<string, Match[]>; approved: Record<string, string> };

const scan: Scan = existsSync(SCAN) ? JSON.parse(readFileSync(SCAN, 'utf8')) : { channels: {}, scannedChannels: [], searched: [], matches: {}, approved: {} };
const save = () => writeFileSync(SCAN, `${JSON.stringify(scan, null, 1)}\n`);
const rows = parseCsv(readFileSync(CSV, 'utf8'));
const snapshot = JSON.parse(readFileSync('src/data/catalogue-snapshot.json', 'utf8')) as Record<string, { runtime?: number; canonicalTitle?: string }>;
const films = rows.filter(r => r.status === 'live' && r.type === 'Film');
const filmOf = (r: CsvRow): Film => {
  const s = snapshot[r.id];
  return { title: r.title, aliases: s?.canonicalTitle ? [s.canonicalTitle] : [], ...(s?.runtime ? { minutes: s.runtime } : {}) };
};

class OutOfQuota extends Error {}
let units = 0;
async function yt(path: string, params: Record<string, string>, cost = 1) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('Add YOUTUBE_API_KEY to .env.local first.');
  units += cost;
  const res = await fetch(`${API}/${path}?${new URLSearchParams({ ...params, key })}`);
  const body = await res.json() as any;
  if (body.error?.errors?.some((e: any) => e.reason === 'quotaExceeded' || e.reason === 'dailyLimitExceeded')) throw new OutOfQuota();
  if (!res.ok) throw new Error(`YouTube ${path}: ${res.status} ${body.error?.message ?? ''}`);
  return body;
}
async function videos(ids: string[]): Promise<Video[]> {
  const found: Video[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const data = await yt('videos', { part: 'snippet,contentDetails,statistics,status', id: ids.slice(i, i + 50).join(','), maxResults: '50' });
    for (const v of data.items ?? []) found.push({
      id: v.id, title: v.snippet.title, channelId: v.snippet.channelId, channelTitle: v.snippet.channelTitle, minutes: Math.round(parseDuration(v.contentDetails.duration)),
      publishedAt: v.snippet.publishedAt, views: Number(v.statistics?.viewCount ?? 0), public: v.status?.privacyStatus === 'public',
      blocked: v.contentDetails.regionRestriction?.blocked ?? [], ...(v.contentDetails.regionRestriction?.allowed ? { allowed: v.contentDetails.regionRestriction.allowed } : {}),
    });
  }
  return found;
}
const trusted = () => new Set(Object.values(scan.channels));
// Saved matches are re-judged on every run, so a change to the rules needs no new API calls.
for (const r of films) {
  const kept = (scan.matches[r.id] ?? []).flatMap(m => { const verdict = judge(filmOf(r), m, trusted()); return verdict ? [{ ...m, verdict }] : []; });
  if (scan.matches[r.id]) scan.matches[r.id] = kept;
}
function record(row: CsvRow, video: Video) {
  const verdict = judge(filmOf(row), video, trusted());
  if (!verdict) return;
  const known = (scan.matches[row.id] ?? []).filter(m => m.id !== video.id);
  scan.matches[row.id] = [...known, { ...video, verdict }].sort((a, b) => Number(a.verdict === 'review') - Number(b.verdict === 'review') || b.views - a.views);
}
const confirmed = (id: string) => scan.matches[id]?.find(m => m.verdict === 'confirmed' || scan.approved[id] === m.id);

async function channels() {
  for (const [handle, name] of CHANNELS) {
    if (scan.scannedChannels.includes(handle)) continue;
    const info = (await yt('channels', { part: 'snippet,contentDetails', forHandle: handle })).items?.[0];
    if (!info?.snippet.title.toLowerCase().includes(name.toLowerCase())) { console.log(`Skipped @${handle}: found "${info?.snippet.title ?? 'nothing'}"`); continue; }
    scan.channels[handle] = info.id;
    const titled: { id: string; title: string }[] = [];
    let page: string | undefined, seen = 0;
    do {
      const data = await yt('playlistItems', { part: 'snippet', playlistId: info.contentDetails.relatedPlaylists.uploads, maxResults: '50', ...(page ? { pageToken: page } : {}) });
      for (const item of data.items ?? []) { seen++; titled.push({ id: item.snippet.resourceId.videoId, title: item.snippet.title }); }
      page = data.nextPageToken;
    } while (page);
    const named = titled.filter(v => films.some(r => namesFilm(v.title, filmOf(r))));
    const details = await videos(named.map(v => v.id));
    for (const video of details) for (const row of films) record(row, video);
    scan.scannedChannels.push(handle);
    save();
    console.log(`@${handle}: ${seen} uploads, ${named.length} name a film.`);
  }
}
async function search() {
  const left = films.filter(r => !scan.searched.includes(r.id) && !confirmed(r.id));
  const allowance = Math.floor(DAILY_UNITS / SEARCH_COST);
  let done = 0;
  for (const row of left.slice(0, allowance)) {
    const data = await yt('search', { part: 'id', type: 'video', videoDuration: 'long', maxResults: '10', q: `${row.title} ${row.year} full documentary` }, 100);
    const found = await videos((data.items ?? []).map((i: any) => i.id.videoId));
    for (const video of found) record(row, video);
    scan.searched.push(row.id);
    done++;
    save();
  }
  console.log(`Searched ${done}; ${left.length - done} films left, about ${Math.ceil((left.length - done) / allowance)} more day(s).`);
}
function report() {
  const line = (r: CsvRow, m: Match) => `| ${r.id} | ${r.title} (${r.year}) | [${m.title.replace(/\|/g, '/')}](https://www.youtube.com/watch?v=${m.id}) | ${m.channelTitle.replace(/\|/g, '/')} | ${m.minutes} / ${snapshot[r.id]?.runtime ?? '?'} | ${m.publishedAt.slice(0, 7)} | ${m.views.toLocaleString('en-IE')} |`;
  const head = '| id | Film | Video | Channel | Min (video / film) | Uploaded | Views |\n|---|---|---|---|---|---|---|';
  const yes = films.flatMap(r => { const m = confirmed(r.id); return m ? [line(r, m)] : []; });
  const maybe = films.flatMap(r => { const m = confirmed(r.id) ? undefined : scan.matches[r.id]?.[0]; return m ? [line(r, m)] : []; });
  const dropped = rows.filter(r => r.tags.includes(TAG) && !confirmed(r.id)).map(r => `- ${r.title} (${r.type})`);
  writeFileSync(RESULTS, `# YouTube results\n\n${scan.scannedChannels.length} of ${CHANNELS.length} channels scanned, ${scan.searched.length} of ${films.length} films searched.\n\n## Confirmed: ${yes.length}\n\n${head}\n${yes.join('\n')}\n\n## Check by hand: ${maybe.length}\n\n${head}\n${maybe.join('\n')}\n\n## Tagged now, not confirmed: ${dropped.length}\n\n${dropped.join('\n')}\n`);
  console.log(`${yes.length} confirmed, ${maybe.length} to check, ${dropped.length} tagged but unconfirmed. See ${RESULTS}.`);
}
function approve(ids: string[]) {
  for (const id of ids) { const m = scan.matches[id]?.[0]; if (m) scan.approved[id] = m.id; else console.log(`No match for ${id}`); }
  save();
}
function apply(prune: boolean) {
  let added = 0, removed = 0;
  for (const r of rows) {
    const tags = r.tags.split(',').map(t => t.trim()).filter(Boolean), link = confirmed(r.id);
    if (link) {
      if (r.youtube_id !== link.id) added++;
      r.youtube_id = link.id;
      if (!tags.includes(TAG)) r.tags = [...tags, TAG].join(', ');
    } else if (prune && r.type === 'Film' && scan.searched.includes(r.id) && tags.includes(TAG)) {
      r.tags = tags.filter(t => t !== TAG).join(', ');
      removed++;
    }
  }
  writeFileSync(CSV, serializeCsv(rows));
  console.log(`${added} links set, ${removed} tags removed. Now run npm run sync-catalogue.`);
}
async function check() {
  const live = rows.filter(r => r.youtube_id), found = await videos(live.map(r => r.youtube_id));
  const good = new Map(found.map(v => [v.id, v]));
  let gone = 0;
  for (const r of live) {
    const v = good.get(r.youtube_id);
    if (v && judge({ ...filmOf(r), minutes: undefined }, { ...v, title: r.title }, trusted()) !== null || v?.public && r.type === 'Series') continue;
    console.log(`Gone: ${r.title}`);
    r.youtube_id = '';
    r.tags = r.tags.split(',').map(t => t.trim()).filter(t => t && t !== TAG).join(', ');
    delete scan.approved[r.id];
    delete scan.matches[r.id];
    gone++;
  }
  writeFileSync(CSV, serializeCsv(rows));
  save();
  console.log(`${live.length} checked, ${gone} gone.${gone ? ' Now run npm run sync-catalogue.' : ''}`);
}

const [step, ...args] = process.argv.slice(2);
try {
  if (step === 'channels') await channels();
  else if (step === 'search') await search();
  else if (step === 'report') report();
  else if (step === 'approve') approve(args);
  else if (step === 'apply') apply(args.includes('--prune'));
  else if (step === 'check') await check();
  else console.log('Steps: channels, search, report, approve <ids>, apply [--prune], check');
} catch (e) {
  save();
  if (!(e instanceof OutOfQuota)) throw e;
  console.log('Out of quota for today. It resets at midnight Pacific; rerun tomorrow to carry on.');
}
console.log(`About ${units} units used this run.`);
