---
title: Optional Arguments
goal: Give a parameter a default, and pass arguments by name.
estimate: 7
concepts:
  - default arguments
  - keyword arguments
---

A parameter can have a default value, used when the caller does not supply
one.

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}"

print(greet("Ada"))
print(greet("Ada", "Good morning"))
```

Parameters with defaults must come after those without. `def greet(greeting="Hi", name)`
is a `SyntaxError`, because there would be no way to tell which argument was
which.

## Passing by name

You can also name the arguments at the call site:

```python
print(greet(name="Ada", greeting="Hey"))
```

These are **keyword arguments**. They can be given in any order, and they make
a call self-explaining. Compare:

```python
draw_box(10, 20, True, False)
draw_box(width=10, height=20, filled=True, shadow=False)
```

The second needs no comment. Any call with a bare `True` or `False` in it is a
good candidate for keywords.

You have already used one: `print("*", end="")`.

## One trap

Never use a list or a dictionary as a default value. This does not do what it
looks like:

```python
def add_item(item, basket=[]):
    basket.append(item)
    return basket
```

The default list is created **once**, when the function is defined, and shared
by every call that relies on it - so the basket keeps filling up between
calls. The safe version uses `None`:

```python
def add_item(item, basket=None):
    if basket is None:
        basket = []
    basket.append(item)
    return basket
```

That pattern is worth memorising; it catches experienced people too.

## Your turn

Write `price_with_tax(price, rate=0.2, currency="GBP")` that returns a string
like:

```
GBP 12.00
```

The tax is added to the price, and the result shows two decimal places.

Print these three calls:

```python
print(price_with_tax(10))
print(price_with_tax(10, 0.05))
print(price_with_tax(10, currency="USD"))
```

giving:

```
GBP 12.00
GBP 10.50
USD 12.00
```

```python starter
# Define price_with_tax with two defaults, then make the three calls.
```

```python solution
def price_with_tax(price, rate=0.2, currency="GBP"):
    total = price * (1 + rate)
    return f"{currency} {total:.2f}"


print(price_with_tax(10))
print(price_with_tax(10, 0.05))
print(price_with_tax(10, currency="USD"))
```

```python tests
def test_defaults():
    """The defaults are 0.2 and GBP"""
    expect_calling("price_with_tax", (10,), "GBP 12.00")

def test_overriding_the_rate():
    """The rate can be overridden positionally"""
    expect_calling("price_with_tax", (10, 0.05), "GBP 10.50")

def test_overriding_by_keyword():
    """The currency can be overridden by name"""
    func = expect_defined("price_with_tax")
    expect_equal(func(10, currency="USD"), "USD 12.00", 'price_with_tax(10, currency="USD")')

def test_output():
    """It prints all three"""
    expect_output("GBP 12.00\nGBP 10.50\nUSD 12.00")
```

```text hint
The definition line is `def price_with_tax(price, rate=0.2, currency="GBP"):`.
```

```text hint
The total is `price * (1 + rate)` - the price plus the tax on it.
```

```text hint
Return an f-string: `f"{currency} {total:.2f}"`.
```
