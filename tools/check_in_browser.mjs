/**
 * Grade every lesson's reference solution inside a real browser.
 *
 * tools/validate.py already does this in CI's CPython, which catches almost
 * everything. This catches the rest: Pyodide is CPython compiled to
 * WebAssembly, and its filesystem, its available modules, and its recursion
 * limits are not identical to a desktop build. A lesson about writing files
 * can pass on a laptop and fail in a browser, and the browser is where the
 * learners are.
 *
 *   node tools/check_in_browser.mjs [baseUrl]
 *
 * Expects the site to be served (./serve.sh) and Playwright's chromium
 * installed.
 */

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const BASE = process.argv[2] || process.env.SMOKE_URL || 'http://localhost:8777';
const here = dirname(fileURLToPath(import.meta.url));
const MANIFEST = resolve(here, '..', 'web', 'content', 'manifest.json');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error)));

await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });

process.stdout.write('Starting Python in the browser ... ');
await page.waitForFunction(
  () => document.getElementById('runtime-status')?.dataset.kind === 'ok',
  null,
  { timeout: 180_000 },
);
console.log('ok\n');

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const failures = [];
let checked = 0;

for (const module of manifest.modules) {
  process.stdout.write(`  ${module.title.padEnd(24)} `);

  for (const entry of module.lessons) {
    // eslint-disable-next-line no-await-in-loop
    const report = await page.evaluate(
      async ({ path, slug }) => {
        const { parseLesson } = await import('/js/lesson.js');
        const { runtime } = await import('/js/runtime.js');
        const text = await (await fetch(`/content/${path}`)).text();
        const lesson = parseLesson(text, slug);
        const result = await runtime.grade(lesson.solution, lesson.tests, lesson.stdin);
        return {
          passed: result.passed,
          error: result.error,
          failed: result.tests.filter((t) => !t.passed).map((t) => `${t.name}: ${t.message}`),
        };
      },
      { path: entry.path, slug: entry.slug },
    );

    checked += 1;
    if (report.passed) {
      process.stdout.write('.');
    } else {
      process.stdout.write('X');
      failures.push({ id: `${module.slug}/${entry.slug}`, ...report });
    }
  }
  console.log('');
}

await browser.close();

console.log('');
for (const failure of failures) {
  console.log(`  ${failure.id}`);
  if (failure.error) console.log(`      ${failure.error.split('\n').join('\n      ')}`);
  for (const line of failure.failed) console.log(`      ${line.split('\n').join('\n      ')}`);
}

if (pageErrors.length) {
  console.log('\nThe page logged errors:');
  for (const error of pageErrors.slice(0, 5)) console.log(`  ${error}`);
}

if (failures.length || pageErrors.length) {
  console.log(`\n${checked - failures.length}/${checked} lesson solutions pass in the browser.`);
  process.exit(1);
}

console.log(`All ${checked} lesson solutions pass in the browser as well as in CI's CPython.`);
