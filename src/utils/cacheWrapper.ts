import { cacheService, CacheService } from './cache';
import { config, type Config } from '../config';
import { logger } from './logger';

// Initialize cache with config
export function initializeCache(): void {
  const cacheOptions = config.getCacheOptions();
  Object.assign(cacheService, new CacheService(cacheOptions));
  logger.debug('Cache initialized with options:', cacheOptions);
}

// Re-initialize cache when config changes
export function refreshCacheConfig(): void {
  initializeCache();
}

/**
 * Wrap a function with caching
 * 
 * @param fn The function to wrap
 * @param keyGenerator Function to generate cache key from args
 * @returns Wrapped function with caching
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> => {
    const cacheConfig = config.get<Config['cache']>('cache');
    if (!cacheConfig?.enabled) {
      return await fn(...args);
    }

    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(...args)
      : cacheService.generateKey(fn.name, args);

    // Check cache
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult !== null) {
      logger.debug(`Cache hit for ${fn.name}`);
      return cachedResult;
    }

    // Execute function
    const result = await fn(...args);

    // Cache result
    cacheService.set(cacheKey, result);

    return result;
  };
}

// Initialize cache on module load
initializeCache();