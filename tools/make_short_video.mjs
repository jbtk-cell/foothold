/**
 * Record the vertical cut, for TikTok and Instagram.
 *
 *   node tools/make_short_video.mjs [baseUrl]
 *
 * docs/demo.gif is a landscape clip that suits a README and a link post. It is
 * the wrong shape for the place most people who cannot code yet actually
 * spend their time. This records the same fifteen seconds at 1080x1920, with
 * the prose and the sidebar hidden so the editor, the failed check and the
 * recording fill a phone screen.
 *
 * No captions are burned in. Those are better added in whatever app the post
 * is written in, where they can be changed without re-recording.
 *
 * Needs ffmpeg on PATH. Writes docs/short.mp4.
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const BASE = process.argv[2] || 'http://localhost:8777';
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const frames = mkdtempSync(resolve(tmpdir(), 'foothold-short-'));

// Recorded portrait, then padded to 9:16.
//
// Three framings were tried. A 1080x1920 viewport gives the site a window
// taller than any desktop and it answers with half a screen of empty grey.
// Zooming scrolled the code out of frame, which loses half the point. A
// narrow portrait window puts the app in its own single-column layout, where
// the editor sits above the recording exactly as it would on a phone, and
// that is what gets recorded here. Padding to 9:16 afterwards leaves room
// under the clip for a caption and for the buttons every one of these apps
// draws over the lower third.
const WIDTH = 820;
const HEIGHT = 1020;
const FRAME_W = 1080;
const FRAME_H = 1920;
const FPS = 24;
let frame = 0;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
});

async function shoot(count = 1) {
  for (let i = 0; i < count; i += 1) {
    await page.screenshot({
      path: resolve(frames, `f${String(frame++).padStart(4, '0')}.png`),
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });
  }
}

const hold = (seconds) => shoot(Math.round(seconds * FPS));

console.log('Loading the lesson...');
await page.goto(`${BASE}/index.html#/lesson/repeating-yourself/accumulating`, { waitUntil: 'networkidle' });
await page.waitForFunction(
  () => document.getElementById('runtime-status')?.dataset.kind === 'ok',
  null,
  { timeout: 180_000 },
);
await page.waitForSelector('.editor-input');

// Strip the page back to the workbench. The prose is a separate moment from
// the code, and the code is the part worth watching.
await page.addStyleTag({
  content: `
    .sidebar, .nav-scrim, .lesson-prose { display: none !important; }
    .shell { grid-template-columns: 1fr !important; }
    /* Eight lines of code need nowhere near the height the editor claims. */
    .editor { max-height: 380px; }
  `,
});
await page.waitForTimeout(400);

const wrong = [
  'total = 0',
  'count = 0',
  '',
  'for number in range(3, 100, 3):',
  '    total += number',
  '',
  'print(f"Sum: {total}")',
  'print(f"Count: {count}")',
].join('\n');
await page.fill('.editor-input', wrong);
await hold(1.6);

console.log('Failing the check...');
await page.click('.js-check');
await page.waitForSelector('.check.is-fail', { timeout: 60_000 });
await hold(2.6);

console.log('Opening the recording...');
await page.click('.js-why');
await page.waitForSelector('.trace-slider', { timeout: 60_000 });
await hold(1.6);

console.log('Scrubbing...');
const steps = await page.evaluate(() => Number(document.querySelector('.trace-slider').max) + 1);
await page.click('.js-first');
await hold(0.8);

// The loop passes where `count` sits still while `total` climbs. That is the
// bug, seen rather than described, and it is the whole reason for the clip.
for (let i = 0; i < Math.min(steps, 18); i += 1) {
  await page.evaluate((value) => {
    const slider = document.querySelector('.trace-slider');
    slider.value = String(value);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  }, i);
  await shoot(5);
}
await hold(2.2);

await browser.close();

console.log('Encoding...');
mkdirSync(resolve(root, 'docs'), { recursive: true });
const out = resolve(root, 'docs', 'short.mp4');

// yuv420p and even dimensions, because a phone will refuse anything else.
// Scale to the frame width, then pad to 9:16 on the app's own background.
// Sitting slightly above centre leaves the lower third clear, which is where
// every one of these apps puts its own buttons.
const pad = `scale=${FRAME_W}:-2:flags=lanczos,` +
  `pad=${FRAME_W}:${FRAME_H}:(ow-iw)/2:(oh-ih)/2-100:color=0x101A26`;

execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-framerate', String(FPS),
  '-i', resolve(frames, 'f%04d.png'),
  '-vf', pad,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  out,
]);

rmSync(frames, { recursive: true, force: true });
const size = (statSync(out).size / 1e6).toFixed(1);
console.log(`Wrote ${out} (${frame} frames, ${(frame / FPS).toFixed(1)}s, ${size} MB)`);
