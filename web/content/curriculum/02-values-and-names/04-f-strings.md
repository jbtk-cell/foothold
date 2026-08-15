---
title: Sentences with Values In
goal: Drop values straight into text with an f-string.
estimate: 6
concepts:
  - f-strings
  - formatting
---

Printing with commas works, but it puts a space between every piece whether
you want one or not, and it gets unreadable fast:

```python
name = "Ada"
age = 36
print("Hi " + name + ", you are " + str(age) + " today")
```

Python has something much better. Put an `f` immediately before the opening
quote, and then anything inside `{}` in that string is evaluated and dropped
in:

```python
name = "Ada"
age = 36
print(f"Hi {name}, you are {age} today")
```

That is an **f-string** - f for format. It handles numbers without complaint,
so no `str()` needed, and what you type looks like the sentence you get.

## Expressions inside the braces

The braces are not limited to variable names. Anything that produces a value
works:

```python
price = 4
count = 3
print(f"{count} coffees cost {price * count}")
print(f"Your name in caps is {name.upper()}")
```

## Controlling the number of decimals

Money is the usual reason to care. A colon inside the braces starts a format
specification, and `.2f` means "a decimal number, two places":

```python
total = 7 / 3
print(f"Total: {total}")
print(f"Total: {total:.2f}")
```

The second prints `Total: 2.33`. This is a rounding for display only - the
value in `total` is untouched.

## Your turn

Print a receipt line for 3 notebooks at 2.5 each, exactly like this:

```
3 x notebook @ 2.50 = 7.50
```

Both money amounts show two decimal places. Use one f-string, and work the
total out rather than typing it.

```python starter
item = "notebook"
price = 2.5
count = 3

# Print the receipt line.
```

```python solution
item = "notebook"
price = 2.5
count = 3

print(f"{count} x {item} @ {price:.2f} = {price * count:.2f}")
```

```python tests
def test_output():
    """It prints the receipt line"""
    expect_output("3 x notebook @ 2.50 = 7.50")

def test_uses_an_f_string():
    """It is built with an f-string"""
    assert 'f"' in SOURCE or "f'" in SOURCE, (
        "This one is about f-strings - start your string with f, like f\"...\"."
    )

def test_total_is_calculated():
    """The total is calculated, not typed"""
    assert "7.5" not in SOURCE, (
        "Work the total out from price and count inside the braces, rather than "
        "typing 7.50."
    )
```

```text hint
Start with `print(f"...")` and put the variable names in braces.
```

```text hint
Two decimal places comes from `:.2f` inside the braces: `{price:.2f}`.
```

```text hint
You can do the multiplication inside the braces too: `{price * count:.2f}`.
```
