/**
 * Unit tests for the browser modules that have no DOM in them.
 *
 * The Markdown renderer and the syntax highlighter run on every lesson a
 * learner opens, and both are hand-written, so they get tested. Anything that
 * touches the DOM is covered by tools/smoke_test.mjs in a real browser
 * instead.
 *
 *   node tools/test_web.mjs
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const { renderMarkdown } = await import(resolve(here, '../web/js/markdown.js'));
const { highlightPython, tokenize, escapeHtml } = await import(resolve(here, '../web/js/highlight.js'));
const { parseLesson, parseFrontmatter } = await import(resolve(here, '../web/js/lesson.js'));

const failures = [];
let count = 0;

function check(label, condition, detail = '') {
  count += 1;
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    console.log(`  FAIL ${label}${detail ? `\n       ${detail}` : ''}`);
    failures.push(label);
  }
}

function group(name, body) {
  console.log(`\n${name}`);
  body();
}

group('markdown: block elements', () => {
  check('a paragraph becomes a p', renderMarkdown('hello there') === '<p>hello there</p>');

  const heading = renderMarkdown('## Your turn');
  check('a heading becomes an h2 with an id', heading === '<h2 id="your-turn">Your turn</h2>', heading);

  const list = renderMarkdown('- one\n- two');
  check('a bullet list becomes a ul', list === '<ul><li>one</li><li>two</li></ul>', list);

  const ordered = renderMarkdown('1. first\n2. second');
  check('a numbered list becomes an ol', ordered.startsWith('<ol>'), ordered);

  const quote = renderMarkdown('> a note');
  check('a blockquote nests its content', quote === '<blockquote><p>a note</p></blockquote>', quote);

  const table = renderMarkdown('| a | b |\n| --- | --- |\n| 1 | 2 |');
  check('a table renders with a header', table.includes('<th>a</th>') && table.includes('<td>2</td>'), table);

  check('a horizontal rule renders', renderMarkdown('---') === '<hr>');
});

group('markdown: inline', () => {
  check('bold works', renderMarkdown('**loud**') === '<p><strong>loud</strong></p>');
  check('italic works', renderMarkdown('an *emphasis* here').includes('<em>emphasis</em>'));

  const code = renderMarkdown('use `print()` here');
  check('inline code works', code === '<p>use <code>print()</code> here</p>', code);

  // The placeholder used for code spans must not collide with ordinary numbers.
  const numbers = renderMarkdown('there are 3 of them, use `x` and 12 more');
  check(
    'numbers in prose survive code-span extraction',
    numbers === '<p>there are 3 of them, use <code>x</code> and 12 more</p>',
    numbers,
  );

  const underscores = renderMarkdown('the name `total_price_here` is fine');
  check(
    'underscores inside code spans are left alone',
    underscores.includes('<code>total_price_here</code>'),
    underscores,
  );

  const link = renderMarkdown('[docs](https://example.com)');
  check('external links open in a new tab', link.includes('rel="noopener noreferrer"'), link);
});

group('markdown: safety', () => {
  const injected = renderMarkdown('<img src=x onerror="alert(1)">');
  check('raw html is escaped, not passed through', !injected.includes('<img'), injected);

  const scripted = renderMarkdown('<script>alert(1)</script>');
  check('script tags are escaped', !scripted.includes('<script>'), scripted);

  const inCode = renderMarkdown('```python\nprint("<b>")\n```');
  check('angle brackets inside code are escaped', inCode.includes('&lt;b&gt;'), inCode);
});

group('markdown: fenced code', () => {
  const block = renderMarkdown('```python\nprint("hi")\n```');
  check('a fence becomes a figure', block.startsWith('<figure class="prose-code"'), block);
  check('the language is recorded', block.includes('data-language="python"'), block);
  check('python is highlighted', block.includes('tok-string'), block);

  const plain = renderMarkdown('```\njust text\n```');
  check('an unlabelled fence is not highlighted', !plain.includes('tok-'), plain);
});

group('highlight: python tokens', () => {
  const kinds = (source) => tokenize(source).map((t) => t.kind);

  check('keywords are found', kinds('if x:').includes('keyword'));
  check('builtins are found', kinds('print(1)').includes('builtin'));
  check('strings are found', kinds('"hello"').includes('string'));
  check('f-strings are found', kinds('f"hi {name}"').includes('string'));
  check('triple-quoted strings are found', kinds('"""doc"""').includes('string'));
  check('comments are found', kinds('# note').includes('comment'));
  check('numbers are found', kinds('x = 42').includes('number'));

  check(
    'a keyword inside a string is not highlighted as a keyword',
    !kinds('"if not for"').includes('keyword'),
    JSON.stringify(tokenize('"if not for"')),
  );
  check(
    'code after a comment is not highlighted',
    kinds('# if x:').filter((k) => k === 'keyword').length === 0,
  );

  const roundTrip = (source) => tokenize(source).map((t) => t.text).join('');
  const samples = [
    'def f(x):\n    return x * 2\n',
    "s = 'it\\'s'\n# done\n",
    'total += 1  # count',
    'print(f"{a:.2f}")',
    'x = [1, 2, 3][0]',
    '"""\nunclosed',
  ];
  check(
    'tokenizing never loses or invents characters',
    samples.every((s) => roundTrip(s) === s),
    samples.find((s) => roundTrip(s) !== s),
  );

  check('output is escaped', highlightPython('a < b').includes('&lt;'));
  check('escapeHtml handles ampersands', escapeHtml('a & b') === 'a &amp; b');
});

group('lesson parser', () => {
  const source = [
    '---',
    'title: A Lesson',
    'estimate: 7',
    'concepts:',
    '  - one',
    '  - two',
    '---',
    '',
    'Some prose.',
    '',
    '```python starter',
    'x = 1',
    '```',
    '',
    '```python solution',
    'x = 2',
    '```',
    '',
    '```python tests',
    'def test_a():',
    '    assert True',
    '```',
    '',
    '```text hint',
    'first hint',
    '```',
    '',
    '```text hint',
    'second hint',
    '```',
    '',
  ].join('\n');

  const lesson = parseLesson(source, 'a-lesson');

  check('the title comes from the front matter', lesson.title === 'A Lesson');
  check('numbers are parsed as numbers', lesson.estimate === 7);
  check('lists are parsed', JSON.stringify(lesson.concepts) === '["one","two"]');
  check('the starter is extracted', lesson.starter === 'x = 1');
  check('the solution is extracted', lesson.solution === 'x = 2');
  check('the tests are extracted', lesson.tests.includes('def test_a'));
  check('hints accumulate in order', JSON.stringify(lesson.hints) === '["first hint","second hint"]');
  check('machine blocks are removed from the prose', lesson.prose === 'Some prose.', lesson.prose);

  const [meta] = parseFrontmatter('---\nflag: true\nname: "quoted"\n---\nbody');
  check('booleans are parsed', meta.flag === true);
  check('quotes are stripped', meta.name === 'quoted');

  const noFrontmatter = parseLesson('# Just a heading\n\nbody', 'x');
  check('a missing front matter falls back to the first heading', noFrontmatter.title === 'Just a heading');

  let threw = false;
  try {
    parseLesson('---\ntitle: x\n\nnever closed');
  } catch {
    threw = true;
  }
  check('unterminated front matter is an error', threw);
});

console.log(`\n${count - failures.length}/${count} checks passed.`);
if (failures.length) {
  console.log(`\nFailed: ${failures.join(', ')}`);
  process.exit(1);
}
