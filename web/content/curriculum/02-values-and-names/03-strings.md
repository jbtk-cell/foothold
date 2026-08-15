---
title: Working with Text
goal: Join text together, measure it, and change its case.
estimate: 7
concepts:
  - strings
  - methods
---

A **string** is a piece of text. Single or double quotes both work, as long as
you close with the same one you opened with.

```python
greeting = "hello"
name = 'Ada'
```

Use double quotes if the text contains an apostrophe, and you avoid a
headache:

```python
print("it's fine")
```

## Joining and repeating

`+` between two strings glues them together. `*` with a number repeats them.

```python
print("foot" + "hold")
print("-" * 20)
```

`+` will not glue a string to a number. `"age: " + 30` is a `TypeError`,
because Python refuses to guess whether you meant the text `"30"` or arithmetic.
You will meet the fix in the next lesson.

## Asking a string about itself

`len()` gives the number of characters:

```python
print(len("Reykjavik"))
```

Strings also carry a set of built-in abilities called **methods**. You call
one by putting a dot after the string, then the method name, then parentheses.

```python
loud = "hello".upper()
print(loud)
```

The handful worth knowing now:

| Method | What it does |
| --- | --- |
| `.upper()` | ALL CAPS |
| `.lower()` | all lowercase |
| `.title()` | Capitalises Each Word |
| `.strip()` | removes spaces from both ends |
| `.replace(a, b)` | swaps every `a` for `b` |

An important thing about all of these: they do not change the original
string. They hand you back a new one. Strings in Python cannot be modified in
place, so `text.upper()` on its own accomplishes nothing - you have to keep
the result.

```python
name = "ada"
name.upper()
print(name)

name = name.upper()
print(name)
```

## Your turn

`raw` below is a name someone typed carelessly. Clean it up and print:

```
Name: Ada Lovelace
Letters: 12
```

The count is the length of the cleaned-up name, including the space.

```python starter
raw = "   ada LOVELACE   "

# Clean it up, then print the two lines.
```

```python solution
raw = "   ada LOVELACE   "

name = raw.strip().title()
print("Name:", name)
print("Letters:", len(name))
```

```python tests
def test_output():
    """It prints the cleaned name and its length"""
    expect_output("Name: Ada Lovelace\nLetters: 12")

def test_cleaned_not_retyped():
    """The name is cleaned, not typed out again"""
    after = SOURCE.split("raw =", 1)[-1].split("\n", 1)[-1]
    assert "Ada Lovelace" not in after, (
        "Build the clean name from `raw` using .strip() and .title() rather than "
        "typing it out - the point is that it would work on any messy name."
    )

def test_length_is_measured():
    """The length is measured with len()"""
    assert "len(" in SOURCE, "Use len() to count the characters rather than typing 12."
```

```text hint
`.strip()` removes the spaces at the ends. `.title()` fixes the capitalisation.
```

```text hint
Methods can be chained: `raw.strip().title()` does both, left to right.
```

```text hint
Store the result - `name = raw.strip().title()` - then use `len(name)`.
```
