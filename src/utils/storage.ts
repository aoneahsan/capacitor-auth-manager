import { AuthPersistence } from '../definitions';

export interface StorageInterface {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class WebStorage implements StorageInterface {
  private storage: Storage;
  private prefix: string;

  constructor(
    persistence: AuthPersistence = AuthPersistence.LOCAL,
    prefix = 'cap_auth_'
  ) {
    this.prefix = prefix;

    switch (persistence) {
      case AuthPersistence.SESSION:
        this.storage = window.sessionStorage;
        break;
      case AuthPersistence.LOCAL:
        this.storage = window.localStorage;
        break;
      case AuthPersistence.NONE:
        // Use in-memory storage
        this.storage = new InMemoryStorage();
        break;
      default:
        this.storage = window.localStorage;
    }
  }

  async get(key: string): Promise<any> {
    try {
      const value = this.storage.getItem(this.prefix + key);
      if (value) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      const stringValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      this.storage.setItem(this.prefix + key, stringValue);
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.storage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Storage remove error:', error);
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
      console.error('Storage clear error:', error);
    }
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
