---
title: Raising Your Own
goal: Reject bad input at the door instead of letting it spread.
estimate: 8
concepts:
  - raise
  - validation
---

Catching errors is half the story. The other half is causing them.

```python
def set_age(age):
    if age < 0:
        raise ValueError("age cannot be negative")
    return age
```

`raise` stops the function immediately and sends the error up to whoever
called it. If nobody catches it, the program stops with a message.

## Why that is better than returning None

Consider the alternative:

```python
def set_age(age):
    if age < 0:
        return None
    return age
```

Now every caller has to remember to check, and the one that forgets gets a
mysterious `TypeError` five functions later, in code that looks fine. The
error message will point at the innocent line.

Raising puts the failure where the mistake is, with a message that names it.
This is worth doing even in small programs, and it is the difference between
half an hour of debugging and ten seconds.

## Choosing the error

Use the built-in that fits:

- `ValueError` - right type, unacceptable value
- `TypeError` - wrong type entirely
- `KeyError` / `IndexError` - something was not found

Write the message for the person who will read it at three in the morning.
`"age cannot be negative, got -5"` beats `"invalid"`.

## Validating at the boundary

The useful habit is to check input **once**, where it enters your program, and
trust it everywhere after.

```python
def parse_age(raw):
    """Return raw as an age, or raise ValueError explaining why not."""
    try:
        age = int(raw)
    except ValueError:
        raise ValueError(f"age must be a whole number, got {raw!r}")

    if not 0 <= age <= 130:
        raise ValueError(f"age must be between 0 and 130, got {age}")

    return age
```

`{raw!r}` in an f-string shows the value the way Python would write it, quotes
and all, which makes `""` and `" "` distinguishable in an error message.

## Your turn

Write `parse_score(raw)` that turns text into a score between 0 and 100.

- return the number if it is valid
- raise `ValueError("not a number: X")` if it will not convert, where X is the
  original value shown with `!r`
- raise `ValueError("out of range: N")` if it converts but is outside 0 to 100

Then print the results of the four calls below, catching the errors:

```
88
not a number: 'abc'
out of range: 150
0
```

```python starter
def parse_score(raw):
    # Convert, validate, and raise with a clear message when it is wrong.
    pass


for value in ["88", "abc", "150", "0"]:
    try:
        print(parse_score(value))
    except ValueError as error:
        print(error)
```

```python solution
def parse_score(raw):
    """Return raw as a score from 0 to 100, or raise ValueError."""
    try:
        score = int(raw)
    except ValueError:
        raise ValueError(f"not a number: {raw!r}")

    if not 0 <= score <= 100:
        raise ValueError(f"out of range: {score}")

    return score


for value in ["88", "abc", "150", "0"]:
    try:
        print(parse_score(value))
    except ValueError as error:
        print(error)
```

```python tests
def test_valid_scores():
    """Valid scores come back as numbers"""
    expect_calling("parse_score", ("88",), 88)
    expect_calling("parse_score", ("0",), 0)
    expect_calling("parse_score", ("100",), 100)

def test_rejects_non_numbers():
    """Text that is not a number is rejected"""
    func = expect_defined("parse_score")
    try:
        func("abc")
    except ValueError as error:
        expect_equal(str(error), "not a number: 'abc'", "the error message")
    else:
        raise AssertionError("parse_score('abc') should raise a ValueError, but it did not.")

def test_rejects_out_of_range():
    """Numbers outside 0 to 100 are rejected"""
    func = expect_defined("parse_score")
    for bad in ("150", "-1"):
        try:
            func(bad)
        except ValueError as error:
            assert str(error).startswith("out of range"), (
                "For " + bad + " the message should start with 'out of range', got "
                + repr(str(error))
            )
        else:
            raise AssertionError("parse_score(" + repr(bad) + ") should raise a ValueError.")

def test_output():
    """It prints the four results"""
    expect_output("88\nnot a number: 'abc'\nout of range: 150\n0")

def test_uses_raise():
    """It raises rather than returning a message"""
    assert "raise" in SOURCE, (
        "Use `raise ValueError(...)` rather than returning the message - that way a "
        "caller cannot forget to check."
    )
```

```text hint
Wrap the `int(raw)` in a try, and raise your own ValueError in the except
block.
```

```text hint
The message uses `!r`: `f"not a number: {raw!r}"` gives `not a number: 'abc'`.
```

```text hint
The range check comes after the conversion succeeded:
`if not 0 <= score <= 100: raise ValueError(f"out of range: {score}")`.
```
