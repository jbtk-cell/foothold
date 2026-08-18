/**
 * Render the app icons.
 *
 * A single SVG favicon is enough for a browser tab and nothing else. Android
 * will not offer to install a site whose manifest has no 192 and 512 PNG, and
 * iOS ignores the manifest entirely when someone adds the page to their home
 * screen - it wants an apple-touch-icon or it screenshots the page, which
 * looks like a mistake.
 *
 * The maskable variant is a separate drawing rather than the same one padded:
 * Android crops icons to whatever shape the launcher uses, and anything
 * outside the middle 80% can be cut off.
 *
 *   node tools/make_icons.mjs
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '..', 'web', 'assets');
mkdirSync(ASSETS, { recursive: true });

const INK = '#0F1620';
const SIGNAL = '#FF6B35';

/** The climbing route, drawn on a 32-unit grid. `inset` shrinks it for masking. */
function mark(scale) {
  const shift = (32 - 32 * scale) / 2;
  return `
    <g transform="translate(${shift} ${shift}) scale(${scale})">
      <path d="M4 26 L12 8 L17 18 L21 12 L28 26 Z" fill="none" stroke="${SIGNAL}"
            stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="12" cy="8" r="2.4" fill="${SIGNAL}"/>
    </g>`;
}

const ICONS = [
  { file: 'icon-192.png', size: 192, radius: 7, scale: 1 },
  { file: 'icon-512.png', size: 512, radius: 7, scale: 1 },
  // Safe zone: Android may crop to a circle of 80% diameter, so the route is
  // pulled in to 62% and the background runs to the edges.
  { file: 'icon-maskable-512.png', size: 512, radius: 0, scale: 0.62 },
  // iOS applies its own rounding and dislikes transparency.
  { file: 'apple-touch-icon.png', size: 180, radius: 0, scale: 0.82 },
];

const browser = await chromium.launch();

for (const icon of ICONS) {
  const page = await browser.newPage({
    viewport: { width: icon.size, height: icon.size },
    deviceScaleFactor: 1,
  });
  await page.setContent(`
    <style>html,body{margin:0;padding:0;background:${INK}}</style>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"
         width="${icon.size}" height="${icon.size}">
      <rect width="32" height="32" rx="${icon.radius}" fill="${INK}"/>
      ${mark(icon.scale)}
    </svg>`);
  await page.screenshot({ path: join(ASSETS, icon.file), omitBackground: false });
  await page.close();
  console.log(`  ${icon.file}  ${icon.size}x${icon.size}`);
}

await browser.close();
console.log('Icons written to web/assets/');
