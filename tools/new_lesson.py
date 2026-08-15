"""Scaffold a new lesson.

    python3 tools/new_lesson.py 06-lists "Slicing a List"

Creates the next-numbered lesson file in that module, filled in with a
template that already passes the validator's structural checks - so the only
thing left to do is the actual teaching.

Pass --module to start a whole new module instead:

    python3 tools/new_lesson.py --module 11-classes "Classes"
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import lesson as lesson_mod

LESSON_TEMPLATE = '''---
title: {title}
goal: One line saying what the learner will be able to do.
estimate: 7
concepts:
  - tag
---

Explain the idea here, in prose. Two or three short paragraphs.

Show it working before asking for anything:

```python
print("an example the learner can run with the Try it button")
```

Name the mistake everyone makes with this, before they make it.

## Your turn

Say exactly what the program should do, and show the exact output expected:

```
expected output
```

```python starter
# What the learner opens with. Must be valid Python, and must NOT pass.
```

```python solution
print("expected output")
```

```python tests
def test_it_works():
    """The docstring is the label the learner sees"""
    expect_output("expected output")
```

```text hint
The first hint - a nudge, not the answer.
```

```text hint
The second hint - narrower.
```

```text hint
The third hint - close to the answer, for someone who is properly stuck.
```
'''

MODULE_TEMPLATE = '''---
title: {title}
summary: One line describing what this module is for.
---

A paragraph or two introducing the module, shown on its first page.
'''


def slugify(title: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", title.lower()).strip()
    return re.sub(r"[\s_]+", "-", slug)


def next_number(directory: Path, pattern: str = "*.md") -> int:
    numbers = []
    for path in directory.glob(pattern):
        if path.name.startswith("_"):
            continue
        match = re.match(r"^(\d+)", path.stem)
        if match:
            numbers.append(int(match.group(1)))
    return max(numbers, default=0) + 1


def new_module(slug_with_number: str, title: str) -> int:
    directory = lesson_mod.CURRICULUM_DIR / slug_with_number
    if directory.exists():
        print(f"{directory} already exists.")
        return 1
    directory.mkdir(parents=True)
    index = directory / "_module.md"
    index.write_text(MODULE_TEMPLATE.format(title=title), encoding="utf-8")
    print(f"Created {index.relative_to(Path.cwd())}")
    print("Now add a lesson:")
    print(f"    python3 tools/new_lesson.py {slug_with_number} \"First Lesson\"")
    return 0


def new_lesson(module_dir_name: str, title: str) -> int:
    directory = lesson_mod.CURRICULUM_DIR / module_dir_name
    if not directory.is_dir():
        available = sorted(p.name for p in lesson_mod.CURRICULUM_DIR.iterdir() if p.is_dir())
        print(f"There is no module directory called {module_dir_name!r}.")
        print("Available modules:")
        for name in available:
            print(f"    {name}")
        return 1

    number = next_number(directory)
    path = directory / f"{number:02d}-{slugify(title)}.md"
    if path.exists():
        print(f"{path} already exists.")
        return 1

    path.write_text(LESSON_TEMPLATE.format(title=title), encoding="utf-8")
    print(f"Created {path.relative_to(Path.cwd())}")
    print()
    print("When you have filled it in:")
    print("    python3 tools/build_manifest.py")
    print("    python3 tools/validate.py")
    return 0


def main(argv: list[str]) -> int:
    args = [a for a in argv if a != "--module"]
    if len(args) != 2:
        print(__doc__)
        return 2

    if "--module" in argv:
        return new_module(args[0], args[1])
    return new_lesson(args[0], args[1])


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
