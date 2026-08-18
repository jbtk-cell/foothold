# Privacy

Foothold collects nothing. There is no analytics script, no tracking pixel, no
cookie, no account, and no server to send anything to. This page exists so that
a teacher or an IT administrator can check that claim quickly rather than
taking it on faith.

## What leaves the device

Two things, both on first load, neither carrying information about the person:

- **The site itself** from GitHub Pages: the page, the stylesheet, the
  JavaScript, and the lesson text. GitHub receives the request, as any web
  server does. Their statement covers what that means:
  <https://docs.github.com/site-policy/privacy-policies/github-privacy-statement>
- **The Python interpreter** from a CDN, the first time and never again. It is
  a static file. Foothold tries jsDelivr, then its Fastly and Gcore hostnames,
  then unpkg, and stops at the first that answers.

Nothing else. Code a learner writes, output it produces, answers it submits,
and the record of which lessons are finished stay in the browser.

To remove the CDN request entirely, run `./tools/vendor_pyodide.sh` and serve
the folder yourself. Foothold then makes no third-party request at all, which
is the arrangement a school with a filtered network usually wants anyway.

## What stays on the device

Two entries in the browser's `localStorage`:

| Key | Holds |
| --- | --- |
| `foothold.progress.v1` | which lessons are marked done |
| `foothold.settings.v1` | the light or dark theme choice |

Clearing site data removes both, and the course starts over. Nothing else is
stored: no history of the code written, no timings, no identifier of any kind.

## Code a learner writes

It is executed inside the page by CPython compiled to WebAssembly. It is never
uploaded, never logged, and never seen by anyone but the person who typed it.
This holds for exercises, the scratch terminal, and the trace.

## Children

Because nothing is collected, there is nothing to collect from a child. There
is no sign-up, no email field, and no way to enter a name. Foothold does not
know who is using it, and cannot be made to.

## Changes

Any change to this file appears in the commit history of a public repository,
so it can be diffed rather than trusted. Questions belong in an issue:
<https://github.com/jbtk-cell/foothold/issues>.
