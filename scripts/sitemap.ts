// Runs after `npm run sync-catalogue`: writes public/sitemap.xml and the robots.txt pointer from the live catalogue and SITE_ORIGIN.
import { readFileSync, writeFileSync } from 'node:fs';
import { CATALOGUE } from '../src/data/catalogue';
import { SITE_ORIGIN, listGroups, pagePath } from '../src/lib/site-urls';

// Thin list pages (noindex) stay out; listGroups already applies that rule.
const paths = [
  '/', '/best', '/directors', '/awards', '/about', '/list', '/suggest', '/privacy',
  ...listGroups().flatMap(g => g.items.map(i => i.path)),
  ...CATALOGUE.map(f => pagePath({ film: f.id })),
].filter(Boolean);
writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p => `  <url><loc>${SITE_ORIGIN}${p}</loc></url>`).join('\n')}\n</urlset>\n`);
const robots = readFileSync('public/robots.txt', 'utf8').replace(/\n*Sitemap: .*\n?/g, '\n').trimEnd();
writeFileSync('public/robots.txt', `${robots}\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
console.log(`${paths.length} pages in sitemap.xml`);
