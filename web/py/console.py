"""The interactive Python console behind Foothold's terminal pane.

This is a REPL in the real sense: a persistent namespace that remembers what
you typed, expression results echoed back automatically, and multi-line blocks
that wait for a blank line before running. It behaves the way `python` in a
terminal behaves, because that is the thing learners will eventually sit in
front of.

It is deliberately separate from harness.py. The harness decides whether a
lesson passes and must stay simple enough to trust; the console is a toy the
learner drives and can afford to be forgiving.
"""

from __future__ import annotations

import builtins
import codeop
import io
import sys
import traceback


class Console:
    def __init__(self):
        self.reset()

    def reset(self):
        self.namespace = {
            "__name__": "__console__",
            "__doc__": None,
            "__builtins__": builtins,
        }
        self.buffer: list[str] = []
        self.compile = codeop.CommandCompiler()

    @property
    def in_block(self) -> bool:
        return bool(self.buffer)

    def push(self, line: str) -> dict:
        """Feed one line to the console.

        Returns a dict with:
            status  "more" if the block is unfinished, otherwise "done"
            output  whatever should be written to the terminal
            error   True if the output is a traceback
        """
        self.buffer.append(line)
        source = "\n".join(self.buffer)

        # A blank line closes an open block, which is how the real REPL works
        # and is the single most confusing thing about it for a beginner, so
        # the UI shows a hint about it the first time a block opens.
        if line.strip() == "" and len(self.buffer) > 1:
            return self._run(source)

        try:
            code = self.compile(source, "<console>", "single")
        except (OverflowError, SyntaxError, ValueError):
            output = self._format_syntax_error(source)
            self.buffer = []
            return {"status": "done", "output": output, "error": True}

        if code is None:
            return {"status": "more", "output": "", "error": False}

        return self._run(source)

    def _run(self, source: str) -> dict:
        self.buffer = []
        try:
            code = self.compile(source, "<console>", "single")
        except (OverflowError, SyntaxError, ValueError):
            return {"status": "done", "output": self._format_syntax_error(source), "error": True}

        if code is None:
            return {"status": "done", "output": "", "error": False}

        out = io.StringIO()
        saved = (sys.stdout, sys.stderr, sys.stdin)
        sys.stdout = out
        sys.stderr = out
        sys.stdin = _NoInput()
        error = False
        try:
            exec(code, self.namespace)
        except SystemExit:
            pass
        except BaseException:  # noqa: BLE001
            error = True
            out.write(self._format_runtime_error(source))
        finally:
            sys.stdout, sys.stderr, sys.stdin = saved

        return {"status": "done", "output": out.getvalue(), "error": error}

    def _format_syntax_error(self, source: str) -> str:
        _, exc, _ = sys.exc_info()
        lines = source.split("\n")
        if isinstance(exc, SyntaxError):
            lineno = exc.lineno or 1
            snippet = lines[lineno - 1] if 0 < lineno <= len(lines) else ""
            caret = " " * max((exc.offset or 1) - 1, 0) + "^"
            return f"  {snippet}\n  {caret}\nSyntaxError: {exc.msg}\n"
        return f"SyntaxError: {exc}\n"

    def _format_runtime_error(self, source: str) -> str:
        """Show only the frames from what the learner typed."""
        exc_type, exc, tb = sys.exc_info()
        lines = source.split("\n")
        frames = []
        walker = tb.tb_next if tb else None  # skip our own exec frame
        while walker is not None:
            lineno = walker.tb_lineno
            name = walker.tb_frame.f_code.co_name
            if walker.tb_frame.f_code.co_filename == "<console>":
                snippet = lines[lineno - 1].strip() if 0 < lineno <= len(lines) else ""
                where = "" if name == "<module>" else f", in {name}()"
                frames.append(f"  line {lineno}{where}\n    {snippet}")
            walker = walker.tb_next

        head = "".join(traceback.format_exception_only(exc_type, exc)).strip()
        if frames:
            return "\n".join(frames) + "\n" + head + "\n"
        return head + "\n"


class _NoInput:
    """stdin for the console.

    The console runs one statement at a time and cannot pause mid-statement to
    collect a keystroke, so input() here explains where interactive input does
    work rather than dying with a bare EOFError.
    """

    def readline(self, *_args):
        raise EOFError(
            "input() does not work in the scratch terminal, because the terminal "
            "runs one statement at a time. Use the editor and its Run button - "
            "that will ask you for input as your program needs it."
        )

    read = readline
    readlines = readline

    def isatty(self):
        return False


CONSOLE = Console()


def push(line: str) -> dict:
    return CONSOLE.push(line)


def reset() -> None:
    CONSOLE.reset()


def completions(prefix: str) -> list:
    """Names in scope that start with `prefix`, for tab completion."""
    if "." in prefix:
        head, _, tail = prefix.rpartition(".")
        try:
            obj = eval(head, CONSOLE.namespace)  # noqa: S307 - learner's own namespace
        except BaseException:  # noqa: BLE001
            return []
        return sorted(
            f"{head}.{name}" for name in dir(obj) if name.startswith(tail) and not name.startswith("_")
        )

    names = set(CONSOLE.namespace) | set(dir(builtins))
    return sorted(name for name in names if name.startswith(prefix) and not name.startswith("_"))
