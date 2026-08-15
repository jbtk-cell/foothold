---
title: Sets and Tuples
goal: Use a set to remove duplicates and a tuple to fix a group of values.
estimate: 8
concepts:
  - sets
  - tuples
---

Two more collections, each with one clear job.

## Sets: unique, unordered

A **set** holds each value at most once and does not remember any order.

```python
visitors = {"ada", "grace", "ada", "alan"}
print(visitors)
print(len(visitors))
```

Three, not four - the duplicate simply is not there.

The most common use is removing duplicates from a list:

```python
names = ["ada", "grace", "ada", "alan"]
unique = list(set(names))
```

Be aware that this loses the order. If order matters, use `dict.fromkeys`:

```python
unique = list(dict.fromkeys(names))
```

Sets also do the operations from school mathematics:

```python
monday = {"ada", "grace"}
tuesday = {"grace", "alan"}

print(monday & tuesday)
print(monday | tuesday)
print(monday - tuesday)
```

Intersection, union, difference. Answering "who came both days" with sets is
one line; with loops it is six.

Checking membership in a set is also much faster than in a list, which matters
once your collection is large.

> An empty set is `set()`, not `{}` - the braces were taken by dictionaries.

## Tuples: fixed, ordered

A **tuple** is like a list that cannot be changed after it is made. Round
brackets instead of square:

```python
point = (3, 4)
print(point[0])
```

`point[0] = 5` raises a `TypeError`.

Use one for a group of values that belong together and have no business
changing: a coordinate, a colour, a row from a database. The immutability is
the point - it tells a reader that this will not be modified.

You have already used tuples without noticing:

```python
for index, value in enumerate(items):
```

`enumerate` hands back tuples, and Python unpacks them into two names. That
unpacking works anywhere:

```python
width, height = (1920, 1080)
```

## Your turn

Two classes submitted attendance lists. Print:

```
Both days: ['ada', 'grace']
Either day: ['ada', 'alan', 'grace', 'jean']
Monday only: ['jean']
Total unique: 4
```

Each list is sorted alphabetically. Sets are unordered, so `sorted()` is what
gives you a predictable answer.

```python starter
monday = ["ada", "grace", "jean", "ada"]
tuesday = ["grace", "alan", "ada"]

# Compare the two lists using sets.
```

```python solution
monday = ["ada", "grace", "jean", "ada"]
tuesday = ["grace", "alan", "ada"]

monday_set = set(monday)
tuesday_set = set(tuesday)

print(f"Both days: {sorted(monday_set & tuesday_set)}")
print(f"Either day: {sorted(monday_set | tuesday_set)}")
print(f"Monday only: {sorted(monday_set - tuesday_set)}")
print(f"Total unique: {len(monday_set | tuesday_set)}")
```

```python tests
def test_output():
    """It reports the four figures"""
    expect_output(
        "Both days: ['ada', 'grace']\n"
        "Either day: ['ada', 'alan', 'grace', 'jean']\n"
        "Monday only: ['jean']\n"
        "Total unique: 4"
    )

def test_uses_sets():
    """The comparison uses sets"""
    assert "set(" in SOURCE, (
        "Convert the lists to sets - that is what makes the comparisons one line each."
    )

def test_sorted_for_predictability():
    """The output is sorted"""
    assert "sorted(" in SOURCE, (
        "Sets have no order, so sort the results before printing them, otherwise the "
        "output would be unpredictable."
    )
```

```text hint
Start by making a set from each list: `monday_set = set(monday)`.
```

```text hint
`&` is "in both", `|` is "in either", `-` is "in the first but not the second".
```

```text hint
Wrap each result in `sorted(...)` to get a list in a predictable order.
```
