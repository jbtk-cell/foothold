---
title: Tools for Counting
goal: Replace hand-written counting loops with the collections module.
estimate: 8
concepts:
  - collections
  - Counter
---

You wrote this loop back in the dictionaries module:

```python
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1
```

It is worth having written once. Now stop writing it.

```python
from collections import Counter

counts = Counter(words)
```

`Counter` is a dictionary that counts. Hand it any sequence and it tallies the
items.

```python
from collections import Counter

votes = ["red", "blue", "red", "green", "red"]
counts = Counter(votes)

print(counts)
print(counts["red"])
print(counts["purple"])
print(counts.most_common(2))
```

Three things there are worth noticing.

Asking for a key it has never seen returns `0` rather than raising a
`KeyError`, so no `.get` is needed.

`most_common(n)` returns the top n as a list of `(item, count)` pairs, already
sorted. Writing that by hand takes four lines and a `lambda`.

A Counter is still a dictionary, so `.items()`, `in`, and everything else you
know still works.

## defaultdict

The related tool is for grouping. Building a dictionary of lists by hand needs
a check on every insert:

```python
groups = {}
for word in words:
    letter = word[0]
    if letter not in groups:
        groups[letter] = []
    groups[letter].append(word)
```

`defaultdict` supplies the empty list itself:

```python
from collections import defaultdict

groups = defaultdict(list)
for word in words:
    groups[word[0]].append(word)
```

The argument is what to call when a key is missing: `list` for an empty list,
`int` for zero, `set` for an empty set.

## Your turn

Analyse a sentence.

- `word_counts(text)` returns a `Counter` of the lowercased words
- `top_word(text)` returns the most common word
- `by_letter(text)` returns a plain dictionary mapping each first letter to a
  sorted list of the distinct words starting with it

Print, for the sample:

```
3
the
['brown', 'blue']
```

The first line is how many times `the` appears, then the most common word,
then the words starting with `b` in the order they first appear.

```python starter
from collections import Counter, defaultdict

sample = "the quick brown fox the lazy blue dog the end"

# Write the three functions, then print the three lines.
```

```python solution
from collections import Counter, defaultdict

sample = "the quick brown fox the lazy blue dog the end"


def word_counts(text):
    """Return a Counter of the lowercased words."""
    return Counter(text.lower().split())


def top_word(text):
    """Return the most common word."""
    return word_counts(text).most_common(1)[0][0]


def by_letter(text):
    """Group the distinct words by their first letter."""
    groups = defaultdict(list)
    for word in text.lower().split():
        if word not in groups[word[0]]:
            groups[word[0]].append(word)
    return dict(groups)


print(word_counts(sample)["the"])
print(top_word(sample))
print(by_letter(sample)["b"])
```

```python tests
def test_word_counts():
    """word_counts tallies the words"""
    counts = expect_defined("word_counts")("a b a")
    expect_equal(counts["a"], 2, "the count of 'a'")
    expect_equal(counts["b"], 1, "the count of 'b'")

def test_counts_are_case_insensitive():
    """Case is folded before counting"""
    counts = expect_defined("word_counts")("The the THE")
    expect_equal(counts["the"], 3, "the count of 'the' across three capitalisations")

def test_missing_word_is_zero():
    """An absent word counts zero rather than raising"""
    counts = expect_defined("word_counts")("a b")
    expect_equal(counts["zebra"], 0, "the count of a word that is not there")

def test_top_word():
    """top_word finds the most common"""
    expect_calling("top_word", ("a b a c a",), "a")
    expect_calling("top_word", ("only",), "only")

def test_by_letter():
    """by_letter groups distinct words by first letter"""
    groups = expect_defined("by_letter")("apple ant bee apple")
    expect_equal(groups["a"], ["apple", "ant"], "the words starting with 'a'")
    expect_equal(groups["b"], ["bee"], "the words starting with 'b'")

def test_by_letter_returns_plain_dict():
    """by_letter hands back an ordinary dictionary"""
    groups = expect_defined("by_letter")("a b")
    expect_equal(type(groups), dict, "the type returned by by_letter")

def test_uses_the_module():
    """The collections module does the work"""
    assert "Counter(" in SOURCE, "Use Counter rather than counting by hand."
    assert "defaultdict(" in SOURCE, "Use defaultdict for the grouping."

def test_output():
    """The three lines print"""
    expect_output("3\nthe\n['brown', 'blue']")
```

```text hint
`Counter(text.lower().split())` is the whole of `word_counts`.
```

```text hint
`most_common(1)` gives `[('the', 3)]`. The word is `[0][0]`.
```

```text hint
For `by_letter`, use `defaultdict(list)` and skip a word when it is already in
its group. Convert with `dict(groups)` before returning.
```
