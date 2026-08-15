---
title: Putting Decisions Together
goal: Write a small program that reads input and branches on it.
estimate: 9
concepts:
  - if
  - input
  - practice
---

Everything in this module, in one small program: read something, decide what
it means, say so.

Here is the shape most programs of this kind take.

```python
raw = input("How many? ")
count = int(raw)

if count == 0:
    print("none")
elif count == 1:
    print("one")
else:
    print(f"{count} of them")
```

Notice the input is converted once, immediately, and everything after that
works with a number. Converting late - or twice - is where the bugs live.

## Your turn

Write a ticket price calculator.

Ask `Age? ` and read a whole number. Then print the price on its own line:

| Age | Price |
| --- | --- |
| under 5 | `Free` |
| 5 to 17 | `Child: 6` |
| 18 to 64 | `Adult: 12` |
| 65 and over | `Senior: 8` |

With an input of `70`, the whole output is:

```
Age? 70
Senior: 8
```

```python starter
# Ask for an age, then print the right price.
```

```python solution
age = int(input("Age? "))

if age < 5:
    print("Free")
elif age < 18:
    print("Child: 6")
elif age < 65:
    print("Adult: 12")
else:
    print("Senior: 8")
```

```text stdin
70
```

```python tests
def test_senior():
    """An age of 70 is a senior ticket"""
    expect_output("Age? 70\nSenior: 8")

def test_prompt():
    """It asks with the right prompt"""
    assert "Age? " in SOURCE, 'The prompt should be exactly "Age? " including the space.'

def test_converts_input():
    """The age is converted to a number"""
    assert "int(" in SOURCE, (
        "input() gives you text. Wrap it in int() so the comparisons work on numbers - "
        'comparing the string "70" against 65 is not the same thing.'
    )

def test_all_four_bands():
    """All four price bands are present"""
    for label in ("Free", "Child: 6", "Adult: 12", "Senior: 8"):
        assert label in SOURCE, "I cannot find the " + repr(label) + " case."

def test_uses_elif():
    """The bands are chained"""
    assert "elif" in SOURCE, "Chain the bands with elif so exactly one price prints."
```

```text hint
Start with `age = int(input("Age? "))`.
```

```text hint
Work from youngest to oldest: `if age < 5`, then `elif age < 18`, then
`elif age < 65`, then `else`.
```

```text hint
Because each check only runs when the previous ones failed, you never need to
write "and age >= 5" anywhere.
```
