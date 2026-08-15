---
title: Asking Questions About Text
goal: Test what a string contains, and slice pieces out of it.
estimate: 8
concepts:
  - string methods
  - slicing
---

Strings can be examined as well as transformed.

| Method | Answers |
| --- | --- |
| `.startswith(x)` | does it begin with x? |
| `.endswith(x)` | does it end with x? |
| `.isdigit()` | is every character a digit? |
| `.isalpha()` | is every character a letter? |
| `.find(x)` | at what position is x? (-1 if absent) |
| `.count(x)` | how many times does x appear? |

And `in` works on strings just as it does on lists:

```python
if "@" in email:
    print("looks like an email")
```

## Slicing strings

A string can be sliced exactly like a list:

```python
word = "foothold"
print(word[0])
print(word[:4])
print(word[4:])
print(word[-4:])
```

The same rules apply: positions start at zero, the end is not included, and
negatives count from the right. `word[-4:]` is "the last four characters",
which is a very common thing to want.

Strings cannot be modified in place, so `word[0] = "F"` is a `TypeError`.
Build a new string instead:

```python
word = "F" + word[1:]
```

## Looping over characters

```python
for character in "abc":
    print(character)
```

Useful for counting vowels, validating input, or reversing text by hand -
though `word[::-1]` reverses a string in one step, using a slice with a step
of -1.

## Your turn

Write a function `check(password)` that returns a list of problems with a
password, in this order:

- `"too short"` if it is under 8 characters
- `"no digit"` if it contains no digits
- `"no capital"` if it contains no capital letters

Return an empty list if there is nothing wrong. Then print the results for the
three examples:

```
['too short', 'no digit', 'no capital']
['no capital']
[]
```

```python starter
def check(password):
    problems = []
    # Add a message for each problem you find.
    return problems


print(check("abc"))
print(check("abcdefg1"))
print(check("Abcdefg1"))
```

```python solution
def check(password):
    """Return a list of the problems with a password."""
    problems = []

    if len(password) < 8:
        problems.append("too short")

    has_digit = False
    has_capital = False
    for character in password:
        if character.isdigit():
            has_digit = True
        if character.isupper():
            has_capital = True

    if not has_digit:
        problems.append("no digit")
    if not has_capital:
        problems.append("no capital")

    return problems


print(check("abc"))
print(check("abcdefg1"))
print(check("Abcdefg1"))
```

```python tests
def test_all_three_problems():
    """A short lowercase password has all three problems"""
    expect_calling("check", ("abc",), ["too short", "no digit", "no capital"])

def test_one_problem():
    """A long password with a digit only lacks a capital"""
    expect_calling("check", ("abcdefg1",), ["no capital"])

def test_no_problems():
    """A good password returns an empty list"""
    expect_calling("check", ("Abcdefg1",), [])

def test_boundary():
    """Exactly eight characters is long enough"""
    expect_calling("check", ("Abcdefg1",), [])
    result = expect_defined("check")("Abcdef1")
    assert "too short" in result, (
        "Seven characters should be too short - the rule is under 8."
    )

def test_returns_not_prints():
    """check returns the list rather than printing it"""
    value = expect_defined("check")("abc")
    assert value is not None, "check should return the list, not print it."
```

```text hint
Build the list with `problems.append("too short")` and so on, then return it
at the end.
```

```text hint
`any(c.isdigit() for c in password)` tells you whether there is a digit
anywhere. Or set a flag in a loop.
```

```text hint
Capital letters: `character.isupper()`. Add each message only when the check
fails, and keep them in the order the exercise lists.
```
