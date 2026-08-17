---
title: Sorting
goal: Write a sort by hand, then use the one that ships with Python.
estimate: 10
concepts:
  - sorting
  - key functions
---

Writing a sort is a rite of passage. Here is the simplest one that works.

**Selection sort**: find the smallest item, move it to the front, repeat on
what remains.

```python
def selection_sort(items):
    items = list(items)
    for start in range(len(items)):
        smallest = start
        for index in range(start + 1, len(items)):
            if items[index] < items[smallest]:
                smallest = index
        items[start], items[smallest] = items[smallest], items[start]
    return items
```

Two things there are worth stealing.

`items = list(items)` copies the input, so the caller's list is left alone. A
function that quietly rearranges what it was handed causes bugs a long way
from where it was called.

`a, b = b, a` swaps two values in one line, without a temporary variable.
Python builds the pair on the right before assigning it.

Selection sort makes a comparison for every pair, so a list of a thousand
costs about half a million comparisons. That is O(n squared), and it is why
nobody uses it on real data.

## The one you should use

```python
numbers = [5, 2, 9]
print(sorted(numbers))
numbers.sort()
```

Python's sort is called Timsort, it was written for Python, and it is now used
by Java and by browsers. It finds runs that are already in order and merges
them, so nearly-sorted data is close to free.

`sorted()` returns a new list. `.sort()` rearranges in place and returns
`None`. Reach for `sorted()` unless the list is large and you know you want it
changed.

## Sorting by something other than the value

`key` takes a function, applies it to each item, and sorts by the result.

```python
words = ["banana", "kiwi", "apple"]
print(sorted(words, key=len))
```

The function is not called on pairs; it is called once per item to work out
what to sort on.

```python
people = [{"name": "Ada", "age": 36}, {"name": "Grace", "age": 45}]
print(sorted(people, key=lambda person: person["age"]))
```

`lambda` makes a small function without naming it. `lambda person: person["age"]`
is the same as a `def` that takes `person` and returns `person["age"]`.

`reverse=True` flips the order, and sorting by two things at once is a tuple:

```python
print(sorted(people, key=lambda p: (p["age"], p["name"])))
```

That sorts by age, and settles ties by name.

## Your turn

Write `selection_sort(items)` yourself, then use `sorted` for the rest.

- `selection_sort(items)` returns a new sorted list, leaving the input alone
- `by_length(words)` returns the words sorted shortest first, ties broken
  alphabetically
- `top_scores(people, n)` takes a list of `{"name": ..., "score": ...}` and
  returns the names of the top n, highest first

Expected output:

```
[1, 2, 5, 8, 9]
[5, 2, 9, 1, 8]
['kiwi', 'apple', 'banana']
['Ada', 'Cleo']
```

```python starter
def selection_sort(items):
    pass


def by_length(words):
    pass


def top_scores(people, n):
    pass


numbers = [5, 2, 9, 1, 8]
print(selection_sort(numbers))
print(numbers)
print(by_length(["banana", "kiwi", "apple"]))
print(top_scores([
    {"name": "Ada", "score": 91},
    {"name": "Bo", "score": 55},
    {"name": "Cleo", "score": 78},
], 2))
```

```python solution
def selection_sort(items):
    """Return a new list, sorted, without touching the original."""
    items = list(items)
    for start in range(len(items)):
        smallest = start
        for index in range(start + 1, len(items)):
            if items[index] < items[smallest]:
                smallest = index
        items[start], items[smallest] = items[smallest], items[start]
    return items


def by_length(words):
    """Sort words shortest first, breaking ties alphabetically."""
    return sorted(words, key=lambda word: (len(word), word))


def top_scores(people, n):
    """Return the names of the n highest scorers, highest first."""
    ranked = sorted(people, key=lambda person: person["score"], reverse=True)
    return [person["name"] for person in ranked[:n]]


numbers = [5, 2, 9, 1, 8]
print(selection_sort(numbers))
print(numbers)
print(by_length(["banana", "kiwi", "apple"]))
print(top_scores([
    {"name": "Ada", "score": 91},
    {"name": "Bo", "score": 55},
    {"name": "Cleo", "score": 78},
], 2))
```

```python tests
def test_selection_sort():
    """selection_sort orders a list"""
    expect_calling("selection_sort", ([5, 2, 9, 1, 8],), [1, 2, 5, 8, 9])
    expect_calling("selection_sort", ([],), [])
    expect_calling("selection_sort", ([1],), [1])
    expect_calling("selection_sort", ([3, 3, 1],), [1, 3, 3])

def test_selection_sort_leaves_input_alone():
    """The caller's list is not rearranged"""
    original = [3, 1, 2]
    expect_defined("selection_sort")(original)
    expect_equal(original, [3, 1, 2], "the list passed in, after sorting")

def test_selection_sort_is_hand_written():
    """selection_sort does the work itself"""
    body = SOURCE.split("def selection_sort", 1)[-1].split("def by_length", 1)[0]
    assert "sorted(" not in body and ".sort(" not in body, (
        "Write this one by hand. Using Python's sort here skips the exercise."
    )

def test_by_length():
    """by_length sorts short to long, then alphabetically"""
    expect_calling("by_length", (["banana", "kiwi", "apple"],), ["kiwi", "apple", "banana"])
    expect_calling("by_length", (["bb", "aa", "c"],), ["c", "aa", "bb"])

def test_top_scores():
    """top_scores returns the highest names first"""
    people = [
        {"name": "Ada", "score": 91},
        {"name": "Bo", "score": 55},
        {"name": "Cleo", "score": 78},
    ]
    expect_calling("top_scores", (people, 2), ["Ada", "Cleo"])
    expect_calling("top_scores", (people, 1), ["Ada"])
    expect_calling("top_scores", (people, 5), ["Ada", "Cleo", "Bo"])

def test_output():
    """The four lines print"""
    expect_output(
        "[1, 2, 5, 8, 9]\n[5, 2, 9, 1, 8]\n"
        "['kiwi', 'apple', 'banana']\n['Ada', 'Cleo']"
    )
```

```text hint
Copy the selection sort from the lesson. The copy on the first line is what
keeps the caller's list untouched.
```

```text hint
Two sort keys go in a tuple: `key=lambda word: (len(word), word)` sorts by
length and settles ties with the word itself.
```

```text hint
For `top_scores`, sort with `reverse=True`, slice the first n, then pull out
the names with a comprehension.
```
