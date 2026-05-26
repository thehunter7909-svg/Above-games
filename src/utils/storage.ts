// Safe fallback storage utility to prevent SecurityErrors in high-restriction sandboxes / GitHub Pages iframes
const inMemoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[Storage Warning] Failed to read key "${key}" from localStorage. Using memory fallback.`, e);
    }
    return key in inMemoryStore ? inMemoryStore[key] : null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`[Storage Warning] Failed to write key "${key}" to localStorage. Using memory fallback.`, e);
    }
    inMemoryStore[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`[Storage Warning] Failed to remove key "${key}" from localStorage. Using memory fallback.`, e);
    }
    delete inMemoryStore[key];
  }
};
