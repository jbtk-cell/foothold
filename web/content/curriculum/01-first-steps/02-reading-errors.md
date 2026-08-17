---
title: Reading an Error
goal: Treat an error message as directions rather than as failure.
estimate: 7
starter_broken: true
concepts:
  - errors
  - tracebacks
---

Beginners think errors mean they have done something wrong. Professionals
think errors mean the computer is telling them exactly where to look. The
second attitude is worth more than any amount of memorised syntax.

Here is a broken program:

```python
print("Hello)
```

Run it and Python says something like:

```
SyntaxError on line 1: unterminated string literal
    print("Hello)
          ^
```

Read it in three parts:

- **SyntaxError** - the kind of problem. This one means the code is not
  valid Python at all, so nothing ran.
- **line 1** - where to look.
- **unterminated string literal** - jargon for "you opened a quote and never
  closed it."

The little `^` points at the guilty character. Fix it and the error is gone.

## The two kinds of error

A **SyntaxError** happens before your program starts. Python could not even
read it.

Every other error happens *while* your program runs, which means some of it
already worked. This one runs the first line fine and then falls over:

```python
print("about to fail")
print(nonsense)
```

You get a `NameError`, because `nonsense` is not in quotes, so Python went
looking for something with that name and found nothing.

## Your turn

The starter code below is broken in two ways. Fix both so it prints:

```
Two lines
of working code
```

Run it, read whatever error comes back, fix that one thing, run it again.
That loop - run, read, fix - is most of what programming is.

```python starter
print("Two lines)
print(of working code)
```

```python solution
print("Two lines")
print("of working code")
```

```python tests
def test_first_line():
    """The first line prints correctly"""
    expect_contains("Two lines", "The first line should print `Two lines`.")

def test_both_lines():
    """Both lines print, in order"""
    expect_output("Two lines\nof working code")
```

```text hint
Start with the error Python actually reports. It will point at line 1.
```

```text hint
Line 1 opens a quote before `Two` but never closes it before the `)`.
```

```text hint
Line 2 has no quotes at all, so Python thinks `of` is the name of something.
Both lines need a matching pair of quotes around the text.
```
