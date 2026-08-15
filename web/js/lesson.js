/**
 * The browser's copy of the lesson parser.
 *
 * This is a direct port of tools/lesson.py. The two must agree exactly, and
 * tools/validate.py enforces that on every lesson in CI, so if you change one
 * of them, change the other and run the validator.
 *
 * Why two parsers instead of a build step that emits JSON? Because a lesson
 * should be editable and previewable without a toolchain. A contributor edits
 * a Markdown file, refreshes the page, and sees their lesson.
 */

const ROLES = new Set(['starter', 'solution', 'tests', 'stdin', 'hint']);

const FENCE =
  /^(?<indent>[ \t]*)(?<ticks>`{3,})[ \t]*(?<info>[^\n]*)\n(?<body>[\s\S]*?)^\k<indent>\k<ticks>[ \t]*$/gm;

export class LessonError extends Error {}

function scalar(value) {
  if (value.length >= 2 && value[0] === value[value.length - 1] && (value[0] === '"' || value[0] === "'")) {
    return value.slice(1, -1);
  }
  const lowered = value.toLowerCase();
  if (lowered === 'true' || lowered === 'yes') return true;
  if (lowered === 'false' || lowered === 'no') return false;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  return value;
}

export function parseFrontmatter(text) {
  if (!text.startsWith('---')) return [{}, text];

  const end = text.indexOf('\n---', 3);
  if (end === -1) throw new LessonError('Front matter opened with --- but never closed.');

  const block = text.slice(3, end).replace(/^\n+|\n+$/g, '');
  const rest = text.slice(end + 4).replace(/^\n+/, '');

  const data = {};
  let listKey = null;

  for (const raw of block.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;

    if (line.trimStart().startsWith('- ') && listKey) {
      data[listKey].push(scalar(line.trimStart().slice(2).trim()));
      continue;
    }

    const colon = line.indexOf(':');
    if (colon === -1) throw new LessonError(`Cannot read front matter line: ${raw}`);

    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();

    if (!value) {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = scalar(value);
      listKey = null;
    }
  }

  return [data, rest];
}

function roleOf(info) {
  for (const word of info.replace(/,/g, ' ').split(/\s+/)) {
    if (ROLES.has(word.toLowerCase())) return word.toLowerCase();
  }
  return null;
}

function dedent(content, indent) {
  if (!indent) return content;
  return content
    .split('\n')
    .map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line))
    .join('\n');
}

function firstHeading(prose) {
  const match = /^#\s+(.+)$/m.exec(prose);
  return match ? match[1].trim() : null;
}

export function parseLesson(text, slug = '') {
  const [meta, body] = parseFrontmatter(text);

  const blocks = { hint: [] };
  const proseParts = [];
  let cursor = 0;

  FENCE.lastIndex = 0;
  let match;
  while ((match = FENCE.exec(body)) !== null) {
    const { indent, info, body: inner } = match.groups;
    const role = roleOf(info.trim());
    if (role === null) continue;

    proseParts.push(body.slice(cursor, match.index));
    cursor = match.index + match[0].length;

    const content = dedent(inner, indent).replace(/\n+$/, '');

    if (role === 'hint') {
      blocks.hint.push(content.trim());
    } else if (role in blocks) {
      throw new LessonError(`Lesson has more than one \`${role}\` block.`);
    } else {
      blocks[role] = content;
    }
  }

  proseParts.push(body.slice(cursor));
  const prose = proseParts.join('').trim();

  return {
    slug,
    title: meta.title || firstHeading(prose) || slug,
    goal: meta.goal || '',
    estimate: meta.estimate === undefined ? 5 : meta.estimate,
    concepts: meta.concepts || [],
    starterPasses: Boolean(meta.starter_passes),
    starterBroken: Boolean(meta.starter_broken),
    prose,
    starter: blocks.starter || '',
    solution: blocks.solution || '',
    tests: blocks.tests || '',
    stdin: blocks.stdin || '',
    hints: blocks.hint,
  };
}
