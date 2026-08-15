/**
 * The curriculum list down the left-hand side.
 *
 * It is the map of the whole course, always visible, so a learner can see
 * both how far they have come and how much is left. Modules collapse, the
 * current lesson is marked, and completed lessons carry a tick that persists
 * between visits.
 */

import { escapeHtml } from '../highlight.js';
import { progress } from '../state.js';

export class Sidebar {
  constructor(mount, manifest, { onSelect } = {}) {
    this.mount = mount;
    this.manifest = manifest;
    this.onSelect = onSelect;
    this.current = null;
    this.filter = '';
    this.render();
  }

  setCurrent(moduleSlug, lessonSlug) {
    this.current = moduleSlug ? { module: moduleSlug, lesson: lessonSlug } : null;
    this.render();
    this.mount.querySelector('.nav-lesson.is-current')?.scrollIntoView({ block: 'nearest' });
  }

  matches(module, lesson) {
    if (!this.filter) return true;
    const needle = this.filter.toLowerCase();
    return (
      lesson.title.toLowerCase().includes(needle) ||
      module.title.toLowerCase().includes(needle) ||
      (lesson.concepts || []).some((concept) => concept.toLowerCase().includes(needle))
    );
  }

  render() {
    const stats = progress.stats(this.manifest);

    const modules = this.manifest.modules
      .map((module, moduleIndex) => {
        const lessons = module.lessons.filter((lesson) => this.matches(module, lesson));
        if (!lessons.length) return '';

        const done = stats.perModule[module.slug];
        const isOpen = this.filter || this.current?.module === module.slug || done.done < done.total;

        return `
          <section class="nav-module ${isOpen ? 'is-open' : ''}">
            <button class="nav-module-head" aria-expanded="${isOpen}">
              <span class="nav-module-index">${String(moduleIndex + 1).padStart(2, '0')}</span>
              <span class="nav-module-title">${escapeHtml(module.title)}</span>
              <span class="nav-module-count ${done.done === done.total ? 'is-done' : ''}">
                ${done.done}/${done.total}
              </span>
            </button>
            <ul class="nav-lessons">
              ${lessons
                .map((lesson) => {
                  const complete = progress.isComplete(module.slug, lesson.slug);
                  const current =
                    this.current?.module === module.slug && this.current?.lesson === lesson.slug;
                  return `
                    <li>
                      <a class="nav-lesson ${complete ? 'is-done' : ''} ${current ? 'is-current' : ''}"
                         href="#/lesson/${module.slug}/${lesson.slug}">
                        <span class="nav-tick" aria-hidden="true">${complete ? '&#10003;' : '&#9675;'}</span>
                        <span class="nav-lesson-title">${escapeHtml(lesson.title)}</span>
                        <span class="nav-lesson-time">${lesson.estimate}m</span>
                      </a>
                    </li>`;
                })
                .join('')}
            </ul>
          </section>`;
      })
      .join('');

    this.mount.innerHTML = `
      <div class="nav-search">
        <input type="search" placeholder="Find a lesson" aria-label="Search lessons"
               value="${escapeHtml(this.filter)}" class="js-filter">
      </div>
      <div class="nav-progress">
        <div class="nav-progress-bar"><span style="width:${stats.percent}%"></span></div>
        <p>${stats.done} of ${stats.total} lessons done</p>
      </div>
      <nav class="nav-modules">${modules || '<p class="nav-empty">Nothing matches that.</p>'}</nav>
    `;

    const filterInput = this.mount.querySelector('.js-filter');
    filterInput.addEventListener('input', () => {
      const position = filterInput.selectionStart;
      this.filter = filterInput.value;
      this.render();
      const next = this.mount.querySelector('.js-filter');
      next.focus();
      next.setSelectionRange(position, position);
    });

    for (const head of this.mount.querySelectorAll('.nav-module-head')) {
      head.addEventListener('click', () => {
        const section = head.closest('.nav-module');
        const open = section.classList.toggle('is-open');
        head.setAttribute('aria-expanded', String(open));
      });
    }

    for (const link of this.mount.querySelectorAll('.nav-lesson')) {
      link.addEventListener('click', () => this.onSelect?.());
    }
  }
}
