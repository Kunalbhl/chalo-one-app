export class CacheService {
  private static cache: Map<string, { data: any; expiry: number }> = new Map();

  static set(key: string, data: any, ttlMs: number = 60000) {
    this.cache.set(key, { data, expiry: Date.now() + ttlMs });
  }

  static get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  static clear(key: string) {
    this.cache.delete(key);
  }
}
