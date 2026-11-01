// Runs after `npm run sync-catalogue`: writes public/sitemap.xml and the robots.txt pointer from the live catalogue and SITE_ORIGIN.
import { readFileSync, writeFileSync } from 'node:fs';
import { CATALOGUE } from '../src/data/catalogue';
import { AWARDS, accolades, isFeatured, makerIndex } from '../src/data/discovery-facets';
import { CATEGORIES } from '../src/data/films';
import { TAGS } from '../src/data/tags';
import { SITE_ORIGIN, pagePath } from '../src/lib/site-urls';

const awards = AWARDS.filter(a => CATALOGUE.filter(f => accolades(f).some(x => x.body === a.id)).length >= 3);
const paths = [
  '/', '/directors', '/awards', '/about', '/list', '/suggest', '/privacy',
  ...CATEGORIES.map(c => pagePath({ cat: c.id })),
  ...TAGS.map(t => pagePath({ tag: t.id })),
  ...awards.map(a => pagePath({ award: a.id })),
  ...makerIndex().filter(isFeatured).map(m => pagePath({ maker: m.name })),
  ...CATALOGUE.map(f => pagePath({ film: f.id })),
].filter(Boolean);
writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p => `  <url><loc>${SITE_ORIGIN}${p}</loc></url>`).join('\n')}\n</urlset>\n`);
const robots = readFileSync('public/robots.txt', 'utf8').replace(/\n*Sitemap: .*\n?/g, '\n').trimEnd();
writeFileSync('public/robots.txt', `${robots}\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
console.log(`${paths.length} pages in sitemap.xml`);
