---
title: When Not to Write a Class
goal: Recognise the cases where a function is the better answer.
estimate: 8
concepts:
  - design
---

Having learned classes, the temptation is to put everything in one. Resist it.
A class earns its place when there is **state that outlives a single call**
and behaviour that belongs to that state.

Here is a class that should have been a function:

```python
class Calculator:
    def add(self, a, b):
        return a + b
```

Nothing is stored. `self` is never used. Creating a Calculator to call
`add(2, 3)` is ceremony around `2 + 3`.

```python
def add(a, b):
    return a + b
```

The rule of thumb: if every method could be a plain function taking the same
arguments, you have written a module with extra steps.

## Signs a class is right

- Several functions all take the same first argument, and you keep passing it
  around. Make it the object.
- Something has to be set up once and used many times: an open connection, a
  loaded configuration, a running total across calls.
- Two variants share behaviour and differ in one step. That is the
  polymorphism case from the inheritance lesson.

## Signs a class is wrong

- The class has one method and no fields.
- Every method is `@staticmethod`.
- The constructor takes no arguments and the object holds nothing.
- You named it `Manager`, `Handler`, or `Helper`, and cannot say what it holds.

## Your turn

Below is a class that has been over-engineered. Rewrite it as two plain
functions, keeping the behaviour identical:

- `total(prices)` returns the sum
- `receipt(prices, tax=0.2)` returns a string like `3 items, 24.00 inc tax`

The item count is the length of the list. The total includes tax, shown to two
decimal places.

Expected output:

```
20
3 items, 24.00 inc tax
0 items, 0.00 inc tax
```

```python starter
class PriceCalculator:
    def __init__(self):
        pass

    def total(self, prices):
        running = 0
        for price in prices:
            running += price
        return running

    def receipt(self, prices, tax=0.2):
        gross = self.total(prices) * (1 + tax)
        return f"{len(prices)} items, {gross:.2f} inc tax"


# Rewrite the two methods as functions, then delete the class.

print(total([5, 10, 5]))
print(receipt([5, 10, 5]))
print(receipt([]))
```

```python solution
def total(prices):
    """Return the sum of a list of prices."""
    running = 0
    for price in prices:
        running += price
    return running


def receipt(prices, tax=0.2):
    """Return a one-line receipt with tax included."""
    gross = total(prices) * (1 + tax)
    return f"{len(prices)} items, {gross:.2f} inc tax"


print(total([5, 10, 5]))
print(receipt([5, 10, 5]))
print(receipt([]))
```

```python tests
def test_total():
    """total() sums a list"""
    expect_calling("total", ([5, 10, 5],), 20)
    expect_calling("total", ([],), 0)
    expect_calling("total", ([3],), 3)

def test_receipt():
    """receipt() reports the count and the taxed total"""
    expect_calling("receipt", ([5, 10, 5],), "3 items, 24.00 inc tax")
    expect_calling("receipt", ([],), "0 items, 0.00 inc tax")

def test_tax_can_be_changed():
    """The tax rate is still an optional argument"""
    func = expect_defined("receipt")
    expect_equal(func([100], 0.5), "1 items, 150.00 inc tax", "receipt([100], 0.5)")

def test_class_is_gone():
    """The class has been removed"""
    assert "class PriceCalculator" not in SOURCE, (
        "Delete the class. Nothing was stored on it, so the two methods work better "
        "as plain functions."
    )
    assert "self" not in SOURCE, "No self is needed once these are functions."

def test_receipt_uses_total():
    """receipt still builds on total rather than repeating the sum"""
    assert "total(" in SOURCE.split("def receipt", 1)[-1], (
        "Call total() inside receipt() rather than adding the prices up a second time."
    )

def test_output():
    """The script prints the three lines"""
    expect_output("20\n3 items, 24.00 inc tax\n0 items, 0.00 inc tax")
```

```text hint
Take the method bodies as they are. Remove `self` from the parameter lists and
un-indent them one level.
```

```text hint
Inside `receipt`, `self.total(prices)` becomes `total(prices)`.
```

```text hint
Delete the whole class once both functions exist. The three print lines at the
bottom stay as they are.
```
