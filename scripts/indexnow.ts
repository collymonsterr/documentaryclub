// Run after publishing: tells Bing (and other IndexNow engines) about every sitemap URL straight away.
// The key file public/fcf746b3f2232e745366dcdfd61580aa.txt must be live first, because they fetch it to check the site is ours.
import { readFileSync } from 'node:fs';
import { SITE_ORIGIN } from '../src/lib/site-urls';

const KEY = 'fcf746b3f2232e745366dcdfd61580aa';
const urls = [...readFileSync('public/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]!);
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE_ORIGIN).host, key: KEY, keyLocation: `${SITE_ORIGIN}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: ${response.status} ${response.statusText} for ${urls.length} URLs`);
