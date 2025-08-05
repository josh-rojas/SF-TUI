import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { logger } from './logger';

export interface CacheOptions {
  /**
   * Time-to-live in milliseconds
   * Default: 5 minutes
   */
  ttl?: number;
  
  /**
   * Maximum cache size in bytes
   * Default: 10MB
   */
  maxSize?: number;
  
  /**
   * Whether to enable caching
   * Default: true
   */
  enabled?: boolean;
  
  /**
   * Cache directory
   * Default: ~/.sf-tui/cache
   */
  cacheDir?: string;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  key: string;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
}

const DEFAULT_OPTIONS: CacheOptions = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 10 * 1024 * 1024, // 10MB
  enabled: true,
  cacheDir: path.join(os.homedir(), '.sf-tui', 'cache'),
};

/**
 * Response cache service for SF TUI
 * Caches responses from Salesforce CLI commands to improve performance
 */
export class CacheService<T = any> {
  private options: Required<CacheOptions>;
  private memoryCache: Map<string, CacheEntry<T>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, entries: 0 };
  
  constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options } as Required<CacheOptions>;
    this.ensureCacheDirectory();
  }

  /**
   * Generate a cache key from the provided arguments
   */
  public generateKey(command: string, args: any[]): string {
    const key = JSON.stringify({ command, args });
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Get a value from the cache
   * @returns The cached value or null if not found or expired
   */
  public get(key: string): T | null {
    if (!this.options.enabled) {
      return null;
    }

    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && this.isValid(memEntry)) {
      this.stats.hits++;
      return memEntry.value;
    }

    // Check file system cache if not in memory
    try {
      const cacheFile = path.join(this.options.cacheDir, `${key}.json`);
      if (fs.existsSync(cacheFile)) {
        const data = fs.readFileSync(cacheFile, 'utf8');
        const entry = JSON.parse(data) as CacheEntry<T>;
        
        if (this.isValid(entry)) {
          // Add to memory cache
          this.memoryCache.set(key, entry);
          this.stats.hits++;
          return entry.value;
        } else {
          // Clean up expired entry
          fs.unlinkSync(cacheFile);
        }
      }
    } catch (error) {
      logger.error('Cache read error:', error);
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set a value in the cache
   */
  public set(key: string, value: T): void {
    if (!this.options.enabled) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const size = Buffer.byteLength(serialized);
      
      // Skip if item is too large
      if (size > this.options.maxSize * 0.1) {
        logger.debug(`Cache item too large: ${size} bytes`);
        return;
      }

      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        size,
      };

      // Add to memory cache
      this.memoryCache.set(key, entry);
      
      // Write to file system
      const cacheFile = path.join(this.options.cacheDir, `${key}.json`);
      fs.writeFileSync(cacheFile, JSON.stringify(entry), 'utf8');
      
      // Update stats
      this.stats.size += size;
      this.stats.entries++;

      // Check if we need to clean up
      this.maybePruneCache();
    } catch (error) {
      logger.error('Cache write error:', error);
    }
  }

  /**
   * Check if a key exists in the cache and is valid
   */
  public has(key: string): boolean {
    if (!this.options.enabled) {
      return false;
    }

    // Check memory cache
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      return this.isValid(entry);
    }

    // Check file system
    const cacheFile = path.join(this.options.cacheDir, `${key}.json`);
    return fs.existsSync(cacheFile);
  }

  /**
   * Delete a key from the cache
   */
  public delete(key: string): void {
    if (!this.options.enabled) {
      return;
    }

    // Remove from memory
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      this.stats.size -= entry.size;
      this.stats.entries--;
      this.memoryCache.delete(key);
    }

    // Remove from file system
    try {
      const cacheFile = path.join(this.options.cacheDir, `${key}.json`);
      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
      }
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  /**
   * Clear the entire cache
   */
  public clear(): void {
    if (!this.options.enabled) {
      return;
    }

    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear file system cache
    try {
      const files = fs.readdirSync(this.options.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.options.cacheDir, file));
        }
      }
      
      // Reset stats
      this.stats = { hits: 0, misses: 0, size: 0, entries: 0 };
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  /**
   * Invalidate cache entries based on a prefix or pattern
   */
  public invalidate(prefix: string): void {
    if (!this.options.enabled) {
      return;
    }

    // Invalidate memory cache
    for (const [cacheKey, entry] of this.memoryCache.entries()) {
      if (cacheKey.startsWith(prefix)) {
        this.stats.size -= entry.size;
        this.stats.entries--;
        this.memoryCache.delete(cacheKey);
      }
    }

    // Invalidate file system cache
    try {
      const files = fs.readdirSync(this.options.cacheDir);
      for (const file of files) {
        if (file.startsWith(prefix) && file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.options.cacheDir, file));
        }
      }
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValid(entry: CacheEntry<T>): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.options.ttl;
  }

  /**
   * Ensure the cache directory exists
   */
  private ensureCacheDirectory(): void {
    try {
      if (!fs.existsSync(this.options.cacheDir)) {
        fs.mkdirSync(this.options.cacheDir, { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Prune the cache if it exceeds the size limit
   */
  private maybePruneCache(): void {
    if (this.stats.size <= this.options.maxSize) {
      return;
    }

    try {
      const files = fs.readdirSync(this.options.cacheDir)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const filePath = path.join(this.options.cacheDir, file);
          const stats = fs.statSync(filePath);
          return {
            path: filePath,
            size: stats.size,
            mtime: stats.mtime.getTime(),
          };
        })
        .sort((a, b) => a.mtime - b.mtime); // Oldest first

      let removedSize = 0;
      for (const file of files) {
        fs.unlinkSync(file.path);
        removedSize += file.size;
        
        // Also remove from memory cache if present
        const key = path.basename(file.path, '.json');
        if (this.memoryCache.has(key)) {
          this.memoryCache.delete(key);
        }
        
        if (this.stats.size - removedSize <= this.options.maxSize * 0.8) {
          break; // Pruned enough
        }
      }
      
      // Update stats
      this.stats.size -= removedSize;
    } catch (error) {
      logger.error('Cache pruning error:', error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

