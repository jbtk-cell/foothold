---
title: Your First Program
goal: Make a computer print words on a screen.
estimate: 5
concepts:
  - print
  - strings
---

There is a tradition, older than most people reading this, that the first
program you write in any language just says hello. It is a small thing, but it
proves the whole chain works: your code, the interpreter that reads it, the
screen that shows the result.

In Python, showing something on screen is one word.

```python
print("Hello, World!")
```

`print` is a **function** - a named piece of work the language already knows
how to do. You hand it something by putting it inside the parentheses, and it
writes that thing out.

The quotation marks matter. Anything between quotes is a **string**: text that
Python treats as literal characters rather than as instructions. Without the
quotes, Python would look for something *named* Hello and complain that it has
never heard of it.

Try running the example above with the **Try it** button, then write your own
below.

## Your turn

Print exactly this line:

```
Hello, World!
```

Capital H, capital W, a comma, an exclamation mark. Computers are pedantic;
this is the single most useful thing to learn about them early.

```python starter
# Write your code below this line.
```

```python solution
print("Hello, World!")
```

```python tests
def test_prints_hello_world():
    """It prints Hello, World!"""
    expect_output("Hello, World!")
```

```text hint
The whole program is one line, and it starts with `print(`.
```

```text hint
Put the text inside quotation marks, and the quotes inside the parentheses:
`print("...")`.
```

```text hint
The answer is `print("Hello, World!")` - check every character, including the
comma and the exclamation mark.
```
