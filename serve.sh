#!/usr/bin/env bash
# Serve Foothold locally.
#
# The site is plain static files, but it cannot be opened straight off the disk
# with file:// - browsers block ES modules and web workers on that scheme. So
# it needs a web server, and Python already ships one.
#
#   ./serve.sh          serve on http://localhost:8000
#   ./serve.sh 3000     serve on a port of your choosing
set -euo pipefail

PORT="${1:-8000}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/web"

for candidate in python3 python; do
  if command -v "$candidate" >/dev/null 2>&1; then
    PYTHON="$candidate"
    break
  fi
done

if [ -z "${PYTHON:-}" ]; then
  echo "Foothold needs Python to serve the folder, and none was found on your PATH."
  echo "Any static file server works. For example, with Node installed:"
  echo "    npx serve web"
  exit 1
fi

echo "Foothold is at  http://localhost:${PORT}"
echo "Press Ctrl+C to stop."
exec "$PYTHON" -m http.server "$PORT" --directory "$ROOT"
