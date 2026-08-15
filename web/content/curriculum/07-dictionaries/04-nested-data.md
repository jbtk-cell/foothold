---
title: Data Inside Data
goal: Work with a list of dictionaries, which is how most real data arrives.
estimate: 9
concepts:
  - nested data
  - dictionaries
---

The values in a dictionary can be lists. The items in a list can be
dictionaries. Almost every real dataset you will meet - a config file, an API
response, a spreadsheet export - is some arrangement of these two.

The most common shape by far is a **list of dictionaries**, one dictionary per
record:

```python
people = [
    {"name": "Ada", "age": 36, "languages": ["python", "c"]},
    {"name": "Grace", "age": 45, "languages": ["cobol"]},
]
```

Getting at things is just the two syntaxes stacked up, read left to right:

```python
print(people[0]["name"])
print(people[0]["languages"][1])
```

*The first person, their name.* *The first person, their languages, the second
one.*

## Looping over records

```python
for person in people:
    print(f"{person['name']} is {person['age']}")
```

Each `person` is a whole dictionary, and inside the loop you work with it
exactly as you would any dictionary.

## Filtering records

```python
adults = [p for p in people if p["age"] >= 40]
```

## Pulling one field out

```python
names = [p["name"] for p in people]
```

Together, those two comprehensions cover a surprising amount of real data
work.

## Your turn

Given the book list below, print exactly:

```
Dune (1965) by Frank Herbert
Neuromancer (1984) by William Gibson
Snow Crash (1992) by Neal Stephenson
Oldest: Dune
Average year: 1980
```

The average year is rounded to a whole number with `round()`.

```python starter
books = [
    {"title": "Dune", "author": "Frank Herbert", "year": 1965},
    {"title": "Neuromancer", "author": "William Gibson", "year": 1984},
    {"title": "Snow Crash", "author": "Neal Stephenson", "year": 1992},
]

# Print a line per book, then the oldest and the average year.
```

```python solution
books = [
    {"title": "Dune", "author": "Frank Herbert", "year": 1965},
    {"title": "Neuromancer", "author": "William Gibson", "year": 1984},
    {"title": "Snow Crash", "author": "Neal Stephenson", "year": 1992},
]

for book in books:
    print(f"{book['title']} ({book['year']}) by {book['author']}")

oldest = min(books, key=lambda book: book["year"])
years = [book["year"] for book in books]

print(f"Oldest: {oldest['title']}")
print(f"Average year: {round(sum(years) / len(years))}")
```

```python tests
def test_output():
    """It prints the three books and the two summary lines"""
    expect_output(
        "Dune (1965) by Frank Herbert\n"
        "Neuromancer (1984) by William Gibson\n"
        "Snow Crash (1992) by Neal Stephenson\n"
        "Oldest: Dune\n"
        "Average year: 1980"
    )

def test_uses_a_loop():
    """The book lines come from a loop"""
    assert "for " in SOURCE, "Print the books with a loop rather than three prints."

def test_average_computed():
    """The average is worked out from the data"""
    assert "1980" not in SOURCE, "Work the average out rather than typing 1980."
    assert "len(" in SOURCE, "Divide by len(...) so it still works when a book is added."

def test_oldest_computed():
    """The oldest is found, not typed"""
    after = SOURCE.split("]", 1)[-1]
    assert 'Oldest: Dune' not in after.replace('Oldest: {', ''), (
        "Find the oldest book from the data rather than typing its title."
    )
```

```text hint
Inside the loop, `book["title"]` and `book["year"]` get at the fields. In an
f-string use single quotes for the key.
```

```text hint
Collect the years with a comprehension: `[book["year"] for book in books]`.
Then `sum(...) / len(...)` and wrap it in `round()`.
```

```text hint
For the oldest, either use `min(books, key=lambda book: book["year"])`, or
sort the years and match, or track the minimum in the loop you already have.
```
