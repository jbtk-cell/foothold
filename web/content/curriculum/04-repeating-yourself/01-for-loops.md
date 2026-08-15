---
title: Doing Something Ten Times
goal: Repeat a block of code a fixed number of times.
estimate: 7
concepts:
  - for
  - range
---

A `for` loop runs a block once for each item in a collection. The simplest
collection to produce is a run of numbers, and `range` produces those.

```python
for i in range(5):
    print(i)
```

That prints 0, 1, 2, 3, 4.

Two things surprise everyone the first time:

**It starts at 0.** Counting from zero is a deep convention in programming and
you will stop noticing it quickly.

**It stops before the number you gave.** `range(5)` produces five numbers, and
5 is not one of them. Read it as "five values, starting at zero."

The name `i` is not special - it is just a variable, set to a different value
each time round. `for number in range(5)` works identically. `i` is
traditional for a counter, and short names are acceptable when the variable
only exists for two lines.

## Choosing where to start and stop

```python
for i in range(1, 6):
    print(i)
```

Two arguments means start and stop: 1, 2, 3, 4, 5. Still stops before the
second number.

A third argument is the step:

```python
for i in range(0, 101, 10):
    print(i)
```

That counts 0, 10, 20, ... 100. A negative step counts down:

```python
for i in range(3, 0, -1):
    print(i)
```

## Ignoring the number

Sometimes you just want something to happen n times and do not care which
iteration you are on. By convention the variable is then named `_`:

```python
for _ in range(3):
    print("beep")
```

## Your turn

Print a five-row triangle of stars:

```
*
**
***
****
*****
```

Use a loop. Five `print` statements would produce the right output, but the
whole point is the loop - and the checks will look.

```python starter
# Print the triangle with a loop.
```

```python solution
for i in range(1, 6):
    print("*" * i)
```

```python tests
def test_triangle():
    """It prints the five-row triangle"""
    expect_output("*\n**\n***\n****\n*****")

def test_uses_a_loop():
    """It is built with a loop"""
    assert "for " in SOURCE, (
        "Use a for loop. Writing five prints gives the same output, but the "
        "exercise is the loop - and it would not scale to fifty rows."
    )

def test_one_print():
    """There is a single print, inside the loop"""
    assert SOURCE.count("print(") == 1, (
        "You should only need one print, inside the loop. Yours has "
        + str(SOURCE.count("print(")) + "."
    )
```

```text hint
`"*" * 3` gives you `***`. So you need a loop whose variable counts 1 to 5.
```

```text hint
`range(1, 6)` gives 1, 2, 3, 4, 5.
```

```text hint
Inside the loop: `print("*" * i)`.
```
