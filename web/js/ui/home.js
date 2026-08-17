/**
 * The front page.
 *
 * It opens with the product doing its job rather than a paragraph claiming it
 * does. The trace on the right is live: real interpreter, real recording, the
 * same one that runs inside a lesson.
 *
 * The specification block below it is written as a spec sheet on purpose. A
 * course that teaches people to read error messages should not sell itself in
 * marketing language.
 */

import { escapeHtml } from '../highlight.js';
import { progress } from '../state.js';
import { Terminal } from './terminal.js';
import { HeroTrace } from './hero-trace.js';

let live = { trace: null, terminal: null };

export function teardownHome() {
  live.trace?.destroy();
  live = { trace: null, terminal: null };
}

export function renderHome(mount, manifest, { onExport, onImport, onReset }) {
  teardownHome();

  const stats = progress.stats(manifest);
  const next = progress.nextLesson(manifest);
  const lessonCount = manifest.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const totalMinutes = manifest.modules.reduce(
    (sum, module) => sum + module.lessons.reduce((inner, lesson) => inner + (lesson.estimate || 5), 0),
    0,
  );
  const hours = Math.round(totalMinutes / 60);

  mount.innerHTML = `
    <div class="home">
      <section class="hero">
        <div class="hero-words">
          <h1>Watch your<br>code run.</h1>
          <p class="hero-sub">
            Foothold teaches Python from nothing, in ${lessonCount} lessons. When an
            exercise fails you can step back through your program a line at a
            time and find the moment a variable stopped holding what you meant.
          </p>
          <p class="hero-fact">
            It runs in this tab. Nothing you write is sent anywhere.
          </p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-large" href="${
              next ? `#/lesson/${next.module}/${next.lesson}` : '#/certificate'
            }">
              ${stats.done ? 'Continue' : 'Start lesson one'}
            </a>
            ${
              stats.done
                ? `<span class="hero-progress-inline">
                     <span class="nav-progress-bar"><span style="width:${stats.percent}%"></span></span>
                     <span>${stats.done} of ${stats.total}</span>
                   </span>`
                : `<a class="btn btn-quiet btn-large" href="#/lesson/${manifest.modules[0].slug}/${manifest.modules[0].lessons[0].slug}">
                     See lesson one
                   </a>`
            }
          </div>
        </div>

        <div class="hero-demo js-hero-trace"></div>
      </section>

      <section class="spec">
        <h2 class="rule">What it is</h2>
        <dl class="spec-list">
          <div><dt>Runtime</dt><dd>CPython 3.14, compiled to WebAssembly, running in a background thread of this page.</dd></div>
          <div><dt>Grading</dt><dd>Your code is executed against real tests. Any answer that works passes, including one nobody planned for.</dd></div>
          <div><dt>Debugger</dt><dd>Every exercise records each step it took. Scrub the slider and watch the variables move.</dd></div>
          <div><dt>Accounts</dt><dd>None. Progress is kept in this browser and exports to a file you own.</dd></div>
          <div><dt>Network</dt><dd>First visit only. After that the course is cached and works with the wifi off.</dd></div>
          <div><dt>Length</dt><dd>${lessonCount} lessons across ${manifest.modules.length} modules, roughly ${hours} hours.</dd></div>
          <div><dt>Licence</dt><dd>MIT. Fork it, teach with it, translate it.</dd></div>
        </dl>
      </section>

      <section class="modules">
        <h2 class="rule">The route</h2>
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
                      ${done.done}/${done.total}
                      ${complete ? '<span class="tick">&#10003;</span>' : ''}
                    </span>
                  </a>
                </li>`;
            })
            .join('')}
        </ol>
      </section>

      <section class="scratch">
        <h2 class="rule">Try something now</h2>
        <p class="scratch-lead">
          A Python prompt, with nothing riding on it. Type an expression and
          press Enter.
        </p>
        <div class="scratch-terminal js-scratch"></div>
      </section>

      <section class="keeping">
        <h2 class="rule">Your progress</h2>
        <p>
          Foothold has no server, so what you have finished lives in this
          browser. Export it to a file to move it to another machine, or to keep
          a copy before you clear your browsing data.
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

  live.trace = new HeroTrace(mount.querySelector('.js-hero-trace'));
  live.terminal = new Terminal(mount.querySelector('.js-scratch'));

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
