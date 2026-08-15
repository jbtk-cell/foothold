"""Prove that every lesson in the curriculum actually works.

Run it with: python3 tools/validate.py

For each lesson this checks four things:

  1. it is structurally complete (prose, starter, solution, tests, a hint)
  2. its reference solution passes its own tests
  3. its starter code *fails* those tests - an exercise that is already
     solved, or a test that passes no matter what, teaches nothing
  4. the starter is valid Python, so the learner never opens a file that
     is broken before they touch it

Then it checks the committed manifest matches the files on disk, and that the
browser's JavaScript lesson parser agrees with the Python one.

CI runs this on every push. A green run means a student cannot reach a lesson
that cannot be completed.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "web" / "py"))
sys.path.insert(0, str(ROOT / "tools"))

import harness  # noqa: E402
import lesson as lesson_mod  # noqa: E402

GREEN = "\033[32m"
RED = "\033[31m"
YELLOW = "\033[33m"
DIM = "\033[2m"
RESET = "\033[0m"

if not sys.stdout.isatty():
    GREEN = RED = YELLOW = DIM = RESET = ""


class Report:
    def __init__(self):
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.lessons = 0

    def error(self, where: str, message: str):
        self.errors.append(f"{where}: {message}")

    def warn(self, where: str, message: str):
        self.warnings.append(f"{where}: {message}")


def check_lesson(lesson: dict, report: Report):
    where = f"{lesson['module']}/{lesson['slug']}"

    for problem in lesson_mod.validate_lesson(lesson):
        report.error(where, problem)

    if not lesson["solution"].strip() or not lesson["tests"].strip():
        return

    # Most starters must be valid Python: a learner should never open a file
    # that is broken before they touch it. Fix-the-bug lessons are the
    # deliberate exception and declare themselves in the front matter.
    if lesson["starterBroken"]:
        try:
            compile(lesson["starter"], "starter", "exec")
        except SyntaxError:
            pass
        else:
            report.error(
                where,
                "front matter says `starter_broken: true` but the starter parses fine - "
                "either break it or drop the flag",
            )
    else:
        try:
            compile(lesson["starter"], "starter", "exec")
        except SyntaxError as exc:
            report.error(
                where,
                f"the starter code does not parse: {exc.msg} (line {exc.lineno}). "
                "If that is deliberate, add `starter_broken: true` to the front matter.",
            )

    result = harness.grade_with_helpers(lesson["solution"], lesson["tests"], lesson["stdin"])
    if not result["passed"]:
        if result["error"]:
            report.error(where, f"the solution crashes:\n      {_indent(result['error'])}")
        else:
            for test in result["tests"]:
                if not test["passed"]:
                    report.error(
                        where,
                        f"the solution fails its own test {test['name']!r}:\n      {_indent(test['message'])}",
                    )

    if not lesson["starterPasses"]:
        starter_result = harness.grade_with_helpers(
            lesson["starter"], lesson["tests"], lesson["stdin"]
        )
        if starter_result["passed"]:
            report.error(
                where,
                "the starter code already passes the tests - the exercise asks the learner "
                "to do nothing, or the tests check nothing. Add `starter_passes: true` to the "
                "front matter only if the lesson is deliberately a read-and-run.",
            )

    if lesson["estimate"] and not isinstance(lesson["estimate"], int):
        report.warn(where, "estimate should be a whole number of minutes")

    long_lines = [
        index + 1
        for index, line in enumerate(lesson["starter"].split("\n"))
        if len(line) > 78
    ]
    if long_lines:
        report.warn(where, f"starter lines longer than 78 chars wrap awkwardly in the editor: {long_lines}")


def _indent(text: str) -> str:
    return "\n      ".join(str(text).strip().split("\n"))


def check_manifest(modules: list[dict], report: Report):
    expected = lesson_mod.build_manifest(modules)
    path = lesson_mod.MANIFEST_PATH
    if not path.exists():
        report.error("manifest.json", "missing - run `python3 tools/build_manifest.py`")
        return
    actual = json.loads(path.read_text(encoding="utf-8"))
    if actual != expected:
        report.error(
            "manifest.json",
            "out of date - run `python3 tools/build_manifest.py` and commit the result",
        )


def check_js_parser_agrees(modules: list[dict], report: Report):
    """The browser has its own lesson parser. Make sure it reads the same file the same way."""
    node = _which_node()
    if not node:
        report.warn("parity", "node not found, skipping the JavaScript parser parity check")
        return

    sample = []
    for module in modules:
        for entry in module["lessons"]:
            sample.append(
                {
                    "path": str(lesson_mod.CURRICULUM_DIR.parent / entry["path"]),
                    "slug": entry["slug"],
                    "expected": {
                        key: entry[key]
                        for key in ("title", "starter", "solution", "tests", "stdin", "hints", "goal")
                    },
                }
            )

    script = ROOT / "tools" / "parity_check.mjs"
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
        json.dump(sample, handle)
        payload = handle.name

    try:
        proc = subprocess.run(
            [node, str(script), payload],
            capture_output=True,
            text=True,
            timeout=120,
        )
    except Exception as exc:  # noqa: BLE001
        report.warn("parity", f"could not run the JavaScript parser: {exc}")
        return
    finally:
        Path(payload).unlink(missing_ok=True)

    if proc.returncode != 0:
        for line in (proc.stdout + proc.stderr).strip().split("\n"):
            if line.strip():
                report.error("parity", line.strip())


def _which_node():
    from shutil import which

    return which("node")


def run_harness_tests(report: Report):
    proc = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "test_harness.py")],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        report.error("harness", "the grading harness fails its own tests:\n" + proc.stdout[-2000:])


def run_web_tests(report: Report):
    node = _which_node()
    if not node:
        report.warn("web", "node not found, skipping the JavaScript unit tests")
        return
    proc = subprocess.run(
        [node, str(ROOT / "tools" / "test_web.mjs")],
        capture_output=True,
        text=True,
        cwd=str(ROOT),
    )
    if proc.returncode != 0:
        report.error("web", "the browser modules fail their tests:\n" + proc.stdout[-2000:])


def main() -> int:
    report = Report()

    print(f"{DIM}Foothold curriculum validator{RESET}\n")

    print("  grading harness ... ", end="", flush=True)
    run_harness_tests(report)
    print(f"{RED}fail{RESET}" if report.errors else f"{GREEN}ok{RESET}")

    print("  browser modules ... ", end="", flush=True)
    before = len(report.errors)
    run_web_tests(report)
    print(f"{RED}fail{RESET}" if len(report.errors) > before else f"{GREEN}ok{RESET}")

    try:
        modules = lesson_mod.load_curriculum()
    except lesson_mod.LessonError as exc:
        print(f"{RED}Cannot read the curriculum: {exc}{RESET}")
        return 1

    for module in modules:
        before = len(report.errors)
        for lesson in module["lessons"]:
            check_lesson(lesson, report)
            report.lessons += 1
        status = f"{RED}fail{RESET}" if len(report.errors) > before else f"{GREEN}ok{RESET}"
        print(f"  {module['title']:<34} {len(module['lessons']):>2} lessons  {status}")

    print("\n  manifest ... ", end="", flush=True)
    before = len(report.errors)
    check_manifest(modules, report)
    print(f"{RED}fail{RESET}" if len(report.errors) > before else f"{GREEN}ok{RESET}")

    print("  python/javascript parser parity ... ", end="", flush=True)
    before = len(report.errors)
    check_js_parser_agrees(modules, report)
    print(f"{RED}fail{RESET}" if len(report.errors) > before else f"{GREEN}ok{RESET}")

    print()
    for warning in report.warnings:
        print(f"{YELLOW}  warning  {warning}{RESET}")
    for error in report.errors:
        print(f"{RED}  error    {error}{RESET}")

    total_lessons = report.lessons
    total_minutes = sum(
        entry.get("estimate", 5) or 5
        for module in modules
        for entry in module["lessons"]
    )

    print()
    if report.errors:
        print(f"{RED}{len(report.errors)} problem(s) found across {total_lessons} lessons.{RESET}")
        return 1

    print(
        f"{GREEN}All {total_lessons} lessons in {len(modules)} modules check out"
        f"{RESET} {DIM}(~{total_minutes // 60}h {total_minutes % 60}m of material){RESET}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
