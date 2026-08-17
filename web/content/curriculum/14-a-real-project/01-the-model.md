---
title: The Data Model
goal: Design the shape of the data before writing anything that uses it.
estimate: 11
concepts:
  - dataclasses
  - validation
  - project
---

Every program of any size starts with a decision about what the data looks
like. Get it right and the rest follows; get it wrong and you fight it for the
life of the project.

For a task tracker, one task needs: what it is, whether it is done, how urgent
it is, and when it was added. Four fields, and each one raises a question.

**Priority.** A string like `"high"` invites typos: `"High"`, `"HIGH"`,
`"hgih"`. Restrict it to a known set and reject the rest at the door, the way
the raising lesson did.

**Done.** A boolean, because there are two states. If you find yourself
wanting `"in progress"` later, that is a sign it wanted to be a string of
allowed values too.

**Created.** A date rather than a string, so you can do arithmetic on it.

## Your turn

Build the model.

- A `Task` dataclass with `title`, `priority` defaulting to `"normal"`,
  `done` defaulting to `False`, and `created` defaulting to `date(2026, 1, 1)`
- A module-level `PRIORITIES` tuple: `("low", "normal", "high")`
- `make_task(title, priority="normal", created=date(2026, 1, 1))` returning a
  `Task`, but raising:
  - `ValueError("title cannot be empty")` for a blank or whitespace-only title
  - `ValueError("unknown priority: urgent")` for anything outside `PRIORITIES`
- `Task.label(self)` returning `"[ ] buy rope (high)"`, with `x` in the
  brackets when done

Titles are stripped of surrounding whitespace before storing.

Expected output:

```
[ ] buy rope (high)
[x] write lesson (normal)
title cannot be empty
unknown priority: urgent
```

```python starter
from dataclasses import dataclass, field
from datetime import date

PRIORITIES = ("low", "normal", "high")


# Write the Task dataclass and make_task below.


print(make_task("buy rope", "high").label())

done = make_task("  write lesson  ")
done.done = True
print(done.label())

for title, priority in [("   ", "normal"), ("ok", "urgent")]:
    try:
        make_task(title, priority)
    except ValueError as error:
        print(error)
```

```python solution
from dataclasses import dataclass, field
from datetime import date

PRIORITIES = ("low", "normal", "high")


@dataclass
class Task:
    title: str
    priority: str = "normal"
    done: bool = False
    created: date = date(2026, 1, 1)

    def label(self):
        """Return the task as one readable line."""
        mark = "x" if self.done else " "
        return f"[{mark}] {self.title} ({self.priority})"


def make_task(title, priority="normal", created=date(2026, 1, 1)):
    """Build a Task, refusing anything that would be invalid."""
    title = title.strip()
    if not title:
        raise ValueError("title cannot be empty")
    if priority not in PRIORITIES:
        raise ValueError(f"unknown priority: {priority}")
    return Task(title=title, priority=priority, created=created)


print(make_task("buy rope", "high").label())

done = make_task("  write lesson  ")
done.done = True
print(done.label())

for title, priority in [("   ", "normal"), ("ok", "urgent")]:
    try:
        make_task(title, priority)
    except ValueError as error:
        print(error)
```

```python tests
def test_task_is_a_dataclass():
    """Task is a dataclass with the four fields"""
    import dataclasses
    cls = expect_defined("Task", "class")
    assert dataclasses.is_dataclass(cls), "Task should be decorated with @dataclass."
    task = cls("write")
    expect_equal(task.title, "write", "the title")
    expect_equal(task.priority, "normal", "the default priority")
    expect_equal(task.done, False, "the default done flag")

def test_label():
    """label shows the state, the title and the priority"""
    cls = expect_defined("Task")
    expect_equal(cls("buy rope", "high").label(), "[ ] buy rope (high)", "an unfinished task")
    finished = cls("buy rope", "high")
    finished.done = True
    expect_equal(finished.label(), "[x] buy rope (high)", "a finished task")

def test_make_task_strips():
    """Surrounding whitespace is removed from the title"""
    expect_equal(expect_defined("make_task")("  padded  ").title, "padded", "the stored title")

def test_empty_title_rejected():
    """A blank title raises"""
    func = expect_defined("make_task")
    for blank in ("", "   ", "\t"):
        try:
            func(blank)
        except ValueError as error:
            expect_equal(str(error), "title cannot be empty", "the message for " + repr(blank))
        else:
            raise AssertionError("make_task(" + repr(blank) + ") should raise a ValueError.")

def test_unknown_priority_rejected():
    """An unknown priority raises and names the offender"""
    try:
        expect_defined("make_task")("ok", "urgent")
    except ValueError as error:
        expect_equal(str(error), "unknown priority: urgent", "the message")
    else:
        raise AssertionError("An unknown priority should raise a ValueError.")

def test_valid_priorities_accepted():
    """Every listed priority is allowed"""
    func = expect_defined("make_task")
    for priority in ("low", "normal", "high"):
        expect_equal(func("ok", priority).priority, priority, "the priority " + priority)

def test_output():
    """The four lines print"""
    expect_output(
        "[ ] buy rope (high)\n[x] write lesson (normal)\n"
        "title cannot be empty\nunknown priority: urgent"
    )
```

```text hint
The dataclass declares four fields with types. Only `title` has no default.
```

```text hint
`make_task` strips the title first, then checks it, then checks the priority,
then builds and returns the Task.
```

```text hint
The label is an f-string: work out the mark with
`mark = "x" if self.done else " "`, then
`f"[{mark}] {self.title} ({self.priority})"`.
```
