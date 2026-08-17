---
title: Building on a Class
goal: Extend a class instead of copying it.
estimate: 10
concepts:
  - inheritance
  - super
---

When two classes share most of their behaviour, one can inherit from the
other.

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

    def describe(self):
        return f"{self.name} says {self.speak()}"


class Dog(Animal):
    def speak(self):
        return "woof"


class Cat(Animal):
    def speak(self):
        return "meow"


print(Dog("Rex").describe())
print(Cat("Mog").describe())
```

`class Dog(Animal)` means a Dog is an Animal and gets everything Animal has.
`Dog` writes no `__init__` and no `describe`, and both work.

The interesting line is inside `describe`. It calls `self.speak()`, and
`self` is whatever object the method was called on, so a Dog gets `woof` and a
Cat gets `meow`. The parent class calls a method the child replaced. That is
**polymorphism**, and it is why inheritance is worth anything: you write the
shared logic once and let each subclass fill in the part that differs.

## Extending rather than replacing

Sometimes a subclass wants the parent's behaviour and a bit more. `super()`
reaches the parent:

```python
class Puppy(Dog):
    def __init__(self, name, weeks):
        super().__init__(name)
        self.weeks = weeks

    def describe(self):
        return super().describe() + f" ({self.weeks} weeks old)"
```

`super().__init__(name)` runs Animal's setup, then the subclass adds its own
field. Forgetting that call is a common bug: the object comes out missing the
attributes the parent would have set.

## When to leave it alone

Inheritance is easy to overuse. Reach for it when the child **is a** kind of
the parent and shares its behaviour. When two classes merely have
fields in common, giving one a reference to the other is usually simpler to
follow.

## Your turn

Model shapes.

- `Shape` takes a `name`, has `area()` returning `0`, and `describe()`
  returning `"square: 9"` style output using the name and the area
- `Square(Shape)` takes a `side`, and returns `side * side` from `area()`
- `Circle(Shape)` takes a `radius`, and returns `3.14 * radius * radius`,
  rounded to two places

Both subclasses must set the name through `super().__init__`.

Expected output:

```
square: 9
circle: 12.56
shape: 0
[9, 12.56]
```

```python starter
class Shape:
    def __init__(self, name):
        self.name = name

    def area(self):
        return 0

    def describe(self):
        return f"{self.name}: {self.area()}"


# Write Square and Circle below.


shapes = [Square(3), Circle(2)]
for shape in shapes:
    print(shape.describe())
print(Shape("shape").describe())
print([shape.area() for shape in shapes])
```

```python solution
class Shape:
    def __init__(self, name):
        self.name = name

    def area(self):
        return 0

    def describe(self):
        return f"{self.name}: {self.area()}"


class Square(Shape):
    def __init__(self, side):
        super().__init__("square")
        self.side = side

    def area(self):
        return self.side * self.side


class Circle(Shape):
    def __init__(self, radius):
        super().__init__("circle")
        self.radius = radius

    def area(self):
        return round(3.14 * self.radius * self.radius, 2)


shapes = [Square(3), Circle(2)]
for shape in shapes:
    print(shape.describe())
print(Shape("shape").describe())
print([shape.area() for shape in shapes])
```

```python tests
def test_square_area():
    """Square computes its area"""
    expect_equal(expect_defined("Square", "class")(4).area(), 16, "a square of side 4")

def test_circle_area():
    """Circle computes its area to two places"""
    expect_equal(expect_defined("Circle", "class")(2).area(), 12.56, "a circle of radius 2")
    expect_equal(expect_defined("Circle")(1).area(), 3.14, "a circle of radius 1")

def test_subclasses_inherit():
    """Square and Circle are Shapes"""
    shape = expect_defined("Shape", "class")
    assert issubclass(expect_defined("Square"), shape), "Square should inherit from Shape."
    assert issubclass(expect_defined("Circle"), shape), "Circle should inherit from Shape."

def test_names_set_through_super():
    """The name is set by the parent's __init__"""
    expect_equal(expect_defined("Square")(1).name, "square", "a square's name")
    expect_equal(expect_defined("Circle")(1).name, "circle", "a circle's name")
    assert "super()" in SOURCE, (
        "Set the name by calling super().__init__(...) rather than assigning self.name "
        "again in each subclass."
    )

def test_describe_is_not_rewritten():
    """describe is inherited, not copied into each subclass"""
    assert SOURCE.count("def describe") == 1, (
        "describe() belongs on Shape and works for both subclasses through self.area(). "
        "Writing it again in each child defeats the point."
    )

def test_output():
    """The script prints the four lines"""
    expect_output("square: 9\ncircle: 12.56\nshape: 0\n[9, 12.56]")
```

```text hint
`class Square(Shape):` is the whole of the inheritance. Inside its `__init__`,
call `super().__init__("square")` first.
```

```text hint
Each subclass replaces `area()`. Nothing else needs writing, because
`describe()` on the parent calls `self.area()`.
```

```text hint
Round the circle with `round(3.14 * self.radius * self.radius, 2)`.
```
