/**
 * @promptx/alist - Unified file storage API with multiple driver support
 * 
 * Inspired by Alist, this package provides a unified interface for file operations
 * across different storage systems including local filesystem and WebDAV.
 */

// 导出核心类
export { StorageManager } from './storage-manager.js';

// 导出驱动器
export { LocalDriver, WebDAVDriver } from './drivers/index.js';

// 导出类型
export type {
  StorageDriver,
  FileInfo,
  ListOptions,
  ReadOptions,
  WriteOptions,
  CopyOptions,
  MoveOptions,
  SearchOptions,
  SearchResult,
  DriverConfig,
  LocalDriverConfig,
  WebDAVDriverConfig,
  AnyDriverConfig,
  StorageManagerOptions
} from './types/index.js';

// 导入类型用于函数参数
import type { StorageManagerOptions, LocalDriverConfig, WebDAVDriverConfig } from './types/index.js';
import { StorageManager } from './storage-manager.js';
import { LocalDriver, WebDAVDriver } from './drivers/index.js';

// 导出错误类
export {
  StorageError,
  FileNotFoundError,
  PermissionError,
  ConnectionError
} from './types/index.js';

// 导出工具函数
export {
  normalizePath,
  ensureLeadingSlash,
  removeLeadingSlash,
  ensureTrailingSlash,
  removeTrailingSlash,
  joinPath,
  getExtension,
  getMimeType,
  getBaseName,
  getDirName,
  isAbsolute,
  resolve,
  relative,
  matchPattern,
  isHidden,
  formatFileSize,
  validatePath,
  createSafePath,
  calculateSimilarity,
  matchesSearchQuery,
  matchesExtensions,
  matchesMimeTypes,
  matchesSizeFilter,
  matchesTimeFilter
} from './utils/index.js';

/**
 * 创建存储管理器的便捷函数
 */
export function createStorageManager(options?: StorageManagerOptions): StorageManager {
  return new StorageManager(options);
}

/**
 * 创建本地驱动器的便捷函数
 */
export function createLocalDriver(config: Omit<LocalDriverConfig, 'type'>): LocalDriver {
  return new LocalDriver({ ...config, type: 'local' });
}

/**
 * 创建WebDAV驱动器的便捷函数
 */
export function createWebDAVDriver(config: Omit<WebDAVDriverConfig, 'type'>): WebDAVDriver {
  return new WebDAVDriver({ ...config, type: 'webdav' });
}