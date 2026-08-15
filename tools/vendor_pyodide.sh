#!/usr/bin/env bash
# Download Pyodide into web/vendor/ so Foothold works with no network at all.
#
# By default the Python runtime is fetched from a CDN on first load and then
# cached by the service worker. That is fine for most people and keeps the
# repository small. Run this when it is not fine: a classroom with filtered
# internet, a workshop on conference wifi, a laptop that will be offline.
#
# The worker checks for web/vendor/pyodide/ and prefers it whenever it exists,
# so there is nothing to configure - download it and it is used.
#
# Costs about 30 MB on disk. web/vendor/ is gitignored.
set -euo pipefail

VERSION="314.0.4"
BASE="https://cdn.jsdelivr.net/pyodide/v${VERSION}/full"
DEST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/web/vendor/pyodide"

# The loader, the interpreter, and the standard library. Individual packages
# are not included: the course only uses modules that ship inside the stdlib
# zip, so there is nothing else to fetch.
FILES=(
  pyodide.mjs
  pyodide.asm.js
  pyodide.asm.wasm
  python_stdlib.zip
  pyodide-lock.json
)

if ! command -v curl >/dev/null 2>&1; then
  echo "This script needs curl." >&2
  exit 1
fi

mkdir -p "$DEST"
echo "Downloading Pyodide ${VERSION} into web/vendor/pyodide/"

for file in "${FILES[@]}"; do
  printf '  %-22s' "$file"
  if curl -fsSL "${BASE}/${file}" -o "${DEST}/${file}"; then
    printf 'ok (%s)\n' "$(du -h "${DEST}/${file}" | cut -f1 | tr -d ' ')"
  else
    printf 'FAILED\n'
    echo
    echo "Could not download ${BASE}/${file}" >&2
    echo "Delete web/vendor/pyodide/ and try again, or leave it absent to use the CDN." >&2
    exit 1
  fi
done

echo
echo "Done. Foothold will now use the local copy and needs no network."
echo "To go back to the CDN, delete web/vendor/."
