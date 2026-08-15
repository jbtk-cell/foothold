/**
 * The code editor.
 *
 * A transparent <textarea> sits exactly on top of a syntax-highlighted <pre>.
 * The learner types into the textarea and sees the <pre>. This is an old
 * trick and it has one enormous advantage over a custom-rendered editor: the
 * textarea is a real textarea, so text selection, spellcheck-off, undo/redo,
 * accessibility, mobile keyboards, and IME input all behave the way the
 * operating system says they should, for free.
 *
 * The two layers must share font, size, line height, padding and wrapping
 * exactly or the illusion breaks, which is why those live in one CSS block
 * and not scattered around.
 */

import { highlightPython } from './highlight.js';

const INDENT = '    ';
const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
const CLOSERS = new Set([')', ']', '}', '"', "'"]);

export class Editor extends EventTarget {
  constructor(container, { value = '', onRun = null } = {}) {
    super();
    this.container = container;
    this.onRun = onRun;

    container.classList.add('editor');
    container.innerHTML = `
      <div class="editor-gutter" aria-hidden="true"></div>
      <div class="editor-surface">
        <pre class="editor-highlight" aria-hidden="true"><code></code></pre>
        <textarea class="editor-input" spellcheck="false" autocapitalize="off"
                  autocomplete="off" autocorrect="off" wrap="off"
                  aria-label="Code editor"></textarea>
      </div>
    `;

    this.gutter = container.querySelector('.editor-gutter');
    this.highlight = container.querySelector('.editor-highlight code');
    this.input = container.querySelector('.editor-input');
    this.surface = container.querySelector('.editor-surface');

    this.input.value = value;
    this.bind();
    this.render();
  }

  get value() {
    return this.input.value;
  }

  set value(next) {
    this.input.value = next;
    this.render();
  }

  focus() {
    this.input.focus();
  }

  bind() {
    this.input.addEventListener('input', () => {
      this.render();
      this.dispatchEvent(new CustomEvent('change', { detail: this.value }));
    });

    this.input.addEventListener('scroll', () => this.syncScroll());
    this.input.addEventListener('keydown', (event) => this.onKeyDown(event));
  }

  syncScroll() {
    this.highlight.parentElement.scrollTop = this.input.scrollTop;
    this.highlight.parentElement.scrollLeft = this.input.scrollLeft;
    this.gutter.scrollTop = this.input.scrollTop;
  }

  render() {
    const text = this.input.value;
    // The trailing newline matters: without a character after it the <pre>
    // is one line shorter than the textarea and the two drift apart.
    this.highlight.innerHTML = highlightPython(text) + '\n';

    const lines = text.split('\n').length;
    if (this.gutterLines !== lines) {
      this.gutterLines = lines;
      this.gutter.innerHTML = Array.from({ length: lines }, (_, i) => `<span>${i + 1}</span>`).join('');
    }
    this.syncScroll();
  }

  onKeyDown(event) {
    const meta = event.metaKey || event.ctrlKey;

    if (meta && event.key === 'Enter') {
      event.preventDefault();
      if (this.onRun) this.onRun();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) this.dedent();
      else this.indent();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.newline();
      return;
    }

    if (event.key === 'Backspace') {
      if (this.backspaceIndent()) event.preventDefault();
      return;
    }

    if (PAIRS[event.key] && this.input.selectionStart !== this.input.selectionEnd) {
      event.preventDefault();
      this.wrapSelection(event.key, PAIRS[event.key]);
      return;
    }

    if (PAIRS[event.key]) {
      // Skip over a closer we inserted ourselves rather than doubling it.
      const next = this.input.value[this.input.selectionStart];
      if (CLOSERS.has(event.key) && next === event.key) {
        event.preventDefault();
        this.setCursor(this.input.selectionStart + 1);
        return;
      }
      if (event.key === '"' || event.key === "'") {
        const before = this.input.value[this.input.selectionStart - 1] || '';
        if (/\w/.test(before)) return; // an apostrophe in a word, not a string
      }
      event.preventDefault();
      this.insert(event.key + PAIRS[event.key], 1);
      return;
    }

    if (CLOSERS.has(event.key)) {
      const next = this.input.value[this.input.selectionStart];
      if (next === event.key) {
        event.preventDefault();
        this.setCursor(this.input.selectionStart + 1);
      }
    }
  }

  /** Replace the selection, then place the cursor `back` characters from the end. */
  insert(text, back = 0) {
    const { selectionStart: start, selectionEnd: end, value } = this.input;
    this.input.value = value.slice(0, start) + text + value.slice(end);
    this.setCursor(start + text.length - back);
    this.afterEdit();
  }

  setCursor(position) {
    this.input.selectionStart = position;
    this.input.selectionEnd = position;
  }

  afterEdit() {
    this.render();
    this.dispatchEvent(new CustomEvent('change', { detail: this.value }));
  }

  lineStart(position) {
    return this.input.value.lastIndexOf('\n', position - 1) + 1;
  }

  currentIndent(position) {
    const start = this.lineStart(position);
    const match = /^[ \t]*/.exec(this.input.value.slice(start));
    return match ? match[0] : '';
  }

  /**
   * Enter keeps the current indentation, and adds a level after a colon.
   *
   * Indentation is the single biggest source of early Python frustration, so
   * the editor does as much of it as it safely can while still letting the
   * learner see and control what happened.
   */
  newline() {
    const position = this.input.selectionStart;
    const value = this.input.value;
    const lineStart = this.lineStart(position);
    const line = value.slice(lineStart, position);
    let indent = this.currentIndent(position);

    if (/:\s*$/.test(line)) indent += INDENT;
    else if (/^\s*(return|pass|break|continue|raise)\b/.test(line) && indent.length >= INDENT.length) {
      indent = indent.slice(0, -INDENT.length);
    }

    const closer = value[position];
    if (closer && ')]}'.includes(closer) && /:\s*$/.test(line) === false && indent.length >= INDENT.length) {
      // Splitting a bracket pair: put the closer on its own line.
      this.insert(`\n${indent}\n${indent.slice(0, -INDENT.length)}`, indent.length - INDENT.length + 1);
      return;
    }

    this.insert(`\n${indent}`);
  }

  indent() {
    const { selectionStart: start, selectionEnd: end } = this.input;
    if (start === end) {
      this.insert(INDENT);
      return;
    }
    this.shiftLines((line) => INDENT + line);
  }

  dedent() {
    const { selectionStart: start, selectionEnd: end } = this.input;
    if (start === end) {
      const lineStart = this.lineStart(start);
      const before = this.input.value.slice(lineStart, start);
      if (/^\s+$/.test(before) && before.length >= INDENT.length) {
        const value = this.input.value;
        this.input.value = value.slice(0, start - INDENT.length) + value.slice(start);
        this.setCursor(start - INDENT.length);
        this.afterEdit();
      }
      return;
    }
    this.shiftLines((line) => (line.startsWith(INDENT) ? line.slice(INDENT.length) : line.replace(/^\s+/, '')));
  }

  shiftLines(transform) {
    const { selectionStart: start, selectionEnd: end, value } = this.input;
    const from = this.lineStart(start);
    const toEnd = value.indexOf('\n', end);
    const to = toEnd === -1 ? value.length : toEnd;

    const block = value.slice(from, to).split('\n').map(transform).join('\n');
    this.input.value = value.slice(0, from) + block + value.slice(to);
    this.input.selectionStart = from;
    this.input.selectionEnd = from + block.length;
    this.afterEdit();
  }

  wrapSelection(open, close) {
    const { selectionStart: start, selectionEnd: end, value } = this.input;
    const selected = value.slice(start, end);
    this.input.value = value.slice(0, start) + open + selected + close + value.slice(end);
    this.input.selectionStart = start + 1;
    this.input.selectionEnd = end + 1;
    this.afterEdit();
  }

  /** Backspace at the start of an indented line removes a whole indent level. */
  backspaceIndent() {
    const { selectionStart: start, selectionEnd: end, value } = this.input;
    if (start !== end || start === 0) return false;

    const lineStart = this.lineStart(start);
    const before = value.slice(lineStart, start);
    if (!/^ +$/.test(before) || before.length % INDENT.length !== 0) return false;

    this.input.value = value.slice(0, start - INDENT.length) + value.slice(start);
    this.setCursor(start - INDENT.length);
    this.afterEdit();
    return true;
  }
}
