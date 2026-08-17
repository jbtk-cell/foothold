/**
 * Main-thread client for the Python worker.
 *
 * Its real job is the failure case. A worker running a beginner's `while True`
 * will never answer, so every request carries a deadline; when one expires we
 * destroy the worker, start a new one, and tell the learner in plain words
 * what happened. Recovering from an infinite loop should cost a few seconds
 * and no lost work.
 */

const RUN_TIMEOUT_MS = 10_000;
const BOOT_TIMEOUT_MS = 120_000;

export class PythonRuntime extends EventTarget {
  constructor() {
    super();
    this.worker = null;
    this.pending = new Map();
    this.nextId = 1;
    this.status = 'cold';
    this.bootPromise = null;
  }

  emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  spawn() {
    // A module worker: Pyodide v314+ will not load in a classic one.
    this.worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

    this.worker.onmessage = ({ data }) => {
      if (data.type === 'progress') {
        this.emit('progress', data);
        if (data.stage === 'ready') {
          this.status = 'ready';
          this.emit('ready', {});
        }
        return;
      }

      const entry = this.pending.get(data.id);
      if (!entry) return;
      this.pending.delete(data.id);
      clearTimeout(entry.timer);
      if (data.ok) entry.resolve(data.result);
      else entry.reject(new Error(data.error));
    };

    this.worker.onerror = (event) => {
      const message = event.message || 'The Python runtime stopped unexpectedly.';
      for (const [, entry] of this.pending) {
        clearTimeout(entry.timer);
        entry.reject(new Error(message));
      }
      this.pending.clear();
      this.status = 'crashed';
      this.emit('crashed', { message });
    };
  }

  /**
   * Throw away the current interpreter and start again.
   *
   * Everything the learner defined in the terminal is lost, which is worth
   * saying out loud in the UI rather than silently resetting under them.
   */
  restart(reason = '') {
    if (this.worker) this.worker.terminate();
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.reject(new Error(reason || 'The Python runtime was restarted.'));
    }
    this.pending.clear();
    this.status = 'cold';
    this.bootPromise = null;
    this.spawn();
    this.emit('restarted', { reason });
  }

  boot() {
    if (!this.bootPromise) {
      if (!this.worker) this.spawn();
      this.status = 'booting';
      this.emit('booting', {});
      this.bootPromise = this.request('init', {}, BOOT_TIMEOUT_MS).catch((error) => {
        this.bootPromise = null;
        this.status = 'crashed';
        this.emit('crashed', { message: error.message });
        throw error;
      });
    }
    return this.bootPromise;
  }

  request(type, payload = {}, timeoutMs = RUN_TIMEOUT_MS) {
    if (!this.worker) this.spawn();

    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        this.restart('timeout');
        const error = new Error(
          'Your program ran for too long and was stopped. The usual cause is a ' +
            'loop with no way out - check that something in the loop eventually ' +
            'makes its condition false.',
        );
        error.code = 'TIMEOUT';
        reject(error);
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ id, type, payload });
    });
  }

  async run(code, stdin = '') {
    await this.boot();
    return this.request('run', { code, stdin });
  }

  /**
   * Record every step the program takes, for the Trace panel.
   *
   * Tracing is much slower than running - roughly one settrace callback per
   * line executed - so it gets a longer deadline than an ordinary run.
   */
  async trace(code, stdin = '') {
    await this.boot();
    return this.request('trace', { code, stdin }, 30_000);
  }

  async grade(code, tests, stdin = '') {
    await this.boot();
    return this.request('grade', { code, tests, stdin });
  }

  async push(line) {
    await this.boot();
    return this.request('push', { line });
  }

  async resetConsole() {
    await this.boot();
    return this.request('resetConsole', {});
  }

  async complete(prefix) {
    await this.boot();
    return this.request('complete', { prefix });
  }
}

export const runtime = new PythonRuntime();
