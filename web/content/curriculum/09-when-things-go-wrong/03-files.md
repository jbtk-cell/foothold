---
title: Reading and Writing Files
goal: Save something to disk and read it back.
estimate: 9
concepts:
  - files
  - with
---

Everything your programs have made so far vanished when they finished. Files
are how work survives.

```python
with open("notes.txt", "w") as file:
    file.write("first line\n")
    file.write("second line\n")
```

`open` takes a filename and a mode:

| Mode | Means |
| --- | --- |
| `"r"` | read (the default) |
| `"w"` | write, replacing anything already there |
| `"a"` | append to the end |

**`"w"` deletes the existing contents.** There is no warning and no undo.

`write` does not add a newline. If you want one, put `\n` in yourself - which
is why the lines above end that way.

## The with statement

`with` is doing real work here: it closes the file when the block ends, even
if an error is raised inside. Files left open lose data that is still sitting
in a buffer, so always open files this way.

## Reading

```python
with open("notes.txt") as file:
    contents = file.read()
print(contents)
```

`.read()` gives you the whole file as one string. For line-by-line work, loop
over the file directly:

```python
with open("notes.txt") as file:
    for line in file:
        print(line.rstrip())
```

Each line still has its newline attached, hence the `.rstrip()`. Reading a
file this way handles one line at a time, so it works on a file too big to fit
in memory.

`.readlines()` gives you a list of all the lines at once.

## When the file is not there

```python
try:
    with open("missing.txt") as file:
        contents = file.read()
except FileNotFoundError:
    contents = ""
```

> Foothold gives your program a private folder to work in, and clears it
> between runs. Write whatever files you like - nothing on your computer is
> touched.

## Your turn

Write two functions:

- `save(filename, lines)` writes each item of `lines` on its own line
- `load(filename)` returns the lines as a list with no newline characters, or
  an empty list if the file does not exist

Then use them to produce exactly:

```
['milk', 'bread', 'jam']
[]
```

```python starter
def save(filename, lines):
    pass


def load(filename):
    pass


save("shopping.txt", ["milk", "bread", "jam"])
print(load("shopping.txt"))
print(load("nothing-here.txt"))
```

```python solution
def save(filename, lines):
    """Write each line to the file, one per line."""
    with open(filename, "w") as file:
        for line in lines:
            file.write(line + "\n")


def load(filename):
    """Return the file's lines as a list, or [] if it is not there."""
    try:
        with open(filename) as file:
            return [line.rstrip("\n") for line in file]
    except FileNotFoundError:
        return []


save("shopping.txt", ["milk", "bread", "jam"])
print(load("shopping.txt"))
print(load("nothing-here.txt"))
```

```python tests
def test_round_trip():
    """What is saved comes back"""
    save = expect_defined("save")
    load = expect_defined("load")
    save("round-trip.txt", ["a", "b"])
    expect_equal(load("round-trip.txt"), ["a", "b"], "saving then loading")

def test_missing_file():
    """A missing file gives an empty list"""
    expect_calling("load", ("definitely-not-here.txt",), [])

def test_newlines_stripped():
    """The loaded lines have no newline characters"""
    load = expect_defined("load")
    lines = load("shopping.txt")
    for line in lines:
        assert "\n" not in line, (
            "The line " + repr(line) + " still has its newline. Use .rstrip() or "
            ".rstrip('\\n') on each line."
        )

def test_file_on_disk():
    """save really writes a file"""
    with open("shopping.txt") as file:
        expect_equal(file.read(), "milk\nbread\njam\n", "the file on disk")

def test_uses_with():
    """Files are opened with `with`"""
    assert "with open" in SOURCE, (
        "Open files with `with open(...) as file:` so they are always closed."
    )

def test_output():
    """It prints the loaded list and the empty one"""
    expect_output("['milk', 'bread', 'jam']\n[]")
```

```text hint
In `save`, open with mode `"w"` and loop over the lines, writing
`line + "\n"` each time.
```

```text hint
In `load`, looping over the open file gives you the lines. Strip the newline
off each one.
```

```text hint
Wrap the whole of `load` in a try and return `[]` from
`except FileNotFoundError:`.
```
