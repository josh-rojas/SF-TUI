export interface CacheOptions {
  /**
   * Time-to-live in milliseconds
   * @default 300000 (5 minutes)
   */
  ttl?: number;
  
  /**
   * Maximum cache size in bytes
   * @default 10485760 (10MB)
   */
  maxSize?: number;
  
  /**
   * Whether to enable caching
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Cache directory
   * @default '~/.sf-tui/cache'
   */
  cacheDir?: string;

  /**
   * Tags for cache invalidation
   * @default []
   */
  tags?: string[];
}

export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  key: string;
  size: number;
  tags?: string[];
  expiresAt?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
  evictions: number;
  errors: number;
}

export interface CacheOptionsWithTags extends Omit<CacheOptions, 'tags'> {
  tags?: string[];
}

export interface CommandCacheOptions extends CacheOptionsWithTags {
  /**
   * Whether to enable request deduplication
   * @default true
   */
  deduplicate?: boolean;
  
  /**
   * Whether to use stale-while-revalidate
   * @default true
   */
  staleWhileRevalidate?: boolean;
  
  /**
   * Maximum age in milliseconds to consider a stale entry valid
   * @default 300000 (5 minutes)
   */
  maxStaleAge?: number;
}

export interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}
