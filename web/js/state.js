/**
 * Everything Foothold remembers about a learner.
 *
 * There is no account, no server, and no analytics. Progress lives in this
 * browser's localStorage and nowhere else, which has one obvious cost - clear
 * your browser data and it is gone - so the UI offers an export to a file and
 * an import back, and that file is the learner's to keep.
 *
 * Saved drafts are per lesson, so closing the tab mid-exercise loses nothing.
 */

const KEY = 'foothold.progress.v1';
const SETTINGS_KEY = 'foothold.settings.v1';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    // A locked-down browser (private mode in some builds) throws on access.
    // Losing progress is bad; refusing to load the site is worse.
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const DEFAULT_PROGRESS = {
  version: 1,
  startedAt: null,
  completed: {},
  drafts: {},
  hintsUsed: {},
  solutionsRevealed: {},
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  fontSize: 14,
  name: '',
};

export class Progress extends EventTarget {
  constructor() {
    super();
    this.data = { ...DEFAULT_PROGRESS, ...read(KEY, {}) };
    this.settings = { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) };
    if (!this.data.startedAt) {
      this.data.startedAt = new Date().toISOString();
      this.save();
    }
  }

  save() {
    this.persisted = write(KEY, this.data);
    this.dispatchEvent(new CustomEvent('change', { detail: this.data }));
    return this.persisted;
  }

  saveSettings() {
    write(SETTINGS_KEY, this.settings);
    this.dispatchEvent(new CustomEvent('settings', { detail: this.settings }));
  }

  key(moduleSlug, lessonSlug) {
    return `${moduleSlug}/${lessonSlug}`;
  }

  isComplete(moduleSlug, lessonSlug) {
    return Boolean(this.data.completed[this.key(moduleSlug, lessonSlug)]);
  }

  complete(moduleSlug, lessonSlug) {
    const key = this.key(moduleSlug, lessonSlug);
    if (this.data.completed[key]) return false;
    this.data.completed[key] = new Date().toISOString();
    this.save();
    return true;
  }

  draft(moduleSlug, lessonSlug) {
    return this.data.drafts[this.key(moduleSlug, lessonSlug)] ?? null;
  }

  saveDraft(moduleSlug, lessonSlug, code) {
    this.data.drafts[this.key(moduleSlug, lessonSlug)] = code;
    this.save();
  }

  clearDraft(moduleSlug, lessonSlug) {
    delete this.data.drafts[this.key(moduleSlug, lessonSlug)];
    this.save();
  }

  /** How many hints a learner has opened, so the UI reveals them one at a time. */
  hintsUsed(moduleSlug, lessonSlug) {
    return this.data.hintsUsed[this.key(moduleSlug, lessonSlug)] || 0;
  }

  useHint(moduleSlug, lessonSlug) {
    const key = this.key(moduleSlug, lessonSlug);
    this.data.hintsUsed[key] = (this.data.hintsUsed[key] || 0) + 1;
    this.save();
    return this.data.hintsUsed[key];
  }

  revealSolution(moduleSlug, lessonSlug) {
    this.data.solutionsRevealed[this.key(moduleSlug, lessonSlug)] = true;
    this.save();
  }

  didRevealSolution(moduleSlug, lessonSlug) {
    return Boolean(this.data.solutionsRevealed[this.key(moduleSlug, lessonSlug)]);
  }

  stats(manifest) {
    let total = 0;
    let done = 0;
    const perModule = {};

    for (const module of manifest.modules) {
      let moduleDone = 0;
      for (const lesson of module.lessons) {
        total += 1;
        if (this.isComplete(module.slug, lesson.slug)) {
          done += 1;
          moduleDone += 1;
        }
      }
      perModule[module.slug] = { done: moduleDone, total: module.lessons.length };
    }

    return { total, done, perModule, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  /** The next lesson with no tick against it, which is what Continue jumps to. */
  nextLesson(manifest) {
    for (const module of manifest.modules) {
      for (const lesson of module.lessons) {
        if (!this.isComplete(module.slug, lesson.slug)) {
          return { module: module.slug, lesson: lesson.slug };
        }
      }
    }
    return null;
  }

  export() {
    return JSON.stringify({ ...this.data, settings: this.settings, exportedAt: new Date().toISOString() }, null, 2);
  }

  import(json) {
    const incoming = JSON.parse(json);
    if (!incoming || typeof incoming !== 'object' || !('completed' in incoming)) {
      throw new Error('That file does not look like a Foothold progress export.');
    }
    // Merge rather than replace: importing on a machine where you have also
    // done some lessons should never take ticks away.
    this.data.completed = { ...this.data.completed, ...incoming.completed };
    this.data.drafts = { ...this.data.drafts, ...(incoming.drafts || {}) };
    this.data.hintsUsed = { ...this.data.hintsUsed, ...(incoming.hintsUsed || {}) };
    this.data.solutionsRevealed = {
      ...this.data.solutionsRevealed,
      ...(incoming.solutionsRevealed || {}),
    };
    if (incoming.settings) {
      this.settings = { ...this.settings, ...incoming.settings };
      this.saveSettings();
    }
    this.save();
  }

  reset() {
    this.data = { ...DEFAULT_PROGRESS, startedAt: new Date().toISOString(), completed: {}, drafts: {}, hintsUsed: {}, solutionsRevealed: {} };
    this.save();
  }
}

export const progress = new Progress();
