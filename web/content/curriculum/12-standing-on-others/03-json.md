---
title: Saving Structured Data
goal: Write dictionaries and lists to a file and read them back unchanged.
estimate: 9
concepts:
  - json
  - files
---

In the files lesson you saved lines of text. Saving a dictionary that way
means inventing a format, and then writing a parser for it, and then fixing
the parser when someone puts a comma in a title.

**JSON** is that format, already invented. Almost every language and every web
service reads it.

```python
import json

person = {"name": "Ada", "age": 36, "languages": ["python", "c"]}
text = json.dumps(person)
print(text)
```

`json.dumps` turns a Python object into a string. `json.loads` turns it back.
Remember which is which by the `s`: it stands for string.

```python
back = json.loads(text)
print(back["languages"][0])
```

## Straight to a file

`dump` and `load`, without the `s`, work on an open file:

```python
with open("person.json", "w") as file:
    json.dump(person, file, indent=2)

with open("person.json") as file:
    person = json.load(file)
```

`indent=2` writes it across several lines so a human can read it. Leave it out
and you get one long line, which is smaller and fine for data no person will
open.

## What survives the trip

| Python | JSON |
| --- | --- |
| dict | object |
| list, tuple | array |
| str | string |
| int, float | number |
| True, False | true, false |
| None | null |

Tuples come back as lists, because JSON has one kind of sequence. Sets and
your own classes have no JSON equivalent and raise `TypeError`; convert them
to something in the table first.

Dictionary keys always come back as strings. `{1: "a"}` saves and reloads as
`{"1": "a"}`, which catches people out.

## Your turn

Write a tiny settings store.

- `save_settings(settings, filename)` writes the dictionary as indented JSON
- `load_settings(filename)` reads it back, returning `{}` when the file is
  missing and when it holds text that is not valid JSON

A corrupt file raises `json.JSONDecodeError`; catching it is the point of the
second half.

Expected output:

```
{'theme': 'dark', 'font': 14, 'plugins': ['git', 'lint']}
True
{}
{}
```

```python starter
import json


# Write save_settings and load_settings below.


settings = {"theme": "dark", "font": 14, "plugins": ["git", "lint"]}
save_settings(settings, "settings.json")
loaded = load_settings("settings.json")
print(loaded)
print(loaded == settings)
print(load_settings("no-such-file.json"))

with open("broken.json", "w") as file:
    file.write("{not json at all")
print(load_settings("broken.json"))
```

```python solution
import json


def save_settings(settings, filename):
    """Write the settings dictionary as indented JSON."""
    with open(filename, "w") as file:
        json.dump(settings, file, indent=2)


def load_settings(filename):
    """Read the settings back, or return {} if that is not possible."""
    try:
        with open(filename) as file:
            return json.load(file)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}


settings = {"theme": "dark", "font": 14, "plugins": ["git", "lint"]}
save_settings(settings, "settings.json")
loaded = load_settings("settings.json")
print(loaded)
print(loaded == settings)
print(load_settings("no-such-file.json"))

with open("broken.json", "w") as file:
    file.write("{not json at all")
print(load_settings("broken.json"))
```

```python tests
def test_round_trip():
    """Settings survive being saved and loaded"""
    save = expect_defined("save_settings")
    load = expect_defined("load_settings")
    original = {"a": 1, "b": [1, 2], "c": {"d": True}}
    save(original, "round-trip.json")
    expect_equal(load("round-trip.json"), original, "saving then loading")

def test_missing_file():
    """A missing file gives an empty dictionary"""
    expect_calling("load_settings", ("definitely-not-here.json",), {})

def test_corrupt_file():
    """A corrupt file gives an empty dictionary rather than crashing"""
    with open("garbage.json", "w") as file:
        file.write("]]not json[[")
    expect_calling("load_settings", ("garbage.json",), {})

def test_file_is_real_json():
    """The saved file is valid, indented JSON"""
    import json as _json
    expect_defined("save_settings")({"x": 1}, "check.json")
    with open("check.json") as file:
        raw = file.read()
    expect_equal(_json.loads(raw), {"x": 1}, "the parsed file")
    assert "\n" in raw, "Pass indent=2 to json.dump so the file is readable."

def test_uses_json_module():
    """The json module does the encoding"""
    assert "json.dump" in SOURCE or "json.dumps" in SOURCE, "Use json.dump to write the file."
    assert "json.load" in SOURCE, "Use json.load to read it back."

def test_output():
    """The four lines print"""
    expect_output(
        "{'theme': 'dark', 'font': 14, 'plugins': ['git', 'lint']}\nTrue\n{}\n{}"
    )
```

```text hint
`save_settings` is a `with open(filename, "w")` and one call to
`json.dump(settings, file, indent=2)`.
```

```text hint
`load_settings` wraps `json.load(file)` in a try. Two different things can go
wrong, so catch both.
```

```text hint
The exceptions are `FileNotFoundError` and `json.JSONDecodeError`. They can go
in one `except (A, B):` or in two blocks.
```
