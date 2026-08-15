---
title: And, Or, Not
goal: Combine several conditions into one.
estimate: 7
concepts:
  - logic
  - operators
---

Three words let you build bigger questions out of small ones.

**`and`** is `True` only when both sides are:

```python
age = 20
has_ticket = True

if age >= 18 and has_ticket:
    print("Come in")
```

**`or`** is `True` when at least one side is:

```python
day = "Saturday"

if day == "Saturday" or day == "Sunday":
    print("Weekend")
```

**`not`** flips the answer:

```python
if not has_ticket:
    print("You need a ticket")
```

## A trap worth knowing now

This does not do what it looks like it does:

```python
if day == "Saturday" or "Sunday":
```

Python reads it as `(day == "Saturday") or ("Sunday")`, and a non-empty string
counts as true, so the whole thing is always `True`. You have to repeat the
comparison in full on both sides.

For this exact case there is a neater way:

```python
if day in ("Saturday", "Sunday"):
    print("Weekend")
```

`in` asks whether a value appears in a collection, and reads better than a
chain of `or`s.

## Chained comparisons

Python lets you write a range the way mathematics does:

```python
if 0 <= score <= 100:
    print("valid")
```

That means `score >= 0 and score <= 100`. Most languages cannot do this;
Python can, and it is clearer.

## Your turn

Decide whether someone can borrow a book. They can if:

- they have a library card, **and**
- they owe nothing in fines, **and**
- the book is not reserved

Print `Yes` if all three hold, and `No` otherwise. With the values below the
answer is `No`, because there is a fine outstanding.

```python starter
has_card = True
fines = 3
is_reserved = False

# Print Yes or No.
```

```python solution
has_card = True
fines = 3
is_reserved = False

if has_card and fines == 0 and not is_reserved:
    print("Yes")
else:
    print("No")
```

```python tests
def test_says_no():
    """With a fine outstanding, the answer is No"""
    expect_output("No")

def test_uses_and():
    """The three conditions are combined"""
    assert " and " in SOURCE, (
        "All three conditions have to hold at once - join them with `and`."
    )

def test_checks_all_three():
    """All three variables are consulted"""
    for name in ("has_card", "fines", "is_reserved"):
        assert name in SOURCE.split("is_reserved =", 1)[-1], (
            "Your condition does not mention " + name + "."
        )

def test_not_hardcoded():
    """It decides, rather than printing a fixed answer"""
    assert "if " in SOURCE, "Use an if statement to decide between Yes and No."
```

```text hint
`has_card` is already True or False, so you can use it directly - no need for
`has_card == True`.
```

```text hint
"owes nothing" is `fines == 0`. "is not reserved" is `not is_reserved`.
```

```text hint
Join all three with `and`, then print Yes in the if and No in the else.
```
