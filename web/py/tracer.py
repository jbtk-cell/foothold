"""Record every step a program takes, so a learner can scrub back through it.

This is the thing Foothold has that other courses do not. Python Tutor proved
the idea works - five million people have used it to watch code execute - but
it is a separate site you paste code into. Here it sits inside the exercise, so
when a check fails you can rewind to the moment the variable went wrong instead
of staring at a red cross.

`trace()` runs the program under sys.settrace and returns a list of steps. Each
step is a photograph of the program taken just before a line runs: which line,
what every variable held, how deep the call stack was, and what had been
printed so far. The UI turns that list into a scrubber.

Two things this deliberately does not do:

* It does not trace inside library code. A beginner stepping through `print`
  and landing in the guts of CPython learns nothing, so only frames from their
  own file are recorded.
* It does not keep the objects themselves, only rendered summaries. Holding
  references would mean a later mutation changed what an earlier step appears
  to show, and a time machine that rewrites the past is worse than none.
"""

from __future__ import annotations

import sys

from harness import _Capture, _echoing_input, _format_exception, InputNeeded

# A loop running ten thousand times would produce a scrubber nobody can use and
# a payload measured in megabytes. Stop early and say so.
MAX_STEPS = 3000

# Deep recursion is worth showing, but not to the point of exhausting memory.
MAX_DEPTH = 40

# Long values get cut. The learner can still see the type and the beginning,
# which is enough to know whether it holds what they expected.
MAX_REPR = 160


def _render(value) -> dict:
    """Summarise a value for display: what type it is, and what it looks like."""
    type_name = type(value).__name__

    try:
        text = repr(value)
    except BaseException:  # noqa: BLE001 - a learner's __repr__ can raise
        return {"type": type_name, "repr": f"<{type_name}: its repr raised>", "size": None}

    truncated = len(text) > MAX_REPR
    if truncated:
        text = text[:MAX_REPR] + "..."

    size = None
    if isinstance(value, (list, dict, set, tuple, str, frozenset)):
        try:
            size = len(value)
        except BaseException:  # noqa: BLE001
            size = None

    return {"type": type_name, "repr": text, "size": size}


# A variables panel is for data. Watching `greet: <function greet>` sit
# unchanged for forty steps teaches nothing, and `input` is not even the
# learner's - the harness injects it.
HIDDEN_TYPES = {"function", "builtin_function_or_method", "method", "type", "module"}
HIDDEN_NAMES = {"input"}


def _visible_locals(frame) -> dict:
    """The variables a learner would consider 'theirs' in this frame."""
    out = {}
    for name, value in list(frame.f_locals.items()):
        if name.startswith("__") or name in HIDDEN_NAMES:
            continue
        if type(value).__name__ in HIDDEN_TYPES:
            continue
        out[name] = _render(value)
    return out


class _Recorder:
    def __init__(self, filename: str, capture: _Capture):
        self.filename = filename
        self.capture = capture
        self.steps: list[dict] = []
        self.stopped = False
        self.call_names: list[str] = []

    def stop_reason(self):
        return "step-limit" if self.stopped else None

    def _record(self, frame, event: str, arg):
        if len(self.steps) >= MAX_STEPS:
            self.stopped = True
            return

        depth = len(self.call_names)
        function = frame.f_code.co_name
        if function == "<module>":
            function = "your program"

        step = {
            "line": frame.f_lineno,
            "event": event,
            "function": function,
            "depth": min(depth, MAX_DEPTH),
            "locals": _visible_locals(frame),
            "output": len(self.capture.text),
            "stack": list(self.call_names),
        }

        if event == "return" and arg is not None:
            step["returned"] = _render(arg)
        if event == "exception" and arg is not None:
            step["raised"] = f"{arg[0].__name__}: {arg[1]}"

        self.steps.append(step)

    def dispatch(self, frame, event, arg):
        """The global trace function: decide whether to follow this frame."""
        if frame.f_code.co_filename != self.filename:
            return None
        if self.stopped:
            return None

        if event == "call":
            if len(self.call_names) >= MAX_DEPTH:
                return None
            name = frame.f_code.co_name
            is_module = name == "<module>"
            self.call_names.append("your program" if is_module else name)
            # Entering the module is not a step a learner took; it is the
            # program starting. Its reported line number is 0, which would
            # highlight nothing in the editor.
            if not is_module:
                self._record(frame, "call", arg)
            return self.local

        return self.local(frame, event, arg)

    def local(self, frame, event, arg):
        """The per-frame trace function: one call per line executed."""
        if self.stopped or frame.f_code.co_filename != self.filename:
            return None

        if event in ("line", "return", "exception"):
            self._record(frame, event, arg)

        if event == "return" and self.call_names:
            self.call_names.pop()

        return self.local


def trace(source: str, stdin_text: str = "", filename: str = "your_program.py") -> dict:
    """Run source under the tracer and return every step it took."""
    capture = _Capture(stdin_text)
    recorder = _Recorder(filename, capture)
    namespace = {"__name__": "__main__", "__file__": filename}
    error = None
    needs_input = False

    try:
        compiled = compile(source, filename, "exec")
    except SyntaxError as exc:
        return {
            "steps": [],
            "error": _format_exception(exc, source, filename),
            "needsInput": False,
            "stoppedEarly": False,
            "stdout": "",
            "lineCount": len(source.split("\n")),
        }

    with capture:
        namespace["input"] = _echoing_input(capture)
        sys.settrace(recorder.dispatch)
        try:
            exec(compiled, namespace)
        except SystemExit:
            pass
        except InputNeeded:
            needs_input = True
        except BaseException as exc:  # noqa: BLE001
            error = _format_exception(exc, source, filename)
        finally:
            sys.settrace(None)

    return {
        "steps": recorder.steps,
        "error": error,
        "needsInput": needs_input,
        "prompt": capture.text.rsplit("\n", 1)[-1].strip() if needs_input else "",
        "stoppedEarly": recorder.stopped,
        "maxSteps": MAX_STEPS,
        "stdout": capture.text,
        "lineCount": len(source.split("\n")),
    }
