"""Catch the tics that make writing read as machine-generated.

    python3 tools/lint_prose.py            # lessons, README, CONTRIBUTING
    python3 tools/lint_prose.py --fix-list # print offending lines only

Foothold is a course, so its prose is a large part of the product. Prose has
patterns that survive a careless edit and read as filler: adverbs doing no
work, "not X, it's Y" reversals, three-item lists, throat-clearing before the
point. This checks for them the way the curriculum validator checks the code.

Only prose is scanned. Fenced code blocks, front matter and inline code spans
are skipped, because `simply` inside a string literal is not a writing problem
and `not x, it's y` is valid Python nobody should have to reword.

Severity:
    error   nearly always filler; CI fails on these
    warn    sometimes legitimate; a human decides
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# --- Rules ------------------------------------------------------------------

ERRORS: list[tuple[str, str, str]] = [
    # (name, regex, what to do instead)
    ("adverb", r"\b(really|just|literally|genuinely|honestly|simply|actually|truly|deeply|"
               r"fundamentally|inherently|inevitably|interestingly|importantly|crucially|"
               r"basically|essentially|obviously|incredibly|extremely|arguably|notably)\b",
     "cut it; the sentence means the same without it"),

    ("throat-clearing", r"(?i)\b(here'?s (the thing|what|why|how|where)|the truth is|"
                        r"it turns out|let me be clear|the real \w+ is|what'?s more)\b",
     "delete the run-up and state the point"),

    ("filler", r"(?i)\b(at its core|in today'?s|it'?s worth noting|at the end of the day|"
               r"when it comes to|in a world where|the reality is|needless to say|"
               r"that being said)\b",
     "cut the phrase"),

    ("binary-contrast", r"(?i)((?:is|are|was|were)n'?t \w[\w ]{0,24}[,.] (?:it'?s|they'?re|its)\b"
                        r"|not \w[\w ]{0,24}, but (?:rather )?\b"
                        r"|the (?:answer|question|problem) is ?n'?t\b"
                        r"|not just \w[\w ]{0,20} but(?: also)?\b"
                        r"|\b(?:is|are|it'?s|they'?re) an? \w[\w ]{0,20}, not an? \w+\b)",
     "state the second half directly and drop the setup"),

    ("em-dash", r"[—–]", "use a comma, a full stop, or brackets"),

    ("emphasis-crutch", r"(?i)(full stop\.|let that sink in|make no mistake|"
                        r"this matters because|here'?s why that matters)",
     "delete it"),

    ("meta-commentary", r"(?i)\b(let me walk you through|in this section,? we|as we'?ll see|"
                        r"the rest of this (lesson|section)|i want to explore)\b",
     "delete it and let the lesson move"),

    ("rhetorical-setup", r"(?i)(^|\. )(what if |think about it|here'?s what i mean|"
                         r"and that'?s okay\.)",
     "make the point instead of announcing it"),

    ("jargon", r"(?i)\b(deep dive|game[- ]changer|double down|circle back|lean into|"
               r"on the same page|moving forward,|unpack (?:the|this|that)|delve)\b",
     "use plain words"),

    ("vague-declarative", r"(?i)\b(the (implications|stakes|consequences|reasons) (are|is) "
                          r"(significant|structural|real|high|clear))\b",
     "name the specific thing"),
]

WARNINGS: list[tuple[str, str, str]] = [
    ("lazy-extreme", r"(?i)\b(everyone|everybody|nobody|no one|always|never|every single)\b",
     "sweeping claim; is it true, and does it need to be?"),

    ("passive", r"(?i)\b(is|are|was|were|be|been|being) (\w+ed|written|done|made|given|taken|"
                r"seen|known|shown|held|built|kept|found)\b(?! by (?:you|the learner))",
     "name who does it"),

    ("wh-opener", r"(?m)^(What|When|Where|Which|Who|Why|How)\b(?![^.?]*\?)",
     "lead with the subject"),
]


# --- Extraction -------------------------------------------------------------

FENCE = re.compile(r"^(\s*)(`{3,}|~{3,})")


def prose_lines(text: str) -> list[tuple[int, str]]:
    """Every prose line in a Markdown file, with its 1-based line number."""
    out = []
    in_fence = False
    fence_mark = ""
    in_frontmatter = False

    for number, raw in enumerate(text.split("\n"), start=1):
        if number == 1 and raw.strip() == "---":
            in_frontmatter = True
            continue
        if in_frontmatter:
            if raw.strip() == "---":
                in_frontmatter = False
            continue

        fence = FENCE.match(raw)
        if fence:
            mark = fence.group(2)[0]
            if not in_fence:
                in_fence = True
                fence_mark = mark
            elif mark == fence_mark:
                in_fence = False
            continue

        if in_fence:
            continue

        # Inline code is code, not prose.
        line = re.sub(r"`[^`]*`", " ", raw)
        # A word inside quotes is being named, not used. The style guide has to
        # be able to say which words it forbids.
        line = re.sub(r'"[^"]{1,20}"', " ", line)
        # Links: keep the label, drop the URL.
        line = re.sub(r"\]\([^)]*\)", "]", line)
        if line.strip():
            out.append((number, line))

    return out


def rule_of_three(line: str) -> bool:
    """Three parallel items in one sentence, the most tired rhythm there is."""
    match = re.search(r"\b(\w+), (\w+),? and (\w+)\b", line)
    if not match:
        return False
    words = [match.group(1), match.group(2), match.group(3)]
    # Only flag when the three are similar in shape; "5, 10 and 20" is data.
    return all(word.isalpha() and len(word) > 3 for word in words)


# --- Reporting --------------------------------------------------------------

class Finding:
    def __init__(self, path: Path, line: int, rule: str, severity: str, text: str, advice: str):
        self.path = path
        self.line = line
        self.rule = rule
        self.severity = severity
        self.text = text.strip()
        self.advice = advice


def scan(path: Path) -> list[Finding]:
    findings = []
    text = path.read_text(encoding="utf-8")

    for number, line in prose_lines(text):
        for name, pattern, advice in ERRORS:
            for match in re.finditer(pattern, line):
                findings.append(Finding(path, number, f"{name}: {match.group(0).strip()}", "error", line, advice))

        for name, pattern, advice in WARNINGS:
            match = re.search(pattern, line)
            if match:
                findings.append(Finding(path, number, f"{name}: {match.group(0).strip()}", "warn", line, advice))

        if rule_of_three(line):
            findings.append(Finding(path, number, "rule-of-three", "warn", line, "two items land harder than three"))

    return findings


def targets() -> list[Path]:
    paths = sorted((ROOT / "web" / "content" / "curriculum").rglob("*.md"))
    for name in ("README.md", "CONTRIBUTING.md"):
        candidate = ROOT / name
        if candidate.exists():
            paths.append(candidate)
    return paths


def main(argv: list[str]) -> int:
    only_errors = "--errors" in argv
    findings = []
    for path in targets():
        findings.extend(scan(path))

    errors = [f for f in findings if f.severity == "error"]
    warnings = [f for f in findings if f.severity == "warn"]

    if "--fix-list" in argv:
        for finding in errors:
            print(f"{finding.path.relative_to(ROOT)}:{finding.line}: {finding.rule}")
            print(f"    {finding.text}")
        return 1 if errors else 0

    by_file: dict[Path, list[Finding]] = {}
    for finding in errors if only_errors else findings:
        by_file.setdefault(finding.path, []).append(finding)

    for path, items in by_file.items():
        print(f"\n{path.relative_to(ROOT)}")
        for finding in items:
            tag = "error" if finding.severity == "error" else "warn "
            print(f"  {tag} line {finding.line:<4} {finding.rule}")
            print(f"        {finding.text[:100]}")
            print(f"        -> {finding.advice}")

    print()
    print(f"{len(errors)} errors, {len(warnings)} warnings across {len(targets())} files.")
    if errors:
        print("Prose that reads as filler blocks the build. Rewrite the lines above.")
        return 1
    print("The prose is clean.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
