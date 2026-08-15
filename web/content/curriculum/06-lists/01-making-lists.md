---
title: Many Things, One Name
goal: Create a list and read items out of it by position.
estimate: 7
concepts:
  - lists
  - indexing
---

A list is written with square brackets, items separated by commas.

```python
colours = ["red", "green", "blue"]
print(colours)
print(len(colours))
```

The items keep the order you gave them, and can be of any type - including
other lists.

## Getting one item out

Square brackets after the list, with a position inside:

```python
colours = ["red", "green", "blue"]
print(colours[0])
print(colours[2])
```

**Positions start at 0.** The first item is `colours[0]`, the second is
`colours[1]`, and the last of three is `colours[2]`.

Asking for `colours[3]` raises an `IndexError`, because there is no fourth
item. That off-by-one is the most common mistake in the whole of programming,
and the standard fix is `len(colours) - 1` for the last position.

Except Python has something nicer:

```python
print(colours[-1])
print(colours[-2])
```

Negative positions count from the end. `[-1]` is the last item, always,
without needing to know how long the list is.

## Changing an item

Unlike strings, lists can be modified in place:

```python
colours[1] = "yellow"
print(colours)
```

## Slicing

Two positions separated by a colon gives you a piece of the list. As with
`range`, the first is included and the second is not:

```python
letters = ["a", "b", "c", "d", "e"]
print(letters[1:3])
print(letters[:2])
print(letters[2:])
```

Leaving a side blank means "from the start" or "to the end".

## Your turn

Given the list below, print exactly:

```
First: Mercury
Last: Neptune
Inner: ['Mercury', 'Venus', 'Earth', 'Mars']
Count: 8
```

Get every value out of the list rather than typing it. The inner planets are
the first four.

```python starter
planets = ["Mercury", "Venus", "Earth", "Mars",
           "Jupiter", "Saturn", "Uranus", "Neptune"]

# Print the four lines.
```

```python solution
planets = ["Mercury", "Venus", "Earth", "Mars",
           "Jupiter", "Saturn", "Uranus", "Neptune"]

print(f"First: {planets[0]}")
print(f"Last: {planets[-1]}")
print(f"Inner: {planets[:4]}")
print(f"Count: {len(planets)}")
```

```python tests
def test_output():
    """It prints all four lines"""
    expect_output(
        "First: Mercury\n"
        "Last: Neptune\n"
        "Inner: ['Mercury', 'Venus', 'Earth', 'Mars']\n"
        "Count: 8"
    )

def test_reads_from_the_list():
    """The values are read from the list, not retyped"""
    after = SOURCE.split("]", 1)[-1]
    assert "Neptune" not in after, (
        "Use planets[-1] rather than typing Neptune - then it still works when "
        "the list changes."
    )
    assert "8" not in after, "Use len(planets) rather than typing 8."
```

```text hint
`planets[0]` is the first. `planets[-1]` is the last.
```

```text hint
The first four are `planets[:4]`.
```

```text hint
Wrap each one in an f-string: `print(f"First: {planets[0]}")`.
```
