---
title: Making It Survive
goal: Save the tasks to disk and load them back, including the parts JSON cannot hold.
estimate: 11
concepts:
  - json
  - dataclasses
  - project
---

The tracker forgets everything when the program ends. JSON fixes that, with
one complication worth understanding.

JSON holds objects, arrays, strings, numbers, booleans and null. A `Task` is
none of those, and neither is a `date`. Both have to be converted on the way
out and rebuilt on the way in.

```python
from dataclasses import asdict

print(asdict(task))
```

`asdict` turns a dataclass into a plain dictionary, which gets you most of the
way. The date inside it is still a date, so it needs converting too:
`created.isoformat()` gives `"2026-08-17"`, and `date.fromisoformat(...)`
turns it back.

## Handle a missing file, and a corrupt one

Storage code fails in ways the rest of the program does not: the file is not
there yet, or something wrote nonsense into it. Both are ordinary situations
rather than bugs, so handle them and carry on with an empty list.

## Your turn

Write two functions.

- `save(tasks, filename)` writes a JSON array of task objects, with `created`
  as an ISO date string
- `load(filename)` reads them back as `Task` objects with a real `date`,
  returning `[]` for a missing file and for one that does not parse

A task that survives the round trip must compare equal to the one that went
in.

Expected output:

```
2
True
buy rope 2026-08-17
[]
[]
```

```python starter
import json
from dataclasses import dataclass, asdict
from datetime import date


@dataclass
class Task:
    title: str
    priority: str = "normal"
    done: bool = False
    created: date = date(2026, 1, 1)


# Write save and load below.


tasks = [
    Task("buy rope", "high", False, date(2026, 8, 17)),
    Task("write lesson", "normal", True, date(2026, 8, 1)),
]

save(tasks, "tasks.json")
restored = load("tasks.json")
print(len(restored))
print(restored == tasks)
print(restored[0].title, restored[0].created)
print(load("no-such-file.json"))

with open("broken.json", "w") as file:
    file.write("[[[not json")
print(load("broken.json"))
```

```python solution
import json
from dataclasses import dataclass, asdict
from datetime import date


@dataclass
class Task:
    title: str
    priority: str = "normal"
    done: bool = False
    created: date = date(2026, 1, 1)


def save(tasks, filename):
    """Write the tasks as a JSON array, dates as ISO strings."""
    rows = []
    for task in tasks:
        row = asdict(task)
        row["created"] = task.created.isoformat()
        rows.append(row)

    with open(filename, "w") as file:
        json.dump(rows, file, indent=2)


def load(filename):
    """Read the tasks back, or return [] if that is not possible."""
    try:
        with open(filename) as file:
            rows = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

    tasks = []
    for row in rows:
        row = dict(row)
        row["created"] = date.fromisoformat(row["created"])
        tasks.append(Task(**row))
    return tasks


tasks = [
    Task("buy rope", "high", False, date(2026, 8, 17)),
    Task("write lesson", "normal", True, date(2026, 8, 1)),
]

save(tasks, "tasks.json")
restored = load("tasks.json")
print(len(restored))
print(restored == tasks)
print(restored[0].title, restored[0].created)
print(load("no-such-file.json"))

with open("broken.json", "w") as file:
    file.write("[[[not json")
print(load("broken.json"))
```

```python tests
from datetime import date as _date

def sample():
    cls = expect_defined("Task", "class")
    return [
        cls("one", "high", False, _date(2026, 5, 1)),
        cls("two", "low", True, _date(2020, 1, 31)),
    ]

def test_round_trip_equality():
    """What comes back equals what went in"""
    save, load = expect_defined("save"), expect_defined("load")
    original = sample()
    save(original, "rt.json")
    expect_equal(load("rt.json"), original, "the tasks after a save and load")

def test_dates_are_real_dates():
    """created comes back as a date, not a string"""
    save, load = expect_defined("save"), expect_defined("load")
    save(sample(), "dates.json")
    restored = load("dates.json")
    expect_equal(type(restored[0].created), _date, "the type of created")
    expect_equal(restored[0].created, _date(2026, 5, 1), "the restored date")

def test_file_is_json():
    """The file on disk is a valid JSON array"""
    import json as _json
    expect_defined("save")(sample(), "check.json")
    with open("check.json") as file:
        rows = _json.load(file)
    expect_equal(type(rows), list, "the top level of the file")
    expect_equal(len(rows), 2, "how many rows were written")
    expect_equal(rows[0]["created"], "2026-05-01", "the date, as stored")
    expect_equal(rows[0]["done"], False, "the done flag, as stored")

def test_missing_file():
    """A missing file loads as an empty list"""
    expect_calling("load", ("definitely-not-here.json",), [])

def test_corrupt_file():
    """A corrupt file loads as an empty list"""
    with open("junk.json", "w") as file:
        file.write("}}not json{{")
    expect_calling("load", ("junk.json",), [])

def test_empty_round_trip():
    """Saving nothing and loading it back gives nothing"""
    save, load = expect_defined("save"), expect_defined("load")
    save([], "empty.json")
    expect_equal(load("empty.json"), [], "an empty task list")

def test_output():
    """The five lines print"""
    expect_output("2\nTrue\nbuy rope 2026-08-17\n[]\n[]")
```

```text hint
`asdict(task)` gives you a dictionary. Replace its `created` with
`task.created.isoformat()` before writing.
```

```text hint
Loading is the reverse: `date.fromisoformat(row["created"])`, then build the
task. `Task(**row)` unpacks a dictionary into the keyword arguments.
```

```text hint
Catch both failures in one line: `except (FileNotFoundError, json.JSONDecodeError):`
and return an empty list.
```
