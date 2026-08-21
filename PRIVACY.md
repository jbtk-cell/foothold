# Privacy

Foothold collects nothing. There is no analytics script, no tracking pixel, no
cookie, no account, and no server to send anything to. This page exists so that
a teacher or an IT administrator can check that claim quickly rather than
taking it on faith.

## What leaves the device

Two things happen without being asked, both on first load, neither carrying
information about the person:

- **The site itself** from GitHub Pages: the page, the stylesheet, the
  JavaScript, and the lesson text. GitHub receives the request, as any web
  server does. Their statement covers what that means:
  <https://docs.github.com/site-policy/privacy-policies/github-privacy-statement>
- **The Python interpreter** from a CDN, the first time and never again. It is
  a static file. Foothold tries jsDelivr, then its Fastly and Gcore hostnames,
  then unpkg, and stops at the first that answers.

Nothing else happens on its own. Code a learner writes, output it produces,
answers it submits, and the record of which lessons are finished stay in the
browser. Two links can be followed on purpose, and only on purpose: the offer
to report a break, described below, and the "was this lesson wrong" link at the
foot of each lesson. Both open GitHub in a new tab and send nothing by
themselves.

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

## When the page breaks

If Foothold throws an error, a note appears in the corner offering to tell the
maintainers, with a button. Pressing the button opens GitHub's issue form in a
new tab with four things filled in: the error and where it happened, the
browser and operating system name, the stack trace, and the user-agent string.

Nothing is sent by pressing nothing. The note is built on the device, the
report is a link, and ignoring it or closing the tab transmits nothing. Even
after pressing, the issue form is a normal GitHub page that shows exactly what
would be posted and posts nothing until it is submitted.

The reason it works this way: a site with analytics finds out within the hour
that it is broken on some browser, and a site without them can go a year. The
learner is the messenger here, and only if they choose to be.

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
