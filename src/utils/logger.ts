export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LoggerConfig {
  enableLogging: boolean;
  logLevel: LogLevel;
  prefix?: string;
}

/**
 * Reads a default log level from the build/runtime environment WITHOUT assuming a particular
 * bundler or host. Checked defensively (each access wrapped) so it is safe in:
 *   - Vite / bundlers that define `import.meta.env`
 *   - Node / SSR where `globalThis.process.env` exists
 *   - Plain browsers where neither is present (falls back to 'warn')
 *
 * Intentional omissions for a PUBLISHED LIBRARY (see F-42):
 *   - We do NOT patch the host application's global `console.*`. A library silencing the host's
 *     console would be hostile and surprising.
 *   - We do NOT read the host's `localStorage` for a log-level switch. The host owns its storage;
 *     the consumer configures logging explicitly via `auth.configure({ logLevel })` or
 *     `logger.setLevel()`.
 */
function readEnvLogLevel(): LogLevel | undefined {
  const candidates: Array<string | undefined> = [];

  try {
    // import.meta.env may not exist (CJS) — guard the whole access.
    const metaEnv = (
      import.meta as unknown as { env?: Record<string, string | undefined> }
    )?.env;
    if (metaEnv) {
      candidates.push(metaEnv.VITE_LOG_LEVEL, metaEnv.LOG_LEVEL);
    }
  } catch {
    // import.meta unsupported in this environment — ignore.
  }

  try {
    const proc = (
      globalThis as unknown as {
        process?: { env?: Record<string, string | undefined> };
      }
    ).process;
    if (proc?.env) {
      candidates.push(proc.env.VITE_LOG_LEVEL, proc.env.LOG_LEVEL);
    }
  } catch {
    // process not available — ignore.
  }

  for (const value of candidates) {
    if (
      value === 'debug' ||
      value === 'info' ||
      value === 'warn' ||
      value === 'error' ||
      value === 'silent'
    ) {
      return value;
    }
  }
  return undefined;
}

export class Logger {
  private config: LoggerConfig;
  private readonly logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4,
  };

  constructor(config: LoggerConfig) {
    // An explicit logLevel from the caller wins; otherwise fall back to the env default, then 'warn'.
    this.config = {
      ...config,
      logLevel: config.logLevel ?? readEnvLogLevel() ?? 'warn',
    };
  }

  private shouldLog(level: Exclude<LogLevel, 'silent'>): boolean {
    if (!this.config.enableLogging) return false;
    return this.logLevels[level] >= this.logLevels[this.config.logLevel];
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix || 'CapacitorAuthManager';
    return `[${timestamp}] [${prefix}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), error);
    }
  }

  /** Verbose tracing — gated at `debug` level like {@link debug}. */
  trace(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.trace(this.formatMessage('trace', message), ...args);
    }
  }

  /** Tabular output — gated at `debug` level. Falls back to `debug` when `console.table` is absent. */
  table(data: unknown, columns?: string[]): void {
    if (this.shouldLog('debug')) {
      if (typeof console.table === 'function') {
        console.table(data, columns);
      } else {
        console.debug(this.formatMessage('table', ''), data);
      }
    }
  }

  /** Opens a console group — gated at `debug` level. No-ops if `console.group` is absent. */
  group(label?: string): void {
    if (this.shouldLog('debug') && typeof console.group === 'function') {
      console.group(label ? this.formatMessage('group', label) : undefined);
    }
  }

  /** Closes a console group opened by {@link group}. */
  groupEnd(): void {
    if (this.shouldLog('debug') && typeof console.groupEnd === 'function') {
      console.groupEnd();
    }
  }

  /** Starts a timer — gated at `debug` level. No-ops if `console.time` is absent. */
  time(label: string): void {
    if (this.shouldLog('debug') && typeof console.time === 'function') {
      console.time(label);
    }
  }

  /** Stops a timer started by {@link time} and logs the elapsed duration. */
  timeEnd(label: string): void {
    if (this.shouldLog('debug') && typeof console.timeEnd === 'function') {
      console.timeEnd(label);
    }
  }

  setLogLevel(level: LogLevel): void {
    this.config.logLevel = level;
  }

  /** Alias for {@link setLogLevel} matching the workspace logger convention. */
  setLevel(level: LogLevel): void {
    this.config.logLevel = level;
  }

  getLevel(): LogLevel {
    return this.config.logLevel;
  }

  setEnabled(enabled: boolean): void {
    this.config.enableLogging = enabled;
  }
}

/**
 * Shared default logger instance used by package internals that don't receive a logger via
 * dependency injection (e.g. {@link EventEmitter}, {@link WebStorage} defaults, the biometric
 * provider). Enabled by default at `warn` level so only warnings + errors surface unless the
 * consumer raises the level. Consumers can adjust it programmatically:
 *
 * ```ts
 * import { defaultLogger } from 'capacitor-auth-manager';
 * defaultLogger.setLevel('debug');
 * ```
 */
export const defaultLogger = new Logger({
  enableLogging: true,
  logLevel: 'warn',
  prefix: 'CapacitorAuthManager',
});
