---
title: Leaving Early
goal: Stop a loop, or skip one turn of it.
estimate: 7
concepts:
  - break
  - continue
---

Two words change the flow inside a loop.

**`break`** leaves the loop immediately. Nothing else in the block runs, and
the loop does not go round again.

```python
for i in range(1, 100):
    if i * i > 50:
        print(i)
        break
```

That finds the first number whose square passes 50, prints it, and stops. Without
the `break` it would print every number from 8 to 99.

**`continue`** skips the rest of this turn and starts the next one.

```python
for i in range(1, 11):
    if i % 3 == 0:
        continue
    print(i)
```

That prints every number from 1 to 10 except the multiples of 3.

## Searching is the classic use

`break` is what you want whenever the answer is "the first thing that
matches", because there is no reason to keep looking once you have found it.

```python
target = 7
found = False

for number in range(1, 20):
    if number == target:
        found = True
        break

print(found)
```

## Which one to reach for

If `continue` is the last thing you could have written, an `if` usually reads
better:

```python
for i in range(10):
    if i % 2 == 0:
        print(i)
```

is clearer than the `continue` version. `continue` earns its place when the
skip condition is at the top and the body below it is long.

## Your turn

Find the first number above 100 that divides exactly by both 7 and 9, and
print it:

```
Found: 126
```

Stop looking as soon as you find it - use `break`.

```python starter
# Search upwards from 101 and stop at the first match.
```

```python solution
for number in range(101, 10000):
    if number % 7 == 0 and number % 9 == 0:
        print(f"Found: {number}")
        break
```

```python tests
def test_output():
    """It finds 126"""
    expect_output("Found: 126")

def test_only_one_line():
    """It stops after the first match"""
    assert len(STDOUT_LINES) == 1, (
        "Only the first match should print, but your program printed "
        + str(len(STDOUT_LINES)) + " lines. Use break to stop the loop."
    )

def test_uses_break():
    """It uses break"""
    assert "break" in SOURCE, (
        "Use break to leave the loop once you have found the answer."
    )

def test_not_hardcoded():
    """It searches rather than printing the answer"""
    assert "126" not in SOURCE, "Let the loop find 126 rather than typing it."
```

```text hint
Loop over a range starting at 101 and going somewhere comfortably far, like
`range(101, 10000)`.
```

```text hint
"Divides exactly by 7" is `number % 7 == 0`. You need both, joined by `and`.
```

```text hint
Inside the `if`: print the number, then `break` on the next line.
```
