---
title: Your First Class
goal: Define a type, and create instances of it.
estimate: 9
concepts:
  - classes
  - objects
---

A dictionary can hold a person:

```python
person = {"name": "Ada", "age": 36}
```

That works until you have thirty of them and every one needs a birthday
method, and you find yourself passing the dictionary into functions that only
make sense for people. A **class** binds the data and the behaviour together.

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

ada = Person("Ada", 36)
print(ada.name)
```

Reading that from the top:

`class Person:` starts the definition. The capital letter is a convention that
every Python programmer follows, and following it tells a reader instantly
that `Person` is a type and not a variable.

`__init__` runs when you create an instance. Its job is to set up the new
object. The double underscores mark it as one of Python's own hooks rather
than a name you invented, and you will meet more of them.

`self` is the object being built. Every method takes it as the first
parameter, and you never pass it yourself: `Person("Ada", 36)` supplies it
behind the scenes.

`self.name = name` stores the value on the object. Without the `self.` prefix
you would be setting a local variable that vanishes when `__init__` returns.

## Methods

A method is a function that lives on the class and takes `self`:

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def greet(self):
        return f"Hello, I am {self.name}"

    def birthday(self):
        self.age += 1

ada = Person("Ada", 36)
print(ada.greet())
ada.birthday()
print(ada.age)
```

`ada.birthday()` changes the object it was called on. Two instances have
separate data, so a birthday for one leaves the other alone.

## Your turn

Write a `BankAccount` class with:

- `__init__(self, owner, balance=0)` storing both
- `deposit(self, amount)` adding to the balance
- `withdraw(self, amount)` subtracting, but returning `False` and changing
  nothing when the balance is too small; `True` when it works
- `statement(self)` returning a string like `Ada: 120`

Then produce this output:

```
Ada: 0
Ada: 150
True
Ada: 100
False
Ada: 100
```

```python starter
class BankAccount:
    def __init__(self, owner, balance=0):
        pass


account = BankAccount("Ada")
print(account.statement())
account.deposit(150)
print(account.statement())
print(account.withdraw(50))
print(account.statement())
print(account.withdraw(500))
print(account.statement())
```

```python solution
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance:
            return False
        self.balance -= amount
        return True

    def statement(self):
        return f"{self.owner}: {self.balance}"


account = BankAccount("Ada")
print(account.statement())
account.deposit(150)
print(account.statement())
print(account.withdraw(50))
print(account.statement())
print(account.withdraw(500))
print(account.statement())
```

```python tests
def test_starts_empty():
    """A new account starts at zero"""
    cls = expect_defined("BankAccount", "class")
    account = cls("Grace")
    expect_equal(account.balance, 0, "a new account's balance")
    expect_equal(account.owner, "Grace", "the owner")

def test_opening_balance():
    """An opening balance can be supplied"""
    account = expect_defined("BankAccount")("Grace", 40)
    expect_equal(account.balance, 40, "the opening balance")

def test_deposit():
    """Depositing adds to the balance"""
    account = expect_defined("BankAccount")("Grace")
    account.deposit(25)
    account.deposit(25)
    expect_equal(account.balance, 50, "the balance after two deposits")

def test_withdraw_succeeds():
    """A withdrawal within the balance works and reports True"""
    account = expect_defined("BankAccount")("Grace", 100)
    expect_equal(account.withdraw(30), True, "withdrawing 30 from 100")
    expect_equal(account.balance, 70, "the balance afterwards")

def test_withdraw_refused():
    """An overdraw is refused and changes nothing"""
    account = expect_defined("BankAccount")("Grace", 10)
    expect_equal(account.withdraw(50), False, "withdrawing 50 from 10")
    expect_equal(account.balance, 10, "the balance after a refused withdrawal")

def test_exact_withdrawal():
    """Taking the whole balance is allowed"""
    account = expect_defined("BankAccount")("Grace", 10)
    expect_equal(account.withdraw(10), True, "withdrawing the exact balance")
    expect_equal(account.balance, 0, "the balance afterwards")

def test_instances_are_separate():
    """Two accounts do not share a balance"""
    cls = expect_defined("BankAccount")
    one, two = cls("A", 10), cls("B", 20)
    one.deposit(5)
    expect_equal(two.balance, 20, "the second account after the first was used")

def test_output():
    """The script prints the expected six lines"""
    expect_output("Ada: 0\nAda: 150\nTrue\nAda: 100\nFalse\nAda: 100")
```

```text hint
`__init__` stores the two values: `self.owner = owner` and
`self.balance = balance`.
```

```text hint
`withdraw` checks before it subtracts. Return `False` straight away when the
amount is larger than the balance, so the balance is left alone.
```

```text hint
`statement` returns an f-string: `f"{self.owner}: {self.balance}"`. Every
method takes `self` as its first parameter.
```
