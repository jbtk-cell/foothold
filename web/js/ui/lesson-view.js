/**
 * The lesson screen: explanation on the left, a place to work on the right.
 *
 * The interesting part is `runInteractively`. A browser worker cannot pause
 * mid-execution to wait for a keystroke, so when a program calls input() and
 * we have nothing to give it, we ask the learner for that one line and run the
 * whole program again from the top with the answer appended. Programs at this
 * level are short and have no side effects outside their own output, so the
 * re-run is invisible, and what the learner sees is a program that asks
 * questions one at a time - exactly like a terminal.
 */

import { renderMarkdown } from '../markdown.js';
import { escapeHtml, highlightPython, highlightOutput } from '../highlight.js';
import { Editor } from '../editor.js';
import { Terminal } from './terminal.js';
import { TracePanel } from './trace.js';
import { runtime } from '../runtime.js';
import { progress } from '../state.js';

const MAX_INPUT_ROUNDS = 200;

export class LessonView {
  constructor({ mount, moduleMeta, lesson, onComplete, onNavigate }) {
    this.mount = mount;
    this.moduleMeta = moduleMeta;
    this.lesson = lesson;
    this.onComplete = onComplete;
    this.onNavigate = onNavigate;
    this.stdin = '';
    this.inputRounds = 0;
    this.render();
  }

  get key() {
    return { module: this.moduleMeta.slug, lesson: this.lesson.slug };
  }

  render() {
    const { lesson } = this;
    const done = progress.isComplete(this.moduleMeta.slug, lesson.slug);

    this.mount.innerHTML = `
      <div class="lesson">
        <section class="lesson-prose" aria-label="Lesson">
          <header class="lesson-head">
            <p class="lesson-crumb">${escapeHtml(this.moduleMeta.title)}</p>
            <h1>${escapeHtml(lesson.title)}</h1>
            ${lesson.goal ? `<p class="lesson-goal">${escapeHtml(lesson.goal)}</p>` : ''}
            <p class="lesson-meta">
              <span class="badge ${done ? 'badge-done' : ''}">${done ? 'Completed' : `About ${lesson.estimate} min`}</span>
              ${lesson.concepts.map((c) => `<span class="chip">${escapeHtml(c)}</span>`).join('')}
            </p>
          </header>
          <div class="prose">${renderMarkdown(lesson.prose)}</div>
          <div class="hints" hidden>
            <h2>Hints</h2>
            <div class="hint-list"></div>
          </div>
          <footer class="lesson-foot">
            <button class="btn btn-quiet js-hint">
              Stuck? Show a hint <span class="hint-count"></span>
            </button>
            <button class="btn btn-quiet js-solution">Show the answer</button>
          </footer>
        </section>

        <section class="workbench" aria-label="Your code">
          <div class="workbench-bar">
            <button class="btn btn-primary js-run" title="Run your program (Ctrl+Enter)">
              <span class="glyph">&#9654;</span> Run
            </button>
            <button class="btn btn-check js-check" title="Check your answer">
              <span class="glyph">&#10003;</span> Check
            </button>
            <button class="btn btn-quiet js-reset" title="Start this exercise over">Reset</button>
            <span class="workbench-status js-status" role="status"></span>
          </div>

          <div class="editor-wrap js-editor"></div>

          <div class="panes">
            <div class="pane-tabs" role="tablist">
              <button class="pane-tab is-active" role="tab" data-pane="output">Output</button>
              <button class="pane-tab" role="tab" data-pane="tests">
                Checks <span class="tab-badge js-tests-badge"></span>
              </button>
              <button class="pane-tab" role="tab" data-pane="trace">
                Trace <span class="tab-new">new</span>
              </button>
              <button class="pane-tab" role="tab" data-pane="terminal">Terminal</button>
            </div>
            <div class="pane is-active" data-pane="output">
              <div class="console js-console"><p class="console-empty">Press Run to see what your program does.</p></div>
            </div>
            <div class="pane" data-pane="tests">
              <div class="checks js-checks"><p class="console-empty">Press Check when you think it is right.</p></div>
            </div>
            <div class="pane" data-pane="trace">
              <div class="js-trace"></div>
            </div>
            <div class="pane" data-pane="terminal">
              <div class="js-terminal"></div>
            </div>
          </div>
        </section>
      </div>
    `;

    const saved = progress.draft(this.moduleMeta.slug, lesson.slug);
    this.editor = new Editor(this.mount.querySelector('.js-editor'), {
      value: saved ?? lesson.starter,
      onRun: () => this.run(),
    });
    this.editor.addEventListener('change', () => {
      progress.saveDraft(this.moduleMeta.slug, lesson.slug, this.editor.value);
    });

    this.consoleEl = this.mount.querySelector('.js-console');
    this.checksEl = this.mount.querySelector('.js-checks');
    this.statusEl = this.mount.querySelector('.js-status');
    this.testsBadge = this.mount.querySelector('.js-tests-badge');

    this.terminal = new Terminal(this.mount.querySelector('.js-terminal'));
    this.trace = new TracePanel(this.mount.querySelector('.js-trace'), {
      editor: this.editor,
      getCode: () => this.editor.value,
      getStdin: () => this.lesson.stdin,
    });

    this.bind();
    this.renderHints();
    this.decorateProseCode();
  }

  bind() {
    this.mount.querySelector('.js-run').addEventListener('click', () => this.run());
    this.mount.querySelector('.js-check').addEventListener('click', () => this.check());
    this.mount.querySelector('.js-reset').addEventListener('click', () => this.resetExercise());
    this.mount.querySelector('.js-hint').addEventListener('click', () => this.showHint());
    this.mount.querySelector('.js-solution').addEventListener('click', () => this.showSolution());

    for (const tab of this.mount.querySelectorAll('.pane-tab')) {
      tab.addEventListener('click', () => this.showPane(tab.dataset.pane));
    }
  }

  showPane(name) {
    for (const tab of this.mount.querySelectorAll('.pane-tab')) {
      tab.classList.toggle('is-active', tab.dataset.pane === name);
    }
    for (const pane of this.mount.querySelectorAll('.pane')) {
      pane.classList.toggle('is-active', pane.dataset.pane === name);
    }
    if (name === 'terminal') this.terminal.focus();
    // The executing-line highlight belongs to the trace. Leaving it behind
    // while the learner edits would point at a line that no longer exists.
    if (name !== 'trace') this.trace?.clear();
  }

  /** Give every example in the prose a button that drops it into the terminal. */
  decorateProseCode() {
    for (const figure of this.mount.querySelectorAll('.prose-code')) {
      const language = figure.dataset.language;
      if (language !== 'python' && language !== 'py') continue;

      const code = figure.querySelector('code').textContent;
      const button = document.createElement('button');
      button.className = 'btn btn-tiny code-run';
      button.textContent = 'Try it';
      button.title = 'Run this example in the terminal';
      button.addEventListener('click', async () => {
        this.showPane('terminal');
        await this.terminal.runSnippet(code.replace(/\n$/, ''));
      });
      figure.appendChild(button);
    }
  }

  setStatus(text, kind = '') {
    this.statusEl.textContent = text;
    this.statusEl.className = `workbench-status js-status ${kind}`;
  }

  // --- Running ------------------------------------------------------------

  async run() {
    this.showPane('output');
    this.stdin = '';
    this.inputRounds = 0;
    this.setStatus('Running...', 'is-busy');
    this.consoleEl.innerHTML = '<p class="console-empty">Running...</p>';
    await this.runInteractively();
  }

  async runInteractively() {
    let result;
    try {
      result = await runtime.run(this.editor.value, this.stdin);
    } catch (error) {
      this.renderConsole('', error.message, false);
      this.setStatus(error.code === 'TIMEOUT' ? 'Stopped' : 'Error', 'is-error');
      return;
    }

    if (result.needsInput && this.inputRounds < MAX_INPUT_ROUNDS) {
      this.inputRounds += 1;
      this.renderConsole(result.stdout, '', true, result.prompt);
      this.setStatus('Waiting for input', 'is-busy');
      return;
    }

    this.renderConsole(result.stdout, result.error, false);
    if (result.error) this.setStatus('Error', 'is-error');
    else this.setStatus('Ran without errors', 'is-ok');
  }

  renderConsole(stdout, error, awaitingInput, promptText = '') {
    const parts = [];

    if (stdout) {
      // The unfinished last line is the input prompt; it is shown on the
      // input row instead so it does not appear twice.
      const shown = awaitingInput ? stdout.slice(0, stdout.lastIndexOf('\n') + 1) : stdout;
      if (shown) parts.push(`<pre class="console-out">${escapeHtml(shown.replace(/\n$/, ''))}</pre>`);
    }

    if (error) parts.push(`<pre class="console-err">${highlightOutput(error)}</pre>`);

    if (!parts.length && !awaitingInput) {
      parts.push('<p class="console-empty">Your program ran and printed nothing.</p>');
    }

    if (awaitingInput) {
      parts.push(`
        <form class="console-ask">
          <label>
            <span class="console-ask-prompt">${escapeHtml(promptText || 'Input:')}</span>
            <input class="console-ask-input" aria-label="Program input" autocomplete="off" spellcheck="false">
          </label>
          <button class="btn btn-tiny" type="submit">Enter</button>
        </form>
      `);
    }

    this.consoleEl.innerHTML = parts.join('');

    if (awaitingInput) {
      const form = this.consoleEl.querySelector('.console-ask');
      const input = form.querySelector('.console-ask-input');
      input.focus();
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        this.stdin += `${input.value}\n`;
        await this.runInteractively();
      });
    }
  }

  // --- Checking -----------------------------------------------------------

  async check() {
    this.showPane('tests');
    this.setStatus('Checking...', 'is-busy');
    this.checksEl.innerHTML = '<p class="console-empty">Running the checks...</p>';

    let report;
    try {
      report = await runtime.grade(this.editor.value, this.lesson.tests, this.lesson.stdin);
    } catch (error) {
      this.checksEl.innerHTML = `<pre class="console-err">${highlightOutput(error.message)}</pre>`;
      this.setStatus(error.code === 'TIMEOUT' ? 'Stopped' : 'Error', 'is-error');
      return;
    }

    this.renderChecks(report);

    if (report.passed) {
      this.setStatus('Passed', 'is-ok');
      const first = progress.complete(this.moduleMeta.slug, this.lesson.slug);
      this.onComplete?.(first);
    } else {
      this.setStatus('Not yet', 'is-error');
    }
  }

  renderChecks(report) {
    const parts = [];

    if (report.error) {
      parts.push(
        '<div class="check-error"><h3>Your program did not finish</h3>' +
          `<pre class="console-err">${highlightOutput(report.error)}</pre></div>`,
      );
    }

    if (report.tests.length) {
      const passedCount = report.tests.filter((test) => test.passed).length;
      this.testsBadge.textContent = `${passedCount}/${report.tests.length}`;
      this.testsBadge.className = `tab-badge js-tests-badge ${passedCount === report.tests.length ? 'is-ok' : 'is-partial'}`;

      parts.push(
        '<ul class="check-list">' +
          report.tests
            .map(
              (test) => `
        <li class="check ${test.passed ? 'is-pass' : 'is-fail'}">
          <span class="check-mark">${test.passed ? '&#10003;' : '&#10007;'}</span>
          <div>
            <p class="check-name">${escapeHtml(test.name)}</p>
            ${test.message ? `<pre class="check-message">${escapeHtml(test.message)}</pre>` : ''}
          </div>
        </li>`,
            )
            .join('') +
          '</ul>',
      );
    }

    if (report.passed) {
      parts.push(`
        <div class="check-pass">
          <h3>That is correct.</h3>
          <p>${escapeHtml(this.lesson.goal || 'On to the next one.')}</p>
          <button class="btn btn-primary js-next">Next lesson &rarr;</button>
        </div>
      `);
      this.trace?.clear();
    } else {
      parts.push(`
        <div class="check-why">
          <p>Not sure where it went wrong? Watch it run, line by line, and see
             the moment a variable stops being what you expected.</p>
          <button class="btn js-why"><span class="glyph">&#9673;</span> Show me why</button>
        </div>
      `);
    }

    if (!report.passed && report.stdout) {
      parts.push(
        `<details class="check-output"><summary>What your program printed</summary>` +
          `<pre class="console-out">${escapeHtml(report.stdout.replace(/\n$/, ''))}</pre></details>`,
      );
    }

    this.checksEl.innerHTML = parts.join('');
    this.checksEl.querySelector('.js-next')?.addEventListener('click', () => this.onNavigate?.('next'));
    this.checksEl.querySelector('.js-why')?.addEventListener('click', () => {
      this.showPane('trace');
      this.trace.load({ jumpToEnd: true });
    });
  }

  // --- Help ---------------------------------------------------------------

  showHint() {
    const used = progress.useHint(this.moduleMeta.slug, this.lesson.slug);
    this.renderHints(Math.min(used, this.lesson.hints.length));
  }

  renderHints(count = progress.hintsUsed(this.moduleMeta.slug, this.lesson.slug)) {
    const shown = Math.min(count, this.lesson.hints.length);
    const wrap = this.mount.querySelector('.hints');
    const list = this.mount.querySelector('.hint-list');
    const button = this.mount.querySelector('.js-hint');
    const counter = this.mount.querySelector('.hint-count');

    wrap.hidden = shown === 0;
    list.innerHTML = this.lesson.hints
      .slice(0, shown)
      .map((hint, index) => `<div class="hint"><span class="hint-n">${index + 1}</span><div>${renderMarkdown(hint)}</div></div>`)
      .join('');

    counter.textContent = shown >= this.lesson.hints.length ? '' : `(${shown}/${this.lesson.hints.length})`;
    button.disabled = shown >= this.lesson.hints.length;
    button.firstChild.textContent =
      shown === 0 ? 'Stuck? Show a hint ' : shown >= this.lesson.hints.length ? 'No more hints ' : 'Show another hint ';
  }

  showSolution() {
    const already = progress.didRevealSolution(this.moduleMeta.slug, this.lesson.slug);
    if (!already) {
      const sure = window.confirm(
        'Seeing the answer is fine - but try one more time first. Struggling for a minute ' +
          'is where most of the learning happens.\n\nShow it anyway?',
      );
      if (!sure) return;
      progress.revealSolution(this.moduleMeta.slug, this.lesson.slug);
    }

    const panel = document.createElement('div');
    panel.className = 'solution';
    panel.innerHTML = `
      <h2>One way to do it</h2>
      <p>There is usually more than one right answer. Compare it with yours, then
         type it out rather than pasting - your hands remember what your eyes skim.</p>
      <figure class="prose-code"><pre><code>${highlightPython(this.lesson.solution)}</code></pre></figure>
      <button class="btn btn-quiet js-copy-solution">Put it in the editor</button>
    `;

    this.mount.querySelector('.lesson-foot').before(panel);
    this.mount.querySelector('.js-solution').disabled = true;
    panel.querySelector('.js-copy-solution').addEventListener('click', () => {
      this.editor.value = this.lesson.solution;
      progress.saveDraft(this.moduleMeta.slug, this.lesson.slug, this.lesson.solution);
      this.editor.focus();
    });
  }

  resetExercise() {
    if (!window.confirm('Replace your code with the original starter code?')) return;
    this.editor.value = this.lesson.starter;
    progress.clearDraft(this.moduleMeta.slug, this.lesson.slug);
    this.setStatus('');
    this.consoleEl.innerHTML = '<p class="console-empty">Press Run to see what your program does.</p>';
    this.checksEl.innerHTML = '<p class="console-empty">Press Check when you think it is right.</p>';
    this.testsBadge.textContent = '';
    this.editor.focus();
  }
}
