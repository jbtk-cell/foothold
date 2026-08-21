/**
 * The promises that are not about Python.
 *
 * validate.py proves every lesson is solvable and smoke_test.mjs proves the
 * course runs. Neither notices when the interface stops being usable without
 * a mouse, when a colour drifts under the contrast a person needs to read it,
 * or when the only route to the interpreter goes down. Those failures are
 * quiet, they land on the people least able to work around them, and they are
 * exactly the kind that survive to release.
 *
 *   node tools/check_access.mjs [base-url]
 *
 * Needs axe-core alongside playwright:  npm install --no-save axe-core
 */

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const BASE = (process.argv[2] || 'http://localhost:8000').replace(/\/$/, '');
const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const HOME = `${BASE}/index.html#/`;
const LESSON = `${BASE}/index.html#/lesson/first-steps/hello-world`;
// Deliberately one nobody has opened, to prove the whole course is cached and
// not only the pages already read.
const UNREAD = `${BASE}/index.html#/lesson/lists/comprehensions`;

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

function section(title) {
  console.log(`\n${title}`);
}

const browser = await chromium.launch();

async function openLesson(context, url = LESSON) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('.editor-input', { timeout: 30_000 });
  return page;
}

// --- Contrast ---------------------------------------------------------------

section('colour contrast');

for (const [label, url] of [['home', HOME], ['a lesson', LESSON]]) {
  for (const theme of ['dark', 'light']) {
    // bypassCSP because axe is injected inline, which the page's own policy
    // forbids. The policy itself is checked further down.
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, bypassCSP: true });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('.view', { timeout: 30_000 }).catch(() => {});
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await page.waitForTimeout(800);
    await page.addScriptTag({ content: AXE });
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: ['color-contrast'] }));
    const offenders = result.violations.flatMap((v) => v.nodes);
    check(
      `${label} reads at WCAG AA (${theme})`,
      offenders.length === 0,
      offenders
        .slice(0, 3)
        .map((n) => `${n.target.join(' ')} -> ${(n.any[0] || {}).data?.contrastRatio}`)
        .join('; '),
    );
    await context.close();
  }
}

// --- Everything else axe can see -------------------------------------------

section('the rest of WCAG that a machine can judge');

for (const [label, url] of [['home', HOME], ['a lesson', LESSON]]) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, bypassCSP: true });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.addScriptTag({ content: AXE });
  const result = await page.evaluate(async () =>
    window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } },
    }),
  );
  check(
    `${label} has no other violations`,
    result.violations.length === 0,
    result.violations.map((v) => `${v.id} (${v.nodes.length})`).join(', '),
  );
  await context.close();
}

// --- The content security policy --------------------------------------------

section('the security policy');

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const refused = [];
  page.on('console', (message) => {
    if (/Content Security Policy|Refused to/i.test(message.text())) refused.push(message.text());
  });
  await page.goto(LESSON, { waitUntil: 'networkidle' });
  const ready = await page
    .waitForFunction(() => document.getElementById('runtime-status')?.dataset.kind === 'ok', {
      timeout: 180_000,
    })
    .then(() => true)
    .catch(() => false);

  check('Python boots with the policy enforced', ready);
  check('nothing legitimate is refused', refused.length === 0, refused.slice(0, 2).join(' | '));

  await page.evaluate(() => {
    const input = document.querySelector('.editor-input');
    input.value = 'print("policy ok")';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.click('.js-run');
  await page.waitForFunction(() => /policy ok/.test(document.body.innerText), { timeout: 30_000 }).catch(() => {});
  check('a program still runs end to end', /policy ok/.test(await page.innerText('body')));
  await context.close();
}

// --- Reporting a break ------------------------------------------------------

section('when the page itself breaks');

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await openLesson(context);

  await page.evaluate(() => setTimeout(() => { throw new Error('deliberate test explosion'); }, 0));
  const offered = await page
    .waitForSelector('.reporter', { timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  check('a page error offers a report', offered);

  if (offered) {
    const href = await page.getAttribute('.js-report', 'href');
    const url = new URL(href);
    check('the report is prefilled', url.searchParams.get('template') === 'bug.yml');
    check(
      'it names the lesson they were on',
      /first-steps\/hello-world/.test(url.searchParams.get('what') || ''),
    );
    check('it carries the stack', /deliberate test explosion/.test(url.searchParams.get('console') || ''));
    check('the link is short enough for GitHub', href.length < 6000, `${href.length} chars`);
    check(
      'it promises nothing is sent yet',
      /Nothing is sent unless/.test(await page.innerText('.reporter')),
    );

    // A thing that breaks tends to break repeatedly.
    await page.evaluate(() => setTimeout(() => { throw new Error('second explosion'); }, 0));
    await page.waitForTimeout(800);
    check('a second error does not stack a second note', (await page.locator('.reporter').count()) === 1);

    await page.click('.js-dismiss');
    await page.waitForTimeout(300);
    check('it can be dismissed', (await page.locator('.reporter').count()) === 0);
  }
  await context.close();
}

{
  // The learner's own infinite loop is expected, is explained where it happens,
  // and must not turn into an issue on the tracker.
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await openLesson(context);
  await page.waitForFunction(
    () => document.getElementById('runtime-status')?.dataset.kind === 'ok',
    { timeout: 180_000 },
  );
  await page.evaluate(() => {
    const input = document.querySelector('.editor-input');
    input.value = 'while True:\n    pass';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.click('.js-run');
  await page.waitForTimeout(14_000);
  check('a runaway loop is not reported as a bug', (await page.locator('.reporter').count()) === 0);
  check('and is still explained where it happened', /too long|stopped/i.test(await page.innerText('body')));
  await context.close();
}

// --- Keyboard ---------------------------------------------------------------

section('finishing a lesson without a mouse');

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await openLesson(context);

  await page.click('.editor-input');
  await page.keyboard.press('Tab');
  check(
    'Tab indents rather than leaving',
    (await page.evaluate(() => document.activeElement.className)).includes('editor-input'),
  );

  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');
  const afterEscape = await page.evaluate(() => document.activeElement.className);
  check('Escape then Tab is a way out', !afterEscape.includes('editor-input'), `focus: ${afterEscape}`);

  await page.click('.editor-input');
  await page.keyboard.press('Escape');
  await page.keyboard.down('Shift');
  await page.keyboard.press('Tab');
  await page.keyboard.up('Shift');
  const afterBack = await page.evaluate(() => document.activeElement.className);
  check('Escape then Shift+Tab leaves backwards', !afterBack.includes('editor-input'), `focus: ${afterBack}`);

  check('the way out is written on the page', await page.isVisible('.editor-keys'));
  await context.close();
}

// --- What a screen reader is told -------------------------------------------

section('what gets said out loud');

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await openLesson(context);
  await page.waitForFunction(
    () => document.getElementById('runtime-status')?.dataset.kind === 'ok',
    { timeout: 120_000 },
  );

  // A wrong answer, so the announcement has to carry a reason.
  await page.evaluate(() => {
    const input = document.querySelector('.editor-input');
    input.value = 'print("nope")';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.click('.js-check');
  await page.waitForFunction(
    () => (document.getElementById('announcer')?.textContent || '').includes('Not yet'),
    { timeout: 30_000 },
  ).catch(() => {});

  const said = await page.textContent('#announcer');
  check('a failed check is announced', /Not yet/.test(said || ''), said);
  check('and it says why, not only that it failed', (said || '').length > 'Not yet.'.length + 8, said);

  const valuetext = await page.getAttribute('.js-slider', 'aria-valuetext').catch(() => null);
  check('the trace slider says where it landed', !valuetext || /line \d+/.test(valuetext), String(valuetext));
  await context.close();
}

// --- Reaching Python at all -------------------------------------------------

section('when the network is against you');

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route('**jsdelivr.net/**', (route) => route.abort('failed'));
  const page = await context.newPage();
  await page.goto(LESSON, { waitUntil: 'networkidle' });
  const started = await page
    .waitForFunction(() => document.getElementById('runtime-status')?.dataset.kind === 'ok', {
      timeout: 180_000,
    })
    .then(() => true)
    .catch(() => false);
  check('Python still starts when jsDelivr is blocked', started, await page.textContent('#runtime-status'));
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route('**jsdelivr.net/**', (route) => route.abort('failed'));
  await context.route('**unpkg.com/**', (route) => route.abort('failed'));
  const page = await context.newPage();
  await page.goto(LESSON, { waitUntil: 'networkidle' });
  const shown = await page
    .waitForSelector('#runtime-alert:not([hidden])', { timeout: 180_000 })
    .then(() => true)
    .catch(() => false);
  check('a blocked learner is told what happened', shown);
  if (shown) {
    const text = (await page.innerText('#runtime-alert')).toLowerCase();
    check('in words, not an exception', !text.includes('failed to fetch dynamically'), text.slice(0, 90));
    check('with a way to try again', await page.isVisible('.js-retry'));
  }
  await context.close();
}

// --- Offline ----------------------------------------------------------------

section('the wifi promise');

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });

  const cached = await page
    .waitForFunction(
      async () => {
        if (!navigator.serviceWorker.controller) return false;
        const names = await caches.keys();
        const shell = names.find((n) => n.startsWith('foothold-shell'));
        if (!shell) return false;
        const keys = await (await caches.open(shell)).keys();
        return keys.filter((r) => r.url.includes('/content/curriculum/')).length;
      },
      { timeout: 60_000 },
    )
    .then((h) => h.jsonValue())
    .catch(() => 0);

  check('every lesson is saved for offline use', cached >= 60, `${cached} lesson files cached`);

  await context.setOffline(true);
  const offlinePage = await context.newPage();
  await offlinePage.goto(UNREAD, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await offlinePage.waitForTimeout(2500);
  const body = await offlinePage.innerText('#view').catch(() => '');
  check('a lesson never opened before still opens offline', body.length > 80 && !/not here/i.test(body), body.slice(0, 80));
  await context.setOffline(false);
  await context.close();
}

await browser.close();

console.log(`\n${checks - failures.length}/${checks} checks passed.`);
if (failures.length) {
  console.log(`\nFailed:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
  process.exit(1);
}
