"""Foothold's grading harness.

This single module is the only thing that decides whether an exercise passes.
It runs unmodified in two places:

  * inside the browser, on CPython compiled to WebAssembly (Pyodide)
  * inside CI, on the CPython that ships with the runner

Running the same code in both is the whole point. A lesson that CI says is
correct is correct for a student too, because the grader is byte-for-byte the
same program.

The public entry point is `grade()`. Everything else is support.
"""

from __future__ import annotations

import builtins
import contextlib
import io
import os
import re
import shutil
import sys
import tempfile
import traceback

# The label a test carries in the UI is its docstring, falling back to a
# de-snake-cased function name so a lazily written test still reads like English.
_TEST_PREFIX = "test_"


class StudentError(Exception):
    """Raised internally when the student's own code fails to run."""

    def __init__(self, formatted: str):
        super().__init__(formatted)
        self.formatted = formatted


def _friendly_name(func_name: str) -> str:
    words = func_name[len(_TEST_PREFIX):].replace("_", " ").strip()
    return words[:1].upper() + words[1:] if words else func_name


def _format_exception(exc: BaseException, source: str, filename: str) -> str:
    """Render a traceback that points at the student's code, not at ours.

    Pyodide tracebacks are full of frames from the harness and from the
    interop layer. A beginner reading "File <exec>, line 1, in <module>"
    learns nothing, so we drop every frame that is not theirs and re-attach
    the offending source line.
    """
    lines = source.splitlines()

    if isinstance(exc, SyntaxError) and exc.filename in (filename, "<string>", None):
        lineno = exc.lineno or 1
        caret = " " * max((exc.offset or 1) - 1, 0) + "^"
        snippet = lines[lineno - 1] if 0 < lineno <= len(lines) else ""
        return (
            f"SyntaxError on line {lineno}: {exc.msg}\n"
            f"    {snippet}\n"
            f"    {caret}"
        )

    tb = exc.__traceback__
    frames = []
    while tb is not None:
        frame = tb.tb_frame
        if frame.f_code.co_filename == filename:
            lineno = tb.tb_lineno
            snippet = lines[lineno - 1].strip() if 0 < lineno <= len(lines) else ""
            frames.append((lineno, snippet, frame.f_code.co_name))
        tb = tb.tb_next

    header = f"{type(exc).__name__}: {exc}"
    if not frames:
        return header

    trace = []
    for lineno, snippet, func in frames:
        where = "your code" if func == "<module>" else f"{func}()"
        trace.append(f"  line {lineno}, in {where}\n      {snippet}")
    return header + "\n" + "\n".join(trace)


class InputNeeded(EOFError):
    """Raised when the program wants input we do not have yet.

    A browser worker cannot block waiting for a keystroke - that needs
    SharedArrayBuffer, which GitHub Pages cannot serve the headers for. So
    `input()` reads from a buffer supplied before the run.

    Rather than making learners pre-type their answers into a box, the UI
    catches this exception, asks for the one missing line, appends it to the
    buffer, and runs the whole program again from the top. Programs at this
    level are short and deterministic, so the re-run is invisible and the
    program appears to ask its questions one at a time, like a real terminal.
    """


class _Stdin:
    """A stdin that reads from a fixed block of text."""

    def __init__(self, text: str):
        self._lines = text.splitlines() if text else []
        self._index = 0
        self.echo: list[str] = []

    def readline(self, *_args) -> str:
        if self._index >= len(self._lines):
            raise InputNeeded(
                "Your program asked for input that has not been supplied yet."
            )
        line = self._lines[self._index]
        self._index += 1
        self.echo.append(line)
        return line + "\n"

    def read(self, *_args) -> str:
        rest = "\n".join(self._lines[self._index:])
        self._index = len(self._lines)
        return rest

    def readlines(self, *_args) -> list[str]:
        rest = [line + "\n" for line in self._lines[self._index:]]
        self._index = len(self._lines)
        return rest

    def __iter__(self):
        return iter(self.readlines())

    def isatty(self) -> bool:
        return False


class _Capture:
    """Swap stdout/stderr/stdin for the duration of a block of student code."""

    def __init__(self, stdin_text: str):
        self.out = io.StringIO()
        self.stdin = _Stdin(stdin_text)

    def __enter__(self):
        self._saved = (sys.stdout, sys.stderr, sys.stdin)
        sys.stdout = self.out
        sys.stderr = self.out
        sys.stdin = self.stdin
        return self

    def __exit__(self, *_exc):
        sys.stdout, sys.stderr, sys.stdin = self._saved
        return False

    @property
    def text(self) -> str:
        return self.out.getvalue()


def _echoing_input(namespace_capture: _Capture):
    """`input()` that also prints what it consumed.

    A real terminal shows the characters the user typed. Because our input is
    pre-supplied, nothing would appear, and a learner comparing their output
    against an example would see a mismatch that is not their fault. So we
    echo the consumed line, exactly as a terminal would.
    """

    def _input(prompt: str = "") -> str:
        if prompt:
            sys.stdout.write(str(prompt))
        line = sys.stdin.readline()
        if not line:
            raise EOFError("No more input available.")
        value = line.rstrip("\n")
        sys.stdout.write(value + "\n")
        return value

    return _input


@contextlib.contextmanager
def scratch_directory():
    """Run a learner's code in an empty directory of its own.

    Lessons about files have to be able to write files. Doing that in whatever
    directory happens to be current would let one run leave debris that changes
    the result of the next one - a lesson that passes only on the second
    attempt is worse than one that never passes. A fresh directory per run
    makes file exercises repeatable, and keeps a student's `open(...)` from
    touching anything that matters.
    """
    previous = os.getcwd()
    directory = tempfile.mkdtemp(prefix="foothold-")
    try:
        os.chdir(directory)
        yield directory
    finally:
        os.chdir(previous)
        shutil.rmtree(directory, ignore_errors=True)


def _fresh_namespace(filename: str) -> dict:
    ns = {
        "__name__": "__main__",
        "__file__": filename,
        "__builtins__": builtins,
    }
    return ns


def run_code(
    source: str,
    stdin_text: str = "",
    filename: str = "your_program.py",
    isolate: bool = True,
) -> dict:
    """Execute student source and capture everything it did.

    Returns a dict rather than raising, because the caller is a UI that wants
    to render a failure, not handle an exception.

    `isolate` runs the code in a scratch directory. `grade` turns it off
    because it manages a single scratch directory spanning both the student's
    code and the tests, so that a test can read a file the code just wrote.
    """
    if isolate:
        with scratch_directory():
            return run_code(source, stdin_text, filename, isolate=False)

    capture = _Capture(stdin_text)
    namespace = _fresh_namespace(filename)
    error = None
    needs_input = False

    with capture:
        namespace["input"] = _echoing_input(capture)
        try:
            compiled = compile(source, filename, "exec")
            exec(compiled, namespace)
        except SystemExit:
            pass
        except InputNeeded:
            needs_input = True
        except BaseException as exc:  # noqa: BLE001 - a learner can raise anything
            error = _format_exception(exc, source, filename)

    return {
        "stdout": capture.text,
        "error": error,
        "needsInput": needs_input,
        "prompt": _trailing_prompt(capture.text) if needs_input else "",
        "namespace": namespace,
    }


def _trailing_prompt(stdout: str) -> str:
    """Whatever the program printed after its last newline.

    `input("What is your name? ")` writes the prompt without a newline, so the
    unfinished last line is exactly the question being asked. The UI shows it
    as the label on the input box.
    """
    tail = stdout.rsplit("\n", 1)[-1]
    return tail.strip()


def _collect_tests(namespace: dict, test_source: str) -> list:
    """Return test functions in the order they appear in the test source.

    Dict order would work today, but ordering by source position keeps the
    checklist stable if a lesson author reorganises helpers between tests.
    """
    order = {}
    for index, match in enumerate(re.finditer(r"^def\s+(test_\w+)", test_source, re.M)):
        order[match.group(1)] = index

    found = [
        (name, obj)
        for name, obj in namespace.items()
        if name.startswith(_TEST_PREFIX) and callable(obj)
    ]
    found.sort(key=lambda pair: order.get(pair[0], 10_000))
    return found


def grade(student_source: str, test_source: str, stdin_text: str = "") -> dict:
    """Run a student's code, then run the lesson's tests against it.

    The tests execute in the *same* namespace as the student's code, so a test
    can simply call a function the student defined. Two extra names are
    injected for tests that care about printed output:

        STDOUT        the full text the program printed, as one string
        STDOUT_LINES  that text split into a list of lines, trailing blanks
                      removed, which is what almost every test actually wants

    A test fails by raising. `assert` is the normal way; any exception counts.
    The assertion message, if given, is what the learner reads, so lessons
    should write messages that teach rather than messages that accuse.
    """
    with scratch_directory():
        return _grade_here(student_source, test_source, stdin_text)


def _grade_here(student_source: str, test_source: str, stdin_text: str) -> dict:
    filename = "your_program.py"
    result = run_code(student_source, stdin_text, filename, isolate=False)

    report = {
        "stdout": result["stdout"],
        "error": result["error"],
        "tests": [],
        "passed": False,
    }

    # When checking an answer the input is fixed by the lesson, so asking for
    # more of it is a bug in the learner's code, not a question for the UI.
    if result["needsInput"]:
        report["error"] = (
            "Your program called input() more times than this exercise supplies "
            "input for. Count the input() calls against the lines in the Input panel."
        )
        return report

    if result["error"] is not None:
        return report

    namespace = result["namespace"]
    stdout = result["stdout"]
    namespace["STDOUT"] = stdout
    namespace["STDOUT_LINES"] = [line.rstrip() for line in stdout.rstrip("\n").split("\n")] if stdout.strip() else []
    # Some lessons are about *how* something was written - that a loop was used
    # rather than four copied lines, that a comment exists at all - and no
    # amount of looking at the output can tell you that.
    namespace["SOURCE"] = student_source

    capture = _Capture(stdin_text)
    with capture:
        namespace["input"] = _echoing_input(capture)
        try:
            exec(compile(test_source, "lesson_tests.py", "exec"), namespace)
        except BaseException as exc:  # noqa: BLE001
            report["error"] = (
                "This lesson's tests could not be loaded. That is a bug in "
                "Foothold, not in your code. Please report it.\n"
                + _format_exception(exc, test_source, "lesson_tests.py")
            )
            return report

        tests = _collect_tests(namespace, test_source)
        if not tests:
            report["error"] = "This lesson has no tests. That is a bug in Foothold, not in your code."
            return report

        for name, func in tests:
            label = (func.__doc__ or "").strip().splitlines()[0].strip() if func.__doc__ else _friendly_name(name)
            entry = {"name": label, "passed": False, "message": ""}
            try:
                func()
                entry["passed"] = True
            except AssertionError as exc:
                entry["message"] = str(exc).strip() or "That is not quite right yet."
            except BaseException as exc:  # noqa: BLE001
                entry["message"] = f"{type(exc).__name__}: {exc}"
            report["tests"].append(entry)

    report["passed"] = bool(report["tests"]) and all(t["passed"] for t in report["tests"])
    return report


# --- Helpers a lesson's test code may use -----------------------------------
# These are exec'd into every test namespace by the runner so that lesson
# authors do not have to re-implement the same three checks in every file.

HELPERS = r'''
def _normalise(text):
    """Compare output the way a human would: ignore trailing spaces and case-free noise."""
    return "\n".join(line.rstrip() for line in str(text).strip().split("\n"))


def expect_output(expected):
    """Assert the program printed exactly this, ignoring trailing whitespace."""
    actual = _normalise(STDOUT)
    wanted = _normalise(expected)
    assert actual == wanted, (
        "Your program printed:\n\n"
        + (actual or "(nothing)")
        + "\n\nbut this lesson expected:\n\n"
        + wanted
    )


def expect_contains(fragment, hint=None):
    """Assert the program's output contains a fragment somewhere."""
    assert fragment in STDOUT, hint or (
        "I could not find " + repr(fragment) + " anywhere in your output.\n"
        "Your output was:\n\n" + (STDOUT.strip() or "(nothing)")
    )


def expect_defined(name, kind="function"):
    """Assert the student defined something with this name."""
    assert name in globals(), (
        "I could not find a " + kind + " called " + repr(name) + ". "
        "Check the spelling - Python is picky about it."
    )
    return globals()[name]


def expect_equal(actual, expected, context=""):
    """Assert two values match, with a message that shows both."""
    assert actual == expected, (
        (context + "\n" if context else "")
        + "Expected " + repr(expected) + " but got " + repr(actual) + "."
    )


def expect_calling(func_name, args, expected):
    """Assert calling the student's function with these args returns expected."""
    func = expect_defined(func_name)
    shown = ", ".join(repr(a) for a in args)
    try:
        actual = func(*args)
    except TypeError as exc:
        raise AssertionError(
            "Calling " + func_name + "(" + shown + ") raised a TypeError: " + str(exc)
            + "\nCheck how many parameters your function takes."
        )
    assert actual == expected, (
        func_name + "(" + shown + ") returned " + repr(actual)
        + " but it should return " + repr(expected) + "."
    )
'''


def grade_with_helpers(student_source: str, test_source: str, stdin_text: str = "") -> dict:
    """`grade()`, with the shared assertion helpers available to the tests."""
    return grade(student_source, HELPERS + "\n" + test_source, stdin_text)
