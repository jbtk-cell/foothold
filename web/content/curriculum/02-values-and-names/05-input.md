---
title: Asking a Question
goal: Read something the person running your program typed, and turn it into a number.
estimate: 8
concepts:
  - input
  - type conversion
---

`input()` stops the program, waits for someone to type a line, and hands back
what they typed.

```python
name = input("What is your name? ")
print(f"Hello, {name}!")
```

The text inside the parentheses is the prompt. It is printed without a
newline, so the cursor sits on the same line - which is why prompts usually
end with a space.

> Press **Run** and Foothold will ask you the question for real, one at a time,
> just as a terminal would.

## Everything typed is text

This is the part that catches everyone.

```python
age = input("Age? ")
print(age + 1)
```

That crashes with a `TypeError`, because `age` is the string `"36"`, not the
number `36`, and you cannot add 1 to a piece of text.

To do arithmetic you must **convert** it:

```python
age = int(input("Age? "))
print(age + 1)
```

- `int(...)` turns text into a whole number
- `float(...)` turns text into a decimal number
- `str(...)` turns a number into text

Read `int(input("Age? "))` from the inside out: `input` runs first and returns
text, then `int` converts that text to a number.

If someone types something that is not a number at all, `int()` raises a
`ValueError`. Handling that gracefully is a later lesson; for now, assume
people type what you asked for.

## Your turn

Ask for a temperature in Celsius and print it in Fahrenheit, to one decimal
place.

The formula is `F = C * 9 / 5 + 32`.

Your program should print exactly this, for an input of `20`:

```
Celsius? 20
20.0C is 68.0F
```

The first line is the prompt with the typed answer after it - that appears by
itself. Your job is the second line.

```python starter
# Ask for a temperature, convert it, print the result.
```

```python solution
celsius = float(input("Celsius? "))
fahrenheit = celsius * 9 / 5 + 32
print(f"{celsius:.1f}C is {fahrenheit:.1f}F")
```

```text stdin
20
```

```python tests
def test_asks_and_converts():
    """It asks for a temperature and converts it"""
    expect_output("Celsius? 20\n20.0C is 68.0F")

def test_uses_input():
    """It reads the value with input()"""
    assert "input(" in SOURCE, "Use input() to ask for the temperature."

def test_converts_the_text():
    """The text is converted to a number"""
    assert "float(" in SOURCE or "int(" in SOURCE, (
        "input() hands back text. Wrap it in float() so you can do arithmetic on it."
    )
```

```text hint
The prompt must be exactly `"Celsius? "` - with the space at the end.
```

```text hint
`float(input("Celsius? "))` gets you a number you can multiply.
```

```text hint
One decimal place is `{value:.1f}` inside an f-string.
```
