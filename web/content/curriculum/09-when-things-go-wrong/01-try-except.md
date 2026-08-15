---
title: Catching an Error
goal: Keep a program running when something predictable goes wrong.
estimate: 9
concepts:
  - exceptions
  - try
---

`int("abc")` raises a `ValueError` and your program stops. Often that is the
right thing. Sometimes it is not - if a person mistyped their age, you want to
ask again rather than crash.

`try` and `except` let you carry on:

```python
raw = "abc"

try:
    age = int(raw)
    print(f"You are {age}")
except ValueError:
    print("That is not a number")
```

Python runs the `try` block. If nothing goes wrong, the `except` block is
skipped entirely. If a `ValueError` happens *anywhere* in the `try` block, the
rest of the block is abandoned and the `except` block runs instead.

## Name the error you expect

```python
except:
    pass
```

That catches everything - including typos in your own code, and the Ctrl+C
someone pressed to stop the program. It turns a clear error message into a
silent, mysterious failure, and it is the single worst habit in Python.

Catch the specific thing you are prepared to handle:

| Error | Happens when |
| --- | --- |
| `ValueError` | the right type, an impossible value: `int("abc")` |
| `TypeError` | the wrong type entirely: `"a" + 1` |
| `KeyError` | a dictionary key is missing |
| `IndexError` | a list position does not exist |
| `ZeroDivisionError` | dividing by zero |
| `FileNotFoundError` | opening a file that is not there |

You can handle several, either together or separately:

```python
try:
    value = data[key] / divisor
except KeyError:
    print("no such key")
except ZeroDivisionError:
    print("cannot divide by zero")
```

## Seeing what happened

```python
try:
    int("abc")
except ValueError as error:
    print(f"Could not read that: {error}")
```

## Else and finally

`else` runs when nothing went wrong; `finally` runs either way, and is where
cleanup goes.

```python
try:
    number = int(raw)
except ValueError:
    print("bad input")
else:
    print(f"got {number}")
finally:
    print("done")
```

## Your turn

Write `safe_divide(a, b)` that returns `a / b`, but:

- returns the string `"cannot divide by zero"` if `b` is zero
- returns the string `"need two numbers"` if either value is not a number

Print these four calls:

```
5.0
cannot divide by zero
need two numbers
2.5
```

```python starter
def safe_divide(a, b):
    # Try the division, and handle the two things that can go wrong.
    pass


print(safe_divide(10, 2))
print(safe_divide(10, 0))
print(safe_divide(10, "x"))
print(safe_divide(5, 2))
```

```python solution
def safe_divide(a, b):
    """Divide a by b, returning a message instead of raising."""
    try:
        return a / b
    except ZeroDivisionError:
        return "cannot divide by zero"
    except TypeError:
        return "need two numbers"


print(safe_divide(10, 2))
print(safe_divide(10, 0))
print(safe_divide(10, "x"))
print(safe_divide(5, 2))
```

```python tests
def test_normal_division():
    """Ordinary division works"""
    expect_calling("safe_divide", (10, 2), 5.0)

def test_divide_by_zero():
    """Dividing by zero is caught"""
    expect_calling("safe_divide", (10, 0), "cannot divide by zero")

def test_bad_type():
    """A non-number is caught"""
    expect_calling("safe_divide", (10, "x"), "need two numbers")
    expect_calling("safe_divide", ("x", 10), "need two numbers")

def test_output():
    """It prints all four results"""
    expect_output("5.0\ncannot divide by zero\nneed two numbers\n2.5")

def test_catches_specific_errors():
    """The specific errors are named"""
    assert "ZeroDivisionError" in SOURCE and "TypeError" in SOURCE, (
        "Name the errors you are handling. A bare `except:` would also swallow "
        "mistakes in your own code."
    )
```

```text hint
The whole body is a `try` with `return a / b` inside it.
```

```text hint
Dividing by zero raises `ZeroDivisionError`. Dividing a number by a string
raises `TypeError`.
```

```text hint
Each `except` block returns its message - no `else` needed, because a
successful `return` leaves the function immediately.
```
