/**
 * Foothold's entry point: load the curriculum, route on the URL hash, and
 * keep one Python worker warm for the whole session.
 *
 * Routing uses the hash rather than the History API because the site has to
 * work from a `file://`-style static folder and from any subpath on GitHub
 * Pages without a server that knows how to rewrite URLs.
 */

import { parseLesson } from './lesson.js';
import { renderHome, teardownHome } from './ui/home.js';
import { renderCertificate } from './ui/certificate.js';
import { Sidebar } from './ui/sidebar.js';
import { LessonView } from './ui/lesson-view.js';
import { runtime } from './runtime.js';
import { progress } from './state.js';
import { escapeHtml } from './highlight.js';
import { announce } from './announce.js';

const CONTENT_BASE = new URL('../content/', import.meta.url);

const app = {
  manifest: null,
  sidebar: null,
  lessonCache: new Map(),
  view: null,
};

const main = document.getElementById('view');
const statusEl = document.getElementById('runtime-status');
const alertEl = document.getElementById('runtime-alert');

// --- Runtime status ---------------------------------------------------------

function setRuntimeStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.dataset.kind = kind;
}

runtime.addEventListener('booting', () => setRuntimeStatus('Starting Python', 'busy'));
runtime.addEventListener('progress', (event) => {
  const { stage, detail } = event.detail;
  if (stage === 'downloading') setRuntimeStatus(`Downloading Python (${detail})`, 'busy');
  if (stage === 'starting') setRuntimeStatus('Starting Python', 'busy');
});
runtime.addEventListener('ready', () => {
  setRuntimeStatus('Python ready', 'ok');
  hideRuntimeAlert();
  announce('Python is ready.');
});
runtime.addEventListener('restarted', () => setRuntimeStatus('Python restarted', 'warn'));
runtime.addEventListener('crashed', (event) => {
  setRuntimeStatus('Python did not start', 'error');
  showRuntimeAlert(event.detail);
});

// --- When Python cannot start -----------------------------------------------

/**
 * Boot failure deserves more than the status chip.
 *
 * Every exercise needs the interpreter, so a learner who cannot download it
 * has no course - and the browser's own wording for that is "Failed to fetch
 * dynamically imported module", which tells a beginner nothing. Say what
 * happened, say whose fault it is not, and give them the two things that
 * actually fix it.
 */

/** Does this browser run a module worker? Pyodide needs one. */
function moduleWorkerWorks() {
  return new Promise((resolve) => {
    let url = null;
    try {
      url = URL.createObjectURL(new Blob(['self.postMessage(1)'], { type: 'text/javascript' }));
      const worker = new Worker(url, { type: 'module' });
      const finish = (ok) => {
        clearTimeout(timer);
        worker.terminate();
        URL.revokeObjectURL(url);
        resolve(ok);
      };
      const timer = setTimeout(() => finish(false), 3000);
      worker.onmessage = () => finish(true);
      worker.onerror = () => finish(false);
    } catch {
      if (url) URL.revokeObjectURL(url);
      resolve(false);
    }
  });
}

function hideRuntimeAlert() {
  if (!alertEl) return;
  alertEl.hidden = true;
  alertEl.innerHTML = '';
}

async function showRuntimeAlert({ message, code, detail }) {
  if (!alertEl) return;

  let heading = 'Python did not start';
  let body;

  if (!navigator.onLine) {
    heading = 'You are offline, and Python has not been saved yet';
    body = `The interpreter downloads once and is then kept on this device. That
            first download has not happened, so the course needs you online for
            about a minute. Open this page again on a connection and it will
            work offline from then on.`;
  } else if (!(await moduleWorkerWorks())) {
    heading = 'This browser is too old to run Python';
    body = `Foothold needs a browser released after mid-2023: Chrome 80, Edge 80,
            Safari 15, or Firefox 114 and up. Everything else about the course
            works on this one - only running code does not.`;
  } else if (code === 'RUNTIME_UNREACHABLE') {
    body = `Python itself is fine; the download was refused. Something between
            this device and the internet is filtering it, which is common on
            school and office networks and across mainland China. We already
            tried four separate sources. On your own connection it will work,
            and there is an offline bundle a teacher can install once for a
            whole room.`;
  } else {
    body = escapeHtml(message || 'Something went wrong while starting the interpreter.');
  }

  alertEl.innerHTML = `
    <div class="runtime-alert-body">
      <h2>${escapeHtml(heading)}</h2>
      <p>${body}</p>
      <p class="runtime-alert-actions">
        <button class="btn btn-primary js-retry" type="button">Try again</button>
        <a class="btn btn-quiet" href="https://github.com/jbtk-cell/foothold#fully-offline"
           target="_blank" rel="noopener noreferrer">How to install it offline</a>
      </p>
      ${detail ? `<details><summary>What we tried</summary><pre>${escapeHtml(detail)}</pre></details>` : ''}
    </div>`;
  alertEl.hidden = false;

  alertEl.querySelector('.js-retry').addEventListener('click', () => {
    hideRuntimeAlert();
    setRuntimeStatus('Starting Python', 'busy');
    runtime.restart('retry');
    runtime.boot().catch(() => {});
  });
}

// --- Content ----------------------------------------------------------------

async function loadManifest() {
  const response = await fetch(new URL('manifest.json', CONTENT_BASE));
  if (!response.ok) throw new Error(`Could not load the curriculum (${response.status}).`);
  return response.json();
}

async function loadLesson(moduleSlug, lessonSlug) {
  const key = `${moduleSlug}/${lessonSlug}`;
  if (app.lessonCache.has(key)) return app.lessonCache.get(key);

  const moduleMeta = app.manifest.modules.find((module) => module.slug === moduleSlug);
  if (!moduleMeta) throw new Error(`There is no module called "${moduleSlug}".`);

  const entry = moduleMeta.lessons.find((lesson) => lesson.slug === lessonSlug);
  if (!entry) throw new Error(`There is no lesson called "${lessonSlug}" in ${moduleMeta.title}.`);

  const response = await fetch(new URL(entry.path, CONTENT_BASE));
  if (!response.ok) throw new Error(`Could not load ${entry.path} (${response.status}).`);

  const lesson = parseLesson(await response.text(), lessonSlug);
  lesson.estimate = entry.estimate;
  app.lessonCache.set(key, lesson);
  return lesson;
}

/** Walk the whole course as one flat list, which is what next/previous need. */
function flatten() {
  const order = [];
  for (const module of app.manifest.modules) {
    for (const lesson of module.lessons) {
      order.push({ module: module.slug, lesson: lesson.slug, title: lesson.title });
    }
  }
  return order;
}

function neighbours(moduleSlug, lessonSlug) {
  const order = flatten();
  const index = order.findIndex((item) => item.module === moduleSlug && item.lesson === lessonSlug);
  return {
    previous: index > 0 ? order[index - 1] : null,
    next: index >= 0 && index < order.length - 1 ? order[index + 1] : null,
  };
}

// --- Routing ----------------------------------------------------------------

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);

  if (!parts.length) return { name: 'home' };
  if (parts[0] === 'certificate') return { name: 'certificate' };
  if (parts[0] === 'lesson' && parts.length >= 3) {
    return { name: 'lesson', module: parts[1], lesson: parts[2] };
  }
  return { name: 'home' };
}

async function route() {
  const target = parseRoute();
  document.body.dataset.route = target.name;
  closeNav();
  if (target.name !== 'home') teardownHome();

  if (target.name === 'home') {
    app.sidebar?.setCurrent(null);
    renderHome(main, app.manifest, { onExport: exportProgress, onImport: importProgress, onReset: resetProgress });
    document.title = 'Foothold - learn Python in your browser';
    window.scrollTo(0, 0);
    return;
  }

  if (target.name === 'certificate') {
    app.sidebar?.setCurrent(null);
    renderCertificate(main, app.manifest);
    document.title = 'Foothold - certificate';
    return;
  }

  try {
    const [lesson] = await Promise.all([
      loadLesson(target.module, target.lesson),
      runtime.boot().catch(() => {}),
    ]);
    const moduleMeta = app.manifest.modules.find((module) => module.slug === target.module);

    app.view = new LessonView({
      mount: main,
      moduleMeta,
      lesson,
      onComplete: (isFirstTime) => {
        app.sidebar.setCurrent(target.module, target.lesson);
        if (isFirstTime) celebrate();
      },
      onNavigate: (direction) => {
        const { next, previous } = neighbours(target.module, target.lesson);
        const destination = direction === 'next' ? next : previous;
        window.location.hash = destination
          ? `#/lesson/${destination.module}/${destination.lesson}`
          : '#/certificate';
      },
    });

    renderLessonFooter(target);
    app.sidebar.setCurrent(target.module, target.lesson);
    document.title = `${lesson.title} - Foothold`;
    window.scrollTo(0, 0);
  } catch (error) {
    main.innerHTML = `
      <div class="error-page">
        <h1>That lesson is not here</h1>
        <p>${escapeHtml(error.message)}</p>
        <a class="btn btn-primary" href="#/">Back to the course</a>
      </div>`;
  }
}

function renderLessonFooter(target) {
  const { previous, next } = neighbours(target.module, target.lesson);
  const footer = document.createElement('nav');
  footer.className = 'lesson-nav';
  footer.innerHTML = `
    ${
      previous
        ? `<a class="btn btn-quiet" href="#/lesson/${previous.module}/${previous.lesson}">&larr; ${escapeHtml(previous.title)}</a>`
        : '<span></span>'
    }
    ${
      next
        ? `<a class="btn btn-quiet" href="#/lesson/${next.module}/${next.lesson}">${escapeHtml(next.title)} &rarr;</a>`
        : '<a class="btn btn-quiet" href="#/certificate">Finish &rarr;</a>'
    }
  `;
  main.querySelector('.lesson-prose')?.appendChild(footer);

  // The learner who just hit a confusing explanation is the only person who
  // can report it, and they will not go looking for an issue tracker to do
  // it. The lesson is filled in for them so the report costs one sentence.
  const moduleMeta = app.manifest.modules.find((module) => module.slug === target.module);
  const lessonMeta = moduleMeta?.lessons.find((lesson) => lesson.slug === target.lesson);
  const label = `${moduleMeta?.title || target.module} / ${lessonMeta?.title || target.lesson}`;
  const query = new URLSearchParams({ template: 'lesson-problem.yml', labels: 'lesson', lesson: label });

  const report = document.createElement('p');
  report.className = 'lesson-report';
  report.innerHTML =
    `<a href="https://github.com/jbtk-cell/foothold/issues/new?${query}"` +
    ' target="_blank" rel="noopener noreferrer">Was this lesson wrong or confusing? Say so.</a>';
  main.querySelector('.lesson-prose')?.appendChild(report);
}

// --- Progress import/export -------------------------------------------------

function exportProgress() {
  const blob = new Blob([progress.export()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'foothold-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

async function importProgress(file) {
  try {
    progress.import(await file.text());
    app.sidebar.render();
    route();
    toast('Progress imported.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

function resetProgress() {
  const sure = window.confirm(
    'This erases every tick, every saved draft, and your certificate name, from this browser. ' +
      'Export first if you want a copy.\n\nErase everything?',
  );
  if (!sure) return;
  progress.reset();
  app.sidebar.render();
  route();
  toast('Everything erased.');
}

// --- Small UI bits ----------------------------------------------------------

function toast(message, kind = 'ok') {
  const element = document.createElement('div');
  element.className = `toast toast-${kind}`;
  element.textContent = message;
  document.body.appendChild(element);
  setTimeout(() => element.classList.add('is-in'), 10);
  setTimeout(() => {
    element.classList.remove('is-in');
    setTimeout(() => element.remove(), 300);
  }, 3200);
}

function celebrate() {
  const stats = progress.stats(app.manifest);
  toast(stats.done === stats.total ? 'That was the last lesson. Well done.' : 'Lesson complete.');
}

function openNav() {
  document.body.classList.add('nav-open');
}

function closeNav() {
  document.body.classList.remove('nav-open');
}

function applyTheme() {
  document.documentElement.dataset.theme = progress.settings.theme;
}

function toggleTheme() {
  progress.settings.theme = progress.settings.theme === 'dark' ? 'light' : 'dark';
  progress.saveSettings();
  applyTheme();
}

// --- Boot -------------------------------------------------------------------

async function start() {
  applyTheme();

  try {
    app.manifest = await loadManifest();
  } catch (error) {
    main.innerHTML = `
      <div class="error-page">
        <h1>The course did not load</h1>
        <p>${escapeHtml(error.message)}</p>
        <p class="dim">If you opened this file directly from your disk, the browser will
           block it for security reasons. Serve the folder instead - there is a
           one-line command in the README.</p>
      </div>`;
    return;
  }

  app.sidebar = new Sidebar(document.getElementById('nav'), app.manifest, { onSelect: closeNav });

  window.addEventListener('hashchange', route);
  document.getElementById('nav-toggle').addEventListener('click', () => {
    document.body.classList.contains('nav-open') ? closeNav() : openNav();
  });
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNav();
  });

  await route();

  // Warming the interpreter now means the first Run feels instant rather than
  // making the learner wait several seconds at exactly the wrong moment.
  runtime.boot().catch(() => {});

  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register(new URL('../sw.js', import.meta.url)).catch(() => {});
  }
}

start();
