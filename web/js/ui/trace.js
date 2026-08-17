/**
 * The Trace panel: scrub back and forth through your program's execution.
 *
 * This is the reason to use Foothold over any other course. A red cross tells
 * a beginner that they are wrong. It does not tell them where the number
 * stopped being what they expected, and that gap is where people give up.
 *
 * Drag the slider and three things move together: the highlighted line in the
 * editor, the table of variables, and the output collected so far. Watching
 * `total` fail to change on the pass through the loop where you expected it to
 * is a different kind of understanding from reading an assertion message.
 *
 * The rewind is honest. Every step holds a rendered snapshot taken at the time,
 * not a live reference, so stepping backwards shows what was true then.
 */

import { escapeHtml } from '../highlight.js';
import { runtime } from '../runtime.js';

const PLAY_MS = 260;

export class TracePanel {
  constructor(container, { editor, getCode, getStdin }) {
    this.container = container;
    this.editor = editor;
    this.getCode = getCode;
    this.getStdin = getStdin;
    this.steps = [];
    this.index = 0;
    this.timer = null;
    this.result = null;

    container.classList.add('trace');
    this.renderIdle();
  }

  renderIdle(message = '') {
    this.stop();
    this.container.innerHTML = `
      <div class="trace-idle">
        <p class="trace-idle-lead">Watch your program run, one line at a time.</p>
        <p class="trace-idle-sub">
          ${
            message ||
            'Every variable, every step, forwards and backwards. This is the fastest way to find out why something is not doing what you meant.'
          }
        </p>
        <button class="btn btn-primary js-trace-start">Trace this program</button>
      </div>
    `;
    this.container.querySelector('.js-trace-start').addEventListener('click', () => this.load());
  }

  async load({ jumpToEnd = false } = {}) {
    this.container.innerHTML = '<div class="trace-idle"><p class="trace-idle-sub">Recording every step...</p></div>';

    let result;
    try {
      result = await runtime.trace(this.getCode(), this.getStdin());
    } catch (error) {
      this.renderIdle(error.message);
      return;
    }

    this.result = result;

    if (result.needsInput) {
      this.renderIdle(
        `Your program asks for input (${result.prompt || 'a value'}), and the tracer cannot stop to ask. ` +
          'Run it once with the Run button to answer the questions, then trace it.',
      );
      return;
    }

    if (!result.steps.length) {
      this.renderIdle(
        result.error
          ? 'The program did not get far enough to trace. Fix the error shown in Output first.'
          : 'There was nothing to trace.',
      );
      return;
    }

    this.steps = result.steps;
    this.renderFrame();

    // Landing on the failure is the whole point when you arrive here from a
    // failed check, so jump to the exception if there was one.
    const blewUp = this.steps.findIndex((step) => step.event === 'exception');
    this.showStep(blewUp !== -1 ? blewUp : jumpToEnd ? this.steps.length - 1 : 0);
  }

  renderFrame() {
    const total = this.steps.length;
    this.container.innerHTML = `
      <div class="trace-bar">
        <button class="icon-btn js-first" title="First step" aria-label="First step">&#8676;</button>
        <button class="icon-btn js-prev" title="Previous step (left arrow)" aria-label="Previous step">&#9664;</button>
        <button class="icon-btn js-play" title="Play" aria-label="Play">&#9654;&#9654;</button>
        <button class="icon-btn js-next" title="Next step (right arrow)" aria-label="Next step">&#9654;</button>
        <button class="icon-btn js-last" title="Last step" aria-label="Last step">&#8677;</button>
        <input class="trace-slider js-slider" type="range" min="0" max="${total - 1}" value="0"
               aria-label="Step through the program">
        <span class="trace-count js-count"></span>
        <button class="btn btn-tiny btn-quiet js-retrace" title="Record again after editing">Re-trace</button>
      </div>

      ${
        this.result.stoppedEarly
          ? `<p class="trace-warn">This program runs for more than ${this.result.maxSteps} steps, so the
             recording stops there. Trace a smaller range to see the rest.</p>`
          : ''
      }

      <p class="trace-what js-what"></p>

      <div class="trace-body">
        <section class="trace-vars">
          <h4>Variables</h4>
          <div class="js-vars"></div>
        </section>
        <section class="trace-side">
          <h4>Output so far</h4>
          <pre class="trace-output js-output"></pre>
          <div class="js-stack"></div>
        </section>
      </div>
    `;

    this.slider = this.container.querySelector('.js-slider');
    this.countEl = this.container.querySelector('.js-count');
    this.whatEl = this.container.querySelector('.js-what');
    this.varsEl = this.container.querySelector('.js-vars');
    this.outputEl = this.container.querySelector('.js-output');
    this.stackEl = this.container.querySelector('.js-stack');
    this.playButton = this.container.querySelector('.js-play');

    this.slider.addEventListener('input', () => this.showStep(Number(this.slider.value)));
    this.container.querySelector('.js-first').addEventListener('click', () => this.showStep(0));
    this.container.querySelector('.js-last').addEventListener('click', () => this.showStep(this.steps.length - 1));
    this.container.querySelector('.js-prev').addEventListener('click', () => this.step(-1));
    this.container.querySelector('.js-next').addEventListener('click', () => this.step(1));
    this.playButton.addEventListener('click', () => this.togglePlay());
    this.container.querySelector('.js-retrace').addEventListener('click', () => this.load());

    this.container.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.step(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.step(1);
      }
    });
  }

  step(delta) {
    this.showStep(Math.min(Math.max(this.index + delta, 0), this.steps.length - 1));
  }

  togglePlay() {
    if (this.timer) {
      this.stop();
      return;
    }
    if (this.index >= this.steps.length - 1) this.showStep(0);
    this.playButton.innerHTML = '&#10074;&#10074;';
    this.playButton.title = 'Pause';
    this.timer = setInterval(() => {
      if (this.index >= this.steps.length - 1) {
        this.stop();
        return;
      }
      this.step(1);
    }, PLAY_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.playButton) {
      this.playButton.innerHTML = '&#9654;&#9654;';
      this.playButton.title = 'Play';
    }
  }

  showStep(index) {
    this.index = index;
    const step = this.steps[index];
    if (!step) return;

    this.slider.value = String(index);
    this.countEl.textContent = `${index + 1} / ${this.steps.length}`;
    this.editor.markLine(step.line);

    this.whatEl.innerHTML = this.describe(step);
    this.whatEl.className = `trace-what js-what is-${step.event}`;

    this.renderVariables(step, this.steps[index - 1]);

    const output = (this.result.stdout || '').slice(0, step.output);
    this.outputEl.textContent = output || '(nothing yet)';
    this.outputEl.classList.toggle('is-empty', !output);

    this.renderStack(step);
  }

  describe(step) {
    const where = step.function === 'your program' ? '' : ` in <b>${escapeHtml(step.function)}()</b>`;
    switch (step.event) {
      case 'call':
        return `About to run <b>${escapeHtml(step.function)}()</b>, called from line ${step.line}.`;
      case 'return':
        return 'returned' in step
          ? `<b>${escapeHtml(step.function)}()</b> hands back <code>${escapeHtml(step.returned.repr)}</code>.`
          : `Leaving <b>${escapeHtml(step.function)}</b>.`;
      case 'exception':
        return `Line ${step.line} raised <code>${escapeHtml(step.raised || 'an error')}</code>.`;
      default:
        return `About to run line ${step.line}${where}.`;
    }
  }

  renderVariables(step, previous) {
    const names = Object.keys(step.locals);
    if (!names.length) {
      this.varsEl.innerHTML = '<p class="trace-empty">No variables yet.</p>';
      return;
    }

    // Highlighting what moved is the whole value of a step-by-step view; a
    // static table of ten names makes the learner do the diffing themselves.
    const before = previous && previous.function === step.function ? previous.locals : {};

    this.varsEl.innerHTML = `
      <table class="trace-table">
        <tbody>
          ${names
            .map((name) => {
              const value = step.locals[name];
              const old = before[name];
              const isNew = !old;
              const changed = old && old.repr !== value.repr;
              const state = isNew ? 'is-new' : changed ? 'is-changed' : '';
              const size = value.size !== null && value.size !== undefined ? ` <span class="trace-size">${value.size}</span>` : '';
              return `
                <tr class="${state}">
                  <td class="trace-name">${escapeHtml(name)}</td>
                  <td class="trace-type">${escapeHtml(value.type)}${size}</td>
                  <td class="trace-value">${escapeHtml(value.repr)}${
                    changed ? `<span class="trace-was">was ${escapeHtml(old.repr)}</span>` : ''
                  }</td>
                </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    `;
  }

  renderStack(step) {
    if (!step.stack || step.stack.length <= 1) {
      this.stackEl.innerHTML = '';
      return;
    }
    this.stackEl.innerHTML = `
      <h4>Call stack</h4>
      <ol class="trace-stack">
        ${step.stack
          .map((name, depth) => `<li style="--depth:${depth}">${escapeHtml(name)}${depth ? '()' : ''}</li>`)
          .join('')}
      </ol>
    `;
  }

  clear() {
    this.stop();
    this.editor.markLine(null);
  }
}
