import { cacheService, CacheService } from './cache';
import { config } from '../config';
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
export function withCache<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): (...args: Parameters<T>) => ReturnType<T> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!config.get<Config['cache']['enabled']>('cache.enabled')) {
      return fn(...args);
    }
    
    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(...args)
      : cacheService.generateKey(fn.name, args);
    
    // Check cache
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
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