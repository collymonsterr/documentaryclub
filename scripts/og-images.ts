// `npm run og-images`: builds the 1200×630 link-preview images in public/og. Rerun after adding a tag or category.
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { CATEGORY_COPY } from '../src/data/category-copy';
import { CATALOGUE, SNAPSHOT } from '../src/data/catalogue';
import { CATEGORIES, type Film } from '../src/data/films';
import { TAGS } from '../src/data/tags';
import { slugify } from '../src/lib/site-urls';

const WIDTH = 1200, HEIGHT = 630, POSTER_W = 240, POSTER_H = 360, COUNT = 5;
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const rank = (f: Film) => SNAPSHOT[f.id]?.omdb?.imdb ?? 0;
const posterCache = new Map<string, Promise<Buffer>>();
const poster = (url: string) => {
  if (!posterCache.has(url)) posterCache.set(url, fetch(url).then(r => r.arrayBuffer()).then(b => sharp(Buffer.from(b)).resize(POSTER_W, POSTER_H, { fit: 'cover' }).toBuffer()));
  return posterCache.get(url)!;
};
async function build(file: string, title: string, films: Film[]) {
  const picks = [...films].filter(f => SNAPSHOT[f.id]?.poster).sort((a, b) => rank(b) - rank(a)).slice(0, COUNT);
  const left = (WIDTH - picks.length * POSTER_W) / 2;
  const posters = await Promise.all(picks.map(async (f, i) => ({ input: await poster(SNAPSHOT[f.id]!.poster!), left: Math.round(left + i * POSTER_W), top: 0 })));
  const size = title.length > 30 ? 52 : 64;
  const text = `<svg width="${WIDTH}" height="${HEIGHT}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="#0a0a0a" stop-opacity="0"/><stop offset="0.62" stop-color="#0a0a0a"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>
    <text x="60" y="510" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="700" fill="#ffffff">${escape(title)}</text>
    <text x="60" y="566" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#f59e4c">Documentary Club</text></svg>`;
  await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#0a0a0a' } }).composite([...posters, { input: Buffer.from(text) }]).jpeg({ quality: 78 }).toFile(`public/og/${file}.jpg`);
}
mkdirSync('public/og', { recursive: true });
await build('default', 'Documentaries worth your time', CATALOGUE.filter(f => f.tags?.includes('essential')));
for (const t of TAGS) await build(`tags-${t.id}`, t.title, CATALOGUE.filter(f => f.tags?.includes(t.id)));
for (const c of CATEGORIES) await build(`categories-${slugify(c.label)}`, CATEGORY_COPY[c.id]?.title ?? c.label, CATALOGUE.filter(f => f.categories[0] === c.id));
