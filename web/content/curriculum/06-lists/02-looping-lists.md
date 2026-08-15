---
title: Looping Over a List
goal: Do something to every item in a list.
estimate: 7
concepts:
  - for
  - lists
---

You already know the syntax. A `for` loop works on a list directly:

```python
colours = ["red", "green", "blue"]

for colour in colours:
    print(colour.upper())
```

No positions, no counting, no `len`. The loop variable takes each item in
turn. This is the normal way to work through a list in Python, and reaching
for `range(len(things))` is usually a sign you have brought a habit from
another language.

## When you do need the position

`enumerate` gives you both:

```python
for index, colour in enumerate(colours):
    print(index, colour)
```

Add `start=1` if you want human numbering:

```python
for number, colour in enumerate(colours, start=1):
    print(f"{number}. {colour}")
```

## The accumulator pattern, again

Exactly as with `range` - set up before, update inside, use after:

```python
prices = [4, 2, 7]
total = 0

for price in prices:
    total += price

print(total)
```

Python has `sum(prices)` for this exact case, and `min`, `max` and `len` too.
Use them when they fit. The loop matters because most real jobs are not one of
the four things the built-ins do.

## Filtering while you loop

```python
for price in prices:
    if price > 3:
        print(price)
```

## Your turn

Given the list of scores, print each one numbered from 1, then the average to
one decimal place:

```
1. 72
2. 88
3. 95
4. 61
Average: 79.0
```

Use `enumerate` for the numbering and work the average out with a loop or with
`sum`.

```python starter
scores = [72, 88, 95, 61]

# Print the numbered list, then the average.
```

```python solution
scores = [72, 88, 95, 61]

for number, score in enumerate(scores, start=1):
    print(f"{number}. {score}")

average = sum(scores) / len(scores)
print(f"Average: {average:.1f}")
```

```python tests
def test_output():
    """It numbers the scores and reports the average"""
    expect_output("1. 72\n2. 88\n3. 95\n4. 61\nAverage: 79.0")

def test_uses_a_loop():
    """The list is printed with a loop"""
    assert "for " in SOURCE, "Print the scores with a loop rather than four prints."

def test_average_is_calculated():
    """The average is computed from the list"""
    assert "79" not in SOURCE, "Work the average out from the list rather than typing it."
    assert "len(" in SOURCE, (
        "Divide by len(scores) rather than by 4, so it still works if a score is added."
    )
```

```text hint
`enumerate(scores, start=1)` gives you the number and the score together.
```

```text hint
The loop variable line is `for number, score in enumerate(scores, start=1):`.
```

```text hint
The average is `sum(scores) / len(scores)`, printed with `{average:.1f}`.
```
