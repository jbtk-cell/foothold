---
title: Passing Things In
goal: Write a function that behaves differently depending on what it is given.
estimate: 8
concepts:
  - parameters
  - arguments
---

A function that always does exactly the same thing is not much better than
the code written out. What makes functions powerful is giving them something
to work on.

```python
def greet(name):
    print(f"Hello, {name}")

greet("Ada")
greet("Grace")
```

`name` inside the parentheses of the `def` is a **parameter**: a variable that
exists inside the function, whose value is supplied fresh on every call. The
value you actually pass in - `"Ada"` - is the **argument**.

The parameter name is yours to choose and only means anything inside the
function.

## More than one

Separate them with commas, in both the definition and the call:

```python
def describe(name, age):
    print(f"{name} is {age}")

describe("Ada", 36)
```

They match up **by position**. The first argument becomes the first
parameter. Swap them at the call site and you get `36 is Ada`, with no
complaint from Python - it has no idea what you meant.

Pass the wrong *number*, though, and it stops you:

```python
describe("Ada")
```

> TypeError: describe() missing 1 required positional argument: 'age'

That error message is worth reading properly. It names the function, says how
many were missing, and names them.

## Your turn

Write a function `receipt(item, price, quantity)` that prints one line:

```
3 x notebook = 7.50
```

with the total worked out and shown to two decimal places.

Then call it twice, exactly like this:

```python
receipt("notebook", 2.5, 3)
receipt("pen", 1.2, 5)
```

so the full output is:

```
3 x notebook = 7.50
5 x pen = 6.00
```

```python starter
# Define receipt(item, price, quantity), then make the two calls.
```

```python solution
def receipt(item, price, quantity):
    total = price * quantity
    print(f"{quantity} x {item} = {total:.2f}")

receipt("notebook", 2.5, 3)
receipt("pen", 1.2, 5)
```

```python tests
def test_output():
    """Both receipt lines print"""
    expect_output("3 x notebook = 7.50\n5 x pen = 6.00")

def test_takes_three_parameters():
    """receipt takes three parameters"""
    func = expect_defined("receipt")
    import inspect
    count = len(inspect.signature(func).parameters)
    assert count == 3, (
        "receipt should take three parameters - item, price and quantity - "
        "but yours takes " + str(count) + "."
    )

def test_works_on_other_values():
    """It works for values the lesson never mentioned"""
    func = expect_defined("receipt")
    import io, sys
    held, sys.stdout = sys.stdout, io.StringIO()
    try:
        func("rope", 10.0, 2)
        produced = sys.stdout.getvalue().strip()
    finally:
        sys.stdout = held
    expect_equal(produced, "2 x rope = 20.00", "Calling receipt('rope', 10.0, 2) should work too.")
```

```text hint
The definition line is `def receipt(item, price, quantity):`.
```

```text hint
Work the total out inside the function - the caller only passes the price and
the quantity.
```

```text hint
The print is `print(f"{quantity} x {item} = {price * quantity:.2f}")`.
```
