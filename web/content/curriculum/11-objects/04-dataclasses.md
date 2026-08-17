---
title: Classes Without the Boilerplate
goal: Use a dataclass when the class is mostly fields.
estimate: 8
concepts:
  - dataclasses
---

Plenty of classes exist to hold a few fields. Writing them by hand means the
same three lines every time:

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Point(x={self.x}, y={self.y})"

    def __eq__(self, other):
        return self.x == other.x and self.y == other.y
```

Twelve lines to say "a point has an x and a y". The standard library has a
shortcut:

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

print(Point(1, 2))
print(Point(1, 2) == Point(1, 2))
```

That is the same class. `@dataclass` is a **decorator**, a line starting with
`@` that modifies the thing defined below it. This one reads the fields and
writes `__init__`, `__repr__` and `__eq__` for you.

`x: int` is a **type annotation**. Python does not enforce it at runtime, and
passing a string still works. Editors and type checkers read it, and so do
people, and the dataclass decorator uses it to spot the fields.

## Defaults and methods

Defaults work the way they do in a function, and must come after the fields
without them:

```python
@dataclass
class Point:
    x: int
    y: int
    label: str = ""

    def distance_from_origin(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5
```

Methods are ordinary methods. The decorator only supplies the parts you did
not write.

## Frozen dataclasses

Add `frozen=True` and the object cannot be changed after it is made:

```python
@dataclass(frozen=True)
class Point:
    x: int
    y: int
```

Assigning to `point.x` now raises. That sounds like a restriction and reads as
a promise: anyone passing this object around knows nobody will alter it
underneath them. Frozen objects can also be dictionary keys.

## Your turn

Build a `Book` dataclass with `title`, `author`, `year`, and `available`
defaulting to `True`. Add:

- `label()` returning `"Dune by Frank Herbert (1965)"`
- `age(now)` returning how many years old it is

Then print:

```
Book(title='Dune', author='Frank Herbert', year=1965, available=True)
Dune by Frank Herbert (1965)
61
True
False
```

The last two lines compare two books with identical fields, then two with
different years.

```python starter
from dataclasses import dataclass


# Write the Book dataclass here.


dune = Book("Dune", "Frank Herbert", 1965)
print(dune)
print(dune.label())
print(dune.age(2026))
print(dune == Book("Dune", "Frank Herbert", 1965))
print(dune == Book("Dune", "Frank Herbert", 1984))
```

```python solution
from dataclasses import dataclass


@dataclass
class Book:
    title: str
    author: str
    year: int
    available: bool = True

    def label(self):
        return f"{self.title} by {self.author} ({self.year})"

    def age(self, now):
        return now - self.year


dune = Book("Dune", "Frank Herbert", 1965)
print(dune)
print(dune.label())
print(dune.age(2026))
print(dune == Book("Dune", "Frank Herbert", 1965))
print(dune == Book("Dune", "Frank Herbert", 1984))
```

```python tests
def test_is_a_dataclass():
    """Book is built with @dataclass"""
    import dataclasses
    cls = expect_defined("Book", "class")
    assert dataclasses.is_dataclass(cls), (
        "Put @dataclass above the class so Python writes __init__, __repr__ and __eq__."
    )

def test_fields_and_default():
    """The four fields exist, with available defaulting to True"""
    book = expect_defined("Book")("T", "A", 2000)
    expect_equal(book.title, "T", "the title")
    expect_equal(book.author, "A", "the author")
    expect_equal(book.year, 2000, "the year")
    expect_equal(book.available, True, "available, when not supplied")

def test_label():
    """label() formats the three fields"""
    book = expect_defined("Book")("Dune", "Frank Herbert", 1965)
    expect_equal(book.label(), "Dune by Frank Herbert (1965)", "the label")

def test_age():
    """age() subtracts the year"""
    book = expect_defined("Book")("Dune", "Frank Herbert", 1965)
    expect_equal(book.age(2026), 61, "the age in 2026")
    expect_equal(book.age(1965), 0, "the age in its year of publication")

def test_equality_comes_free():
    """Two identical books compare equal"""
    cls = expect_defined("Book")
    expect_equal(cls("A", "B", 1) == cls("A", "B", 1), True, "identical books")
    expect_equal(cls("A", "B", 1) == cls("A", "B", 2), False, "books from different years")

def test_output():
    """The script prints all five lines"""
    expect_output(
        "Book(title='Dune', author='Frank Herbert', year=1965, available=True)\n"
        "Dune by Frank Herbert (1965)\n61\nTrue\nFalse"
    )
```

```text hint
The import is already there. Put `@dataclass` on the line above
`class Book:`.
```

```text hint
Fields are declared as `title: str` with no assignment. The one with a default
goes last: `available: bool = True`.
```

```text hint
`label` and `age` are ordinary methods taking `self`. `age` also takes the
current year as a parameter.
```
