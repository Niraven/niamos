const PREFIX = "niamos_";

export const storage = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set: (key: string, value: unknown) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
  },
  remove: (key: string) => {
    try { localStorage.removeItem(PREFIX + key); } catch {}
  },
};
