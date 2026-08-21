/**
 * Telling someone when the page breaks.
 *
 * Foothold sends nothing anywhere, which is the right default and leaves one
 * real hole: when the site throws on a browser nobody tested, the learner
 * closes the tab and no one ever finds out. A site with analytics learns about
 * that within the hour. A site without them can go a year.
 *
 * The way to have both is to make the learner the sender. Nothing is
 * transmitted here. An error puts a note on screen with a button, and the
 * button opens a GitHub issue form with the details already filled in. If they
 * ignore it, or close the tab, or never look, nothing leaves the device - the
 * promise in PRIVACY.md holds either way.
 *
 * It appears once per visit. Something that breaks tends to break repeatedly,
 * and a learner already having a bad time does not need a pile of toasts.
 */

const ISSUES = 'https://github.com/jbtk-cell/foothold/issues/new';
const MAX_STACK = 1200;

let shown = false;
let node = null;

/** A readable browser name, since a raw user-agent string tells nobody much. */
function browserName() {
  const ua = navigator.userAgent;
  const pairs = [
    [/Firefox\/(\d+)/, 'Firefox'],
    [/Edg\/(\d+)/, 'Edge'],
    [/OPR\/(\d+)/, 'Opera'],
    [/Chrome\/(\d+)/, 'Chrome'],
    [/Version\/(\d+).*Safari/, 'Safari'],
  ];
  for (const [pattern, name] of pairs) {
    const found = ua.match(pattern);
    if (found) return `${name} ${found[1]}`;
  }
  return 'an unrecognised browser';
}

function platformName() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'an unrecognised system';
}

/** Which lesson they were on, read off the hash rather than tracked. */
function where() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return hash || 'the home page';
}

function issueURL({ message, stack }) {
  const query = new URLSearchParams({
    template: 'bug.yml',
    labels: 'bug',
    title: `Page error: ${String(message).slice(0, 90)}`,
    what:
      `Foothold reported an error by itself, so this description is written by the page ` +
      `rather than by me.\n\n` +
      `Where: ${where()}\n` +
      `Error: ${message}\n\n` +
      `What I was doing at the time:\n(anything you can remember helps - if you cannot ` +
      `remember, say so and send it anyway)`,
    browser: `${browserName()} on ${platformName()}`,
    console: `${stack || '(no stack)'}\n\nUser agent: ${navigator.userAgent}`,
  });
  return `${ISSUES}?${query}`;
}

function dismiss() {
  if (node) node.remove();
  node = null;
}

/**
 * Put the offer on screen.
 *
 * role="status" rather than "alert": the course still works around whatever
 * just failed in most cases, and shouting over a screen reader mid-sentence
 * would be worse than waiting for a gap.
 */
export function offerToReport(error) {
  if (shown) return;

  // Two failures are expected rather than broken, and both already say so
  // somewhere the learner can see. A runaway loop is the learner's own
  // infinite loop, and an unreachable runtime is a blocked network. Reporting
  // either would send noise to the issue tracker and teach people to ignore
  // the button when something genuinely does break.
  if (error && (error.code === 'TIMEOUT' || error.code === 'RUNTIME_UNREACHABLE')) return;

  shown = true;

  const message = String((error && error.message) || error || 'Unknown error').slice(0, 300);
  const stack = String((error && error.stack) || '').slice(0, MAX_STACK);

  node = document.createElement('div');
  node.className = 'reporter';
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', 'polite');
  node.innerHTML = `
    <p class="reporter-what">
      Something in this page just broke. The course may keep working, and this
      is worth knowing about either way.
    </p>
    <p class="reporter-actions">
      <a class="btn btn-primary btn-tiny js-report" href="#" target="_blank" rel="noopener noreferrer">
        Tell the maintainers
      </a>
      <button class="btn btn-quiet btn-tiny js-dismiss" type="button">No thanks</button>
    </p>
    <p class="reporter-fine">Nothing is sent unless you press the button.</p>
  `;

  node.querySelector('.js-report').href = issueURL({ message, stack });
  node.querySelector('.js-report').addEventListener('click', () => setTimeout(dismiss, 200));
  node.querySelector('.js-dismiss').addEventListener('click', dismiss);

  document.body.appendChild(node);
}

/** Start listening. Safe to call more than once. */
export function watchForErrors() {
  window.addEventListener('error', (event) => {
    // A cross-origin script gives us "Script error." and nothing else, which
    // would produce a report nobody can act on.
    if (!event.error && !event.message) return;
    if (/^Script error\.?$/.test(event.message || '')) return;
    offerToReport(event.error || { message: event.message });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (!reason) return;
    offerToReport(reason instanceof Error ? reason : { message: String(reason) });
  });
}

export const reporterInternals = { issueURL, browserName, platformName, where };
