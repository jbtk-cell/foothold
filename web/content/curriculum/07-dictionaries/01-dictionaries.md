---
title: Looking Things Up
goal: Store pairs of keys and values, and get a value back by its key.
estimate: 8
concepts:
  - dictionaries
---

A dictionary stores **pairs**: a key, and the value that belongs to it.

```python
prices = {"notebook": 3, "pen": 1, "rope": 12}
print(prices["pen"])
```

Curly braces, `key: value`, separated by commas. You look a value up by its
key, in square brackets - the same syntax as a list, but with a meaningful
name instead of a position.

Keys are usually strings, and must be unique. Values can be anything at all,
including lists and other dictionaries.

## Adding and changing

```python
prices["chalk"] = 4
prices["pen"] = 2
```

There is no separate "add" and "update" - assigning to a key creates it if it
is missing and replaces it if it is not.

## Missing keys

```python
print(prices["hammer"])
```

That is a `KeyError`. Two ways to avoid it.

Check first:

```python
if "hammer" in prices:
    print(prices["hammer"])
```

Or use `.get()`, which returns `None` for a missing key rather than raising -
and lets you supply a fallback:

```python
print(prices.get("hammer"))
print(prices.get("hammer", 0))
```

`.get(key, default)` is the workhorse. Reach for it whenever the key might
legitimately be absent.

## Removing

```python
del prices["chalk"]
```

## Useful methods

| Method | Gives you |
| --- | --- |
| `.keys()` | all the keys |
| `.values()` | all the values |
| `.items()` | key-value pairs |
| `.get(k, default)` | the value, or the default |
| `.pop(k)` | the value, and removes it |

`len(prices)` is the number of pairs, and `"pen" in prices` checks the keys,
not the values.

## Your turn

Complete the stock system below. Print exactly:

```
Pens in stock: 12
Rope in stock: 0
Items tracked: 4
```

Add `"chalk": 30` to the dictionary first. Use `.get()` for the rope, which is
deliberately not in stock.

```python starter
stock = {"pen": 12, "notebook": 4, "eraser": 7}

# Add chalk, then print the three lines.
```

```python solution
stock = {"pen": 12, "notebook": 4, "eraser": 7}

stock["chalk"] = 30

print(f"Pens in stock: {stock['pen']}")
print(f"Rope in stock: {stock.get('rope', 0)}")
print(f"Items tracked: {len(stock)}")
```

```python tests
def test_chalk_added():
    """Chalk is added to the stock"""
    value = expect_defined("stock", "dictionary")
    assert "chalk" in value, "Add chalk to the dictionary with stock['chalk'] = 30."
    expect_equal(value["chalk"], 30, "the chalk count")

def test_output():
    """It prints the three lines"""
    expect_output("Pens in stock: 12\nRope in stock: 0\nItems tracked: 4")

def test_uses_get_for_missing_key():
    """The missing key is handled with .get()"""
    assert ".get(" in SOURCE, (
        "There is no rope in the dictionary, so stock['rope'] would raise a KeyError. "
        "Use .get('rope', 0) instead."
    )

def test_count_is_measured():
    """The count comes from the dictionary"""
    assert "len(" in SOURCE, "Use len(stock) rather than typing 4."
```

```text hint
`stock["chalk"] = 30` adds the pair.
```

```text hint
Inside an f-string, use a different quote for the key than the one around the
string: `f"...{stock['pen']}..."`.
```

```text hint
`stock.get('rope', 0)` gives 0 because rope is not there.
```
