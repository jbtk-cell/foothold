---
title: A Grade Book
goal: Turn a pile of records into a report, using functions to keep it readable.
estimate: 12
concepts:
  - dictionaries
  - functions
  - project
---

Real data work is mostly this: a list of records goes in, a summary comes out.

The temptation is to write it as one long stretch of code. Resist it. Each
question the report answers becomes a function, each function is three or four
lines, and each can be checked on its own.

Look at the output you need and work backwards to the functions:

- a letter for a score
- an average for one student
- the best student

That is three functions, and then the report is a loop that calls them.

## Your turn

Given the grade book below, print exactly:

```
Ada        88.7  B
Grace      95.0  A
Alan       72.3  C
---
Class average: 85.3
Top student: Grace
```

Names are padded to 10 characters, averages shown to one decimal place.

Write these three functions:

- `letter(score)` returns `A` for 90+, `B` for 80+, `C` for 70+, `D` for 60+,
  otherwise `F`
- `average(scores)` returns the mean of a list, or `0.0` for an empty list
- `top_student(book)` returns the name with the highest average

```python starter
book = {
    "Ada": [85, 92, 89],
    "Grace": [95, 98, 92],
    "Alan": [70, 75, 72],
}


def letter(score):
    pass


def average(scores):
    pass


def top_student(book):
    pass


# Print the report.
```

```python solution
book = {
    "Ada": [85, 92, 89],
    "Grace": [95, 98, 92],
    "Alan": [70, 75, 72],
}


def letter(score):
    """Return the letter grade for a numeric score."""
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def average(scores):
    """Return the mean of a list of scores, or 0.0 if there are none."""
    if not scores:
        return 0.0
    return sum(scores) / len(scores)


def top_student(book):
    """Return the name of the student with the highest average."""
    best = None
    best_average = None
    for name, scores in book.items():
        score = average(scores)
        if best_average is None or score > best_average:
            best = name
            best_average = score
    return best


averages = []

for name, scores in book.items():
    mean = average(scores)
    averages.append(mean)
    print(f"{name:<10} {mean:.1f}  {letter(mean)}")

print("---")
print(f"Class average: {average(averages):.1f}")
print(f"Top student: {top_student(book)}")
```

```python tests
def test_letter_grades():
    """letter() covers every band"""
    expect_calling("letter", (95,), "A")
    expect_calling("letter", (90,), "A")
    expect_calling("letter", (85,), "B")
    expect_calling("letter", (70,), "C")
    expect_calling("letter", (65,), "D")
    expect_calling("letter", (12,), "F")

def test_average():
    """average() takes the mean"""
    expect_calling("average", ([10, 20],), 15.0)
    expect_calling("average", ([5],), 5.0)

def test_average_of_nothing():
    """An empty list averages to zero rather than crashing"""
    expect_calling("average", ([],), 0.0)

def test_top_student():
    """top_student() finds the highest average"""
    expect_calling("top_student", ({"a": [1], "b": [9]},), "b")
    expect_calling("top_student", ({"only": [3]},), "only")

def test_report():
    """The report prints correctly"""
    expect_output(
        "Ada        88.7  B\n"
        "Grace      95.0  A\n"
        "Alan       72.3  C\n"
        "---\n"
        "Class average: 85.3\n"
        "Top student: Grace"
    )

def test_report_uses_a_loop():
    """The rows come from a loop"""
    assert "for " in SOURCE, "Print the rows with a loop over the grade book."
```

```text hint
`f"{name:<10}"` pads a name to ten characters, left-aligned. `<` means left,
`>` right, `^` centre.
```

```text hint
For `letter`, a chain of `if score >= 90: return "A"` works - once a return
fires the rest is never reached, so no `elif` is needed.
```

```text hint
For `top_student`, loop over `book.items()`, work out each average, and keep
the best one seen so far. Start the "best" at `None` and treat the first
student as the best by default.
```
