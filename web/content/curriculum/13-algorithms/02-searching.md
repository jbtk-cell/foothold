---
title: Two Ways to Find Something
goal: Write binary search, and understand why it beats scanning.
estimate: 10
concepts:
  - searching
  - complexity
---

The obvious way to find something in a list is to look at every item.

```python
def find(items, target):
    for index, item in enumerate(items):
        if item == target:
            return index
    return -1
```

That is **linear search**. On a list of a million, finding the last item takes
a million comparisons. Nothing is wrong with it, and for an unsorted list it
is the only option.

## When the list is sorted

Sorted data lets you throw away half the list with a single comparison.

Look at the middle item. Too big, and the answer lies in the left half. Too
small, and it lies in the right. Repeat on the half that remains.

```python
def binary_search(items, target):
    low = 0
    high = len(items) - 1

    while low <= high:
        middle = (low + high) // 2
        if items[middle] == target:
            return middle
        if items[middle] < target:
            low = middle + 1
        else:
            high = middle - 1

    return -1
```

`low` and `high` mark the part still worth searching. Each turn of the loop
halves it.

## The difference

Halving a million takes twenty steps. A linear scan takes a million.

| Items | Linear | Binary |
| --- | --- | --- |
| 100 | 100 | 7 |
| 1,000 | 1,000 | 10 |
| 1,000,000 | 1,000,000 | 20 |
| 1,000,000,000 | 1,000,000,000 | 30 |

This is what people mean by O(n) and O(log n). The first grows in step with
the data, the second barely grows at all. Going from a million to a billion
costs binary search ten more comparisons.

The catch is that the list has to be sorted, and sorting costs more than a
single scan. Sort once and search often, and it pays for itself immediately.

## Your turn

Write both, and count the work.

- `linear_search(items, target)` returns the index or `-1`
- `binary_search(items, target)` does the same on a sorted list
- Both take an optional `counter` list; append one entry per comparison so the
  work can be measured

Expected output:

```
7
7
8
3
-1
-1
```

The first pair are the index found by each method, then the comparison counts,
then the two searches for something absent.

```python starter
def linear_search(items, target, counter=None):
    pass


def binary_search(items, target, counter=None):
    pass


numbers = [2, 4, 8, 16, 23, 42, 55, 91, 108]

a, b = [], []
print(linear_search(numbers, 91, a))
print(binary_search(numbers, 91, b))
print(len(a))
print(len(b))
print(linear_search(numbers, 5))
print(binary_search(numbers, 5))
```

```python solution
def linear_search(items, target, counter=None):
    """Return the index of target, scanning from the start."""
    for index, item in enumerate(items):
        if counter is not None:
            counter.append(1)
        if item == target:
            return index
    return -1


def binary_search(items, target, counter=None):
    """Return the index of target in a sorted list, halving each time."""
    low = 0
    high = len(items) - 1

    while low <= high:
        middle = (low + high) // 2
        if counter is not None:
            counter.append(1)
        if items[middle] == target:
            return middle
        if items[middle] < target:
            low = middle + 1
        else:
            high = middle - 1

    return -1


numbers = [2, 4, 8, 16, 23, 42, 55, 91, 108]

a, b = [], []
print(linear_search(numbers, 91, a))
print(binary_search(numbers, 91, b))
print(len(a))
print(len(b))
print(linear_search(numbers, 5))
print(binary_search(numbers, 5))
```

```python tests
NUMBERS = [2, 4, 8, 16, 23, 42, 55, 91, 108]

def test_linear_finds():
    """linear_search finds items"""
    expect_calling("linear_search", (NUMBERS, 2), 0)
    expect_calling("linear_search", (NUMBERS, 108), 8)
    expect_calling("linear_search", (NUMBERS, 23), 4)

def test_binary_finds():
    """binary_search finds the same items"""
    expect_calling("binary_search", (NUMBERS, 2), 0)
    expect_calling("binary_search", (NUMBERS, 108), 8)
    expect_calling("binary_search", (NUMBERS, 23), 4)

def test_both_report_absence():
    """A missing value gives -1 from both"""
    expect_calling("linear_search", (NUMBERS, 5), -1)
    expect_calling("binary_search", (NUMBERS, 5), -1)
    expect_calling("binary_search", ([], 5), -1)

def test_binary_agrees_with_linear_everywhere():
    """The two agree on every item and on values between them"""
    linear = expect_defined("linear_search")
    binary = expect_defined("binary_search")
    for probe in range(0, 120):
        expect_equal(binary(NUMBERS, probe), linear(NUMBERS, probe),
                     "the two searches disagree looking for " + str(probe))

def test_binary_does_less_work():
    """binary_search makes far fewer comparisons"""
    linear_count, binary_count = [], []
    expect_defined("linear_search")(NUMBERS, 108, linear_count)
    expect_defined("binary_search")(NUMBERS, 108, binary_count)
    assert len(binary_count) < len(linear_count), (
        "Searching for the last item, binary search made " + str(len(binary_count))
        + " comparisons and linear search made " + str(len(linear_count))
        + ". Binary search should need fewer. Append to `counter` once per comparison."
    )

def test_binary_is_logarithmic():
    """On a thousand items binary search stays in single figures"""
    big = list(range(1000))
    counter = []
    expect_defined("binary_search")(big, 999, counter)
    assert len(counter) <= 12, (
        "Finding one item in a thousand took " + str(len(counter)) + " comparisons. "
        "Halving a thousand should take about ten, so the loop is not halving the range."
    )

def test_output():
    """The script prints the six lines"""
    expect_output("7\n7\n8\n3\n-1\n-1")
```

```text hint
`linear_search` is the loop from the top of the lesson, with one line added to
record each comparison.
```

```text hint
`binary_search` keeps `low` and `high`. The middle is `(low + high) // 2`, and
each turn moves one end past the middle.
```

```text hint
Record a comparison with `if counter is not None: counter.append(1)`. The
default is `None` rather than `[]`, for the reason in the defaults lesson.
```
