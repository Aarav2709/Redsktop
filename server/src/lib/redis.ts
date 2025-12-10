import NodeCache from "node-cache";

const memoryCache = new NodeCache();

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const value = memoryCache.get<T>(key);
  return value ?? null;
};

export const cacheSet = async <T>(key: string, value: T, ttlSeconds: number) => {
  memoryCache.set(key, value, ttlSeconds);
};
