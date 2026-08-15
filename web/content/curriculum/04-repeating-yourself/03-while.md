---
title: Looping Until Something Changes
goal: Use a while loop when you do not know how many times to go round.
estimate: 8
concepts:
  - while
  - conditions
---

A `for` loop needs to know how many times to run. A `while` loop does not - it
keeps going as long as a condition stays true.

```python
countdown = 5

while countdown > 0:
    print(countdown)
    countdown -= 1

print("Lift off")
```

Read it as: *while this is true, do this block, then check again.*

Use `while` when the answer to "how many times?" is "until something happens":
until the user types quit, until the balance reaches zero, until the guess is
right.

## The condition must eventually become false

Remove the `countdown -= 1` line above and the condition never changes.
`countdown` stays 5, `5 > 0` stays true, and the loop runs forever.

```python
while True:
    print("forever")
```

Every programmer writes one of these. Foothold notices after ten seconds,
stops the program, and tells you. In a normal terminal you would press Ctrl+C.

Before writing a `while`, ask yourself: **what inside this loop changes the
condition?** If you cannot point at a line, it will not stop.

## Deliberately forever

`while True:` is sometimes exactly right, as long as something inside the loop
breaks out. `break` leaves the loop immediately.

```python
total = 0

while True:
    total += 10
    if total >= 50:
        break

print(total)
```

`continue` is the other one: it skips the rest of this time round and goes
straight back to the condition.

## Your turn

A colony of 20 bacteria doubles every hour. Print how many whole hours it
takes to exceed 1000, and the population at that point:

```
Hours: 6
Population: 1280
```

Use a `while` loop. You do not know the number of hours in advance - that is
what you are working out.

```python starter
population = 20
hours = 0

# Double the population until it passes 1000.
```

```python solution
population = 20
hours = 0

while population <= 1000:
    population *= 2
    hours += 1

print(f"Hours: {hours}")
print(f"Population: {population}")
```

```python tests
def test_output():
    """It reports the hours and the final population"""
    expect_output("Hours: 6\nPopulation: 1280")

def test_uses_while():
    """It uses a while loop"""
    assert "while" in SOURCE, (
        "Use a while loop - the number of hours is what you are trying to find out, "
        "so a for loop would need the answer up front."
    )

def test_not_hardcoded():
    """The answer is computed"""
    assert "1280" not in SOURCE, "Let the loop find the population rather than typing it."
    assert "Hours: 6" not in SOURCE, "Let the loop count the hours."
```

```text hint
The condition is about the population: keep going `while population <= 1000`.
```

```text hint
Inside the loop, double the population and add one to the hours.
```

```text hint
`population *= 2` doubles it. The loop stops as soon as the population passes
1000, which is why the final value is over 1000 rather than exactly it.
```
