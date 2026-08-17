---
title: Dates and Times
goal: Do arithmetic on dates without counting days yourself.
estimate: 9
concepts:
  - datetime
---

Dates look simple and are not. Months have different lengths, February has two
of them, and time zones move. Every one of those has been handled already.

```python
from datetime import date, timedelta

launch = date(2026, 8, 17)
print(launch)
print(launch.year, launch.month, launch.day)
```

`date(year, month, day)` builds one. `date.today()` gives the current one,
which is why lessons here pass dates in as arguments: a test whose answer
changes overnight is a test that fails overnight.

## Arithmetic

Subtract two dates and you get a `timedelta`, a length of time:

```python
from datetime import date

start = date(2026, 1, 1)
end = date(2026, 3, 1)
gap = end - start
print(gap.days)
```

Add a `timedelta` to a date and you get another date, with the month-length
problem handled:

```python
from datetime import date, timedelta

print(date(2026, 1, 31) + timedelta(days=1))
```

`timedelta` takes `days`, `weeks`, `hours`, `minutes` and `seconds`. Months
are missing on purpose, because "one month after 31 January" has no agreed
answer.

## Formatting

`strftime` turns a date into text, using codes for each part:

```python
from datetime import date

when = date(2026, 8, 17)
print(when.strftime("%d %B %Y"))
print(when.strftime("%Y-%m-%d"))
```

| Code | Means |
| --- | --- |
| `%Y` | four-digit year |
| `%m` | month as a number |
| `%B` | month name |
| `%d` | day of the month |
| `%A` | weekday name |

`strptime` goes the other way, parsing text into a date, and takes the same
codes.

Prefer `%Y-%m-%d` when a machine will read it back. It sorts correctly as
text, which no other common format does.

## Your turn

Write three functions for a library's due dates.

- `due_date(borrowed, days=14)` returns the date a book is due
- `days_overdue(due, today)` returns how many days late, or `0` when it is not
  late yet
- `fine(due, today, rate=0.5)` returns the fine, rounded to two decimal
  places, capped at `10.00`

Expected output:

```
2026-08-31
0
7
3.5
10.0
```

```python starter
from datetime import date, timedelta


# Write the three functions below.


borrowed = date(2026, 8, 17)
due = due_date(borrowed)
print(due)
print(days_overdue(due, date(2026, 8, 20)))
print(days_overdue(due, date(2026, 9, 7)))
print(fine(due, date(2026, 9, 7)))
print(fine(due, date(2026, 12, 25)))
```

```python solution
from datetime import date, timedelta


def due_date(borrowed, days=14):
    """Return the date a book borrowed on `borrowed` falls due."""
    return borrowed + timedelta(days=days)


def days_overdue(due, today):
    """Return how many days past the due date, or 0 if it is not late."""
    late = (today - due).days
    return max(late, 0)


def fine(due, today, rate=0.5):
    """Return the fine owed, capped at 10.00."""
    return round(min(days_overdue(due, today) * rate, 10.0), 2)


borrowed = date(2026, 8, 17)
due = due_date(borrowed)
print(due)
print(days_overdue(due, date(2026, 8, 20)))
print(days_overdue(due, date(2026, 9, 7)))
print(fine(due, date(2026, 9, 7)))
print(fine(due, date(2026, 12, 25)))
```

```python tests
def test_due_date():
    """due_date adds two weeks by default"""
    from datetime import date
    expect_calling("due_date", (date(2026, 1, 1),), date(2026, 1, 15))
    expect_calling("due_date", (date(2026, 1, 1), 7), date(2026, 1, 8))

def test_due_date_crosses_a_month():
    """Month lengths are handled by timedelta"""
    from datetime import date
    expect_calling("due_date", (date(2026, 2, 20),), date(2026, 3, 6))

def test_not_overdue():
    """A book returned early or on time is not overdue"""
    from datetime import date
    expect_calling("days_overdue", (date(2026, 3, 1), date(2026, 2, 20)), 0)
    expect_calling("days_overdue", (date(2026, 3, 1), date(2026, 3, 1)), 0)

def test_overdue():
    """Lateness is counted in days"""
    from datetime import date
    expect_calling("days_overdue", (date(2026, 3, 1), date(2026, 3, 8)), 7)

def test_fine():
    """The fine is the daily rate times the days late"""
    from datetime import date
    expect_calling("fine", (date(2026, 3, 1), date(2026, 3, 5)), 2.0)
    expect_calling("fine", (date(2026, 3, 1), date(2026, 2, 1)), 0)

def test_fine_is_capped():
    """The fine stops at 10.00"""
    from datetime import date
    expect_calling("fine", (date(2026, 3, 1), date(2027, 3, 1)), 10.0)

def test_output():
    """The five lines print"""
    expect_output("2026-08-31\n0\n7\n3.5\n10.0")
```

```text hint
`borrowed + timedelta(days=days)` gives the due date.
```

```text hint
Subtracting two dates gives a timedelta; `.days` is the number you want.
`max(late, 0)` turns a negative into zero.
```

```text hint
The cap is `min(..., 10.0)`, and the rounding wraps the whole thing:
`round(min(days * rate, 10.0), 2)`.
```
