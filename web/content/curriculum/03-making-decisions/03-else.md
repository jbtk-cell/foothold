---
title: Else and Elif
goal: Choose between two paths, or among many.
estimate: 8
concepts:
  - else
  - elif
---

`else` supplies the other path. It runs when the `if` condition was `False`.

```python
age = 15

if age >= 18:
    print("You may vote")
else:
    print("Not yet")
```

Exactly one of those two blocks runs. Never both, never neither.

## More than two paths

`elif` - short for "else if" - lets you keep asking.

```python
score = 74

if score >= 90:
    print("A")
elif score >= 80:
    print("B")
elif score >= 70:
    print("C")
else:
    print("F")
```

Python checks the conditions **in order** and stops at the first one that is
`True`. That is why this reads correctly even though 74 is also `>= 70` and
would have matched a later branch too - it never gets there.

Order matters enormously. Reverse the chain and everything above 70 prints
`C`, because `score >= 70` is the first thing asked and it matches almost
everything.

You can have as many `elif` branches as you like. The `else` is optional; leave
it out and it is possible for nothing to run at all.

## Nesting

A block can contain another `if`:

```python
if logged_in:
    if is_admin:
        print("Admin panel")
    else:
        print("Dashboard")
else:
    print("Please log in")
```

Each level adds four more spaces. When you find yourself three or four levels
deep, that is usually a sign the logic wants rearranging rather than more
indentation.

## Your turn

Classify a temperature. Print exactly one line, based on `temperature`:

| Temperature | Print |
| --- | --- |
| 30 or above | `Hot` |
| 15 to 29 | `Mild` |
| 0 to 14 | `Cold` |
| below 0 | `Freezing` |

With `temperature = 15` it should print `Mild`.

```python starter
temperature = 15

# Print one word describing it.
```

```python solution
temperature = 15

if temperature >= 30:
    print("Hot")
elif temperature >= 15:
    print("Mild")
elif temperature >= 0:
    print("Cold")
else:
    print("Freezing")
```

```python tests
def test_mild():
    """15 is Mild"""
    expect_output("Mild")

def test_one_line_only():
    """Only one word is printed"""
    assert len(STDOUT_LINES) == 1, (
        "Exactly one line should print, but yours printed " + str(len(STDOUT_LINES))
        + ". Use elif rather than several separate ifs."
    )

def test_uses_elif():
    """The branches are joined with elif"""
    assert "elif" in SOURCE, (
        "Use elif to chain the cases together. Separate ifs would each be checked, "
        "and more than one can be true at a time."
    )

def test_covers_every_case():
    """Every band is handled"""
    for word in ("Hot", "Mild", "Cold", "Freezing"):
        assert word in SOURCE, "I cannot find the " + word + " case in your program."
    assert "else" in SOURCE, "Use else for the coldest case - anything below zero."
```

```text hint
Start from the top of the table and work down: check for Hot first.
```

```text hint
Because the checks happen in order, you only need the lower bound each time.
Once `>= 30` has failed, `>= 15` means "between 15 and 29".
```

```text hint
The shape is `if ...: / elif ...: / elif ...: / else:` with one print
indented under each.
```
