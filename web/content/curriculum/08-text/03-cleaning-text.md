---
title: Cleaning Up Real Input
goal: Normalise messy text so that comparisons work.
estimate: 9
concepts:
  - normalisation
  - practice
---

People type inconsistently. `"Ada"`, `"ada"`, `" ADA "` and `"ada "` are four
different strings and one human being. Before comparing, counting, or storing
text, you normalise it - put it into one consistent form.

The standard recipe:

```python
clean = raw.strip().lower()
```

Strip the ends, force one case. That alone fixes most of it.

For text with internal mess, `.replace()` and `.split()` do the rest:

```python
messy = "hello,   world"
tidy = " ".join(messy.replace(",", " ").split())
```

`.split()` with no argument collapses any run of whitespace, so
`" ".join(text.split())` is the idiomatic way to squeeze out repeated spaces.

## Removing punctuation

```python
text = "Well, hello! Hello?"
for mark in ",.!?":
    text = text.replace(mark, "")
print(text)
```

Each pass hands back a new string, which is why the result is reassigned each
time. Forgetting that assignment is the classic bug here - `text.replace(...)`
on its own changes nothing.

## Why it matters

Compare these two counts of the same sentence:

```python
words = "The cat sat. The CAT sat!".split()
```

Without cleaning you get four different words where there are two. With
cleaning, the counts are right.

## Your turn

Write `word_count(text)` that returns a dictionary of word counts, ignoring
case and the punctuation `,.!?`.

For `"The cat sat. The CAT sat!"` it returns:

```python
{'the': 2, 'cat': 2, 'sat': 2}
```

Then print the counts for the sample, one per line, in the order the words
first appear:

```
the: 2
cat: 2
sat: 2
```

```python starter
def word_count(text):
    # Clean the text, split it, and count the words.
    return {}


sample = "The cat sat. The CAT sat!"
counts = word_count(sample)

for word, count in counts.items():
    print(f"{word}: {count}")
```

```python solution
def word_count(text):
    """Return a dictionary of word counts, ignoring case and punctuation."""
    cleaned = text.lower()
    for mark in ",.!?":
        cleaned = cleaned.replace(mark, "")

    counts = {}
    for word in cleaned.split():
        counts[word] = counts.get(word, 0) + 1
    return counts


sample = "The cat sat. The CAT sat!"
counts = word_count(sample)

for word, count in counts.items():
    print(f"{word}: {count}")
```

```python tests
def test_sample():
    """It counts the sample correctly"""
    expect_calling("word_count", ("The cat sat. The CAT sat!",), {"the": 2, "cat": 2, "sat": 2})

def test_ignores_case():
    """Case is ignored"""
    expect_calling("word_count", ("Dog DOG dog",), {"dog": 3})

def test_ignores_punctuation():
    """Punctuation is stripped"""
    expect_calling("word_count", ("hi, hi! hi?",), {"hi": 3})

def test_empty():
    """Empty text gives an empty dictionary"""
    expect_calling("word_count", ("",), {})

def test_collapses_spaces():
    """Runs of spaces do not create empty words"""
    expect_calling("word_count", ("a    a",), {"a": 2})

def test_output():
    """It prints the counts"""
    expect_output("the: 2\ncat: 2\nsat: 2")
```

```text hint
Lowercase first, then remove the punctuation, then split.
```

```text hint
Loop over the characters `",.!?"` and `.replace` each one with `""` -
remembering to reassign the result each time.
```

```text hint
Count with the pattern from the dictionaries module:
`counts[word] = counts.get(word, 0) + 1`.
```
