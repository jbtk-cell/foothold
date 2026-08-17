---
title: Functions That Call Themselves
goal: Write a recursive function with a base case that stops it.
estimate: 10
concepts:
  - recursion
---

A function is allowed to call itself.

```python
def countdown(n):
    if n <= 0:
        print("done")
        return
    print(n)
    countdown(n - 1)

countdown(3)
```

Every recursive function has two parts, and leaving either out breaks it.

The **base case** is the version of the problem small enough to answer
outright. Here it is `n <= 0`. Without one the function calls itself forever
and Python stops you with a `RecursionError` after about a thousand levels.

The **recursive case** does a little work and calls itself with a smaller
problem. `countdown(n - 1)` is smaller than `countdown(n)`, so the chain walks
down to the base case.

## Returning a value

```python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))
```

Trace `factorial(3)` by hand once. It returns `3 * factorial(2)`, which is
`3 * (2 * factorial(1))`, which is `3 * 2 * 1`. Nothing multiplies until the
innermost call returns, so the multiplications happen on the way back out.

Open the Trace panel and step through it. The call stack grows to three
frames, then unwinds, and each `return` hands its value to the frame below.
Watching that once teaches more than a page of description.

## When recursion earns its place

A loop can do everything recursion can, and for counting down a loop is
clearer. Recursion is the better fit when the data itself nests: a folder
containing folders, a comment with replies that have replies, a menu with
submenus.

```python
def total_size(item):
    if isinstance(item, int):
        return item
    return sum(total_size(part) for part in item)

print(total_size([1, [2, 3], [4, [5, 6]]]))
```

Writing that with loops means keeping your own stack of what is left to
visit. The recursive version is four lines and says what it means.

## Your turn

Write two recursive functions.

- `count_down(n)` returns a list from n down to 1, and `[]` for anything below 1
- `flatten(items)` takes a list that may contain lists and returns one flat
  list of the values, in order

Neither may use a `while` loop. Expected output:

```
[5, 4, 3, 2, 1]
[]
[1, 2, 3, 4, 5, 6]
[]
```

```python starter
def count_down(n):
    # Base case first, then the recursive case.
    pass


def flatten(items):
    pass


print(count_down(5))
print(count_down(0))
print(flatten([1, [2, 3], [4, [5, [6]]]]))
print(flatten([]))
```

```python solution
def count_down(n):
    """Return a list counting from n down to 1."""
    if n < 1:
        return []
    return [n] + count_down(n - 1)


def flatten(items):
    """Return one flat list from a list that may contain lists."""
    flat = []
    for item in items:
        if isinstance(item, list):
            flat += flatten(item)
        else:
            flat.append(item)
    return flat


print(count_down(5))
print(count_down(0))
print(flatten([1, [2, 3], [4, [5, [6]]]]))
print(flatten([]))
```

```python tests
def test_count_down():
    """count_down counts to one"""
    expect_calling("count_down", (5,), [5, 4, 3, 2, 1])
    expect_calling("count_down", (1,), [1])

def test_count_down_base_case():
    """Zero and below give an empty list"""
    expect_calling("count_down", (0,), [])
    expect_calling("count_down", (-3,), [])

def test_flatten_one_level():
    """A single level of nesting flattens"""
    expect_calling("flatten", ([1, [2, 3], 4],), [1, 2, 3, 4])

def test_flatten_deeply():
    """Nesting of any depth flattens"""
    expect_calling("flatten", ([1, [2, [3, [4, [5]]]]],), [1, 2, 3, 4, 5])

def test_flatten_edges():
    """Empty lists disappear rather than breaking it"""
    expect_calling("flatten", ([],), [])
    expect_calling("flatten", ([[], [1], []],), [1])

def test_flatten_keeps_order():
    """The original order survives"""
    expect_calling("flatten", (["a", ["b", "c"], "d"],), ["a", "b", "c", "d"])

def test_is_recursive():
    """Both functions call themselves"""
    after_count = SOURCE.split("def count_down", 1)[-1].split("def flatten", 1)[0]
    assert "count_down(" in after_count, "count_down should call itself."
    after_flatten = SOURCE.split("def flatten", 1)[-1]
    assert "flatten(" in after_flatten, "flatten should call itself."
    assert "while" not in SOURCE, "This lesson is about recursion, so no while loops."
```

```text hint
`count_down` returns `[]` when n is below 1. Otherwise it returns `[n]` joined
to the answer for `n - 1`.
```

```text hint
Two lists join with `+`, so `[n] + count_down(n - 1)` builds the result.
```

```text hint
For `flatten`, loop over the items and check each with
`isinstance(item, list)`. A list gets flattened and added; anything else gets
appended.
```
