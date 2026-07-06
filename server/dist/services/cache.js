const cache = new Map();
export const getCache = (key) => {
    const entry = cache.get(key);
    if (!entry)
        return undefined;
    if (entry.expiresAt <= Date.now()) {
        cache.delete(key);
        return undefined;
    }
    return entry.value;
};
export const setCache = (key, value, ttlMs) => {
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
};
export const clearCache = () => cache.clear();
export const clearCacheByPrefix = (prefix) => {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix))
            cache.delete(key);
    }
};
