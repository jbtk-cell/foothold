/**
 * The front page shows the product working instead of describing it.
 *
 * A four-line program plays on a loop: the line being executed lights up, the
 * variables update beside it, the output builds underneath. Anyone who has
 * wondered what "step through your code" means gets the answer in about four
 * seconds, without clicking anything.
 *
 * It runs the real tracer on the real interpreter, so what plays here is
 * exactly what the learner gets inside a lesson. Faking it with a hardcoded
 * animation would be easier and would be lying.
 */

import { escapeHtml, highlightPython } from '../highlight.js';
import { runtime } from '../runtime.js';

const PROGRAM = `basket = ["apple", "pear"]
total = 0
for fruit in basket:
    total = total + len(fruit)
print(total)`;

const FRAME_MS = 720;
const HOLD_AT_END_MS = 2000;

export class HeroTrace {
  constructor(container) {
    this.container = container;
    this.steps = [];
    this.index = 0;
    this.timer = null;
    this.paused = false;

    container.classList.add('hero-trace');
    this.render();
    this.start();
  }

  render() {
    const lines = PROGRAM.split('\n');
    this.container.innerHTML = `
      <div class="hero-trace-head">
        <span class="hero-trace-dot"></span>
        <span class="hero-trace-label">python 3.14, running here, one line at a time</span>
        <button class="hero-trace-toggle js-toggle" aria-label="Pause the demonstration">pause</button>
      </div>

      <div class="hero-trace-body">
        <ol class="hero-code js-code">
          ${lines
            .map(
              (line, index) =>
                `<li data-line="${index + 1}"><span class="hero-code-n">${index + 1}</span><span class="hero-code-t">${
                  highlightPython(line) || '&nbsp;'
                }</span></li>`,
            )
            .join('')}
        </ol>

        <div class="hero-watch">
          <p class="hero-watch-title">Variables</p>
          <table class="hero-vars js-vars"><tbody></tbody></table>
          <p class="hero-watch-title">Output</p>
          <pre class="hero-out js-out"></pre>
        </div>
      </div>

      <div class="hero-tape js-tape" aria-hidden="true"></div>
    `;

    this.codeEl = this.container.querySelector('.js-code');
    this.varsEl = this.container.querySelector('.js-vars tbody');
    this.outEl = this.container.querySelector('.js-out');
    this.tapeEl = this.container.querySelector('.js-tape');
    this.toggle = this.container.querySelector('.js-toggle');

    this.toggle.addEventListener('click', () => {
      this.paused = !this.paused;
      this.toggle.textContent = this.paused ? 'play' : 'pause';
      this.toggle.setAttribute(
        'aria-label',
        this.paused ? 'Play the demonstration' : 'Pause the demonstration',
      );
      if (!this.paused) this.tick();
    });
  }

  async start() {
    try {
      const result = await runtime.trace(PROGRAM);
      this.steps = result.steps.filter((step) => step.event === 'line');
      this.stdout = result.stdout || '';
    } catch {
      // The hero is decoration if the runtime will not start; the rest of the
      // page still works, so fail quietly rather than shouting at a visitor.
      this.container.classList.add('is-inert');
      return;
    }

    if (!this.steps.length) return;

    this.tapeEl.innerHTML = this.steps
      .map((_, index) => `<span class="hero-tape-tick" data-step="${index}"></span>`)
      .join('');

    // Someone who asked for less motion should get a static first frame, not
    // a loop they cannot stop.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.paused = true;
      this.toggle.textContent = 'play';
      this.show(0);
      return;
    }

    this.tick();
  }

  tick() {
    if (this.paused) return;
    this.show(this.index);

    const atEnd = this.index >= this.steps.length - 1;
    this.index = atEnd ? 0 : this.index + 1;

    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.tick(), atEnd ? HOLD_AT_END_MS : FRAME_MS);
  }

  show(index) {
    const step = this.steps[index];
    if (!step) return;

    for (const item of this.codeEl.children) {
      item.classList.toggle('is-on', Number(item.dataset.line) === step.line);
    }

    for (const tick of this.tapeEl.children) {
      tick.classList.toggle('is-done', Number(tick.dataset.step) <= index);
      tick.classList.toggle('is-now', Number(tick.dataset.step) === index);
    }

    const previous = index > 0 ? this.steps[index - 1].locals : {};
    const names = Object.keys(step.locals);

    this.varsEl.innerHTML = names.length
      ? names
          .map((name) => {
            const value = step.locals[name];
            const old = previous[name];
            const state = !old ? 'is-new' : old.repr !== value.repr ? 'is-changed' : '';
            return `<tr class="${state}"><td>${escapeHtml(name)}</td><td>${escapeHtml(value.repr)}</td></tr>`;
          })
          .join('')
      : '<tr class="is-empty"><td colspan="2">none yet</td></tr>';

    const printed = this.stdout.slice(0, step.output);
    this.outEl.textContent = printed || ' ';
  }

  destroy() {
    clearTimeout(this.timer);
  }
}
