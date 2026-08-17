---
title: Giving Things Names
goal: Store a value under a name and use it later.
estimate: 6
concepts:
  - variables
  - assignment
---

A **variable** is a name for a value.

```python
city = "Reykjavik"
print(city)
```

The `=` is not the equals sign from mathematics. It does not claim that two
things are equal; it is an instruction: *take the value on the right, and from
now on let the name on the left refer to it.* Read it as "gets" or "is set
to."

Once a name exists you can use it anywhere the value would go, as many times
as you like.

```python
city = "Reykjavik"
print("Welcome to", city)
print(city, "has about 140,000 people")
```

## Names can change

That is the whole point of calling them variables.

```python
score = 0
print(score)
score = 10
print(score)
```

The second assignment replaces the first. The old value is gone, which also
means you can build a value up from itself:

```python
score = 0
score = score + 5
print(score)
```

Read the middle line right-hand side first: work out `score + 5`, which is 5,
then let `score` refer to that. Nothing about it is circular, though it looks
alarming the first time.

## Choosing names

Python will accept almost anything, but a name has real rules: letters,
digits and underscores, not starting with a digit, and no spaces.

Good names are lowercase, with underscores between words, and say what the
thing *is*:

```python
total_price = 42
user_name = "ada"
```

`x`, `data`, and `thing` are names that make your future self do detective
work. Spend the extra second now.

## Your turn

Create three variables and print one sentence using all three:

- `product` set to `"notebook"`
- `price` set to `3`
- `quantity` set to `4`

Then print exactly:

```
4 notebook at 3 each
```

Use the variables in the `print` - do not retype the values.

```python starter
product = "notebook"
# Add price and quantity, then print the line.
```

```python solution
product = "notebook"
price = 3
quantity = 4
print(quantity, product, "at", price, "each")
```

```python tests
def test_variables_exist():
    """The three variables exist with the right values"""
    expect_equal(expect_defined("product", "variable"), "notebook", "product")
    expect_equal(expect_defined("price", "variable"), 3, "price")
    expect_equal(expect_defined("quantity", "variable"), 4, "quantity")

def test_sentence():
    """It prints the sentence"""
    expect_output("4 notebook at 3 each")

def test_uses_the_variables():
    """The sentence is built from the variables, not retyped"""
    assert "notebook" not in SOURCE.split("print", 1)[-1], (
        "Use the variable names inside print(), rather than typing the values again. "
        "That way changing the value at the top changes the output too."
    )
```

```text hint
Assignment looks like `price = 3`. No quotes around numbers.
```

```text hint
`print` takes several things separated by commas, and puts a space between
each one: `print(quantity, product, "at", ...)`.
```

```text hint
The full line is `print(quantity, product, "at", price, "each")`.
```
