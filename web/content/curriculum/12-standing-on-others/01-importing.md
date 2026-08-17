---
title: Importing
goal: Bring in code from outside your file, three different ways.
estimate: 8
concepts:
  - import
  - modules
---

A **module** is a file of Python that somebody else wrote. `import` gives you
access to it.

```python
import math

print(math.sqrt(16))
print(math.pi)
```

`import math` binds the name `math`, and everything inside is reached with a
dot. Nothing enters your file's namespace beyond that one name, so your own
`pi` would not clash.

## Taking specific names

```python
from math import sqrt, pi

print(sqrt(16))
print(pi)
```

Shorter to use, and now `sqrt` and `pi` are yours, which means a variable of
the same name would overwrite them. Use this form for a handful of names you
use often.

Avoid `from math import *`. It pulls in everything, and a reader has no way to
tell which names came from where.

## Renaming

```python
import statistics as stats

print(stats.mean([1, 2, 3]))
```

Useful for long module names, and near-universal for a few libraries where
the short form is a convention people recognise.

## Randomness

`random` is the module people reach for first, and it has a property worth
understanding: the numbers are not random at all. They come from a formula
starting at a **seed**. Give it the same seed and you get the same sequence.

```python
import random

random.seed(1)
print(random.randint(1, 100))
print(random.choice(["red", "green", "blue"]))
```

Without `random.seed(...)` Python picks a seed from the clock and the numbers
differ each run. With it, they repeat, which is exactly what you want when
testing something that uses randomness.

| Call | Gives |
| --- | --- |
| `random.randint(a, b)` | a whole number from a to b, both included |
| `random.random()` | a decimal from 0 up to 1 |
| `random.choice(items)` | one item from a sequence |
| `random.shuffle(items)` | reorders a list in place |
| `random.sample(items, k)` | k different items |

## Your turn

Write a dice roller.

- `roll(sides=6)` returns one number from 1 to `sides`
- `roll_many(count, sides=6)` returns a list of that many rolls

Seed the generator with `random.seed(7)` at the top so the output is
repeatable, then print:

```
3
[2, 4, 6, 1, 1]
[18, 4, 12]
```

```python starter
import random

random.seed(7)


# Write roll() and roll_many() below.


print(roll())
print(roll_many(5))
print(roll_many(3, 20))
```

```python solution
import random

random.seed(7)


def roll(sides=6):
    """Return a single die roll."""
    return random.randint(1, sides)


def roll_many(count, sides=6):
    """Return a list of `count` rolls."""
    return [roll(sides) for _ in range(count)]


print(roll())
print(roll_many(5))
print(roll_many(3, 20))
```

```python tests
def test_roll_in_range():
    """roll() stays within its range"""
    func = expect_defined("roll")
    for _ in range(50):
        value = func()
        assert 1 <= value <= 6, "roll() returned " + repr(value) + ", outside 1 to 6."

def test_roll_respects_sides():
    """roll(sides) uses the range it was given"""
    func = expect_defined("roll")
    for _ in range(50):
        value = func(20)
        assert 1 <= value <= 20, "roll(20) returned " + repr(value) + ", outside 1 to 20."

def test_roll_many_length():
    """roll_many returns the right number of rolls"""
    func = expect_defined("roll_many")
    expect_equal(len(func(5)), 5, "the length of roll_many(5)")
    expect_equal(len(func(0)), 0, "the length of roll_many(0)")
    expect_equal(len(func(3, 20)), 3, "the length of roll_many(3, 20)")

def test_roll_many_uses_roll():
    """roll_many builds on roll"""
    assert "roll(" in SOURCE.split("def roll_many", 1)[-1], (
        "Call roll() inside roll_many() rather than repeating the randint call."
    )

def test_seeded_output():
    """The seeded run prints the expected numbers"""
    expect_output("3\n[2, 4, 6, 1, 1]\n[18, 4, 12]")
```

```text hint
`random.randint(1, sides)` gives you one roll. The default goes in the
signature: `def roll(sides=6):`.
```

```text hint
`roll_many` calls `roll` in a loop. A comprehension does it in one line:
`[roll(sides) for _ in range(count)]`.
```

```text hint
Pass `sides` through from `roll_many` to `roll`, otherwise `roll_many(3, 20)`
would still roll six-sided dice.
```
