/**
 * Record the demo animation used in the README and in link posts.
 *
 *   node tools/make_demo_gif.mjs [baseUrl]
 *
 * Drives a real lesson: type a wrong answer, fail the check, press Show me
 * why, then scrub the recording and watch the variable go wrong. That is the
 * whole pitch in about fifteen seconds, and a moving picture of it does more
 * than any paragraph.
 *
 * Needs ffmpeg on PATH. Writes docs/demo.gif.
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const BASE = process.argv[2] || 'http://localhost:8777';
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const frames = mkdtempSync(resolve(tmpdir(), 'foothold-gif-'));

// 12 fps keeps the file small while staying smooth enough to read.
const FPS = 12;
let frame = 0;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1180, height: 660 }, deviceScaleFactor: 1 });

const clip = { x: 0, y: 0, width: 1180, height: 660 };
async function shoot(count = 1) {
  for (let i = 0; i < count; i += 1) {
    await page.screenshot({ path: resolve(frames, `f${String(frame++).padStart(4, '0')}.png`), clip });
  }
}

async function hold(seconds) {
  await shoot(Math.round(seconds * FPS));
}

console.log('Loading the lesson...');
await page.goto(`${BASE}/index.html#/lesson/repeating-yourself/accumulating`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.getElementById('runtime-status')?.dataset.kind === 'ok', null, { timeout: 180_000 });
await page.waitForSelector('.editor-input');

// Hide the sidebar so the recording is about the workbench.
await page.addStyleTag({ content: '.sidebar{display:none}.shell{grid-template-columns:1fr}' });

// A plausible wrong answer: the total is printed inside the loop.
const wrong = 'total = 0\ncount = 0\n\nfor number in range(3, 100, 3):\n    total += number\n\nprint(f"Sum: {total}")\nprint(f"Count: {count}")';
await page.fill('.editor-input', wrong);
await hold(1.2);

console.log('Failing the check...');
await page.click('.js-check');
await page.waitForSelector('.check.is-fail', { timeout: 60_000 });
await hold(2.2);

console.log('Opening the recording...');
await page.click('.js-why');
await page.waitForSelector('.trace-slider', { timeout: 60_000 });
await hold(1.4);

console.log('Scrubbing...');
const steps = await page.evaluate(() => Number(document.querySelector('.trace-slider').max) + 1);
await page.click('.js-first');
await hold(0.6);

// Walk through the first couple of loop passes, where `count` visibly fails
// to move while `total` climbs. That is the bug, seen rather than described.
for (let i = 0; i < Math.min(steps, 16); i += 1) {
  await page.evaluate((value) => {
    const slider = document.querySelector('.trace-slider');
    slider.value = String(value);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  }, i);
  await shoot(3);
}
await hold(1.8);

await browser.close();

console.log('Encoding...');
mkdirSync(resolve(root, 'docs'), { recursive: true });
const out = resolve(root, 'docs', 'demo.gif');
const palette = resolve(frames, 'palette.png');
const input = resolve(frames, 'f%04d.png');

// Two passes: build a palette from the whole clip, then map to it. A single
// pass picks a palette per frame and the result shimmers.
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', input,
  '-vf', 'scale=900:-1:flags=lanczos,palettegen=max_colors=128', palette]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', input, '-i', palette,
  '-lavfi', 'scale=900:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3', out]);

rmSync(frames, { recursive: true, force: true });
console.log(`Wrote ${out} (${frame} frames at ${FPS}fps)`);
