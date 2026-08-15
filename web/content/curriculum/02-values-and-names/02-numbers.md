---
title: Arithmetic
goal: Do sums, and know which kind of number you get back.
estimate: 7
concepts:
  - numbers
  - operators
---

Python does arithmetic with the symbols you would expect, and two you might
not.

| You write | It means |
| --- | --- |
| `a + b` | add |
| `a - b` | subtract |
| `a * b` | multiply |
| `a / b` | divide |
| `a // b` | divide, throwing away the remainder |
| `a % b` | the remainder only |
| `a ** b` | a to the power of b |

```python
print(7 + 3)
print(7 * 3)
print(7 / 3)
print(7 // 3)
print(7 % 3)
print(7 ** 3)
```

Try that. Two results are worth staring at.

`7 / 3` gives `2.3333333333333335`, not a whole number. **Plain division
always produces a decimal**, even when it divides evenly: `6 / 3` is `2.0`,
not `2`. Python calls whole numbers `int` and decimals `float`.

`7 // 3` gives `2`. That is **floor division** - divide and discard whatever
is left over. And `7 % 3` gives `1`, the bit that was discarded. Together they
answer "how many whole times does this fit, and what is left?"

`%` looks obscure but earns its keep constantly: `n % 2` is `0` for even
numbers and `1` for odd ones.

## Order of operations

The usual rules apply - `*` and `/` happen before `+` and `-` - and brackets
override them.

```python
print(2 + 3 * 4)
print((2 + 3) * 4)
```

When in doubt, add brackets. Nobody has ever been confused by too many.

## Your turn

A café sells coffee at 4 each. Someone pays with a 20 note.

Using the variables given, work out and print:

```
Coffees: 5
Change: 0
```

where the first number is how many whole coffees the 20 covers, and the
second is what is left over. Calculate both - do not type the answers in.

```python starter
price = 4
paid = 20

# Work out how many whole coffees, and the change.
```

```python solution
price = 4
paid = 20

coffees = paid // price
change = paid % price

print("Coffees:", coffees)
print("Change:", change)
```

```python tests
def test_output():
    """It prints the count and the change"""
    expect_output("Coffees: 5\nChange: 0")

def test_actually_calculated():
    """The numbers are worked out, not typed in"""
    assert "//" in SOURCE or "int(" in SOURCE, (
        "Work the number of coffees out with floor division (//) rather than "
        "typing 5. Then it still works when the price changes."
    )
    assert "%" in SOURCE, (
        "Work the change out with the remainder operator (%) rather than typing 0."
    )

def test_uses_the_variables():
    """The sums use price and paid, not the literal numbers"""
    after = SOURCE.split("paid = 20", 1)[-1]
    assert "20" not in after, (
        "Use the variable `paid` in your arithmetic rather than typing 20 again."
    )
```

```text hint
`//` gives you the whole number of times something fits. `%` gives what is
left over.
```

```text hint
`paid // price` is the number of coffees. `paid % price` is the change.
```

```text hint
Store them in variables first, then print with `print("Coffees:", coffees)`.
```
