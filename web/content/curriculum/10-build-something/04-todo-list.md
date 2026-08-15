---
title: A To-Do List That Remembers
goal: Build a complete program - data, functions, files and error handling together.
estimate: 14
concepts:
  - project
  - files
  - functions
---

The final one. A to-do list that survives being closed, which means everything
in this course at once: a list of dictionaries for the data, functions for the
operations, a file to persist it, and error handling for the things that can
go wrong.

Think about the pieces before you write any of them:

- what does one task look like? (a dictionary with a title and a done flag)
- what can you do to the list? (add, complete, format for display)
- how does it get to disk and back? (one line per task, done flag included)

Each of those is a function of a few lines. Written separately they are easy;
written as one blob they are not.

## The storage format

Keep it simple and readable - one task per line, the flag and the title
separated by a `|`:

```
1|buy rope
0|write lesson
```

`1` means done, `0` means not. A format you can read in a text editor is worth
a great deal when something goes wrong.

## Your turn

Write four functions:

- `add(tasks, title)` appends `{"title": title, "done": False}` and returns the list
- `complete(tasks, title)` sets `done` to `True` for the matching task and
  returns `True`, or returns `False` if there is no such task
- `save(tasks, filename)` writes the file in the format above
- `load(filename)` reads it back into the same list of dictionaries, returning
  `[]` if the file does not exist

Then produce exactly this output:

```
[ ] buy rope
[x] write lesson
[ ] pack bag
2 of 3 remaining
Reloaded: 3 tasks
Unknown task: False
```

```python starter
def add(tasks, title):
    pass


def complete(tasks, title):
    pass


def save(tasks, filename):
    pass


def load(filename):
    pass


tasks = []
add(tasks, "buy rope")
add(tasks, "write lesson")
add(tasks, "pack bag")
complete(tasks, "write lesson")

# Print each task, the count, then save, reload, and report.
```

```python solution
def add(tasks, title):
    """Append a new, incomplete task and return the list."""
    tasks.append({"title": title, "done": False})
    return tasks


def complete(tasks, title):
    """Mark a task done. Return True if it was found."""
    for task in tasks:
        if task["title"] == title:
            task["done"] = True
            return True
    return False


def save(tasks, filename):
    """Write the tasks, one per line, as done-flag|title."""
    with open(filename, "w") as file:
        for task in tasks:
            flag = 1 if task["done"] else 0
            file.write(f"{flag}|{task['title']}\n")


def load(filename):
    """Read the tasks back, or return [] if the file is not there."""
    try:
        with open(filename) as file:
            tasks = []
            for line in file:
                line = line.rstrip("\n")
                if not line:
                    continue
                flag, title = line.split("|", 1)
                tasks.append({"title": title, "done": flag == "1"})
            return tasks
    except FileNotFoundError:
        return []


tasks = []
add(tasks, "buy rope")
add(tasks, "write lesson")
add(tasks, "pack bag")
complete(tasks, "write lesson")

for task in tasks:
    mark = "x" if task["done"] else " "
    print(f"[{mark}] {task['title']}")

remaining = len([task for task in tasks if not task["done"]])
print(f"{remaining} of {len(tasks)} remaining")

save(tasks, "todo.txt")
reloaded = load("todo.txt")
print(f"Reloaded: {len(reloaded)} tasks")

print(f"Unknown task: {complete(tasks, 'no such thing')}")
```

```python tests
def test_add():
    """add() appends a task in the right shape"""
    add = expect_defined("add")
    tasks = []
    add(tasks, "one")
    expect_equal(tasks, [{"title": "one", "done": False}], "after adding one task")

def test_complete_found():
    """complete() marks a task and reports success"""
    add = expect_defined("add")
    complete = expect_defined("complete")
    tasks = []
    add(tasks, "one")
    expect_equal(complete(tasks, "one"), True, "completing a task that exists")
    expect_equal(tasks[0]["done"], True, "the done flag")

def test_complete_missing():
    """complete() reports failure for an unknown task"""
    complete = expect_defined("complete")
    expect_equal(complete([], "nope"), False, "completing a task that does not exist")

def test_round_trip():
    """Saving and loading preserves the tasks"""
    save = expect_defined("save")
    load = expect_defined("load")
    original = [{"title": "a", "done": True}, {"title": "b", "done": False}]
    save(original, "round-trip.txt")
    expect_equal(load("round-trip.txt"), original, "saving then loading")

def test_titles_with_pipes_or_spaces():
    """Titles with awkward characters survive the round trip"""
    save = expect_defined("save")
    load = expect_defined("load")
    tricky = [{"title": "buy rope | and chalk", "done": False}]
    save(tricky, "tricky.txt")
    expect_equal(load("tricky.txt"), tricky, "a title containing a pipe")

def test_missing_file():
    """Loading a missing file gives an empty list"""
    expect_calling("load", ("definitely-not-here.txt",), [])

def test_file_format():
    """The file is written in the documented format"""
    with open("todo.txt") as file:
        contents = file.read()
    expect_equal(contents, "0|buy rope\n1|write lesson\n0|pack bag\n", "the saved file")

def test_output():
    """The whole program prints the expected report"""
    expect_output(
        "[ ] buy rope\n"
        "[x] write lesson\n"
        "[ ] pack bag\n"
        "2 of 3 remaining\n"
        "Reloaded: 3 tasks\n"
        "Unknown task: False"
    )
```

```text hint
`add` is two lines: append the dictionary, return the list. Note that it
changes the list it was given - lists are passed by reference, so the caller
sees the change.
```

```text hint
In `complete`, loop over the tasks looking for a matching title. Return True
as soon as you find one; if the loop finishes without a match, return False.
```

```text hint
When loading, `line.split("|", 1)` splits on the *first* pipe only, so a task
whose title contains a pipe still survives. The flag is text, so compare it:
`flag == "1"`.
```
