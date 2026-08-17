"""Tests for the execution recorder.

The trace is the reason to use Foothold rather than another course, so it gets
the same treatment as the grader: run it with

    python3 tools/test_tracer.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "web" / "py"))

import tracer  # noqa: E402

FAILURES = []


def check(label, condition, detail=""):
    if condition:
        print(f"  ok   {label}")
    else:
        print(f"  FAIL {label}")
        if detail:
            print(f"       {detail}")
        FAILURES.append(label)


def lines(result):
    return [step for step in result["steps"] if step["event"] == "line"]


def final(result):
    """The last recorded state.

    A step is a photograph taken *before* its line runs, so the last line
    event predates the last assignment. The module's return step is where the
    finished state lives, and it is what the UI shows on the final frame.
    """
    return result["steps"][-1]


def test_records_each_line():
    result = tracer.trace("a = 1\nb = 2\nc = a + b\n")
    check("every line is recorded", [s["line"] for s in lines(result)] == [1, 2, 3],
          [s["line"] for s in lines(result)])
    check("no error is reported", result["error"] is None, result["error"])


def test_snapshots_are_frozen():
    """Stepping back must show what was true then, not what is true now."""
    result = tracer.trace("items = []\nitems.append(1)\nitems.append(2)\n")
    seen = [step["locals"].get("items", {}).get("repr") for step in lines(result)]
    check(
        "a mutated list shows its value at each step",
        seen == [None, "[]", "[1]"],
        seen,
    )


def test_variables_appear_and_change():
    result = tracer.trace("total = 0\nfor i in range(2):\n    total += i\n")
    values = [step["locals"].get("total", {}).get("repr") for step in lines(result)]
    check("the accumulator's history is visible", "0" in values and "1" in values, values)


def test_function_calls_and_returns():
    result = tracer.trace("def double(n):\n    return n * 2\n\nprint(double(4))\n")
    events = [step["event"] for step in result["steps"]]
    check("a call is recorded", "call" in events, events)
    check("a return is recorded", "return" in events, events)

    returns = [step for step in result["steps"] if step["event"] == "return" and "returned" in step]
    check("the returned value is captured", any(r["returned"]["repr"] == "8" for r in returns),
          [r["returned"]["repr"] for r in returns])

    called = [step for step in result["steps"] if step["event"] == "call"]
    check("the called function is named", called and called[0]["function"] == "double",
          called[0]["function"] if called else None)


def test_call_stack_depth():
    result = tracer.trace(
        "def outer():\n    return inner()\n\ndef inner():\n    return 1\n\nouter()\n"
    )
    depths = [step["depth"] for step in result["steps"]]
    check("nested calls increase the depth", max(depths) >= 3, depths)


def test_exception_is_recorded():
    result = tracer.trace("x = 1\ny = 0\nprint(x / y)\n")
    raised = [step for step in result["steps"] if step["event"] == "exception"]
    check("the exception step exists", len(raised) == 1, len(raised))
    check("it names the error", raised and "ZeroDivisionError" in raised[0]["raised"],
          raised[0]["raised"] if raised else None)
    check("it points at the right line", raised and raised[0]["line"] == 3,
          raised[0]["line"] if raised else None)
    check("the error is reported too", "ZeroDivisionError" in (result["error"] or ""), result["error"])


def test_output_accumulates():
    result = tracer.trace('print("a")\nprint("b")\n')
    offsets = [step["output"] for step in lines(result)]
    check("output length grows with the steps", offsets == sorted(offsets), offsets)
    check("the final output is complete", result["stdout"] == "a\nb\n", repr(result["stdout"]))


def test_library_internals_are_not_traced():
    """A beginner stepping into CPython's guts learns nothing."""
    result = tracer.trace('import json\nprint(json.dumps({"a": 1}))\n')
    functions = {step["function"] for step in result["steps"]}
    check("only the learner's frames appear", functions == {"your program"}, functions)


def test_noise_is_hidden():
    result = tracer.trace("import math\ndef f():\n    pass\nx = 1\n")
    names = set()
    for step in result["steps"]:
        names |= set(step["locals"])
    check("modules and functions stay out of the variables panel", names == {"x"}, names)


def test_step_limit():
    result = tracer.trace("for i in range(100000):\n    pass\n")
    check("a long program stops early", result["stoppedEarly"] is True)
    check("the cap is respected", len(result["steps"]) <= tracer.MAX_STEPS, len(result["steps"]))


def test_long_values_are_truncated():
    result = tracer.trace('big = "x" * 5000\n')
    value = final(result)["locals"].get("big", {})
    check("the variable is present on the final step", "repr" in value, value)
    check("a huge value is cut short", len(value.get("repr", "")) < 200, len(value.get("repr", "")))
    check("its real length is still reported", value.get("size") == 5000, value.get("size"))


def test_syntax_error_returns_cleanly():
    result = tracer.trace("def broken(:\n    pass\n")
    check("a syntax error yields no steps", result["steps"] == [])
    check("it is explained", "SyntaxError" in (result["error"] or ""), result["error"])


def test_input_is_reported_not_raised():
    result = tracer.trace('name = input("Name? ")\n')
    check("needing input is flagged", result["needsInput"] is True)
    check("the prompt is extracted", result["prompt"] == "Name?", repr(result["prompt"]))


def test_repr_that_raises_is_survivable():
    source = (
        "class Bad:\n"
        "    def __repr__(self):\n"
        "        raise ValueError('no')\n"
        "\n"
        "b = Bad()\n"
        "x = 1\n"
    )
    result = tracer.trace(source)
    check("a hostile __repr__ does not break the tracer", result["error"] is None, result["error"])
    reprs = [step["locals"].get("b", {}).get("repr") for step in lines(result)]
    check("it is reported instead", any(r and "repr raised" in r for r in reprs), reprs)


def main():
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_")]
    print(f"Testing the execution recorder ({len(tests)} groups)\n")
    for test in tests:
        print(test.__name__)
        test()
        print()

    if FAILURES:
        print(f"{len(FAILURES)} check(s) failed.")
        return 1
    print("All tracer checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
