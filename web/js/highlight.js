/**
 * A small Python tokenizer, used for syntax colouring in the editor, the
 * terminal, and every code block in a lesson.
 *
 * Foothold pulls in no libraries for this on purpose. The whole site has to
 * work from a folder on disk with no build step and no network, so a hundred
 * lines of tokenizer is a better trade than a dependency. It only has to be
 * good enough to colour beginner Python, and it is.
 */

const KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'match',
  'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with',
  'yield', 'case',
]);

const BUILTINS = new Set([
  'abs', 'all', 'any', 'bool', 'chr', 'dict', 'dir', 'divmod', 'enumerate',
  'filter', 'float', 'format', 'frozenset', 'getattr', 'hasattr', 'hash',
  'help', 'hex', 'id', 'input', 'int', 'isinstance', 'issubclass', 'iter',
  'len', 'list', 'map', 'max', 'min', 'next', 'object', 'oct', 'open', 'ord',
  'pow', 'print', 'range', 'repr', 'reversed', 'round', 'set', 'setattr',
  'slice', 'sorted', 'str', 'sum', 'super', 'tuple', 'type', 'zip',
  'Exception', 'ValueError', 'TypeError', 'NameError', 'IndexError',
  'KeyError', 'ZeroDivisionError', 'AttributeError', 'FileNotFoundError',
  'RuntimeError', 'StopIteration', 'SyntaxError',
]);

// Ordered: the first pattern that matches at the cursor wins, so comments and
// strings must come before anything that could match inside them.
const RULES = [
  ['comment', /#[^\n]*/y],
  ['string', /(?:[rRbBuUfF]{0,3})(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$))/y],
  ['string', /(?:[rRbBuUfF]{0,3})(?:"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)/y],
  ['number', /(?:0[xXbBoO][0-9a-fA-F_]+|(?:\d[\d_]*)?\.?\d[\d_]*(?:[eE][+-]?\d+)?j?)/y],
  ['name', /[A-Za-z_]\w*/y],
  ['operator', /[+\-*/%@&|^~<>!=]+|:=/y],
  ['punct', /[()[\]{},:;.]/y],
  ['space', /\s+/y],
  ['other', /[\s\S]/y],
];

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

export function escapeHtml(text) {
  return String(text).replace(/[&<>]/g, (character) => ESCAPES[character]);
}

/** Split Python source into `{ kind, text }` tokens. */
export function tokenize(source) {
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    let matched = false;

    for (const [kind, pattern] of RULES) {
      pattern.lastIndex = index;
      const match = pattern.exec(source);
      if (!match || match.index !== index || match[0] === '') continue;

      let resolved = kind;
      if (kind === 'name') {
        const word = match[0];
        if (KEYWORDS.has(word)) {
          resolved = 'keyword';
        } else if (BUILTINS.has(word)) {
          resolved = 'builtin';
        } else if (source[index - 1] === '.') {
          resolved = 'attr';
        } else if (/^\s*\(/.test(source.slice(index + word.length))) {
          resolved = 'call';
        } else if (/(?:^|\n)\s*(?:def|class)\s+$/.test(source.slice(0, index))) {
          resolved = 'defname';
        }
      }

      tokens.push({ kind: resolved, text: match[0] });
      index = pattern.lastIndex;
      matched = true;
      break;
    }

    if (!matched) {
      tokens.push({ kind: 'other', text: source[index] });
      index += 1;
    }
  }

  return tokens;
}

/** Python source as HTML with `<span class="tok-*">` around each token. */
export function highlightPython(source) {
  let html = '';
  for (const { kind, text } of tokenize(source)) {
    const escaped = escapeHtml(text);
    html += kind === 'space' || kind === 'other' ? escaped : `<span class="tok-${kind}">${escaped}</span>`;
  }
  return html;
}

/**
 * Colour a captured traceback or program output.
 *
 * Output is not Python, so it gets a much simpler treatment: error lines are
 * marked so the eye lands on them, everything else is left alone.
 */
export function highlightOutput(text) {
  return escapeHtml(text)
    .replace(
      /^([A-Za-z_]*(?:Error|Exception|Warning|Interrupt)(?:.*)?)$/gm,
      '<span class="tok-error">$1</span>',
    )
    .replace(/^(\s*line \d+.*)$/gm, '<span class="tok-trace">$1</span>')
    .replace(/(\^+)$/gm, '<span class="tok-caret">$1</span>');
}
