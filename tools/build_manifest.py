"""Regenerate web/content/manifest.json from the lesson files on disk.

The browser needs one small file listing every module and lesson so it can
draw the sidebar without fetching forty Markdown files. That index is
generated, never hand-edited, and committed so the site works as a plain
static folder with no build step.

Run it after adding, renaming, or reordering a lesson:

    python3 tools/build_manifest.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import lesson as lesson_mod


def main() -> int:
    manifest = lesson_mod.write_manifest()
    lessons = sum(len(module["lessons"]) for module in manifest["modules"])
    print(f"Wrote {lesson_mod.MANIFEST_PATH.relative_to(Path.cwd()) if lesson_mod.MANIFEST_PATH.is_relative_to(Path.cwd()) else lesson_mod.MANIFEST_PATH}")
    print(f"  {len(manifest['modules'])} modules, {lessons} lessons")
    for module in manifest["modules"]:
        print(f"    {module['title']:<34} {len(module['lessons']):>2}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
