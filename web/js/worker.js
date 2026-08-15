/**
 * The Python worker.
 *
 * Everything a learner writes runs in here, off the main thread, for one
 * reason above all others: beginners write infinite loops. A `while True:`
 * with no break is a rite of passage, and if it ran on the main thread the
 * whole tab would lock up and the only way out would be closing it. In a
 * worker we can simply terminate the thread and start a fresh one.
 *
 * The worker speaks a small request/response protocol. Every message carries
 * an `id`, and every reply carries the same `id` back.
 *
 * This is a *module* worker, not a classic one. Pyodide from v314 onwards
 * refuses to load in a classic worker ("Classic web workers are not
 * supported"), so the runtime is pulled in with a dynamic `import()` of
 * pyodide.mjs rather than `importScripts`.
 */

/* eslint-env worker */

const PYODIDE_VERSION = '314.0.4';
const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const LOCAL = new URL('../vendor/pyodide/', self.location.href).href;

let pyodide = null;
let api = null;

/**
 * Prefer a vendored copy of Pyodide when one exists.
 *
 * tools/vendor_pyodide.sh downloads it, which is what makes Foothold work on
 * a laptop with no internet - a classroom on bad wifi, a plane, a country
 * where the CDN is blocked. Without it we fall back to the CDN.
 */
async function resolveIndexURL() {
  try {
    const probe = await fetch(`${LOCAL}pyodide.mjs`, { method: 'HEAD' });
    if (probe.ok) return LOCAL;
  } catch {
    /* no local copy; that is the normal case */
  }
  return CDN;
}

function progress(stage, detail = '') {
  self.postMessage({ type: 'progress', stage, detail });
}

async function init() {
  if (pyodide) return;

  const indexURL = await resolveIndexURL();
  progress('downloading', indexURL === LOCAL ? 'local copy' : 'first visit only');

  const { loadPyodide } = await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`);
  pyodide = await loadPyodide({ indexURL });

  progress('starting', 'Python 3.14');

  // The harness is fetched rather than inlined so that the exact same file
  // grades in the browser and in CI. Two copies would drift.
  const [harnessSource, consoleSource] = await Promise.all([
    fetch(new URL('../py/harness.py', self.location.href)).then((r) => r.text()),
    fetch(new URL('../py/console.py', self.location.href)).then((r) => r.text()),
  ]);

  pyodide.FS.mkdirTree('/foothold');
  pyodide.FS.writeFile('/foothold/harness.py', harnessSource);
  pyodide.FS.writeFile('/foothold/console.py', consoleSource);

  // Every result crosses the boundary as a JSON string. Handing back Python
  // objects would mean managing PyProxy lifetimes for something the main
  // thread only ever reads once, and a leaked proxy is a memory leak that
  // only shows up after an hour of study.
  pyodide.runPython(`
import sys, json
sys.path.insert(0, "/foothold")
import harness, console

def _run(code, stdin):
    result = harness.run_code(code, stdin)
    result.pop("namespace", None)
    return json.dumps(result)

def _grade(code, tests, stdin):
    return json.dumps(harness.grade_with_helpers(code, tests, stdin))

def _push(line):
    return json.dumps(console.push(line))

def _reset():
    console.reset()
    return "{}"

def _complete(prefix):
    return json.dumps(console.completions(prefix))
`);

  api = {
    run: pyodide.globals.get('_run'),
    grade: pyodide.globals.get('_grade'),
    push: pyodide.globals.get('_push'),
    reset: pyodide.globals.get('_reset'),
    complete: pyodide.globals.get('_complete'),
  };

  progress('ready');
}

const HANDLERS = {
  async init() {
    await init();
    return { ready: true, version: PYODIDE_VERSION };
  },

  async run({ code, stdin }) {
    await init();
    return JSON.parse(api.run(code, stdin || ''));
  },

  async grade({ code, tests, stdin }) {
    await init();
    return JSON.parse(api.grade(code, tests, stdin || ''));
  },

  async push({ line }) {
    await init();
    return JSON.parse(api.push(line));
  },

  async resetConsole() {
    await init();
    api.reset();
    return {};
  },

  async complete({ prefix }) {
    await init();
    return JSON.parse(api.complete(prefix));
  },
};

self.onmessage = async (event) => {
  const { id, type, payload } = event.data;
  const handler = HANDLERS[type];

  if (!handler) {
    self.postMessage({ id, ok: false, error: `Unknown request: ${type}` });
    return;
  }

  try {
    const result = await handler(payload || {});
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({ id, ok: false, error: String((error && error.message) || error) });
  }
};
