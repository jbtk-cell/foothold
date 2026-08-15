---
title: A Guessing Game
goal: Build a loop that keeps asking until the answer is right.
estimate: 10
concepts:
  - while
  - input
  - project
---

A program that talks back. The computer has a number in mind; the player
guesses; the program says higher or lower until they get it.

This is the classic shape of an interactive program:

```python
while True:
    answer = input("...")
    if finished(answer):
        break
    respond(answer)
```

Press **Run** and Foothold will ask you the questions for real, one at a time.

## Your turn

The secret is 42 - fixed, so the checks can be repeatable. Real randomness
would use `random.randint(1, 100)`, and you should try that in the terminal
afterwards.

Ask `Guess: ` repeatedly. After each guess print one of:

- `Too low` if the guess is below the secret
- `Too high` if it is above
- `Got it in N guesses` and stop, when it is right

Bad input - anything that is not a whole number - prints `Numbers only` and
does not count as a guess.

With the guesses 50, 25, abc, 42 the whole output is:

```
Guess: 50
Too high
Guess: 25
Too low
Guess: abc
Numbers only
Guess: 42
Got it in 3 guesses
```

```python starter
secret = 42
guesses = 0

# Keep asking until they get it.
```

```python solution
secret = 42
guesses = 0

while True:
    raw = input("Guess: ")

    try:
        guess = int(raw)
    except ValueError:
        print("Numbers only")
        continue

    guesses += 1

    if guess < secret:
        print("Too low")
    elif guess > secret:
        print("Too high")
    else:
        print(f"Got it in {guesses} guesses")
        break
```

```text stdin
50
25
abc
42
```

```python tests
def test_full_game():
    """It plays the whole game"""
    expect_output(
        "Guess: 50\nToo high\n"
        "Guess: 25\nToo low\n"
        "Guess: abc\nNumbers only\n"
        "Guess: 42\nGot it in 3 guesses"
    )

def test_bad_input_does_not_count():
    """Invalid input is not counted as a guess"""
    assert "Got it in 3 guesses" in STDOUT, (
        "Four things were typed but one was not a number, so the count should be 3. "
        "Use `continue` so the counter is skipped for bad input."
    )

def test_uses_a_loop():
    """It loops until the guess is right"""
    assert "while" in SOURCE, "Use a while loop - you cannot know how many guesses it takes."

def test_handles_bad_input():
    """Bad input is caught rather than crashing"""
    assert "except" in SOURCE, (
        "int('abc') raises a ValueError. Catch it so the game carries on."
    )

def test_stops():
    """It stops once the answer is right"""
    assert "break" in SOURCE, "Use break to leave the loop once the guess is correct."
```

```text hint
The prompt is exactly `"Guess: "` - with the space.
```

```text hint
Convert inside a try. In the except block, print `Numbers only` and use
`continue` so the rest of the loop is skipped and the count does not go up.
```

```text hint
Increment the counter only after a successful conversion, then compare with
`if / elif / else`, and `break` in the else.
```
