/**
 * End-to-end smoke test.
 *
 * tools/validate.py proves the lessons are correct against CPython. This
 * proves the other half: that a real browser can boot Pyodide, run a
 * learner's code, grade it, and record the result. Between them, a green CI
 * run means someone can actually finish a lesson.
 *
 *   node tools/smoke_test.mjs [baseUrl]
 *
 * It expects the site to already be served (./serve.sh) and Playwright's
 * chromium to be installed. Set SMOKE_HEADED=1 to watch it work.
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || process.env.SMOKE_URL || 'http://localhost:8777';
const here = dirname(fileURLToPath(import.meta.url));
const SHOTS = resolve(here, '..', 'docs', 'screenshots');

const failures = [];
let checks = 0;

function check(label, condition, detail = '') {
  checks += 1;
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    console.log(`  FAIL ${label}${detail ? `\n       ${detail}` : ''}`);
    failures.push(label);
  }
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });

  const browser = await chromium.launch({ headless: !process.env.SMOKE_HEADED });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  console.log(`Smoke testing ${BASE}\n`);

  // --- The front page -------------------------------------------------------
  console.log('front page');
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });

  check('the hero renders', (await page.locator('.hero h1').count()) === 1);
  check('module cards are listed', (await page.locator('.module-card').count()) > 0);
  check('the sidebar lists lessons', (await page.locator('.nav-lesson').count()) > 0);

  // --- Python actually boots -----------------------------------------------
  console.log('\npython runtime');
  await page.waitForFunction(
    () => document.getElementById('runtime-status')?.dataset.kind === 'ok',
    null,
    { timeout: 180_000 },
  );
  check('the interpreter reports ready', true);

  // --- The live prompt in the hero -----------------------------------------
  console.log('\nhero terminal');
  const heroEntry = page.locator('.hero-demo .terminal-entry');
  await heroEntry.fill('2 + 2');
  await heroEntry.press('Enter');
  // Assert on the last output line specifically. Matching "4" anywhere in the
  // terminal would also match the "3.14" in the banner, and a test that can
  // pass while the runtime is broken is worse than no test.
  await page.waitForFunction(
    () => {
      const lines = document.querySelectorAll('.hero-demo .terminal-output .terminal-out');
      return lines.length > 0 && lines[lines.length - 1].textContent.trim() === '4';
    },
    null,
    { timeout: 30_000 },
  );
  check('typing 2 + 2 prints 4', true);

  await heroEntry.fill('name = "Ada"');
  await heroEntry.press('Enter');
  await heroEntry.fill('f"hello {name}"');
  await heroEntry.press('Enter');
  await page.waitForFunction(
    () => document.querySelector('.hero-demo .terminal-output')?.textContent.includes('hello Ada'),
    null,
    { timeout: 30_000 },
  );
  check('the namespace persists between lines', true);

  await page.screenshot({ path: resolve(SHOTS, 'home.png'), fullPage: false });

  // --- A lesson, start to finish -------------------------------------------
  console.log('\nfirst lesson');
  await page.click('.nav-lesson');
  await page.waitForSelector('.editor-input');

  check('the lesson prose renders', (await page.locator('.prose p').count()) > 0);
  check('the starter code is loaded', (await page.locator('.editor-input').inputValue()).length > 0);

  // A wrong answer must be rejected.
  await page.fill('.editor-input', 'print("nope")');
  await page.click('.js-check');
  await page.waitForSelector('.check.is-fail', { timeout: 60_000 });
  check('a wrong answer fails the checks', true);
  const failMessage = await page.locator('.check-message').first().textContent();
  check('the failure explains itself', (failMessage || '').length > 10, failMessage);

  // The right answer must pass, and stick.
  await page.fill('.editor-input', 'print("Hello, World!")');
  await page.click('.js-check');
  await page.waitForSelector('.check-pass', { timeout: 60_000 });
  check('the correct answer passes', true);
  check('the status line says so', (await page.locator('.js-status').textContent()).includes('Passed'));

  await page.waitForSelector('.nav-lesson.is-done', { timeout: 10_000 });
  check('the sidebar records the tick', true);

  await page.screenshot({ path: resolve(SHOTS, 'lesson.png'), fullPage: false });

  // --- Running a program, and its output ------------------------------------
  console.log('\nrun button');
  await page.fill('.editor-input', 'for i in range(3):\n    print(i * 2)');
  await page.click('.js-run');
  await page.waitForFunction(
    () => document.querySelector('.console-out')?.textContent.trim() === '0\n2\n4',
    null,
    { timeout: 30_000 },
  );
  check('Run shows the program output', true);

  // --- Errors point at the learner's line -----------------------------------
  console.log('\nerrors');
  await page.fill('.editor-input', 'x = 1\nprint(x + "no")');
  await page.click('.js-run');
  await page.waitForSelector('.console-err', { timeout: 30_000 });
  const errorText = await page.locator('.console-err').textContent();
  check('a TypeError is reported', errorText.includes('TypeError'), errorText);
  check('it names the offending line', errorText.includes('line 2'), errorText);

  // --- input() asks, one question at a time ---------------------------------
  console.log('\ninteractive input');
  await page.fill('.editor-input', 'a = input("First? ")\nb = input("Second? ")\nprint(a + b)');
  await page.click('.js-run');
  await page.waitForSelector('.console-ask', { timeout: 30_000 });
  const prompt1 = await page.locator('.console-ask-prompt').textContent();
  check('the program asks its first question', prompt1.trim() === 'First?', prompt1);

  await page.fill('.console-ask-input', 'ab');
  await page.press('.console-ask-input', 'Enter');
  await page.waitForFunction(
    () => document.querySelector('.console-ask-prompt')?.textContent.trim() === 'Second?',
    null,
    { timeout: 30_000 },
  );
  check('then its second', true);

  await page.fill('.console-ask-input', 'cd');
  await page.press('.console-ask-input', 'Enter');
  await page.waitForFunction(
    () => document.querySelector('.console-out')?.textContent.includes('abcd'),
    null,
    { timeout: 30_000 },
  );
  check('and finishes with both answers', true);

  // --- An infinite loop must not take the page down -------------------------
  console.log('\ninfinite loop recovery');
  await page.fill('.editor-input', 'while True:\n    pass');
  await page.click('.js-run');
  await page.waitForSelector('.console-err', { timeout: 40_000 });
  const timeoutText = await page.locator('.console-err').textContent();
  check('the runaway program is stopped', timeoutText.includes('too long'), timeoutText);

  // The page must still work afterwards.
  await page.fill('.editor-input', 'print("still here")');
  await page.click('.js-run');
  await page.waitForFunction(
    () => document.querySelector('.console-out')?.textContent.includes('still here'),
    null,
    { timeout: 180_000 },
  );
  check('the runtime recovers and runs again', true);

  // --- Progress survives a reload -------------------------------------------
  console.log('\npersistence');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.nav-lesson.is-done', { timeout: 20_000 });
  check('the completed lesson is still ticked after a reload', true);

  // --- Light theme ----------------------------------------------------------
  console.log('\ntheme');
  await page.click('#theme-toggle');
  await page.waitForTimeout(200);
  check('the light theme applies', (await page.getAttribute('html', 'data-theme')) === 'light');
  await page.screenshot({ path: resolve(SHOTS, 'lesson-light.png'), fullPage: false });
  await page.click('#theme-toggle');

  // --- No console errors ----------------------------------------------------
  console.log('\nconsole');
  const realErrors = consoleErrors.filter(
    (text) => !/favicon|ServiceWorker|sw\.js|Failed to load resource.*404/i.test(text),
  );
  check('the page logged no errors', realErrors.length === 0, realErrors.slice(0, 5).join('\n       '));

  await browser.close();

  console.log(`\n${checks - failures.length}/${checks} checks passed.`);
  if (failures.length) {
    console.log(`\nFailed: ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log(`Screenshots written to ${SHOTS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
