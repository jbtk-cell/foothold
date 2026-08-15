---
title: A Small Report
goal: Combine loops, lists and functions into something useful.
estimate: 10
concepts:
  - practice
  - functions
  - lists
---

Nothing new here. This is the module's ideas used together, which is a
different skill from learning them one at a time.

The job: take a list of daily rainfall figures and print a summary.

Break it up before you write anything. The output has four parts, so there are
four questions to answer, and each is a line or two of code:

- what is the total?
- what is the highest?
- which days were dry?
- what does each row look like?

## Your turn

Write two functions and use them:

- `summarise(readings)` returns a string like `Total: 21mm over 7 days`
- `dry_days(readings)` returns a list of the day numbers (starting at 1) where
  the reading was 0

Then print, exactly:

```
Mon 5mm
Tue 0mm
Wed 3mm
Thu 8mm
Fri 0mm
Sat 2mm
Sun 3mm
Total: 21mm over 7 days
Dry days: [2, 5]
```

```python starter
days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
rain = [5, 0, 3, 8, 0, 2, 3]


def summarise(readings):
    pass


def dry_days(readings):
    pass


# Print the seven rows, then the summary and the dry days.
```

```python solution
days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
rain = [5, 0, 3, 8, 0, 2, 3]


def summarise(readings):
    """Return a one-line total for a list of readings."""
    return f"Total: {sum(readings)}mm over {len(readings)} days"


def dry_days(readings):
    """Return the 1-based day numbers with no rain."""
    return [number for number, value in enumerate(readings, start=1) if value == 0]


for day, value in zip(days, rain):
    print(f"{day} {value}mm")

print(summarise(rain))
print(f"Dry days: {dry_days(rain)}")
```

```python tests
def test_summarise():
    """summarise returns the total line"""
    expect_calling("summarise", ([5, 0, 3],), "Total: 8mm over 3 days")

def test_summarise_is_general():
    """summarise works on any list"""
    expect_calling("summarise", ([1, 1],), "Total: 2mm over 2 days")
    expect_calling("summarise", ([],), "Total: 0mm over 0 days")

def test_dry_days():
    """dry_days returns 1-based day numbers"""
    expect_calling("dry_days", ([5, 0, 3, 8, 0, 2, 3],), [2, 5])
    expect_calling("dry_days", ([0, 0],), [1, 2])
    expect_calling("dry_days", ([1, 2],), [])

def test_output():
    """The whole report prints"""
    expect_output(
        "Mon 5mm\nTue 0mm\nWed 3mm\nThu 8mm\nFri 0mm\nSat 2mm\nSun 3mm\n"
        "Total: 21mm over 7 days\n"
        "Dry days: [2, 5]"
    )

def test_rows_come_from_a_loop():
    """The seven rows are printed by a loop"""
    assert "for " in SOURCE, "Print the rows with a loop rather than seven prints."
```

```text hint
`zip(days, rain)` pairs the two lists up, so you can loop over both at once:
`for day, value in zip(days, rain):`.
```

```text hint
`summarise` is one line: an f-string using `sum(readings)` and `len(readings)`.
```

```text hint
For `dry_days`, use `enumerate(readings, start=1)` and keep the numbers where
the value is 0. A comprehension does it in one line.
```
