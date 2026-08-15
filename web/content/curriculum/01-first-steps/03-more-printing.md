---
title: Printing More Than One Thing
goal: Build up output from several pieces and control where the lines break.
estimate: 6
concepts:
  - print
  - arguments
---

`print` is happy to take more than one thing. Separate them with commas and it
prints them all, with a single space between each.

```python
print("Ada", "Grace", "Alan")
```

That prints `Ada Grace Alan` on one line.

The pieces do not have to be text. Python will print numbers too, and you can
mix them freely - which is the first hint that quotes are not decoration, they
are the difference between a piece of text and a number you can do arithmetic
on.

```python
print("The answer is", 42)
```

## One line each

Each `print` starts a new line. Three calls, three lines:

```python
print("first")
print("second")
print("third")
```

An empty `print()` with nothing inside prints nothing at all, which is to say
it prints a blank line. That is genuinely useful for spacing output out.

## Your turn

Write a program that prints exactly this:

```
Name: Ada Lovelace
Born: 1815

She wrote the first computer program.
```

Note the blank line before the last sentence. Get the number in there with a
comma rather than by typing it inside the quotes - it makes no difference to
the output here, but it is the habit you want.

```python starter
print("Name:", "Ada", "Lovelace")
# Add the rest below.
```

```python solution
print("Name:", "Ada", "Lovelace")
print("Born:", 1815)
print()
print("She wrote the first computer program.")
```

```python tests
def test_four_lines():
    """It prints four lines, one of them blank"""
    lines = STDOUT.rstrip("\n").split("\n")
    assert len(lines) == 4, (
        "Expected 4 lines of output (the blank one counts), but got "
        + str(len(lines)) + ".\nYour output was:\n\n" + STDOUT
    )

def test_exact_output():
    """The output matches exactly"""
    expect_output("Name: Ada Lovelace\nBorn: 1815\n\nShe wrote the first computer program.")
```

```text hint
You need four `print` calls in total. One of them has nothing inside its
parentheses.
```

```text hint
`print("Born:", 1815)` gives you `Born: 1815` - the comma supplies the space,
so do not add one of your own inside the quotes.
```

```text hint
The blank line comes from `print()` on its own, between the `Born:` line and
the sentence.
```
