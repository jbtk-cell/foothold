---
title: Notes to Yourself
goal: Leave notes in code that Python ignores and people read.
estimate: 5
concepts:
  - comments
---

Anything after a `#` on a line is a **comment**. Python skips it entirely.

```python
# This line does nothing at all.
print("but this one runs")  # and so does this, up to the hash
```

Comments exist because code is read far more often than it is written, and the
person most likely to read yours in six months is you, having forgotten
everything.

## What to write in them

The useful comment explains *why*, not *what*. The code already says what.

```python
price = price * 1.2  # add VAT before showing it to the customer
```

That is worth writing. This is not:

```python
price = price * 1.2  # multiply price by 1.2
```

It says nothing the line does not already say, and when the rate changes to
1.25 someone will update the code and forget the comment, and now the comment
is a lie.

## Commenting things out

The other use for `#` is switching a line off without deleting it - handy when
you are trying to work out which line is causing trouble.

```python
print("this runs")
# print("this does not")
```

## Your turn

The program below has a line that should not run, and is missing a note
explaining a decision. Do two things:

1. Comment out the `print("DEBUG: made it here")` line so it stops printing.
2. Add a comment - any comment, on any line - explaining something.

The program should print only the two real lines.

```python starter
print("Sales report")
print("DEBUG: made it here")
print("Total: 480")
```

```python solution
# A quick report for the Monday meeting.
print("Sales report")
# print("DEBUG: made it here")
print("Total: 480")
```

```python tests
def test_debug_line_is_gone():
    """The debug line no longer prints"""
    assert "DEBUG" not in STDOUT, (
        "The debug line is still printing. Put a # at the very start of that line."
    )

def test_real_lines_still_print():
    """The two real lines still print"""
    expect_output("Sales report\nTotal: 480")

def test_has_a_comment():
    """There is a comment in the file"""
    assert "#" in SOURCE, "I cannot find a # anywhere in your program."
```

```text hint
Putting a `#` at the very beginning of a line turns the whole line into a
comment.
```

```text hint
Comment out the DEBUG line, and add one more line starting with `#` that says
something about the program.
```
