---
title: Picking the Right Container
goal: Choose between a list, a set and a dictionary by how it will be used.
estimate: 9
concepts:
  - complexity
  - data structures
---

Three containers, and the difference between them shows up as soon as the data
gets large.

```python
names_list = ["ada", "grace", "alan"]
names_set = {"ada", "grace", "alan"}
ages = {"ada": 36, "grace": 45}
```

Ask each one "is `alan` in here?"

The list checks every item until it finds a match. A million names means up to
a million comparisons.

The set and the dictionary compute a **hash** of the value, which is a number
derived from its contents, and jump straight to where that value would be
stored. One step, whatever the size.

| Operation | list | set | dict |
| --- | --- | --- | --- |
| `x in c` | slow, grows with size | fast, flat | fast, flat (keys) |
| add an item | fast at the end | fast | fast |
| remove an item | slow | fast | fast |
| keeps order | yes | no | yes, insertion order |
| allows duplicates | yes | no | keys no, values yes |
| can hold lists | yes | no | not as keys |

## The rule

Use a **list** when order matters or duplicates matter.

Use a **set** when membership is the question and duplicates are noise.

Use a **dict** when each item has something attached to it.

The mistake worth avoiding is the `in` check inside a loop:

```python
seen = []
for record in records:
    if record.id not in seen:
        seen.append(record.id)
```

That looks harmless and is quadratic: for each of a million records it scans a
growing list. Changing `seen = []` to `seen = set()` and `.append` to `.add`
makes the same code fast, because sets are unordered and hashed.

## Why sets cannot hold lists

Hashing requires the value never to change, otherwise the stored position
would go stale. Lists can change, so they cannot be hashed and cannot go in a
set or be used as a dictionary key. Tuples can, which is one reason they
exist.

```python
positions = {(0, 0), (1, 2)}
```

## Your turn

The function below works and is slow. Rewrite `find_duplicates` so it stays
correct while the membership checks stop scanning a list.

- `find_duplicates(items)` returns the values that appear more than once, in
  the order they first repeat
- `unique_in_order(items)` returns each value once, keeping first-seen order
- `common(a, b)` returns the sorted values present in both lists

Expected output:

```
['b', 'a']
['a', 'b', 'c']
[2, 3]
```

```python starter
def find_duplicates(items):
    duplicates = []
    seen = []
    for item in items:
        if item in seen and item not in duplicates:
            duplicates.append(item)
        seen.append(item)
    return duplicates


def unique_in_order(items):
    pass


def common(a, b):
    pass


print(find_duplicates(["a", "b", "b", "c", "a", "b"]))
print(unique_in_order(["a", "b", "a", "c", "b"]))
print(common([1, 2, 3, 4], [2, 3, 9]))
```

```python solution
def find_duplicates(items):
    """Return values appearing more than once, in order of first repeat."""
    duplicates = []
    seen = set()
    reported = set()
    for item in items:
        if item in seen and item not in reported:
            duplicates.append(item)
            reported.add(item)
        seen.add(item)
    return duplicates


def unique_in_order(items):
    """Return each value once, keeping the order first seen."""
    seen = set()
    out = []
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


def common(a, b):
    """Return the sorted values present in both lists."""
    return sorted(set(a) & set(b))


print(find_duplicates(["a", "b", "b", "c", "a", "b"]))
print(unique_in_order(["a", "b", "a", "c", "b"]))
print(common([1, 2, 3, 4], [2, 3, 9]))
```

```python tests
def test_find_duplicates():
    """Duplicates are reported once, in order of first repeat"""
    expect_calling("find_duplicates", (["a", "b", "b", "c", "a", "b"],), ["b", "a"])
    expect_calling("find_duplicates", ([1, 2, 3],), [])
    expect_calling("find_duplicates", ([1, 1, 1],), [1])

def test_unique_in_order():
    """unique_in_order keeps first-seen order"""
    expect_calling("unique_in_order", (["a", "b", "a", "c", "b"],), ["a", "b", "c"])
    expect_calling("unique_in_order", ([],), [])
    expect_calling("unique_in_order", ([3, 1, 3, 1],), [3, 1])

def test_common():
    """common returns the sorted intersection"""
    expect_calling("common", ([1, 2, 3, 4], [2, 3, 9]), [2, 3])
    expect_calling("common", ([1], [2]), [])
    expect_calling("common", ([1, 1, 2], [2, 2, 1]), [1, 2])

def test_membership_uses_sets():
    """The membership checks are against sets"""
    assert "set()" in SOURCE or "set(" in SOURCE, (
        "Use a set for the `seen` collections. Checking `in` against a list scans it."
    )
    assert "seen = []" not in SOURCE, (
        "`seen` is still a list, so every `in` check scans it from the start. "
        "A set answers the same question in one step."
    )

def test_scales():
    """The rewrite is fast enough for ten thousand items"""
    data = list(range(10000)) + [7, 9]
    result = expect_defined("find_duplicates")(data)
    expect_equal(result, [7, 9], "duplicates in a large list")
    expect_equal(len(expect_defined("unique_in_order")(data)), 10000, "unique count")

def test_output():
    """The three lines print"""
    expect_output("['b', 'a']\n['a', 'b', 'c']\n[2, 3]")
```

```text hint
Change `seen = []` to `seen = set()` and `seen.append(item)` to
`seen.add(item)`. Nothing else about the logic changes.
```

```text hint
`duplicates` stays a list, because the order of the answer matters. Track what
you have already reported in a second set.
```

```text hint
`common` is one line: `sorted(set(a) & set(b))`.
```
