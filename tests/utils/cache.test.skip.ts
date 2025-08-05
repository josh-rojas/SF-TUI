import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { CacheService, CacheOptions } from '../../src/utils/cache';

// Mock fs
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn(),
    unlinkSync: vi.fn(),
    statSync: vi.fn(),
    rmSync: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CacheService', () => {
  let cacheService: CacheService;
  let tempDir: string;
  
  beforeEach(() => {
    // Create a temp directory for testing
    tempDir = path.join(os.tmpdir(), 'cache-test');
    
    // Reset mocks
    vi.resetAllMocks();
    
    // Mock fs.existsSync for the cache directory
    (fs.existsSync as any).mockImplementation((path: string) => {
      return path === tempDir;
    });
    
    // Setup cache service with test options
    const options: CacheOptions = {
      ttl: 1000, // 1 second
      maxSize: 1024 * 1024, // 1MB
      enabled: true,
      cacheDir: tempDir,
    };
    
    cacheService = new CacheService(options);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('generateKey', () => {
    it('should generate a consistent key for the same command and args', () => {
      const key1 = cacheService.generateKey('test', ['arg1', 'arg2']);
      const key2 = cacheService.generateKey('test', ['arg1', 'arg2']);
      
      expect(key1).toBe(key2);
    });
    
    it('should generate different keys for different commands', () => {
      const key1 = cacheService.generateKey('test1', ['arg1', 'arg2']);
      const key2 = cacheService.generateKey('test2', ['arg1', 'arg2']);
      
      expect(key1).not.toBe(key2);
    });
    
    it('should generate different keys for different args', () => {
      const key1 = cacheService.generateKey('test', ['arg1', 'arg2']);
      const key2 = cacheService.generateKey('test', ['arg1', 'arg3']);
      
      expect(key1).not.toBe(key2);
    });
  });
  
  describe('get/set operations', () => {
    it('should set and get values from memory cache', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      cacheService.set(key, value);
      const result = cacheService.get(key);
      
      expect(result).toEqual(value);
    });
    
    it('should return null for missing keys', () => {
      const result = cacheService.get('non-existent-key');
      
      expect(result).toBeNull();
    });
    
    it('should check if a key exists', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      expect(cacheService.has(key)).toBe(false);
      
      cacheService.set(key, value);
      
      expect(cacheService.has(key)).toBe(true);
    });
    
    it('should delete keys', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      cacheService.set(key, value);
      expect(cacheService.has(key)).toBe(true);
      
      cacheService.delete(key);
      expect(cacheService.has(key)).toBe(false);
      expect(cacheService.get(key)).toBeNull();
    });
  });
  
  describe('file system cache', () => {
    it('should save to file system when setting a value', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      cacheService.set(key, value);
      
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    it('should read from file system when value not in memory', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      const entry = {
        key,
        value,
        timestamp: Date.now(),
        size: 100,
      };
      
      // Mock file exists
      (fs.existsSync as any).mockImplementation((path: string) => {
        return path === tempDir || path.includes(key);
      });
      
      // Mock file read
      (fs.readFileSync as any).mockReturnValue(JSON.stringify(entry));
      
      const result = cacheService.get(key);
      
      expect(result).toEqual(value);
      expect(fs.readFileSync).toHaveBeenCalled();
    });
  });
  
  describe('cache invalidation', () => {
    it('should respect TTL for cached items', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      // Set the value
      cacheService.set(key, value);
      
      // Verify it's there
      expect(cacheService.get(key)).toEqual(value);
      
      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));
      
      // Mock file exists for expired check
      (fs.existsSync as any).mockImplementation((path: string) => {
        return path === tempDir || path.includes(key);
      });
      
      // Mock file read for expired value
      (fs.readFileSync as any).mockReturnValue(JSON.stringify({
        key,
        value,
        timestamp: Date.now() - 2000, // Older than TTL
        size: 100,
      }));
      
      // Value should now be expired
      expect(cacheService.get(key)).toBeNull();
    });
    
    it('should clear the entire cache', () => {
      // Add some items
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      // Mock reading directory
      (fs.readdirSync as any).mockReturnValue(['key1.json', 'key2.json']);
      
      // Clear the cache
      cacheService.clear();
      
      // Check that items were deleted
      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBeNull();
      
      // Verify unlink was called for both files
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
    });
    
    it('should invalidate by prefix', () => {
      // Add some items
      cacheService.set('prefix-key1', 'value1');
      cacheService.set('prefix-key2', 'value2');
      cacheService.set('other-key', 'value3');
      
      // Mock reading directory
      (fs.readdirSync as any).mockReturnValue(['prefix-key1.json', 'prefix-key2.json', 'other-key.json']);
      
      // Invalidate by prefix
      cacheService.invalidate('prefix');
      
      // Check that items were deleted
      expect(cacheService.get('prefix-key1')).toBeNull();
      expect(cacheService.get('prefix-key2')).toBeNull();
      expect(cacheService.get('other-key')).not.toBeNull();
      
      // Verify unlink was called for matching files
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('cache stats', () => {
    it('should track cache hits and misses', () => {
      // Miss
      cacheService.get('non-existent');
      
      // Hit
      cacheService.set('existent', 'value');
      cacheService.get('existent');
      
      const stats = cacheService.getStats();
      
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });
  
  describe('cache size management', () => {
    it('should prune cache when it exceeds max size', () => {
      // Create a cache service with tiny max size
      const tinyCache = new CacheService({
        maxSize: 100, // 100 bytes
        ttl: 1000,
        enabled: true,
        cacheDir: tempDir,
      });
      
      // Mock file stats
      (fs.statSync as any).mockReturnValue({
        size: 50,
        mtime: new Date(),
      });
      
      // Mock directory read for pruning
      (fs.readdirSync as any).mockReturnValue(['file1.json', 'file2.json', 'file3.json']);
      
      // Add items that will exceed the max size
      const largeObject = { data: 'x'.repeat(80) };
      tinyCache.set('key1', largeObject);
      
      // Check that pruning occurred
      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });
  
  describe('cache configuration', () => {
    it('should disable cache when enabled is false', () => {
      const disabledCache = new CacheService({
        enabled: false,
      });
      
      disabledCache.set('key', 'value');
      const result = disabledCache.get('key');
      
      expect(result).toBeNull();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
    
    it('should use default options when not provided', () => {
      const defaultCache = new CacheService();
      
      // Default options should be used and the cache should work
      defaultCache.set('key', 'value');
      expect(defaultCache.get('key')).toBe('value');
    });
  });
});