---
title: Making an Object Printable
goal: Control how your object appears, and how it compares.
estimate: 9
concepts:
  - dunder methods
  - repr
---

Print one of your own objects and Python has nothing useful to say:

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

print(Point(1, 2))
```

You get something like `<__main__.Point object at 0x7f8b1c0>`. The hexadecimal
number is the object's address in memory, which tells you two things you did
not want to know and nothing you did.

`__repr__` fixes it:

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

print(Point(1, 2))
print([Point(1, 2), Point(3, 4)])
```

The convention for `__repr__` is to return something that would recreate the
object if you typed it back in. Follow it and debugging gets easier, because
a list of your objects prints as something you can read.

## Comparing

Two objects with identical contents are still different objects:

```python
print(Point(1, 2) == Point(1, 2))
```

That is `False`, because by default `==` on objects asks whether they are the
same object, not whether they hold the same values. `__eq__` decides:

```python
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y
```

## The ones worth knowing

| Method | Called when |
| --- | --- |
| `__init__` | the object is created |
| `__repr__` | it is printed, or shown in a list |
| `__eq__` | it is compared with `==` |
| `__len__` | `len()` is called on it |
| `__lt__` | it is compared with `<`, which also gives you `sorted()` |

These are how Python lets your types behave like its own. A class with
`__len__` works with `len()`; one with `__lt__` can be sorted. Nothing is
registered or declared, the method being there is enough.

## Your turn

Write a `Money` class holding `amount` and `currency`, with:

- `__repr__` returning `Money(5.5, 'GBP')`
- `__eq__` treating two Money objects as equal when both fields match
- `__lt__` comparing amounts, raising `ValueError("cannot compare GBP with USD")`
  when the currencies differ

Then print:

```
Money(5.5, 'GBP')
True
False
[Money(1, 'GBP'), Money(5.5, 'GBP'), Money(9, 'GBP')]
cannot compare GBP with USD
```

```python starter
class Money:
    def __init__(self, amount, currency):
        self.amount = amount
        self.currency = currency


print(Money(5.5, "GBP"))
print(Money(5.5, "GBP") == Money(5.5, "GBP"))
print(Money(5.5, "GBP") == Money(5.5, "USD"))
print(sorted([Money(9, "GBP"), Money(1, "GBP"), Money(5.5, "GBP")]))
try:
    Money(1, "GBP") < Money(1, "USD")
except ValueError as error:
    print(error)
```

```python solution
class Money:
    def __init__(self, amount, currency):
        self.amount = amount
        self.currency = currency

    def __repr__(self):
        return f"Money({self.amount}, {self.currency!r})"

    def __eq__(self, other):
        return self.amount == other.amount and self.currency == other.currency

    def __lt__(self, other):
        if self.currency != other.currency:
            raise ValueError(f"cannot compare {self.currency} with {other.currency}")
        return self.amount < other.amount


print(Money(5.5, "GBP"))
print(Money(5.5, "GBP") == Money(5.5, "GBP"))
print(Money(5.5, "GBP") == Money(5.5, "USD"))
print(sorted([Money(9, "GBP"), Money(1, "GBP"), Money(5.5, "GBP")]))
try:
    Money(1, "GBP") < Money(1, "USD")
except ValueError as error:
    print(error)
```

```python tests
def test_repr():
    """__repr__ shows the amount and the currency"""
    cls = expect_defined("Money", "class")
    expect_equal(repr(cls(5.5, "GBP")), "Money(5.5, 'GBP')", "repr of Money(5.5, 'GBP')")

def test_equality():
    """Two identical amounts in the same currency are equal"""
    cls = expect_defined("Money")
    expect_equal(cls(3, "GBP") == cls(3, "GBP"), True, "GBP 3 against GBP 3")
    expect_equal(cls(3, "GBP") == cls(4, "GBP"), False, "GBP 3 against GBP 4")
    expect_equal(cls(3, "GBP") == cls(3, "USD"), False, "GBP 3 against USD 3")

def test_sorting():
    """Sorting orders by amount"""
    cls = expect_defined("Money")
    ordered = sorted([cls(9, "GBP"), cls(1, "GBP"), cls(5, "GBP")])
    expect_equal([m.amount for m in ordered], [1, 5, 9], "the sorted amounts")

def test_mismatched_currency_raises():
    """Comparing different currencies raises"""
    cls = expect_defined("Money")
    try:
        cls(1, "GBP") < cls(1, "USD")
    except ValueError as error:
        expect_equal(str(error), "cannot compare GBP with USD", "the error message")
    else:
        raise AssertionError("Comparing GBP with USD should raise a ValueError.")

def test_output():
    """The script prints all five lines"""
    expect_output(
        "Money(5.5, 'GBP')\nTrue\nFalse\n"
        "[Money(1, 'GBP'), Money(5.5, 'GBP'), Money(9, 'GBP')]\n"
        "cannot compare GBP with USD"
    )
```

```text hint
`__repr__` returns a string. Use `!r` on the currency so it comes out with
quotes: `f"Money({self.amount}, {self.currency!r})"`.
```

```text hint
`__eq__` and `__lt__` both take `self` and `other`, and both return a boolean.
```

```text hint
`__lt__` checks the currencies first and raises before comparing. `sorted()`
uses `__lt__`, which is why defining it is enough to make a list of Money
sortable.
```
