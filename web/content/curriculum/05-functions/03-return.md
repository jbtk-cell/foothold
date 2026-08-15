---
title: Handing an Answer Back
goal: Return a value from a function instead of printing it.
estimate: 9
concepts:
  - return
---

There is a difference between a function that *shows* you something and one
that *gives* you something, and it is the difference that trips people up
most.

```python
def double_and_print(n):
    print(n * 2)

def double(n):
    return n * 2
```

The first puts a number on the screen and hands back nothing. The second hands
back a number and puts nothing on the screen.

Only the second is useful as a building block:

```python
result = double(5) + double(10)
print(result)
```

Try that with `double_and_print` and `result` ends up as `None`, because a
function with no `return` returns `None` - Python's word for "nothing here".
`None + None` is a `TypeError`.

## Return ends the function

The moment a `return` runs, the function stops. Nothing after it happens.

```python
def check(n):
    if n < 0:
        return "negative"
    return "not negative"
```

No `else` is needed. If `n` is negative the first `return` fires and the
second line is never reached.

## The rule of thumb

**Functions should return, not print.** A function that returns can be used
anywhere - printed, stored, passed on, tested. A function that prints can only
ever print.

Keep the printing at the outside edge of your program, and let everything
inside deal in values.

```python
def area(width, height):
    return width * height

print(f"The area is {area(3, 4)}")
```

## Your turn

Write two functions:

- `celsius_to_fahrenheit(c)` returns `c * 9 / 5 + 32`
- `describe(c)` returns a string like `20C = 68.0F`, using the first function

Neither one prints anything. Then print the result of `describe(20)` and
`describe(100)`:

```
20C = 68.0F
100C = 212.0F
```

```python starter
def celsius_to_fahrenheit(c):
    # Return the converted value.
    pass


# Write describe(c), then print the two lines.
```

```python solution
def celsius_to_fahrenheit(c):
    return c * 9 / 5 + 32


def describe(c):
    return f"{c}C = {celsius_to_fahrenheit(c)}F"


print(describe(20))
print(describe(100))
```

```python tests
def test_conversion_returns():
    """celsius_to_fahrenheit returns a number"""
    expect_calling("celsius_to_fahrenheit", (0,), 32.0)
    expect_calling("celsius_to_fahrenheit", (100,), 212.0)

def test_describe_returns_a_string():
    """describe returns the sentence rather than printing it"""
    func = expect_defined("describe")
    value = func(20)
    assert value is not None, (
        "describe(20) returned None, which means it printed instead of returning. "
        "Use `return` rather than `print` inside it."
    )
    expect_equal(value, "20C = 68.0F", "describe(20)")

def test_describe_uses_the_other_function():
    """describe builds on celsius_to_fahrenheit"""
    assert "celsius_to_fahrenheit" in SOURCE.split("def describe", 1)[-1], (
        "Call celsius_to_fahrenheit inside describe rather than repeating the formula."
    )

def test_output():
    """It prints both descriptions"""
    expect_output("20C = 68.0F\n100C = 212.0F")
```

```text hint
Replace the `pass` with `return c * 9 / 5 + 32`.
```

```text hint
`describe` returns an f-string. Inside the braces you can call the other
function: `{celsius_to_fahrenheit(c)}`.
```

```text hint
The printing happens at the bottom, outside both functions:
`print(describe(20))`.
```
