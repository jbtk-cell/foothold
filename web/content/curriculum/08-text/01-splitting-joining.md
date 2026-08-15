---
title: Splitting and Joining
goal: Turn text into a list and a list back into text.
estimate: 8
concepts:
  - split
  - join
---

`.split()` cuts a string into a list.

```python
sentence = "the quick brown fox"
print(sentence.split())
```

With no argument it splits on whitespace and ignores runs of it, which is
exactly what you want for words.

Give it an argument and it splits on that instead:

```python
row = "Ada,Lovelace,1815"
print(row.split(","))
```

That is how you read a line of a CSV file. Note that it does not strip spaces
around the pieces - `"a, b".split(",")` gives `['a', ' b']`, with the space
still attached.

## Joining

`.join()` is the reverse, and its shape surprises people: the **separator**
goes on the outside.

```python
words = ["the", "quick", "fox"]
print(" ".join(words))
print("-".join(words))
```

Read `" ".join(words)` as "join these words with a space between them". It
seems backwards until you notice that the separator is the constant and the
list is the variable.

`.join` only works on a list of strings. Numbers need converting first:

```python
numbers = [1, 2, 3]
print(", ".join(str(n) for n in numbers))
```

## Splitting only so far

A second argument limits how many cuts are made:

```python
line = "name: Ada: the first"
print(line.split(":", 1))
```

That gives `['name', ' Ada: the first']` - useful when only the first
separator is a separator and the rest are part of the value.

## Lines

`.splitlines()` splits on newlines, which is what you want after reading a
file.

## Your turn

Take the raw CSV row below and print:

```
Name: Ada Lovelace
Born: 1815
Fields: mathematics | computing
```

The fields are separated by semicolons inside the last column, and everything
has stray spaces around it that need removing.

```python starter
row = " Ada Lovelace , 1815 , mathematics; computing "

# Split it up, clean each piece, and print the three lines.
```

```python solution
row = " Ada Lovelace , 1815 , mathematics; computing "

name, born, fields = [part.strip() for part in row.split(",")]
field_list = [field.strip() for field in fields.split(";")]

print(f"Name: {name}")
print(f"Born: {born}")
print(f"Fields: {' | '.join(field_list)}")
```

```python tests
def test_output():
    """It prints the three cleaned lines"""
    expect_output("Name: Ada Lovelace\nBorn: 1815\nFields: mathematics | computing")

def test_uses_split():
    """The row is split rather than read by hand"""
    assert ".split(" in SOURCE, "Use .split(',') to cut the row into its columns."

def test_uses_join():
    """The fields are joined"""
    assert ".join(" in SOURCE, (
        "Build the Fields line with .join() rather than writing the separator by hand."
    )

def test_strips_whitespace():
    """The stray spaces are removed"""
    assert ".strip()" in SOURCE, "Use .strip() to remove the spaces around each piece."

def test_not_hardcoded():
    """The values come from the row"""
    after = SOURCE.split("row =", 1)[-1].split("\n", 1)[-1]
    assert "Ada Lovelace" not in after, (
        "Pull the name out of `row` rather than typing it again."
    )
```

```text hint
`row.split(",")` gives you three pieces, each with spaces around it.
```

```text hint
A comprehension cleans them all at once:
`[part.strip() for part in row.split(",")]`. Three names on the left of the
`=` will unpack the three pieces.
```

```text hint
The last piece splits again on `";"`, and the pieces join back together with
`" | ".join(...)`.
```
