---
title: FizzBuzz
goal: Write the exercise every programmer has been asked at an interview.
estimate: 8
concepts:
  - loops
  - conditions
  - project
---

The rules, for the numbers 1 to 100:

- a multiple of 3 prints `Fizz`
- a multiple of 5 prints `Buzz`
- a multiple of both prints `FizzBuzz`
- anything else prints the number

It is famous because it is easy and still catches people out. The trap is
the order of the checks. If you test for 3 first, then 15 prints
`Fizz` and stops - the `FizzBuzz` case never gets a look in.

Two ways to avoid that:

- check the "both" case first
- or build the word up, and print the number only if the word is still empty

The second generalises better - adding a rule for 7 costs one more `if`
instead of doubling the branches.

## Your turn

Write `fizzbuzz(n)` that **returns** the right string for a single number, and
then a loop that prints the results for 1 to 20.

```
1
2
Fizz
4
Buzz
Fizz
7
8
Fizz
Buzz
11
Fizz
13
14
FizzBuzz
16
17
Fizz
19
Buzz
```

```python starter
def fizzbuzz(n):
    # Return "Fizz", "Buzz", "FizzBuzz", or the number as a string.
    pass


# Print the results for 1 to 20.
```

```python solution
def fizzbuzz(n):
    """Return the FizzBuzz word for n, or n itself as a string."""
    word = ""
    if n % 3 == 0:
        word += "Fizz"
    if n % 5 == 0:
        word += "Buzz"
    return word or str(n)


for number in range(1, 21):
    print(fizzbuzz(number))
```

```python tests
def test_plain_numbers():
    """Ordinary numbers come back as strings"""
    expect_calling("fizzbuzz", (1,), "1")
    expect_calling("fizzbuzz", (7,), "7")

def test_fizz():
    """Multiples of three are Fizz"""
    expect_calling("fizzbuzz", (3,), "Fizz")
    expect_calling("fizzbuzz", (9,), "Fizz")

def test_buzz():
    """Multiples of five are Buzz"""
    expect_calling("fizzbuzz", (5,), "Buzz")
    expect_calling("fizzbuzz", (20,), "Buzz")

def test_fizzbuzz():
    """Multiples of both are FizzBuzz"""
    expect_calling("fizzbuzz", (15,), "FizzBuzz")
    expect_calling("fizzbuzz", (30,), "FizzBuzz")
    expect_calling("fizzbuzz", (90,), "FizzBuzz")

def test_returns_a_string():
    """It always returns a string"""
    func = expect_defined("fizzbuzz")
    for n in (1, 3, 5, 15):
        value = func(n)
        assert isinstance(value, str), (
            "fizzbuzz(" + str(n) + ") returned " + repr(value) + ". It should always "
            "return a string, so that printing it is the caller's job."
        )

def test_output():
    """It prints 1 to 20"""
    expect_equal(len(STDOUT_LINES), 20, "There should be 20 lines of output.")
    expect_equal(STDOUT_LINES[14], "FizzBuzz", "Line 15 should be FizzBuzz.")
    expect_equal(STDOUT_LINES[0], "1", "Line 1 should be 1.")
```

```text hint
Start `word = ""`, then add `"Fizz"` if divisible by 3, and add `"Buzz"` if
divisible by 5. Both can happen.
```

```text hint
At the end, if `word` is still empty return `str(n)`. In Python an empty
string is falsy, so `return word or str(n)` does exactly that.
```

```text hint
The loop at the bottom is `for number in range(1, 21): print(fizzbuzz(number))`.
```
