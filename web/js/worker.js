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
const LOCAL = new URL('../vendor/pyodide/', self.location.href).href;

/**
 * Where to look for Python, in the order we try them.
 *
 * The order carries more weight than it appears to. cdn.jsdelivr.net is
 * DNS-blocked across mainland China and on a good number of school and
 * corporate networks, and a learner who cannot reach it has no course at
 * all, because every exercise needs the interpreter. fastly. and gcore. are
 * jsDelivr's own alternate hostnames and stay reachable through that block.
 * unpkg belongs to a different company, so one bad afternoon at jsDelivr
 * does not take every option down at once.
 *
 * A vendored copy beats all of them; tools/vendor_pyodide.sh puts one there.
 */
const SOURCES = [
  { url: LOCAL, label: 'this computer', local: true },
  { url: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`, label: 'jsDelivr' },
  { url: `https://fastly.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`, label: 'jsDelivr via Fastly' },
  { url: `https://gcore.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`, label: 'jsDelivr via Gcore' },
  { url: `https://unpkg.com/pyodide@${PYODIDE_VERSION}/`, label: 'unpkg' },
];

const PROBE_MS = 8000;

let pyodide = null;
let api = null;

/**
 * Ask whether a source answers at all, and give up quickly when it does not.
 *
 * A blocked host often blackholes the connection rather than refusing it, so
 * without a deadline one dead mirror would spend the whole boot budget and
 * the working mirror further down the list would never get a turn.
 */
async function reachable(url) {
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), PROBE_MS);
  try {
    const response = await fetch(`${url}pyodide.mjs`, { method: 'HEAD', signal: stop.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function loadFrom(source) {
  const { loadPyodide } = await import(/* @vite-ignore */ `${source.url}pyodide.mjs`);
  return loadPyodide({ indexURL: source.url });
}

/**
 * Work down the list until one source hands us a running interpreter.
 *
 * Reaching pyodide.mjs is not proof the rest will arrive - a filter can pass
 * the small file and drop the 10 MB of WebAssembly behind it - so success
 * means loadPyodide returned, not that a probe went through.
 */
function progress(stage, detail = '') {
  self.postMessage({ type: 'progress', stage, detail });
}

async function startPython() {
  const failures = [];
  const tried = new Set();

  const attempt = async (source) => {
    tried.add(source.url);
    progress('downloading', source.local ? 'the copy on this computer' : source.label);
    try {
      return await loadFrom(source);
    } catch (error) {
      failures.push(`${source.label}: ${String((error && error.message) || error)}`);
      return null;
    }
  };

  // Only sources that answer, so one blackholed host costs the probe deadline
  // instead of the entire boot budget.
  for (const source of SOURCES) {
    if (!(await reachable(source.url))) continue;
    const running = await attempt(source);
    if (running) return running;
  }

  // Some proxies allow GET and refuse HEAD, which would have made every probe
  // above lie. Try the remote sources again without asking first.
  for (const source of SOURCES) {
    if (source.local || tried.has(source.url)) continue;
    const running = await attempt(source);
    if (running) return running;
  }

  const error = new Error('Python could not be downloaded from any of the places we know to look.');
  error.code = 'RUNTIME_UNREACHABLE';
  error.detail = failures.join('\n') || 'Nothing answered.';
  throw error;
}

async function init() {
  if (pyodide) return;

  pyodide = await startPython();

  progress('starting', 'Python 3.14');

  // The harness is fetched rather than inlined so that the exact same file
  // grades in the browser and in CI. Two copies would drift.
  const modules = ['harness', 'console', 'tracer'];
  const sources = await Promise.all(
    modules.map((name) => fetch(new URL(`../py/${name}.py`, self.location.href)).then((r) => r.text())),
  );

  pyodide.FS.mkdirTree('/foothold');
  modules.forEach((name, index) => pyodide.FS.writeFile(`/foothold/${name}.py`, sources[index]));

  // Every result crosses the boundary as a JSON string. Handing back Python
  // objects would mean managing PyProxy lifetimes for something the main
  // thread only ever reads once, and a leaked proxy is a memory leak that
  // only shows up after an hour of study.
  pyodide.runPython(`
import sys, json
sys.path.insert(0, "/foothold")
import harness, console, tracer

def _trace(code, stdin):
    return json.dumps(tracer.trace(code, stdin))

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
    trace: pyodide.globals.get('_trace'),
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

  async trace({ code, stdin }) {
    await init();
    return JSON.parse(api.trace(code, stdin || ''));
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
    self.postMessage({
      id,
      ok: false,
      error: String((error && error.message) || error),
      // A boot failure needs different words from a failed exercise, so the
      // main thread gets told which kind it is rather than guessing.
      code: (error && error.code) || null,
      detail: (error && error.detail) || null,
    });
  }
};
