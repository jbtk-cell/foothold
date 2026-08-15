"""Parsing for Foothold's lesson format.

A lesson is a Markdown file. It reads correctly on GitHub with no tooling at
all, which matters: contributors browse lessons on the web before they ever
clone anything. The machine-readable parts hide inside ordinary fenced code
blocks, tagged by a second word in the info string:

    ```python starter      the code the learner opens with
    ```python solution     the reference answer (never shown unless asked)
    ```python tests        assertions that decide whether the lesson passes
    ```text stdin          input fed to input(), if the lesson needs any
    ```text hint           one hint; repeat the block for progressive hints

Any other fenced block is prose - an example the learner reads, and which the
UI offers to run in the scratch terminal.

The equivalent parser for the browser lives in web/js/lesson.js. The two are
kept honest by tools/validate.py, which compares their output on every lesson.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROLES = {"starter", "solution", "tests", "stdin", "hint"}

_FENCE = re.compile(
    r"^(?P<indent>[ \t]*)(?P<ticks>`{3,})[ \t]*(?P<info>[^\n]*)\n(?P<body>.*?)^(?P=indent)(?P=ticks)[ \t]*$",
    re.S | re.M,
)


class LessonError(Exception):
    pass


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Read the leading `---` block.

    This understands a deliberately small slice of YAML: `key: value`, and
    `- item` lists indented under a key. Lessons never need more than that,
    and a small parser is one that behaves identically in Python and in
    JavaScript, which is the actual requirement.
    """
    if not text.startswith("---"):
        return {}, text

    end = text.find("\n---", 3)
    if end == -1:
        raise LessonError("Front matter opened with --- but never closed.")

    block = text[3:end].strip("\n")
    rest = text[end + 4:].lstrip("\n")

    data: dict = {}
    current_list_key = None

    for raw in block.split("\n"):
        line = raw.rstrip()
        if not line.strip() or line.strip().startswith("#"):
            continue

        if line.lstrip().startswith("- ") and current_list_key:
            data[current_list_key].append(_scalar(line.lstrip()[2:].strip()))
            continue

        if ":" not in line:
            raise LessonError(f"Cannot read front matter line: {raw!r}")

        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()

        if not value:
            data[key] = []
            current_list_key = key
        else:
            data[key] = _scalar(value)
            current_list_key = None

    return data, rest


def _scalar(value: str):
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    lowered = value.lower()
    if lowered in ("true", "yes"):
        return True
    if lowered in ("false", "no"):
        return False
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    return value


def parse_lesson(text: str, slug: str = "") -> dict:
    """Turn one lesson file into a dict the UI can render."""
    meta, body = parse_frontmatter(text)

    blocks: dict = {"hint": []}
    prose_parts = []
    cursor = 0

    for match in _FENCE.finditer(body):
        info = match.group("info").strip()
        role = _role_of(info)

        if role is None:
            continue

        prose_parts.append(body[cursor:match.start()])
        cursor = match.end()

        content = match.group("body")
        if match.group("indent"):
            content = _dedent(content, match.group("indent"))
        content = content.rstrip("\n")

        if role == "hint":
            blocks["hint"].append(content.strip())
        elif role in blocks:
            raise LessonError(f"Lesson has more than one `{role}` block.")
        else:
            blocks[role] = content

    prose_parts.append(body[cursor:])
    prose = "".join(prose_parts).strip()

    title = meta.get("title") or _first_heading(prose) or slug
    lesson = {
        "slug": slug,
        "title": title,
        "goal": meta.get("goal", ""),
        "estimate": meta.get("estimate", 5),
        "concepts": meta.get("concepts", []),
        "starterPasses": bool(meta.get("starter_passes", False)),
        "starterBroken": bool(meta.get("starter_broken", False)),
        "prose": prose,
        "starter": blocks.get("starter", ""),
        "solution": blocks.get("solution", ""),
        "tests": blocks.get("tests", ""),
        "stdin": blocks.get("stdin", ""),
        "hints": blocks["hint"],
    }
    return lesson


def _role_of(info: str):
    """Return the role named in a fence info string, or None for prose code."""
    words = info.replace(",", " ").split()
    for word in words:
        if word.lower() in ROLES:
            return word.lower()
    return None


def _dedent(content: str, indent: str) -> str:
    out = []
    for line in content.split("\n"):
        out.append(line[len(indent):] if line.startswith(indent) else line)
    return "\n".join(out)


def _first_heading(prose: str):
    match = re.search(r"^#\s+(.+)$", prose, re.M)
    return match.group(1).strip() if match else None


def validate_lesson(lesson: dict) -> list[str]:
    """Structural problems with a lesson, as human-readable strings."""
    problems = []
    if not lesson["title"]:
        problems.append("no title")
    if not lesson["prose"]:
        problems.append("no explanation - a lesson needs prose before the exercise")
    if not lesson["starter"].strip():
        problems.append("no `starter` block")
    if not lesson["solution"].strip():
        problems.append("no `solution` block")
    if not lesson["tests"].strip():
        problems.append("no `tests` block")
    elif "def test_" not in lesson["tests"]:
        problems.append("the `tests` block defines no test_ functions")
    if not lesson["hints"]:
        problems.append("no `hint` block - every lesson owes the learner at least one")
    return problems


# --- Curriculum assembly ----------------------------------------------------

CURRICULUM_DIR = Path(__file__).resolve().parent.parent / "web" / "content" / "curriculum"
MANIFEST_PATH = Path(__file__).resolve().parent.parent / "web" / "content" / "manifest.json"


def _numbered(path: Path) -> tuple[int, str]:
    match = re.match(r"^(\d+)[-_](.+)$", path.stem)
    if not match:
        raise LessonError(f"{path} must be named NN-slug")
    return int(match.group(1)), match.group(2)


def load_curriculum(root: Path = CURRICULUM_DIR) -> list[dict]:
    """Walk the curriculum directory into an ordered list of modules."""
    modules = []
    for module_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        order, module_slug = _numbered(module_dir)
        index = module_dir / "_module.md"
        if not index.exists():
            raise LessonError(f"{module_dir} has no _module.md")
        meta, intro = parse_frontmatter(index.read_text(encoding="utf-8"))

        lessons = []
        for lesson_path in sorted(module_dir.glob("*.md")):
            if lesson_path.name.startswith("_"):
                continue
            lesson_order, lesson_slug = _numbered(lesson_path)
            lesson = parse_lesson(lesson_path.read_text(encoding="utf-8"), lesson_slug)
            lesson["order"] = lesson_order
            lesson["module"] = module_slug
            lesson["path"] = f"curriculum/{module_dir.name}/{lesson_path.name}"
            lessons.append(lesson)

        lessons.sort(key=lambda item: item["order"])
        modules.append(
            {
                "slug": module_slug,
                "order": order,
                "title": meta.get("title", module_slug),
                "summary": meta.get("summary", ""),
                "intro": intro.strip(),
                "dir": module_dir.name,
                "lessons": lessons,
            }
        )

    modules.sort(key=lambda item: item["order"])
    return modules


def build_manifest(modules: list[dict]) -> dict:
    """The index the browser loads first: everything except lesson bodies."""
    return {
        "version": 1,
        "generated_by": "tools/build_manifest.py",
        "modules": [
            {
                "slug": module["slug"],
                "title": module["title"],
                "summary": module["summary"],
                "lessons": [
                    {
                        "slug": lesson["slug"],
                        "title": lesson["title"],
                        "goal": lesson["goal"],
                        "estimate": lesson["estimate"],
                        "concepts": lesson["concepts"],
                        "path": lesson["path"],
                    }
                    for lesson in module["lessons"]
                ],
            }
            for module in modules
        ],
    }


def write_manifest(path: Path = MANIFEST_PATH) -> dict:
    manifest = build_manifest(load_curriculum())
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest
