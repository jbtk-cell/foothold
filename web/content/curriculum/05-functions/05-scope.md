---
title: What a Function Can See
goal: Understand which variables exist where, and document what a function does.
estimate: 8
concepts:
  - scope
  - docstrings
---

Variables created inside a function exist only inside it.

```python
def calculate():
    subtotal = 100
    return subtotal

calculate()
print(subtotal)
```

That last line is a `NameError`. `subtotal` was born when the function was
called and died when it returned. This is called **scope**, and it is a
feature: it means you can name a variable `total` inside a function without
wondering whether some other part of the program is already using that name.

Reading outwards does work:

```python
TAX_RATE = 0.2

def with_tax(price):
    return price * (1 + TAX_RATE)
```

The function can see `TAX_RATE` because it is defined at the top level of the
file. Constants like this are conventionally written in capitals.

## Assigning is different from reading

```python
count = 0

def increment():
    count = count + 1

increment()
```

That raises `UnboundLocalError`. Assigning to `count` anywhere in the function
makes it a *local* variable for the whole function, so the `count` on the
right-hand side is a local that has no value yet.

Python has a `global` keyword that changes this, and you should almost never
use it. Pass values in and return them out instead:

```python
def increment(count):
    return count + 1

count = increment(count)
```

Code where every function's effects are visible in its arguments and its
return value is enormously easier to reason about.

## Docstrings

A string on the first line of a function is its **docstring** - the
explanation of what it does.

```python
def with_tax(price, rate=0.2):
    """Return the price with tax added."""
    return price * (1 + rate)
```

`help(with_tax)` prints it. Editors show it while you type. Write it as an
instruction - "Return the price with tax added" - rather than "This function
returns...".

## Your turn

Write a function `initials(full_name)` that returns the initials of a name in
capitals:

```
initials("ada lovelace")   ->  "AL"
initials("Grace Brewster Murray Hopper")  ->  "GBMH"
```

It must have a docstring. Then print the two examples above:

```
AL
GBMH
```

```python starter
def initials(full_name):
    # A docstring goes here, then the code.
    pass
```

```python solution
def initials(full_name):
    """Return the capitalised initials of each word in a name."""
    letters = ""
    for word in full_name.split():
        letters += word[0].upper()
    return letters


print(initials("ada lovelace"))
print(initials("Grace Brewster Murray Hopper"))
```

```python tests
def test_two_words():
    """It handles a two-word name"""
    expect_calling("initials", ("ada lovelace",), "AL")

def test_four_words():
    """It handles a four-word name"""
    expect_calling("initials", ("Grace Brewster Murray Hopper",), "GBMH")

def test_one_word():
    """It handles a single name"""
    expect_calling("initials", ("Prince",), "P")

def test_has_a_docstring():
    """The function is documented"""
    func = expect_defined("initials")
    assert func.__doc__ and func.__doc__.strip(), (
        "Add a docstring - a string on the first line inside the function - saying "
        "what it returns."
    )

def test_output():
    """It prints both examples"""
    expect_output("AL\nGBMH")
```

```text hint
`"ada lovelace".split()` gives you `["ada", "lovelace"]` - a list of the words.
```

```text hint
`word[0]` is the first character of a word. `.upper()` capitalises it.
```

```text hint
Build the answer up in a string, one letter per word, then return it.
```
