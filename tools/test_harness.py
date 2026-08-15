"""Tests for the grading harness itself.

If the grader is wrong, every lesson is wrong, so this file gets tested before
anything else does. Run it with: python3 tools/test_harness.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "web" / "py"))

import harness  # noqa: E402

FAILURES = []


def check(label, condition, detail=""):
    if condition:
        print(f"  ok   {label}")
    else:
        print(f"  FAIL {label}")
        if detail:
            print(f"       {detail}")
        FAILURES.append(label)


def test_passing_exercise():
    report = harness.grade_with_helpers(
        'def double(x):\n    return x * 2\nprint("hi")\n',
        'def test_double():\n'
        '    """double() doubles its argument"""\n'
        '    expect_calling("double", (5,), 10)\n'
        '\n'
        'def test_printed():\n'
        '    """It prints a greeting"""\n'
        '    expect_output("hi")\n',
    )
    check("a correct solution passes", report["passed"], report)
    check("both tests are reported", len(report["tests"]) == 2, report["tests"])
    check(
        "the docstring becomes the label",
        report["tests"][0]["name"] == "double() doubles its argument",
        report["tests"][0],
    )
    check("stdout is captured", report["stdout"] == "hi\n", repr(report["stdout"]))


def test_failing_exercise():
    report = harness.grade_with_helpers(
        "def double(x):\n    return x + 2\n",
        'def test_double():\n'
        '    """double() doubles its argument"""\n'
        '    expect_calling("double", (5,), 10)\n',
    )
    check("a wrong solution fails", not report["passed"])
    check(
        "the failure message shows both values",
        "returned 7" in report["tests"][0]["message"]
        and "should return 10" in report["tests"][0]["message"],
        report["tests"][0]["message"],
    )


def test_runtime_error_points_at_student_line():
    report = harness.grade_with_helpers(
        'x = 1\nprint("fine")\nprint(x + "oops")\n',
        'def test_a():\n    """anything"""\n    assert True\n',
    )
    check("a runtime error stops grading", not report["passed"])
    check("the error names the type", "TypeError" in report["error"], report["error"])
    check("the error names the line", "line 3" in report["error"], report["error"])
    check(
        "the error shows the source line",
        'print(x + "oops")' in report["error"],
        report["error"],
    )
    check(
        "no harness frames leak into the traceback",
        "harness.py" not in report["error"] and "grade" not in report["error"],
        report["error"],
    )


def test_syntax_error_is_readable():
    report = harness.grade_with_helpers(
        "def broken(:\n    pass\n",
        'def test_a():\n    """anything"""\n    assert True\n',
    )
    check("a syntax error is caught", not report["passed"])
    check("it says SyntaxError", "SyntaxError" in report["error"], report["error"])
    check("it points at a caret", "^" in report["error"], report["error"])


def test_input_is_fed_and_echoed():
    report = harness.grade_with_helpers(
        'name = input("Name? ")\nprint(f"Hello, {name}!")\n',
        'def test_a():\n'
        '    """It greets by name"""\n'
        '    expect_output("Name? Ada\\nHello, Ada!")\n',
        stdin_text="Ada",
    )
    check("input() reads the supplied line", report["passed"], report)


def test_running_out_of_input_is_explained():
    report = harness.grade_with_helpers(
        "a = input()\nb = input()\n",
        'def test_a():\n    """anything"""\n    assert True\n',
        stdin_text="only-one-line",
    )
    check("missing input fails the check", not report["passed"])
    check(
        "missing input is explained in plain words",
        "input()" in report["error"] and "Input panel" in report["error"],
        report["error"],
    )


def test_run_asks_for_missing_input():
    """The interactive re-run loop: running out of input is a question, not a crash."""
    result = harness.run_code('name = input("What is your name? ")\nprint(name)\n')
    check("running out of input is flagged, not raised", result["needsInput"] is True)
    check("no error is reported for it", result["error"] is None, result["error"])
    check(
        "the unfinished prompt line becomes the question",
        result["prompt"] == "What is your name?",
        repr(result["prompt"]),
    )

    # Feeding the answer back in and re-running is what the UI does next.
    result = harness.run_code('name = input("What is your name? ")\nprint(name)\n', "Ada")
    check("re-running with the answer completes", result["needsInput"] is False)
    check("the answer is echoed like a terminal", result["stdout"] == "What is your name? Ada\nAda\n", repr(result["stdout"]))


def test_second_prompt_is_asked_separately():
    program = 'a = input("First? ")\nb = input("Second? ")\nprint(a + b)\n'
    first = harness.run_code(program)
    check("it stops at the first question", first["prompt"] == "First?", first["prompt"])
    second = harness.run_code(program, "x")
    check("it then stops at the second", second["prompt"] == "Second?", second["prompt"])
    done = harness.run_code(program, "x\ny")
    check("and finishes with both answers", done["stdout"].endswith("xy\n"), repr(done["stdout"]))


def test_stdout_lines_helper():
    report = harness.grade_with_helpers(
        'for i in range(3):\n    print(i)\n',
        'def test_a():\n'
        '    """It prints three lines"""\n'
        '    expect_equal(len(STDOUT_LINES), 3)\n'
        '    expect_equal(STDOUT_LINES[0], "0")\n',
    )
    check("STDOUT_LINES is available to tests", report["passed"], report)


def test_source_is_available_to_tests():
    report = harness.grade_with_helpers(
        "# a note\nprint('hi')\n",
        'def test_a():\n'
        '    """It contains a comment"""\n'
        '    assert "#" in SOURCE\n'
        '\n'
        'def test_b():\n'
        '    """It does not use a loop"""\n'
        '    assert "for " not in SOURCE\n',
    )
    check("tests can inspect the student's source", report["passed"], report)


def test_missing_definition_message():
    report = harness.grade_with_helpers(
        "x = 1\n",
        'def test_a():\n'
        '    """It defines greet()"""\n'
        '    expect_defined("greet")\n',
    )
    check("a missing name fails clearly", not report["passed"])
    check(
        "the message names what is missing",
        "'greet'" in report["tests"][0]["message"],
        report["tests"][0]["message"],
    )


def test_tests_run_in_source_order():
    report = harness.grade_with_helpers(
        "x = 1\n",
        'def test_zebra():\n    """first"""\n    assert True\n'
        'def test_apple():\n    """second"""\n    assert True\n',
    )
    names = [t["name"] for t in report["tests"]]
    check("tests keep their source order", names == ["first", "second"], names)


def test_student_cannot_print_its_way_to_a_pass():
    report = harness.grade_with_helpers(
        'print("All tests passed")\n',
        'def test_a():\n'
        '    """It returns 4 from add(2, 2)"""\n'
        '    expect_calling("add", (2, 2), 4)\n',
    )
    check("printing a fake pass does not pass", not report["passed"])


def test_infinite_output_is_not_a_crash():
    report = harness.grade_with_helpers(
        'for i in range(2000):\n    print(i)\n',
        'def test_a():\n'
        '    """It prints 2000 lines"""\n'
        '    expect_equal(len(STDOUT_LINES), 2000)\n',
    )
    check("large output is handled", report["passed"], report.get("error"))


def main():
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_")]
    print(f"Testing the grading harness ({len(tests)} groups)\n")
    for test in tests:
        print(test.__name__)
        test()
        print()

    if FAILURES:
        print(f"{len(FAILURES)} check(s) failed.")
        return 1
    print("All harness checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
