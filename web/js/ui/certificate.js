/**
 * A certificate a learner can print when they finish.
 *
 * It is deliberately honest about what it is. Foothold has no server, so it
 * cannot verify anything; the certificate records what this browser saw you
 * complete, and it says exactly that on its face. A credential that overclaims
 * is worth less than one that is straight with you.
 */

import { escapeHtml } from '../highlight.js';
import { progress } from '../state.js';

function formatDate(iso) {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function renderCertificate(mount, manifest) {
  const stats = progress.stats(manifest);
  const finished = stats.done === stats.total;
  const name = progress.settings.name || '';

  const completedDates = Object.values(progress.data.completed).sort();
  const lastDate = completedDates[completedDates.length - 1];

  mount.innerHTML = `
    <div class="certificate-page">
      ${
        finished
          ? ''
          : `<div class="notice">
               <p><strong>${stats.total - stats.done} lessons to go.</strong>
               You can print this now if you like, but it will say so.</p>
             </div>`
      }

      <label class="cert-name-field">
        Name on the certificate
        <input class="js-cert-name" value="${escapeHtml(name)}" placeholder="Your name" maxlength="60">
      </label>

      <article class="certificate" id="certificate">
        <header>
          <p class="cert-mark">FOOTHOLD</p>
          <p class="cert-kind">Certificate of Completion</p>
        </header>

        <p class="cert-lead">This records that</p>
        <p class="cert-name js-cert-display">${escapeHtml(name || 'Your name here')}</p>
        <p class="cert-lead">completed</p>
        <p class="cert-course">${stats.done} of ${stats.total} lessons of Python Foundations</p>

        <div class="cert-modules">
          ${manifest.modules
            .map((module) => {
              const done = stats.perModule[module.slug];
              return `<span class="cert-module ${done.done === done.total ? 'is-done' : ''}">
                        ${escapeHtml(module.title)} <b>${done.done}/${done.total}</b>
                      </span>`;
            })
            .join('')}
        </div>

        <footer>
          <p class="cert-date">${formatDate(lastDate)}</p>
          <p class="cert-fine">
            Foothold is a free, open source course. It has no server and no accounts,
            so this certificate is a record of what this browser observed, not a
            verified credential. The work, however, was really yours: every lesson
            above was passed by running your own code against its tests.
          </p>
        </footer>
      </article>

      <div class="cert-actions">
        <button class="btn btn-primary js-print">Print or save as PDF</button>
        <a class="btn btn-quiet" href="#/">Back to the course</a>
      </div>
    </div>
  `;

  const field = mount.querySelector('.js-cert-name');
  const display = mount.querySelector('.js-cert-display');
  field.addEventListener('input', () => {
    display.textContent = field.value || 'Your name here';
    progress.settings.name = field.value;
    progress.saveSettings();
  });

  mount.querySelector('.js-print').addEventListener('click', () => window.print());
}
