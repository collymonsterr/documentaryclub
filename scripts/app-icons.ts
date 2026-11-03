// Home-screen icons for the installable app, drawn from favicon.svg on the site's dark background.
// The camera sits inside the middle 60% so Android's circle and squircle masks never clip it.
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const BACKGROUND = '#14100c';
const glyph = readFileSync('public/favicon.svg', 'utf8');

async function icon(size: number, file: string, scale = 0.6) {
  const width = Math.round(size * scale), height = Math.round(width * 48 / 64);
  const camera = await sharp(Buffer.from(glyph)).resize(width, height).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
    .composite([{ input: camera, left: Math.round((size - width) / 2), top: Math.round((size - height) / 2) }])
    .png().toFile(`public/${file}`);
}

await icon(192, 'icon-192.png', 0.7);
await icon(512, 'icon-512.png', 0.7);
await icon(512, 'icon-maskable-512.png');
await icon(180, 'apple-touch-icon.png', 0.7);
console.log('Wrote public/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png');
