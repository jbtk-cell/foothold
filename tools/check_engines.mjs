/**
 * The course, in the other two browser engines.
 *
 * Everything else runs in Chromium, which is convenient and not what a lot of
 * learners use. This matters more here than on an ordinary site: Foothold
 * depends on a module worker, dynamic import inside that worker, and
 * WebAssembly compilation, and those are exactly the places where Safari and
 * Firefox have historically differed from Chrome. A failure here means the
 * course does not run at all for that person, so it is worth the extra minutes.
 *
 *   node tools/check_engines.mjs [base-url]
 */

import { webkit, firefox } from 'playwright';

const BASE = (process.argv[2] || 'http://localhost:8000').replace(/\/$/, '');
const LESSON = `${BASE}/index.html#/lesson/first-steps/hello-world`;

const ENGINES = [
  ['WebKit, the engine behind Safari', webkit],
  ['Firefox', firefox],
];

const failures = [];
let checks = 0;

function check(label, passed, detail = '') {
  checks += 1;
  if (passed) {
    console.log(`  ok   ${label}`);
  } else {
    console.log(`  FAIL ${label}`);
    if (detail) console.log(`       ${detail}`);
    failures.push(label);
  }
}

for (const [name, engine] of ENGINES) {
  console.log(`\n${name}`);

  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(LESSON, { waitUntil: 'domcontentloaded' });

  const ready = await page
    .waitForFunction(() => document.getElementById('runtime-status')?.dataset.kind === 'ok', {
      timeout: 240_000,
    })
    .then(() => true)
    .catch(() => false);
  check('Python starts', ready, (await page.textContent('#runtime-status')).trim());

  if (ready) {
    await page.evaluate(() => {
      const input = document.querySelector('.editor-input');
      input.value = 'print(2 + 2)';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.click('.js-run');
    await page
      .waitForFunction(() => /\b4\b/.test(document.body.innerText), { timeout: 60_000 })
      .catch(() => {});
    check('a program runs and prints', /\b4\b/.test(await page.innerText('body')));

    // The trace is the reason to use Foothold, so it is checked rather than
    // assumed to follow from the interpreter working.
    await page.click('.pane-tab[data-pane="trace"]');
    await page.click('.js-trace-start');
    const traced = await page
      .waitForSelector('.js-slider', { timeout: 120_000 })
      .then(() => true)
      .catch(() => false);
    check('the trace records', traced);

    if (traced) {
      const valuetext = await page.getAttribute('.js-slider', 'aria-valuetext');
      check('and says which line each step is on', /line \d+/.test(valuetext || ''), String(valuetext));
    }
  }

  check('the page reported no errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await browser.close();
}

console.log(`\n${checks - failures.length}/${checks} checks passed.`);
if (failures.length) {
  console.log(`\nFailed:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
  process.exit(1);
}
