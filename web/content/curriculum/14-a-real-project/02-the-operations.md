---
title: The Operations
goal: Write the functions that change and query a list of tasks.
estimate: 11
concepts:
  - functions
  - sorting
  - project
---

With the shape of a task settled, the next layer is everything you can do to a
collection of them: add, complete, filter, count.

Keep this layer free of printing and free of files. Functions that take data
and return data can be tested one at a time and reused by any interface you
put on top, which is the point of separating them.

The one design decision worth making now: do these functions **change** the
list they are given, or return a new one?

Changing in place is what `list.append` does, and it is what most task
trackers want, because there is one list and everyone should see the same
version of it. Returning a new list is safer and costs a copy. This project
changes in place for the operations that alter tasks, and returns fresh lists
from the queries, which is the common arrangement.

## Your turn

The `Task` model is supplied. Write five functions.

- `add(tasks, title, priority="normal")` appends a new task and returns it
- `complete(tasks, title)` marks the first matching task done and returns
  `True`, or returns `False` when there is no match
- `pending(tasks)` returns the unfinished tasks, most urgent first, ties in
  the order added
- `counts(tasks)` returns a dictionary like `{"total": 3, "done": 1, "pending": 2}`
- `search(tasks, term)` returns the tasks whose title contains the term,
  ignoring case

Matching a title is exact and case-insensitive.

Expected output:

```
3
['pack bag', 'write lesson']
True
False
{'total': 3, 'done': 2, 'pending': 1}
['buy rope', 'write lesson']
```

```python starter
from dataclasses import dataclass

PRIORITY_ORDER = {"high": 0, "normal": 1, "low": 2}


@dataclass
class Task:
    title: str
    priority: str = "normal"
    done: bool = False


# Write add, complete, pending, counts and search below.


tasks = []
add(tasks, "buy rope", "high")
add(tasks, "write lesson")
add(tasks, "pack bag", "high")
print(len(tasks))

complete(tasks, "buy rope")
print([task.title for task in pending(tasks)])

print(complete(tasks, "write lesson"))
print(complete(tasks, "no such task"))
print(counts(tasks))
print([task.title for task in search(tasks, "E")])
```

```python solution
from dataclasses import dataclass

PRIORITY_ORDER = {"high": 0, "normal": 1, "low": 2}


@dataclass
class Task:
    title: str
    priority: str = "normal"
    done: bool = False


def add(tasks, title, priority="normal"):
    """Append a new task and hand it back."""
    task = Task(title=title, priority=priority)
    tasks.append(task)
    return task


def complete(tasks, title):
    """Mark the first matching task done. True if one was found."""
    for task in tasks:
        if task.title.lower() == title.lower():
            task.done = True
            return True
    return False


def pending(tasks):
    """Unfinished tasks, most urgent first."""
    unfinished = [task for task in tasks if not task.done]
    return sorted(unfinished, key=lambda task: PRIORITY_ORDER[task.priority])


def counts(tasks):
    """A tally of total, done and pending."""
    done = len([task for task in tasks if task.done])
    return {"total": len(tasks), "done": done, "pending": len(tasks) - done}


def search(tasks, term):
    """Tasks whose title contains term, ignoring case."""
    return [task for task in tasks if term.lower() in task.title.lower()]


tasks = []
add(tasks, "buy rope", "high")
add(tasks, "write lesson")
add(tasks, "pack bag", "high")
print(len(tasks))

complete(tasks, "buy rope")
print([task.title for task in pending(tasks)])

print(complete(tasks, "write lesson"))
print(complete(tasks, "no such task"))
print(counts(tasks))
print([task.title for task in search(tasks, "E")])
```

```python tests
def fresh():
    add = expect_defined("add")
    tasks = []
    add(tasks, "alpha", "low")
    add(tasks, "beta", "high")
    add(tasks, "gamma")
    return tasks

def test_add_returns_the_task():
    """add appends and hands the task back"""
    add = expect_defined("add")
    tasks = []
    task = add(tasks, "one", "high")
    expect_equal(len(tasks), 1, "the list length after adding")
    expect_equal(task.title, "one", "the returned task's title")
    expect_equal(task.priority, "high", "the returned task's priority")
    expect_equal(tasks[0].done, False, "a new task's done flag")

def test_complete_found_and_missing():
    """complete reports whether it found a match"""
    complete = expect_defined("complete")
    tasks = fresh()
    expect_equal(complete(tasks, "beta"), True, "completing an existing task")
    expect_equal(tasks[1].done, True, "the completed task's flag")
    expect_equal(complete(tasks, "nope"), False, "completing a task that is absent")

def test_complete_ignores_case():
    """Matching a title ignores case"""
    tasks = fresh()
    expect_equal(expect_defined("complete")(tasks, "BETA"), True, "completing 'BETA'")

def test_pending_orders_by_priority():
    """pending puts the urgent first and hides finished tasks"""
    tasks = fresh()
    expect_defined("complete")(tasks, "beta")
    titles = [task.title for task in expect_defined("pending")(tasks)]
    expect_equal(titles, ["gamma", "alpha"], "the pending titles")

def test_pending_keeps_insertion_order_within_a_priority():
    """Ties keep the order they were added in"""
    add = expect_defined("add")
    tasks = []
    add(tasks, "first", "high")
    add(tasks, "second", "high")
    titles = [task.title for task in expect_defined("pending")(tasks)]
    expect_equal(titles, ["first", "second"], "two tasks of equal priority")

def test_counts():
    """counts tallies the three numbers"""
    tasks = fresh()
    expect_defined("complete")(tasks, "alpha")
    expect_equal(expect_defined("counts")(tasks), {"total": 3, "done": 1, "pending": 2}, "the counts")
    expect_equal(expect_defined("counts")([]), {"total": 0, "done": 0, "pending": 0}, "an empty list")

def test_search():
    """search matches part of a title, ignoring case"""
    search = expect_defined("search")
    tasks = fresh()
    expect_equal([t.title for t in search(tasks, "a")], ["alpha", "beta", "gamma"], "searching for 'a'")
    expect_equal([t.title for t in search(tasks, "BET")], ["beta"], "searching for 'BET'")
    expect_equal(search(tasks, "zzz"), [], "searching for something absent")

def test_queries_do_not_mutate():
    """pending and search leave the original list alone"""
    tasks = fresh()
    before = list(tasks)
    expect_defined("pending")(tasks)
    expect_defined("search")(tasks, "a")
    expect_equal(tasks, before, "the task list after querying it")

def test_output():
    """The script prints the six lines"""
    expect_output(
        "3\n['pack bag', 'write lesson']\nTrue\nFalse\n"
        "{'total': 3, 'done': 2, 'pending': 1}\n['buy rope', 'write lesson']"
    )
```

```text hint
`add` builds a `Task(...)`, appends it, and returns it. Three lines.
```

```text hint
`pending` filters first, then sorts. `PRIORITY_ORDER` turns a priority into a
number, so `key=lambda task: PRIORITY_ORDER[task.priority]` gives the order.
Python's sort keeps ties in their original order, so nothing else is needed.
```

```text hint
`search` is one comprehension: keep a task when
`term.lower() in task.title.lower()`.
```
