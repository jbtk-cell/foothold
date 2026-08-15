---
title: Making Your Own
goal: Define a function and call it.
estimate: 7
concepts:
  - def
  - functions
---

You have been calling functions since your first line of code: `print`,
`len`, `int`, `input`. Now you write your own.

```python
def greet():
    print("Hello there")

greet()
greet()
```

`def` starts a definition. Then the name, then parentheses, then a colon, then
an indented block - the same shape as an `if`.

Defining a function does not run it. The block just sits there with a name
attached. It runs when you **call** it, which means writing its name followed
by parentheses. Leave the parentheses off and nothing happens: `greet` on its
own is the function itself, not a request to run it.

## Why bother

Three reasons, in order of how soon you will feel them.

**Repetition.** Anything you do twice, you will do five times.

**Naming.** A block of code called `calculate_tax` explains itself. The same
lines sitting loose in the middle of a program do not.

**Isolation.** A function is a small thing you can understand, and test, on
its own. When a program breaks, the question "which function is wrong?" is
much easier than "which of these two hundred lines is wrong?"

## Order matters

Python reads a file top to bottom, so a function must be defined before it is
called:

```python
greet()

def greet():
    print("Hello")
```

That is a `NameError`. Definitions go at the top; the code that uses them goes
below.

## Your turn

Write a function called `banner` that prints these three lines:

```
========
FOOTHOLD
========
```

Then call it twice, so the whole output is those three lines repeated.

```python starter
# Define banner(), then call it twice.
```

```python solution
def banner():
    print("========")
    print("FOOTHOLD")
    print("========")

banner()
banner()
```

```python tests
def test_function_exists():
    """A function called banner exists"""
    expect_defined("banner")

def test_output():
    """Calling it twice prints the banner twice"""
    expect_output("========\nFOOTHOLD\n========\n========\nFOOTHOLD\n========")

def test_defined_with_def():
    """It is a real function definition"""
    assert "def banner" in SOURCE, "Define it with `def banner():`."

def test_called_twice_not_written_twice():
    """The banner is written once and called twice"""
    assert SOURCE.count("FOOTHOLD") == 1, (
        "The word FOOTHOLD should appear once, inside the function. Call the "
        "function twice rather than repeating its body."
    )
```

```text hint
The definition starts `def banner():` and the three prints are indented under
it.
```

```text hint
Calling it is just `banner()` on a line of its own, un-indented, below the
definition.
```

```text hint
The whole program is a `def` with three indented prints, then two lines that
say `banner()`.
```
