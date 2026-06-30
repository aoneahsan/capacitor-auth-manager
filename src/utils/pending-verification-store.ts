import { defaultLogger } from './logger';

/**
 * Small, SSR-guarded, localStorage-backed store for passwordless "pending verification" metadata
 * (SMS code / email code / magic-link). It exists because verification frequently completes on a
 * DIFFERENT page load than the one that started it — most acutely for magic links, where the user
 * clicks an emailed link that opens a fresh document with empty in-memory state. Without
 * persistence the pending map is always empty on verify and the flow fails with INVALID_TOKEN /
 * NO_PENDING_VERIFICATION (see F-11).
 *
 * SECURITY: only NON-secret metadata is persisted — a backend `sessionId`, the `expires`
 * timestamp, and the `attempts` counter (plus the email/phone for UX). The one-time code is NEVER
 * persisted; it lives only in the SMS/email the user receives and is sent straight to the backend
 * for verification. For magic links the lookup key is the link token itself, which the user
 * already holds in the callback URL — storing non-secret metadata under it adds no new exposure.
 *
 * Entries are namespaced per provider. `get` returns the stored record as-is (including past its
 * `expires`) so the CALLER can raise its own precise error (e.g. CODE_EXPIRED vs
 * NO_PENDING_VERIFICATION). Expired entries are swept opportunistically on `set` to bound storage
 * growth — never on `get`, so a provider's own expiry branch stays reachable.
 */
export interface PendingVerificationRecord {
  /** Identifier the user authenticates with (phone number or email). For UX/display only. */
  identifier: string;
  /** Opaque backend session id for the verification attempt. Not a secret on its own. */
  sessionId: string;
  /** Epoch ms after which the pending verification is no longer valid. */
  expires: number;
  /** Number of verify attempts made so far (server still enforces the real limit). */
  attempts: number;
  /** Epoch ms of the last (re)send, used to throttle resends. */
  lastResent?: number;
}

export class PendingVerificationStore {
  private readonly storageKey: string;
  /** In-memory mirror so the store works in SSR / private-mode where localStorage is unavailable. */
  private readonly memory = new Map<string, PendingVerificationRecord>();

  /**
   * @param namespace Provider namespace (e.g. `'sms'`, `'email-code'`, `'magic-link'`). Keys are
   *   stored under `cap_auth_pending_<namespace>` so providers never collide.
   */
  constructor(namespace: string) {
    this.storageKey = `cap_auth_pending_${namespace}`;
  }

  private getLocalStorage(): Storage | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
      // Access to localStorage can throw (e.g. sandboxed iframe) — fall back to memory only.
      return null;
    }
  }

  private readAll(): Record<string, PendingVerificationRecord> {
    const ls = this.getLocalStorage();
    if (!ls) {
      return Object.fromEntries(this.memory);
    }
    try {
      const raw = ls.getItem(this.storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<
        string,
        PendingVerificationRecord
      >;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      defaultLogger.warn(
        `PendingVerificationStore: failed to read ${this.storageKey}`,
        error
      );
      return {};
    }
  }

  private writeAll(all: Record<string, PendingVerificationRecord>): void {
    const ls = this.getLocalStorage();
    if (!ls) {
      this.memory.clear();
      for (const [k, v] of Object.entries(all)) this.memory.set(k, v);
      return;
    }
    try {
      ls.setItem(this.storageKey, JSON.stringify(all));
    } catch (error) {
      defaultLogger.warn(
        `PendingVerificationStore: failed to write ${this.storageKey}`,
        error
      );
    }
  }

  /**
   * Stores (or replaces) the pending record for `key` (phone / email / magic-link token). Other
   * expired entries in the namespace are pruned here to bound storage growth.
   */
  set(key: string, record: PendingVerificationRecord): void {
    const all = this.readAll();
    this.pruneExpired(all, key);
    all[key] = record;
    this.writeAll(all);
  }

  /**
   * Returns the pending record for `key`, or null if absent. Does NOT filter by expiry — the
   * caller owns the expiry decision so it can throw a precise error and clean up itself.
   */
  get(key: string): PendingVerificationRecord | null {
    const all = this.readAll();
    return all[key] ?? null;
  }

  /** Removes the pending record for `key` (e.g. after a successful or expired verification). */
  delete(key: string): void {
    const all = this.readAll();
    if (key in all) {
      delete all[key];
      this.writeAll(all);
    }
  }

  /** Clears every pending record in this namespace. */
  clear(): void {
    const ls = this.getLocalStorage();
    this.memory.clear();
    if (ls) {
      try {
        ls.removeItem(this.storageKey);
      } catch (error) {
        defaultLogger.warn(
          `PendingVerificationStore: failed to clear ${this.storageKey}`,
          error
        );
      }
    }
  }

  private pruneExpired(
    all: Record<string, PendingVerificationRecord>,
    exceptKey?: string
  ): Record<string, PendingVerificationRecord> {
    const now = Date.now();
    for (const [k, v] of Object.entries(all)) {
      if (k !== exceptKey && now > v.expires) {
        delete all[k];
      }
    }
    return all;
  }
}
