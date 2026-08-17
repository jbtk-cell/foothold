---
title: Loops Inside Loops
goal: Use one loop inside another to work through a grid.
estimate: 8
concepts:
  - nested loops
---

A loop is a block of code, and a block of code can contain a loop.

```python
for row in range(3):
    for column in range(4):
        print(row, column)
```

The inner loop runs completely, every single time the outer loop goes round.
Three outer turns times four inner turns is twelve lines of output.

That multiplication is worth respecting. Two nested loops over a thousand
items each is a million iterations.

## Printing without a newline

To build a line piece by piece you need `print` to stop starting a new line
each time. The `end` argument controls what gets printed at the end:

```python
for i in range(5):
    print("*", end="")
print()
```

`end=""` means "finish with nothing at all". The bare `print()` afterwards
supplies the newline once the row is complete.

Getting that final `print()` in the right place - after the inner loop, inside
the outer one - is the whole trick of drawing anything.

```python
for row in range(3):
    for column in range(5):
        print("#", end="")
    print()
```

## Your turn

Print a multiplication table for 1 to 4, with the numbers separated by a
single space and no trailing space:

```
1 2 3 4
2 4 6 8
3 6 9 12
4 8 12 16
```

The neat way uses `end=" "` and then strips the line - but there is a tidier
approach: build each row as a string and print it once.

```python starter
# Print the 4x4 multiplication table.
```

```python solution
for row in range(1, 5):
    line = ""
    for column in range(1, 5):
        line += str(row * column)
        if column < 4:
            line += " "
    print(line)
```

```python tests
def test_table():
    """It prints the 4 by 4 table"""
    expect_output("1 2 3 4\n2 4 6 8\n3 6 9 12\n4 8 12 16")

def test_four_rows():
    """There are four rows"""
    expect_equal(len(STDOUT_LINES), 4, "The table should have four rows.")

def test_nested_loops():
    """It uses a loop inside a loop"""
    assert SOURCE.count("for ") >= 2, (
        "This one wants a loop inside a loop - one for the rows, one for the columns."
    )

def test_no_trailing_spaces():
    """No row ends in a stray space"""
    for line in STDOUT.rstrip("\n").split("\n"):
        assert line == line.rstrip(), (
            "The row " + repr(line) + " ends with a space. Separate the numbers with "
            "single spaces but do not put one after the last number."
        )
```

```text hint
The outer loop is the row, 1 to 4. The inner loop is the column, 1 to 4. The
value at each position is `row * column`.
```

```text hint
Building the row as a string first avoids the trailing-space problem. Start
with `line = ""` inside the outer loop.
```

```text hint
Add a space only when there is another number coming - that is
`if column < 4`. Then `print(line)` after the inner loop finishes.
```
