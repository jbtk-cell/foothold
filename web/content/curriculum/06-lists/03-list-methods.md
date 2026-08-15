---
title: Changing a List
goal: Add, remove, sort and search a list.
estimate: 8
concepts:
  - list methods
---

Lists come with methods that change them in place.

```python
stack = []
stack.append("a")
stack.append("b")
print(stack)
```

| Method | What it does |
| --- | --- |
| `.append(x)` | add x to the end |
| `.insert(i, x)` | put x at position i |
| `.remove(x)` | delete the first x (`ValueError` if absent) |
| `.pop()` | remove and return the last item |
| `.pop(i)` | remove and return the item at i |
| `.sort()` | sort in place |
| `.reverse()` | reverse in place |
| `.count(x)` | how many times x appears |
| `.index(x)` | the position of the first x |

## Changing versus returning

This catches everyone once:

```python
names = ["Zoe", "Ada"]
sorted_names = names.sort()
print(sorted_names)
```

That prints `None`. `.sort()` sorts the list itself and returns nothing. The
line above threw the list away and kept the nothing.

Two correct versions:

```python
names.sort()
print(names)

print(sorted(names))
```

`sorted()` is the built-in that leaves the original alone and hands back a new
sorted list. The same distinction applies to `.reverse()` versus `reversed()`.

## Checking membership

`in` works on lists, and it reads exactly like English:

```python
if "Ada" in names:
    print("found")
```

## Building a list in a loop

The accumulator pattern with a list instead of a number:

```python
squares = []
for n in range(1, 6):
    squares.append(n * n)
print(squares)
```

## Your turn

Starting from the list below:

1. add `"fig"` to the end
2. remove `"kiwi"`
3. sort what is left
4. print the sorted list, then the first item, then how many are left

```
['apple', 'fig', 'pear', 'plum']
apple
4
```

```python starter
fruit = ["pear", "kiwi", "apple", "plum"]

# Add, remove, sort, then print the three lines.
```

```python solution
fruit = ["pear", "kiwi", "apple", "plum"]

fruit.append("fig")
fruit.remove("kiwi")
fruit.sort()

print(fruit)
print(fruit[0])
print(len(fruit))
```

```python tests
def test_output():
    """It prints the sorted list, the first item and the count"""
    expect_output("['apple', 'fig', 'pear', 'plum']\napple\n4")

def test_list_was_modified():
    """The original list ends up in the right state"""
    value = expect_defined("fruit", "list")
    expect_equal(value, ["apple", "fig", "pear", "plum"], "the fruit list")

def test_uses_the_methods():
    """The changes are made with list methods"""
    for method in ("append", "remove", "sort"):
        assert "." + method in SOURCE, (
            "Use ." + method + "() rather than building a new list by hand."
        )
```

```text hint
Each step is one line: `fruit.append("fig")`, and so on.
```

```text hint
`.sort()` changes the list and returns nothing, so write it on a line of its
own - do not assign the result to anything.
```

```text hint
After sorting, `fruit[0]` is the first item and `len(fruit)` is the count.
```
