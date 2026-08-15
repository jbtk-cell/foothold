---
title: Going Through a Dictionary
goal: Loop over pairs, and count things with a dictionary.
estimate: 8
concepts:
  - dictionaries
  - loops
---

Looping over a dictionary directly gives you the **keys**:

```python
prices = {"notebook": 3, "pen": 1}

for item in prices:
    print(item, prices[item])
```

That works, but there is a better way. `.items()` hands you both at once:

```python
for item, price in prices.items():
    print(f"{item}: {price}")
```

Two loop variables, because each item is a pair. This is the standard way to
walk a dictionary and you should reach for it by default.

Dictionaries remember the order things were added, so the output order is
predictable.

## Counting things

This is the job dictionaries are best at, and it comes up constantly.

```python
votes = ["red", "blue", "red", "green", "red"]
counts = {}

for vote in votes:
    counts[vote] = counts.get(vote, 0) + 1

print(counts)
```

That prints `{'red': 3, 'blue': 1, 'green': 1}`.

The whole trick is `counts.get(vote, 0) + 1`: *whatever the count is now, or
zero if we have never seen this before, plus one.* Without `.get` you would
need an `if` to handle the first sighting of each value.

## Finding the biggest

```python
winner = max(counts, key=counts.get)
```

`max` over a dictionary looks at the keys; `key=counts.get` tells it to
compare them by their values instead. Read it as "the key with the largest
count".

## Your turn

Count the letters in a word and report the results.

Print each letter and its count, in the order the letters first appear, then
the most common one:

```
b: 1
a: 3
n: 2
Most common: a
```

```python starter
word = "banana"

# Count the letters, print each, then the most common.
```

```python solution
word = "banana"

counts = {}
for letter in word:
    counts[letter] = counts.get(letter, 0) + 1

for letter, count in counts.items():
    print(f"{letter}: {count}")

print(f"Most common: {max(counts, key=counts.get)}")
```

```python tests
def test_output():
    """It counts the letters and names the most common"""
    expect_output("b: 1\na: 3\nn: 2\nMost common: a")

def test_counts_dictionary():
    """A dictionary of counts is built"""
    scope = {name: value for name, value in globals().items() if isinstance(value, dict)}
    assert any(value == {"b": 1, "a": 3, "n": 2} for value in scope.values()), (
        "Build a dictionary mapping each letter to how many times it appears."
    )

def test_uses_a_loop():
    """The counting is done with a loop"""
    assert "for " in SOURCE, "Count the letters with a loop over the word."

def test_not_hardcoded():
    """The counts are computed"""
    assert '"b": 1' not in SOURCE and "'b': 1" not in SOURCE, (
        "Let the loop build the counts rather than typing the dictionary out."
    )
```

```text hint
Looping over a string gives you one character at a time:
`for letter in word:`.
```

```text hint
The counting line is `counts[letter] = counts.get(letter, 0) + 1`.
```

```text hint
Print the pairs with `for letter, count in counts.items():`, and find the
winner with `max(counts, key=counts.get)`.
```
