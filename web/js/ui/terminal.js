/**
 * The scratch terminal: a real Python prompt, always one tab away.
 *
 * Lessons teach by exercise, but the thing that turns a beginner into someone
 * who can teach themselves is having somewhere to just *try something*. This
 * is that somewhere. It keeps its namespace between lines, so a variable
 * defined ten minutes ago is still there.
 */

import { runtime } from '../runtime.js';
import { escapeHtml, highlightPython, highlightOutput } from '../highlight.js';

const BANNER = [
  'Python 3.14 running in your browser. Nothing here is sent anywhere.',
  'Type an expression and press Enter. Try:  2 + 2',
];

export class Terminal {
  constructor(container) {
    this.container = container;
    this.history = [];
    this.historyIndex = 0;
    this.pendingBlock = false;
    this.busy = false;
    this.warnedAboutBlocks = false;

    container.classList.add('terminal');
    container.innerHTML = `
      <div class="terminal-output" tabindex="0" role="log" aria-live="polite" aria-label="Terminal output"></div>
      <form class="terminal-inputline" autocomplete="off">
        <span class="terminal-prompt">&gt;&gt;&gt;</span>
        <input class="terminal-entry" spellcheck="false" autocapitalize="off"
               autocomplete="off" autocorrect="off" aria-label="Python prompt">
      </form>
    `;

    this.output = container.querySelector('.terminal-output');
    this.form = container.querySelector('.terminal-inputline');
    this.entry = container.querySelector('.terminal-entry');
    this.promptEl = container.querySelector('.terminal-prompt');

    for (const line of BANNER) this.write(line, 'banner');

    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submit();
    });

    this.entry.addEventListener('keydown', (event) => this.onKeyDown(event));
    this.output.addEventListener('click', () => {
      if (!window.getSelection().toString()) this.entry.focus();
    });
  }

  focus() {
    this.entry.focus();
  }

  write(text, kind = 'out') {
    if (text === '' && kind === 'out') return;
    const line = document.createElement('div');
    line.className = `terminal-line terminal-${kind}`;

    if (kind === 'echo') {
      line.innerHTML =
        `<span class="terminal-prompt">${this.pendingBlock ? '...' : '&gt;&gt;&gt;'}</span>` +
        `<span class="terminal-code">${highlightPython(text)}</span>`;
    } else if (kind === 'error') {
      line.innerHTML = highlightOutput(text.replace(/\n$/, ''));
    } else if (kind === 'out') {
      line.innerHTML = escapeHtml(text.replace(/\n$/, ''));
    } else {
      line.textContent = text;
    }

    this.output.appendChild(line);
    this.output.scrollTop = this.output.scrollHeight;
  }

  clear() {
    this.output.innerHTML = '';
  }

  /**
   * Accept a line and return a promise for when it has run.
   *
   * Lines are queued rather than dropped. Somebody typing quickly - or a
   * lesson example being replayed a line at a time - would otherwise lose
   * whatever they entered while the previous statement was still running,
   * and losing typed input is the kind of bug that makes a tool feel broken.
   */
  submit() {
    const line = this.entry.value;
    this.entry.value = '';

    if (line.trim() && this.history[this.history.length - 1] !== line) {
      this.history.push(line);
    }
    this.historyIndex = this.history.length;

    this.chain = (this.chain || Promise.resolve()).then(() => this.process(line));
    return this.chain;
  }

  async process(line) {
    this.write(line, 'echo');
    this.busy = true;

    try {
      const result = await runtime.push(line);

      if (result.status === 'more') {
        this.pendingBlock = true;
        this.promptEl.textContent = '...';
        // Only offer the indent if they have not started typing the next line
        // themselves; overwriting what someone is mid-way through is worse
        // than making them press space four times.
        if (!this.entry.value) this.entry.value = this.guessIndent(line);
        if (!this.warnedAboutBlocks) {
          this.warnedAboutBlocks = true;
          this.write('(block open - press Enter on an empty line to run it)', 'banner');
        }
      } else {
        this.pendingBlock = false;
        this.promptEl.innerHTML = '&gt;&gt;&gt;';
        if (result.output) this.write(result.output, result.error ? 'error' : 'out');
      }
    } catch (error) {
      this.pendingBlock = false;
      this.promptEl.innerHTML = '&gt;&gt;&gt;';
      this.write(error.message, 'error');
    } finally {
      this.busy = false;
      this.entry.focus();
    }
  }

  guessIndent(line) {
    const indent = (/^[ \t]*/.exec(line) || [''])[0];
    return /:\s*$/.test(line) ? `${indent}    ` : indent;
  }

  onKeyDown(event) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex -= 1;
        this.entry.value = this.history[this.historyIndex];
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex += 1;
        this.entry.value = this.history[this.historyIndex];
      } else {
        this.historyIndex = this.history.length;
        this.entry.value = '';
      }
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      this.complete();
      return;
    }

    if (event.key === 'l' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.clear();
      return;
    }

    if (event.key === 'c' && event.ctrlKey) {
      event.preventDefault();
      this.entry.value = '';
      this.pendingBlock = false;
      this.promptEl.innerHTML = '&gt;&gt;&gt;';
      this.write('KeyboardInterrupt', 'error');
    }
  }

  async complete() {
    const value = this.entry.value;
    const match = /[\w.]*$/.exec(value);
    const prefix = match ? match[0] : '';
    if (!prefix) return;

    // Tab-completion is a convenience. If the interpreter is busy, restarting,
    // or was never reachable, the useful behaviour is for Tab to do nothing.
    let names;
    try {
      names = await runtime.complete(prefix);
    } catch {
      return;
    }
    if (!names.length) return;

    if (names.length === 1) {
      this.entry.value = value.slice(0, value.length - prefix.length) + names[0];
      return;
    }

    const shared = names.reduce((accumulator, name) => {
      let index = 0;
      while (index < accumulator.length && accumulator[index] === name[index]) index += 1;
      return accumulator.slice(0, index);
    });

    if (shared.length > prefix.length) {
      this.entry.value = value.slice(0, value.length - prefix.length) + shared;
    }
    this.write(names.join('   '), 'banner');
  }

  /** Drop a snippet from a lesson into the prompt, line by line. */
  async runSnippet(code) {
    for (const line of code.split('\n')) {
      this.entry.value = line;
      // eslint-disable-next-line no-await-in-loop
      await this.submit();
    }
    // A trailing blank line closes any block the snippet left open, so an
    // example ending in a for-loop actually runs instead of sitting there.
    if (this.pendingBlock) {
      this.entry.value = '';
      await this.submit();
    }
  }

  async reset() {
    try {
      await runtime.resetConsole();
    } catch (error) {
      this.write(`The interpreter could not be reset: ${error.message}`, 'err');
      return;
    }
    this.clear();
    this.write('Interpreter reset. Every variable you defined is gone.', 'banner');
  }
}
