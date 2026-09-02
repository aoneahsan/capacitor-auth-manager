import { AuthPersistence } from '../definitions.js';
import { Logger, defaultLogger } from './logger.js';

export interface StorageInterface {
  /**
   * Read and JSON-deserialize a value. Pass the expected shape as `T` at the call site to get a
   * typed result (`storage.get<AuthUser>(key)`); defaults to `unknown` so untyped callers must
   * narrow before use rather than silently receiving `any`.
   */
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class WebStorage implements StorageInterface {
  private storage: Storage;
  private prefix: string;
  private logger: Logger;

  /**
   * @param persistence Where to persist values (local / session / in-memory).
   * @param prefix Key prefix to namespace this package's storage.
   * @param logger Optional logger for storage errors. Defaults to the shared {@link defaultLogger}
   *   so storage failures honour the package log level instead of writing to `console` directly.
   */
  constructor(
    persistence: AuthPersistence = AuthPersistence.LOCAL,
    prefix = 'cap_auth_',
    logger: Logger = defaultLogger
  ) {
    this.prefix = prefix;
    this.logger = logger;

    switch (persistence) {
      case AuthPersistence.SESSION:
        this.storage = resolveBrowserStorage('sessionStorage');
        break;
      case AuthPersistence.NONE:
        // Use in-memory storage
        this.storage = new InMemoryStorage();
        break;
      case AuthPersistence.LOCAL:
      default:
        this.storage = resolveBrowserStorage('localStorage');
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = this.storage.getItem(this.prefix + key);
      if (value) {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      }
      return null;
    } catch (error) {
      this.logger.error('Storage get error:', error);
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    try {
      const stringValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      this.storage.setItem(this.prefix + key, stringValue);
    } catch (error) {
      this.logger.error('Storage set error:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.storage.removeItem(this.prefix + key);
    } catch (error) {
      this.logger.error('Storage remove error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }

      keys.forEach((key) => this.storage.removeItem(key));
    } catch (error) {
      this.logger.error('Storage clear error:', error);
    }
  }
}

interface PreferencesPlugin {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
  keys(): Promise<{ keys: string[] }>;
}

/**
 * StorageInterface backed by `@capacitor/preferences` (native KV — iOS UserDefaults /
 * Android SharedPreferences). On a device this keeps tokens out of the webview's localStorage,
 * which is the right default for Capacitor apps. Lazily imports the optional
 * `@capacitor/preferences` package on first use; opt in by passing an instance as `storage`
 * to `auth.configure({ storage: new CapacitorPreferencesStorage() })`.
 *
 * NOTE: Preferences is not hardware-encrypted. For secrecy at rest, inject a Keychain/Keystore
 * (e.g. a secure-storage plugin) implementation of StorageInterface instead.
 */
export class CapacitorPreferencesStorage implements StorageInterface {
  private prefix: string;
  private prefsPromise: Promise<PreferencesPlugin> | null = null;

  constructor(prefix = 'cap_auth_') {
    this.prefix = prefix;
  }

  private getPrefs(): Promise<PreferencesPlugin> {
    if (!this.prefsPromise) {
      this.prefsPromise = import(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- optional peer dep; the module may be absent at build time
        '@capacitor/preferences' as any
      ).then((m) => m.Preferences as PreferencesPlugin);
    }
    return this.prefsPromise;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const prefs = await this.getPrefs();
    const { value } = await prefs.get({ key: this.prefix + key });
    if (value === null || value === undefined) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    const prefs = await this.getPrefs();
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    await prefs.set({ key: this.prefix + key, value: stringValue });
  }

  async remove(key: string): Promise<void> {
    const prefs = await this.getPrefs();
    await prefs.remove({ key: this.prefix + key });
  }

  async clear(): Promise<void> {
    const prefs = await this.getPrefs();
    const { keys } = await prefs.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith(this.prefix))
        .map((k) => prefs.remove({ key: k }))
    );
  }
}

/**
 * Returns the requested browser storage when it exists AND is usable, otherwise an in-memory
 * fallback. Two environments make the fallback necessary:
 *   - Node / SSR / test runners: `window` is undefined, so the old unguarded `window.localStorage`
 *     read threw `ReferenceError: window is not defined` at import time (ISSUE-002).
 *   - Browsers that expose the API but refuse it (Safari private mode, cookies disabled, sandboxed
 *     iframes): `getItem`/`setItem` throw, so the probe below catches that and degrades gracefully.
 */
function resolveBrowserStorage(kind: 'localStorage' | 'sessionStorage'): Storage {
  if (typeof window === 'undefined') {
    return new InMemoryStorage();
  }
  try {
    const candidate = window[kind];
    if (!candidate) {
      return new InMemoryStorage();
    }
    const probeKey = '__cap_auth_probe__';
    candidate.setItem(probeKey, '1');
    candidate.removeItem(probeKey);
    return candidate;
  } catch {
    return new InMemoryStorage();
  }
}

class InMemoryStorage implements Storage {
  private data: Map<string, string> = new Map();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) || null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] || null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}
