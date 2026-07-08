export interface StorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = "kavach-ai:") {
    this.prefix = prefix;
  }

  public async getItem<T>(key: string): Promise<T | null> {
    try {
      const val = localStorage.getItem(this.prefix + key);
      if (!val) return null;
      return JSON.parse(val) as T;
    } catch (err) {
      console.warn(`LocalStorageAdapter failed to get item: ${key}`, err);
      return null;
    }
  }

  public async setItem<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (err) {
      console.warn(`LocalStorageAdapter failed to set item: ${key}`, err);
    }
  }

  public async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (err) {
      console.warn(`LocalStorageAdapter failed to remove item: ${key}`, err);
    }
  }
}
