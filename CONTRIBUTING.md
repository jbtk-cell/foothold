# Contributing to Foothold

The most valuable contribution is a lesson, or a fix to one that confused you.
If a lesson confused you, that is a bug in the lesson, not in you, and an issue
saying which sentence lost you is genuinely useful.

## What you need

Python 3.9 or newer. That is it. Node is only needed if you want to run the
JavaScript tests, and it is optional.

```bash
git clone https://github.com/jbtk-cell/foothold.git
cd foothold
./serve.sh
```

There is no build step and no dependency install. Edit a file, refresh the
page.

## Adding a lesson

```bash
python3 tools/new_lesson.py 06-lists "Slicing a List"
```

That creates `web/content/curriculum/06-lists/06-slicing-a-list.md` from a
template. Fill it in, then:

```bash
python3 tools/build_manifest.py
python3 tools/validate.py
```

Commit the regenerated `web/content/manifest.json` along with your lesson.

## The lesson format

One Markdown file, which must read correctly on GitHub with no tooling -
people browse lessons on the web before they ever clone anything. The
machine-readable parts hide inside ordinary fenced code blocks, tagged by a
second word in the info string:

| Block | Purpose |
| --- | --- |
| `python starter` | the code the learner opens with |
| `python solution` | the reference answer |
| `python tests` | the assertions that decide whether it passes |
| `text stdin` | input fed to `input()`, if the lesson needs any |
| `text hint` | one hint; repeat the block for progressive hints |

Any other fenced block is prose - an example the learner reads, and which the
interface offers to run in the terminal.

### Front matter

```yaml
---
title: Slicing a List          # required
goal: Take a piece out of a list.   # one line, shown under the title
estimate: 7                    # minutes
concepts:                      # optional tags, searchable in the sidebar
  - lists
  - slicing
starter_broken: true           # only for fix-the-bug lessons
starter_passes: true           # only for read-and-run lessons
---
```

## Writing tests

Tests run in the same namespace as the learner's code, so they can call
functions the learner defined. Each test is a function whose name starts with
`test_`, and whose **docstring is the label shown in the interface**.

```python
def test_slices_the_middle():
    """It returns the middle three items"""
    expect_calling("middle", ([1, 2, 3, 4, 5],), [2, 3, 4])
```

Three names are injected:

| Name | What it holds |
| --- | --- |
| `STDOUT` | everything the program printed, as one string |
| `STDOUT_LINES` | that, split into lines, trailing blanks removed |
| `SOURCE` | the learner's source code, for checking *how* they wrote it |

And these helpers:

| Helper | Use |
| --- | --- |
| `expect_output(text)` | the program printed exactly this |
| `expect_contains(text)` | this appears somewhere in the output |
| `expect_defined(name)` | the learner defined this, returns it |
| `expect_equal(actual, expected, context)` | two values match |
| `expect_calling(name, args, expected)` | calling their function returns this |

A plain `assert` works too. The assertion message is what the learner reads.

### Test the behaviour, not the keystrokes

Any correct solution must pass. Grade the output and the return values, and
reach for `SOURCE` only when the lesson is genuinely *about* how something is
written - "use a loop rather than four prints", "this one is about
comprehensions".

Include at least one case the lesson text never mentions, so that a solution
hard-coded to the example fails.

### Write messages that teach

This is the part that matters most. The failure message is the only teaching
that happens at the moment a learner is stuck.

```python
# no
assert result == 10, "wrong"

# yes
assert result == 10, (
    f"double(5) returned {result}. Multiplying by 2 rather than adding 2 will fix it."
)
```

Say what happened, what was expected, and where to look. Never imply the
learner is careless.

## What the validator checks

`python3 tools/validate.py` runs on every push and enforces:

1. the grading harness passes its own tests
2. the JavaScript modules pass theirs
3. every lesson has prose, a starter, a solution, tests, and at least one hint
4. every reference solution passes its own tests
5. every starter code **fails** those tests - an exercise that is already
   solved, or a test that passes regardless, teaches nothing
6. every starter is valid Python, unless it declares `starter_broken: true`
7. `manifest.json` matches the files on disk
8. the Python and JavaScript lesson parsers read every lesson identically

Point 5 is the one people trip over. If your lesson is deliberately a
read-and-run, add `starter_passes: true` to the front matter.

## Writing style

The lessons have a voice, and keeping it consistent matters more than any
individual sentence.

- Explain *why*, not just *what*. "Two equals signs, not one" is a rule to
  memorise; "`=` is a command and `==` is a question" is something to
  understand.
- Address the reader as "you". Never "we".
- Name the trap before the learner falls into it. Most lessons here spend a
  paragraph on the mistake everyone makes.
- Short sentences. A beginner reading about scope does not also need to parse
  a subordinate clause.
- No exclamation marks, no jokes that need context, no "simply" or "just" or
  "obviously" - every one of those tells a stuck reader that they are the
  problem.
- Prefer real examples. Prices, temperatures and names beat `foo` and `bar`.
- British or American spelling are both fine; be consistent within a lesson.

## Reporting a problem

Useful issues, roughly in order of value:

1. a lesson whose explanation lost you, and the sentence where it happened
2. a correct solution that the tests reject
3. an error message that did not help
4. anything that broke in your browser, with which browser it was

## Code of conduct

Be decent. The full text is in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
