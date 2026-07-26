// src/utils/cacheManager.js

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.isOnline = navigator.onLine;
    this.readCount = 0;
    this.readLimit = 50000;
    this.lastResetDate = new Date().toDateString();

    window.addEventListener("online", () => {
      this.isOnline = true;
      console.log("🟢 App is online");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("🔴 App is offline - using cached data");
    });
  }

  checkAndResetCounter() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.readCount = 0;
      this.lastResetDate = today;
    }
  }

  isNearLimit() {
    this.checkAndResetCounter();
    return this.readCount > this.readLimit * 0.8;
  }

  trackRead(count = 1) {
    this.readCount += count;
  }

  getReadCount() {
    this.checkAndResetCounter();
    return this.readCount;
  }

  async set(key, data, ttl = 30 * 60 * 1000) {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl,
      expiresAt: Date.now() + ttl,
    };

    this.memoryCache.set(key, cacheData);

    try {
      sessionStorage.setItem(key, JSON.stringify(cacheData));
    } catch (e) {
      console.warn("SessionStorage full for:", key);
    }
  }

  async get(key) {
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (Date.now() < cached.expiresAt) {
        return cached.data;
      }
      this.memoryCache.delete(key);
    }

    try {
      const sessionData = sessionStorage.getItem(key);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (Date.now() < parsed.expiresAt) {
          this.memoryCache.set(key, parsed);
          return parsed.data;
        }
        sessionStorage.removeItem(key);
      }
    } catch (e) {}

    return null;
  }

  async clear(key) {
    this.memoryCache.delete(key);
    try {
      sessionStorage.removeItem(key);
    } catch (e) {}
  }

  async clearAll() {
    this.memoryCache.clear();
    try {
      sessionStorage.clear();
    } catch (e) {}
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      isNearLimit: this.isNearLimit(),
      readCount: this.getReadCount(),
      memoryCacheSize: this.memoryCache.size,
    };
  }
}

export const cacheManager = new CacheManager();
