---
title: Building Lists in One Line
goal: Write a list comprehension, and know when not to.
estimate: 8
concepts:
  - comprehensions
---

This pattern - make an empty list, loop, append - is so common that Python has
a compact form for it.

```python
squares = []
for n in range(1, 6):
    squares.append(n * n)
```

becomes

```python
squares = [n * n for n in range(1, 6)]
```

That is a **list comprehension**. Read it left to right: *the value `n * n`,
for each `n` in this range*. The expression that goes in the list comes first,
which feels backwards for about a day and then feels obvious.

## With a condition

Add `if` at the end to filter:

```python
evens = [n for n in range(20) if n % 2 == 0]
```

*Take n, for each n in the range, if n is even.*

Filtering and transforming at once:

```python
names = ["ada", "grace", "alan"]
short_upper = [name.upper() for name in names if len(name) < 5]
```

## When not to use one

A comprehension should read as one thought. When it stops doing that, the
loop was better.

```python
result = [transform(x) if check(x) else other(x) for x in items if x.valid and x.ready]
```

Nobody enjoys reading that. If you need two conditions, or a nested loop, or
you find yourself scrolling sideways, write the loop out. Short and clear
beats short.

Also: a comprehension is for **building a list**. If you are not keeping the
result, use a loop.

## Your turn

Given the temperatures below, produce and print three lists:

- `fahrenheit` - every temperature converted with `c * 9 / 5 + 32`
- `warm` - only the Celsius values above 20
- `labels` - a string like `"18C"` for each Celsius value

```
[50.0, 64.4, 77.0, 89.6]
[25, 32]
['10C', '18C', '25C', '32C']
```

Use a comprehension for each.

```python starter
celsius = [10, 18, 25, 32]

# Build the three lists, then print them one per line.
```

```python solution
celsius = [10, 18, 25, 32]

fahrenheit = [c * 9 / 5 + 32 for c in celsius]
warm = [c for c in celsius if c > 20]
labels = [f"{c}C" for c in celsius]

print(fahrenheit)
print(warm)
print(labels)
```

```python tests
def test_fahrenheit():
    """fahrenheit holds the converted values"""
    expect_equal(expect_defined("fahrenheit", "list"), [50.0, 64.4, 77.0, 89.6], "fahrenheit")

def test_warm():
    """warm holds only the values above 20"""
    expect_equal(expect_defined("warm", "list"), [25, 32], "warm")

def test_labels():
    """labels holds the formatted strings"""
    expect_equal(expect_defined("labels", "list"), ["10C", "18C", "25C", "32C"], "labels")

def test_uses_comprehensions():
    """The lists are built with comprehensions"""
    assert SOURCE.count(" for ") >= 3, (
        "Build each list with a comprehension - the `[... for ... in ...]` form."
    )
    assert ".append" not in SOURCE, (
        "This lesson is about comprehensions, so build the lists without .append()."
    )

def test_output():
    """It prints all three lists"""
    expect_output("[50.0, 64.4, 77.0, 89.6]\n[25, 32]\n['10C', '18C', '25C', '32C']")
```

```text hint
The shape is `[expression for item in collection]`.
```

```text hint
For `warm`, the expression is just `c` and the filter goes on the end:
`[c for c in celsius if c > 20]`.
```

```text hint
For `labels`, the expression is an f-string: `[f"{c}C" for c in celsius]`.
```
