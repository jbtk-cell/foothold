---
title: The Interface
goal: Put a command interface on the program and finish it.
estimate: 14
concepts:
  - project
  - parsing
---

The last layer. Everything underneath takes data and returns data; this part
turns what someone types into a call, and the result into a line of output.

Keeping that boundary thin is the discipline worth taking from this project. A
command function should read the input, call one thing, and format the answer.
When logic creeps into it, testing means simulating typing.

## Parsing a command

```python
line = "add buy rope"
verb, _, rest = line.strip().partition(" ")
```

`partition` splits on the first space and always returns three pieces, so a
bare `list` with no argument gives `rest = ""` rather than raising. `split(" ", 1)`
would need a length check.

## Your turn

Finish the tracker. The model and the operations are supplied; write
`handle(tasks, line)`, which takes the task list and one typed line and
returns the string to print.

| Typed | Does | Returns |
| --- | --- | --- |
| `add buy rope` | adds a normal task | `added: buy rope` |
| `add! buy rope` | adds a high-priority task | `added: buy rope (high)` |
| `done buy rope` | marks it done | `done: buy rope` |
| `done nothing` | no match | `not found: nothing` |
| `list` | pending tasks, urgent first | one line per task, or `nothing to do` |
| `count` | the tally | `3 total, 1 done, 2 pending` |
| anything else | unknown | `unknown command: xyz` |
| `add` with no title | rejected | `title cannot be empty` |

For `list`, join the labels with newlines.

Expected output:

```
added: buy rope (high)
added: write lesson
title cannot be empty
done: write lesson
not found: nothing
[ ] buy rope (high)
2 total, 1 done, 1 pending
unknown command: sing
```

```python starter
from dataclasses import dataclass

PRIORITY_ORDER = {"high": 0, "normal": 1, "low": 2}


@dataclass
class Task:
    title: str
    priority: str = "normal"
    done: bool = False

    def label(self):
        return f"[{'x' if self.done else ' '}] {self.title} ({self.priority})"


def add(tasks, title, priority="normal"):
    task = Task(title=title, priority=priority)
    tasks.append(task)
    return task


def complete(tasks, title):
    for task in tasks:
        if task.title.lower() == title.lower():
            task.done = True
            return True
    return False


def pending(tasks):
    unfinished = [task for task in tasks if not task.done]
    return sorted(unfinished, key=lambda task: PRIORITY_ORDER[task.priority])


def counts(tasks):
    done = len([task for task in tasks if task.done])
    return {"total": len(tasks), "done": done, "pending": len(tasks) - done}


# Write handle(tasks, line) below.


tasks = []
for line in ["add! buy rope", "add write lesson", "add   ",
             "done write lesson", "done nothing", "list", "count", "sing"]:
    print(handle(tasks, line))
```

```python solution
from dataclasses import dataclass

PRIORITY_ORDER = {"high": 0, "normal": 1, "low": 2}


@dataclass
class Task:
    title: str
    priority: str = "normal"
    done: bool = False

    def label(self):
        return f"[{'x' if self.done else ' '}] {self.title} ({self.priority})"


def add(tasks, title, priority="normal"):
    task = Task(title=title, priority=priority)
    tasks.append(task)
    return task


def complete(tasks, title):
    for task in tasks:
        if task.title.lower() == title.lower():
            task.done = True
            return True
    return False


def pending(tasks):
    unfinished = [task for task in tasks if not task.done]
    return sorted(unfinished, key=lambda task: PRIORITY_ORDER[task.priority])


def counts(tasks):
    done = len([task for task in tasks if task.done])
    return {"total": len(tasks), "done": done, "pending": len(tasks) - done}


def handle(tasks, line):
    """Turn one typed line into an answer."""
    verb, _, rest = line.strip().partition(" ")
    rest = rest.strip()

    if verb in ("add", "add!"):
        if not rest:
            return "title cannot be empty"
        priority = "high" if verb == "add!" else "normal"
        task = add(tasks, rest, priority)
        suffix = " (high)" if priority == "high" else ""
        return f"added: {task.title}{suffix}"

    if verb == "done":
        if complete(tasks, rest):
            return f"done: {rest}"
        return f"not found: {rest}"

    if verb == "list":
        waiting = pending(tasks)
        if not waiting:
            return "nothing to do"
        return "\n".join(task.label() for task in waiting)

    if verb == "count":
        tally = counts(tasks)
        return f"{tally['total']} total, {tally['done']} done, {tally['pending']} pending"

    return f"unknown command: {verb}"


tasks = []
for line in ["add! buy rope", "add write lesson", "add   ",
             "done write lesson", "done nothing", "list", "count", "sing"]:
    print(handle(tasks, line))
```

```python tests
def test_add():
    """add creates a normal task"""
    handle = expect_defined("handle")
    tasks = []
    expect_equal(handle(tasks, "add buy rope"), "added: buy rope", "adding a task")
    expect_equal(len(tasks), 1, "the list length")
    expect_equal(tasks[0].priority, "normal", "the priority")

def test_add_urgent():
    """add! creates a high-priority task"""
    handle = expect_defined("handle")
    tasks = []
    expect_equal(handle(tasks, "add! buy rope"), "added: buy rope (high)", "adding an urgent task")
    expect_equal(tasks[0].priority, "high", "the priority")

def test_add_needs_a_title():
    """A bare add is refused"""
    handle = expect_defined("handle")
    tasks = []
    expect_equal(handle(tasks, "add"), "title cannot be empty", "a bare add")
    expect_equal(handle(tasks, "add    "), "title cannot be empty", "add with only spaces")
    expect_equal(len(tasks), 0, "the list length after two refused adds")

def test_done():
    """done marks a task and reports"""
    handle = expect_defined("handle")
    tasks = []
    handle(tasks, "add buy rope")
    expect_equal(handle(tasks, "done buy rope"), "done: buy rope", "completing a task")
    expect_equal(tasks[0].done, True, "the done flag")
    expect_equal(handle(tasks, "done nothing"), "not found: nothing", "completing something absent")

def test_list_orders_and_hides():
    """list shows pending tasks, urgent first"""
    handle = expect_defined("handle")
    tasks = []
    handle(tasks, "add write lesson")
    handle(tasks, "add! buy rope")
    handle(tasks, "add pack bag")
    handle(tasks, "done pack bag")
    expect_equal(
        handle(tasks, "list"),
        "[ ] buy rope (high)\n[ ] write lesson (normal)",
        "the listing",
    )

def test_list_when_empty():
    """An empty list says so"""
    handle = expect_defined("handle")
    tasks = []
    expect_equal(handle(tasks, "list"), "nothing to do", "listing nothing")
    handle(tasks, "add one")
    handle(tasks, "done one")
    expect_equal(handle(tasks, "list"), "nothing to do", "listing when all are done")

def test_count():
    """count reports the tally"""
    handle = expect_defined("handle")
    tasks = []
    handle(tasks, "add a")
    handle(tasks, "add b")
    handle(tasks, "done a")
    expect_equal(handle(tasks, "count"), "2 total, 1 done, 1 pending", "the tally")

def test_unknown():
    """An unrecognised verb is named back"""
    handle = expect_defined("handle")
    expect_equal(handle([], "sing"), "unknown command: sing", "an unknown command")
    expect_equal(handle([], "sing loudly"), "unknown command: sing", "an unknown command with an argument")

def test_titles_with_spaces():
    """A title may contain spaces"""
    handle = expect_defined("handle")
    tasks = []
    handle(tasks, "add buy a very long rope")
    expect_equal(tasks[0].title, "buy a very long rope", "the stored title")

def test_output():
    """The whole session prints as expected"""
    expect_output(
        "added: buy rope (high)\nadded: write lesson\ntitle cannot be empty\n"
        "done: write lesson\nnot found: nothing\n[ ] buy rope (high)\n"
        "2 total, 1 done, 1 pending\nunknown command: sing"
    )
```

```text hint
Start with `verb, _, rest = line.strip().partition(" ")` and strip `rest`.
Then a chain of `if verb == ...` returning a string from each branch.
```

```text hint
`add` and `add!` share almost everything. Handle them in one branch and let
the priority depend on which verb it was.
```

```text hint
For `list`, join the labels: `"\n".join(task.label() for task in pending(tasks))`.
Check for an empty result first and return `nothing to do`.
```
