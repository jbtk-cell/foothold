# Security

## What Foothold is exposed to

There is no server and no account, so there is no database to breach and no
session to steal. Everything runs in the visitor's browser, and nothing a
learner writes is transmitted anywhere.

That leaves a smaller surface than most projects, and it is worth being
precise about what is on it:

- **Running the learner's code is the product, not a vulnerability.** Every
  exercise executes arbitrary Python inside Pyodide, which is CPython compiled
  to WebAssembly and confined by the browser's own sandbox. Code that prints
  something rude, loops forever, or exhausts memory is expected. A report that
  amounts to "I ran code and it ran" will be closed.
- **Escaping that sandbox is a real finding.** Reaching the page's DOM, the
  network, another origin, or anything on the visitor's disk from inside an
  exercise is a bug worth reporting.
- **The interpreter arrives over a CDN.** Foothold loads Pyodide from
  jsDelivr, with unpkg as a fallback. A compromise of either would be serious,
  which is one reason the offline bundle exists.
- **Lesson content is Markdown that the page renders.** Content that escapes
  the renderer and executes as script is a finding.

## Reporting something

Use GitHub's private vulnerability reporting on
<https://github.com/jbtk-cell/foothold/security/advisories/new>. It reaches the
maintainers without the report being public first.

If that is unavailable, open an issue describing the effect without the exact
steps, and say you have details to share privately.

Expect an acknowledgement within a week. This is a volunteer project, so a fix
may take longer than that; you will be told either way rather than left
waiting.

## Scope

In scope: this repository, and the site published from it at
<https://jbtk-cell.github.io/foothold/>.

Out of scope: Pyodide, CPython, GitHub Pages, and the CDNs. Report those to
their own maintainers, who will handle them better than we can.
