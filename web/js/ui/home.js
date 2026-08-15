/**
 * The front page: what this is, and the one button that matters.
 *
 * For a returning learner the important thing on this screen is Continue.
 * For a new one it is the promise that nothing is being asked of them - no
 * account, no install, no payment - and a first lesson within one click.
 */

import { escapeHtml } from '../highlight.js';
import { progress } from '../state.js';
import { Terminal } from './terminal.js';

export function renderHome(mount, manifest, { onExport, onImport, onReset }) {
  const stats = progress.stats(manifest);
  const next = progress.nextLesson(manifest);
  const started = stats.done > 0;
  const totalMinutes = manifest.modules.reduce(
    (sum, module) => sum + module.lessons.reduce((inner, lesson) => inner + (lesson.estimate || 5), 0),
    0,
  );

  const lessonCount = manifest.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const hours = Math.floor(totalMinutes / 60);
  const duration = hours >= 1 ? `about ${hours} hours` : `about ${totalMinutes} minutes`;

  mount.innerHTML = `
    <div class="home">
      <section class="hero">
        <p class="hero-eyebrow">Free, open source, and yours to keep</p>
        <h1>Learn to code. The Python below is real.</h1>
        <p class="hero-sub">
          ${lessonCount} lessons, ${duration}, every one of them checked by actually
          running your code. No account. No install. Nothing you write leaves your
          computer.
        </p>
        <div class="hero-actions">
          ${
            next
              ? `<a class="btn btn-primary btn-large" href="#/lesson/${next.module}/${next.lesson}">
                   ${started ? 'Continue' : 'Start the first lesson'} &rarr;
                 </a>`
              : `<a class="btn btn-primary btn-large" href="#/certificate">See your certificate &rarr;</a>`
          }
          <a class="btn btn-quiet btn-large" href="#/lesson/${manifest.modules[0].slug}/${manifest.modules[0].lessons[0].slug}">
            Back to the beginning
          </a>
        </div>
        ${
          started
            ? `<div class="hero-progress">
                 <div class="nav-progress-bar"><span style="width:${stats.percent}%"></span></div>
                 <p>${stats.done} of ${stats.total} done &middot; ${stats.percent}%</p>
               </div>`
            : ''
        }

        <div class="hero-demo">
          <div class="hero-demo-head">
            <span class="hero-demo-dot"></span>
            <span>python 3.14 &middot; running here, in this tab</span>
          </div>
          <div class="js-hero-terminal"></div>
        </div>
      </section>

      <section class="pitch">
        <article>
          <h3>A terminal, not a text box</h3>
          <p>Python 3.14 is compiled to WebAssembly and runs in a background
             thread in your browser. Real errors, real tracebacks, a real
             interactive prompt you can experiment in.</p>
        </article>
        <article>
          <h3>Checked by running it</h3>
          <p>Your answer is graded by executing it against real tests, not by
             matching it against a string. Any correct solution passes, including
             one nobody thought of.</p>
        </article>
        <article>
          <h3>Works with the wifi off</h3>
          <p>After the first visit the whole course is cached. Clone the
             repository and it runs from a folder on your disk, forever, with
             no server and no build step.</p>
        </article>
      </section>

      <section class="modules">
        <h2>The course</h2>
        <ol class="module-cards">
          ${manifest.modules
            .map((module, index) => {
              const done = stats.perModule[module.slug];
              const complete = done.done === done.total;
              return `
                <li class="module-card ${complete ? 'is-done' : ''}">
                  <a href="#/lesson/${module.slug}/${module.lessons[0].slug}">
                    <span class="module-card-index">${String(index + 1).padStart(2, '0')}</span>
                    <h3>${escapeHtml(module.title)}</h3>
                    <p>${escapeHtml(module.summary)}</p>
                    <span class="module-card-foot">
                      ${done.done}/${done.total} lessons
                      ${complete ? '<span class="tick">&#10003;</span>' : ''}
                    </span>
                  </a>
                </li>`;
            })
            .join('')}
        </ol>
      </section>

      <section class="keeping">
        <h2>Your progress</h2>
        <p>
          Foothold has no accounts and no server, so your progress lives in this
          browser only. Export it to a file if you want it on another machine,
          or as a backup before clearing your browser data.
        </p>
        <div class="keeping-actions">
          <button class="btn btn-quiet js-export">Export progress</button>
          <button class="btn btn-quiet js-import">Import progress</button>
          <a class="btn btn-quiet" href="#/certificate">Certificate</a>
          <button class="btn btn-danger js-reset">Erase everything</button>
        </div>
        <input type="file" accept="application/json,.json" class="js-file" hidden>
      </section>
    </div>
  `;

  // A working prompt, right there in the hero. Every other claim on this page
  // is something the reader has to take on trust; this one they can test by
  // typing 2 + 2 before they have clicked anything.
  new Terminal(mount.querySelector('.js-hero-terminal'));

  mount.querySelector('.js-export').addEventListener('click', onExport);
  mount.querySelector('.js-reset').addEventListener('click', onReset);

  const file = mount.querySelector('.js-file');
  mount.querySelector('.js-import').addEventListener('click', () => file.click());
  file.addEventListener('change', () => {
    const chosen = file.files?.[0];
    if (chosen) onImport(chosen);
    file.value = '';
  });
}
