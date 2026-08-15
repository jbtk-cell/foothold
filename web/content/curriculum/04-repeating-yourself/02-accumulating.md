---
title: Building Up an Answer
goal: Carry a running total through a loop.
estimate: 8
concepts:
  - accumulator
  - for
---

Most useful loops build something up as they go. The pattern has three parts,
and once you see it you will see it everywhere:

1. Set up a variable **before** the loop
2. Update it **inside** the loop
3. Use it **after** the loop

```python
total = 0

for i in range(1, 11):
    total = total + i

print(total)
```

That adds up 1 to 10 and prints 55.

The variable is called an **accumulator**. Getting its starting value right
matters: 0 for a sum, 1 for a product, `""` for building text.

## A shorthand

`total = total + i` is so common that Python has a shorter form:

```python
total += i
```

They mean exactly the same thing. `-=`, `*=` and `/=` exist too.

## Where you put a line changes everything

This is the single most common loop bug. Look at where `print` sits:

```python
total = 0
for i in range(1, 4):
    total += i
    print(total)
```

Indented, so it runs every time round: 1, 3, 6.

```python
total = 0
for i in range(1, 4):
    total += i
print(total)
```

Not indented, so it runs once at the end: 6.

Neither is wrong. But if your loop prints the right answer plus a lot of
wrong ones, this is why.

## Counting instead of summing

Same shape, different update - add 1 rather than the value:

```python
evens = 0
for i in range(1, 21):
    if i % 2 == 0:
        evens += 1
print(evens)
```

## Your turn

Print the sum of every multiple of 3 below 100, then the count of them, like
this:

```
Sum: 1683
Count: 33
```

Work both out with a loop.

```python starter
total = 0
count = 0

# Loop over the numbers, then print the two lines.
```

```python solution
total = 0
count = 0

for number in range(3, 100, 3):
    total += number
    count += 1

print(f"Sum: {total}")
print(f"Count: {count}")
```

```python tests
def test_output():
    """It prints the sum and the count"""
    expect_output("Sum: 1683\nCount: 33")

def test_uses_a_loop():
    """The answer comes from a loop"""
    assert "for " in SOURCE or "while " in SOURCE, "Use a loop to work through the numbers."

def test_not_hardcoded():
    """The numbers are computed, not typed"""
    assert "1683" not in SOURCE, "Let the loop work the total out rather than typing it."
    assert "33" not in SOURCE.replace("range(3", ""), "Let the loop count rather than typing 33."
```

```text hint
`range(3, 100, 3)` gives you 3, 6, 9 ... 99 directly. Or loop over every
number and test `if number % 3 == 0`.
```

```text hint
Both variables are set up before the loop and updated inside it.
```

```text hint
Inside the loop: `total += number` and `count += 1`. The prints go after the
loop, un-indented.
```
