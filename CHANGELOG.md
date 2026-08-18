# Changelog

Notable changes to Foothold. Dates are the day the change reached the live
site.

## 1.0.0 - 2026-08-18

First public release. 60 lessons across 14 modules, roughly eight and a half
hours of work, every exercise graded by running it.

### Added

- A step-through debugger inside every exercise. A failed check offers
  **Show me why**, which drops you into a recording of your own program at the
  moment it went wrong.
- Real CPython 3.14, compiled to WebAssembly, running in a background thread
  so an infinite loop costs five seconds rather than the tab.
- Working `input()`, a scratch terminal whose namespace persists, and file
  exercises that run in a fresh scratch directory each time.
- Offline use. The whole curriculum is cached on first visit, and
  `tools/vendor_pyodide.sh` bundles the interpreter for networks that block
  CDNs entirely.
- Four sources for the interpreter, because jsDelivr is blocked across
  mainland China and on many school networks.

### Accessibility

- The code editor no longer traps keyboard focus. Escape then Tab leaves it,
  and the page says so.
- Every colour pair meets WCAG AA in both themes.
- Check results are announced with the reason they failed, not only the
  verdict.

### Infrastructure

- CI proves every reference solution passes its own tests and every starter
  fails them, using the same grading file the browser loads.
- The browser's lesson parser is diffed against the Python one on every push,
  so a learner cannot read a lesson differently from the validator that
  approved it.
