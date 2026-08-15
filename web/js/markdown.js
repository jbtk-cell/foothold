/**
 * A Markdown renderer covering exactly what lessons are allowed to use.
 *
 * Headings, paragraphs, lists, blockquotes, tables, fenced code, and the
 * usual inline marks. Nothing else - and raw HTML in a lesson is escaped
 * rather than passed through, which keeps a pull request from a stranger
 * from being able to inject script into a learner's page.
 *
 * The rendered output stays deliberately plain; every code block becomes a
 * `<figure class="prose-code">` that the lesson view later decorates with a
 * Run button.
 */

import { escapeHtml, highlightPython } from './highlight.js';

const INLINE_CODE = /`([^`]+)`/g;

// A sentinel that cannot appear in lesson prose. Digits or punctuation would
// eventually collide with something a lesson actually says.
const MARK = '\u0091';

function renderInline(text) {
  // Code spans are pulled out first so that underscores and asterisks inside
  // them survive: `a_b_c` must stay `a_b_c`, not sprout an <em>.
  const codes = [];
  let working = text.replace(INLINE_CODE, (_, code) => {
    codes.push(code);
    return `${MARK}${codes.length - 1}${MARK}`;
  });

  working = escapeHtml(working);

  working = working
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => `<img src="${src}" alt="${alt}">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const external = /^https?:/.test(href);
      const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${href}"${attrs}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>');

  return working.replace(new RegExp(`${MARK}(\\d+)${MARK}`, 'g'), (_, index) =>
    `<code>${escapeHtml(codes[Number(index)])}</code>`);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function renderMarkdown(source) {
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let index = 0;

  const isBlank = (line) => !line || !line.trim();

  while (index < lines.length) {
    const line = lines[index];

    if (isBlank(line)) {
      index += 1;
      continue;
    }

    // Fenced code
    const fence = /^(\s*)(`{3,}|~{3,})\s*(.*)$/.exec(line);
    if (fence) {
      const [, indent, ticks, info] = fence;
      const body = [];
      index += 1;
      while (index < lines.length && !new RegExp(`^${indent}${ticks[0]}{${ticks.length},}\\s*$`).test(lines[index])) {
        body.push(lines[index].startsWith(indent) ? lines[index].slice(indent.length) : lines[index]);
        index += 1;
      }
      index += 1;
      const code = body.join('\n');
      const language = (info.split(/\s+/)[0] || '').toLowerCase();
      const isPython = language === 'python' || language === 'py' || language === '';
      const rendered = isPython && language ? highlightPython(code) : escapeHtml(code);
      out.push(
        `<figure class="prose-code" data-language="${escapeHtml(language || 'text')}">` +
          `<pre><code>${rendered}</code></pre></figure>`,
      );
      continue;
    }

    // Headings
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      out.push(`<h${level} id="${slugify(text)}">${renderInline(text)}</h${level}>`);
      index += 1;
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
      out.push('<hr>');
      index += 1;
      continue;
    }

    // Callout: > **Note** ... rendered as an aside
    if (/^\s*>/.test(line)) {
      const body = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        body.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      out.push(`<blockquote>${renderMarkdown(body.join('\n'))}</blockquote>`);
      continue;
    }

    // Tables
    if (/\|/.test(line) && index + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[index + 1])) {
      const header = splitRow(line);
      index += 2;
      const rows = [];
      while (index < lines.length && /\|/.test(lines[index]) && !isBlank(lines[index])) {
        rows.push(splitRow(lines[index]));
        index += 1;
      }
      out.push(
        '<div class="table-wrap"><table><thead><tr>' +
          header.map((cell) => `<th>${renderInline(cell)}</th>`).join('') +
          '</tr></thead><tbody>' +
          rows
            .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join('')}</tr>`)
            .join('') +
          '</tbody></table></div>',
      );
      continue;
    }

    // Lists
    const bullet = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (bullet) {
      const ordered = /\d/.test(bullet[2]);
      const items = [];
      const baseIndent = bullet[1].length;

      while (index < lines.length) {
        const itemMatch = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[index]);
        if (!itemMatch || itemMatch[1].length < baseIndent) break;

        const parts = [itemMatch[3]];
        index += 1;

        // Continuation lines: either indented, or a plain wrapped line.
        while (index < lines.length) {
          const next = lines[index];
          if (isBlank(next)) break;
          if (/^(\s*)([-*+]|\d+[.)])\s+/.test(next)) break;
          parts.push(next.trim());
          index += 1;
        }

        items.push(parts.join(' '));

        if (index < lines.length && isBlank(lines[index])) {
          const after = lines[index + 1];
          if (!after || !/^(\s*)([-*+]|\d+[.)])\s+/.test(after)) break;
          index += 1;
        }
      }

      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</${tag}>`);
      continue;
    }

    // Paragraph
    const paragraph = [];
    while (index < lines.length && !isBlank(lines[index])) {
      if (/^(\s*)(#{1,6})\s+/.test(lines[index]) && paragraph.length) break;
      if (/^(\s*)(`{3,}|~{3,})/.test(lines[index]) && paragraph.length) break;
      if (/^(\s*)([-*+]|\d+[.)])\s+/.test(lines[index]) && paragraph.length) break;
      if (/^\s*>/.test(lines[index]) && paragraph.length) break;
      paragraph.push(lines[index].trim());
      index += 1;
    }
    out.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
  }

  return out.join('\n');
}

function splitRow(line) {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((cell) => cell.trim());
}
