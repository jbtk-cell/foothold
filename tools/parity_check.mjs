/**
 * Compare the browser's lesson parser against the Python one.
 *
 * tools/validate.py hands this script a JSON file of lessons already parsed by
 * tools/lesson.py. We re-parse the same Markdown with web/js/lesson.js and
 * diff the results. Any disagreement means a student's browser would see a
 * different lesson than CI validated, which is the one failure mode that
 * would let a broken exercise reach a learner.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const { parseLesson } = await import(resolve(here, '../web/js/lesson.js'));

const payloadPath = process.argv[2];
if (!payloadPath) {
  console.error('usage: node parity_check.mjs <payload.json>');
  process.exit(2);
}

const samples = JSON.parse(readFileSync(payloadPath, 'utf8'));
const problems = [];

for (const sample of samples) {
  let parsed;
  try {
    parsed = parseLesson(readFileSync(sample.path, 'utf8'), sample.slug);
  } catch (error) {
    problems.push(`${sample.slug}: the JavaScript parser threw: ${error.message}`);
    continue;
  }

  for (const [key, expected] of Object.entries(sample.expected)) {
    const actual = parsed[key];
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      problems.push(
        `${sample.slug}: field "${key}" differs between the Python and JavaScript parsers\n` +
          `    python:     ${JSON.stringify(expected).slice(0, 160)}\n` +
          `    javascript: ${JSON.stringify(actual).slice(0, 160)}`,
      );
    }
  }
}

if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

console.log(`${samples.length} lessons parse identically in Python and JavaScript.`);
