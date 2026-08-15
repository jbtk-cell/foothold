---
title: True and False
goal: Write a comparison and read the answer.
estimate: 6
concepts:
  - booleans
  - comparison
---

There is a type in Python with exactly two values: `True` and `False`. It is
called `bool`, after George Boole, and it is what every decision is built on.

You rarely type `True` yourself. You get one by comparing two things.

```python
print(3 > 2)
print(3 < 2)
print(3 == 3)
```

| You write | It asks |
| --- | --- |
| `a == b` | are they equal? |
| `a != b` | are they different? |
| `a > b` | is a bigger? |
| `a < b` | is a smaller? |
| `a >= b` | is a bigger or the same? |
| `a <= b` | is a smaller or the same? |

## Two equals signs, not one

This is the single most common typo in programming, and it is worth learning
the reason rather than the rule:

- `=` **sets** a name to a value. It is a command.
- `==` **asks** whether two values are the same. It is a question.

`age = 18` makes age eighteen. `age == 18` asks whether it already is.

## Comparing text

Strings compare too. `==` checks they are exactly the same, and it cares about
case:

```python
print("ada" == "Ada")
print("ada" == "ada")
```

The first is `False`. Comparing user input almost always wants `.lower()`
applied to both sides first.

## Storing the answer

The result of a comparison is a value like any other, so you can name it:

```python
temperature = 31
is_hot = temperature > 25
print(is_hot)
```

Names that read as a yes-or-no question - `is_hot`, `has_paid`, `is_valid` -
make the code that uses them read like English.

## Your turn

Given the variables below, create three of your own and print them:

- `is_adult` - whether `age` is 18 or more
- `is_free` - whether `price` is exactly 0
- `name_matches` - whether `name` is `"ada"`, ignoring capitalisation

Print them one per line, in that order.

```python starter
age = 20
price = 0
name = "Ada"

# Work out the three answers and print them.
```

```python solution
age = 20
price = 0
name = "Ada"

is_adult = age >= 18
is_free = price == 0
name_matches = name.lower() == "ada"

print(is_adult)
print(is_free)
print(name_matches)
```

```python tests
def test_output():
    """It prints three True values"""
    expect_output("True\nTrue\nTrue")

def test_variables_are_booleans():
    """The three variables hold True or False"""
    for label in ("is_adult", "is_free", "name_matches"):
        value = expect_defined(label, "variable")
        assert isinstance(value, bool), (
            label + " should hold True or False, but it holds " + repr(value)
            + ". Make it the result of a comparison."
        )

def test_comparisons_not_constants():
    """The answers come from comparisons"""
    assert "==" in SOURCE or ">=" in SOURCE, (
        "Work the answers out by comparing the variables rather than typing True."
    )

def test_case_insensitive_name():
    """The name check ignores capitalisation"""
    assert ".lower()" in SOURCE or ".upper()" in SOURCE, (
        "`name` is \"Ada\" with a capital A, so a plain == against \"ada\" is False. "
        "Put both sides in the same case first."
    )
```

```text hint
"18 or more" is `>=`, not `>`.
```

```text hint
`price == 0` asks whether price is zero. One equals sign would set it to zero.
```

```text hint
For the name, compare `name.lower()` against `"ada"`.
```
