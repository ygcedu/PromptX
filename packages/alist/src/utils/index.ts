import * as path from 'path';
import * as mimeTypes from 'mime-types';

/**
 * 标准化路径，确保使用正斜杠
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
}

/**
 * 确保路径以斜杠开头
 */
export function ensureLeadingSlash(filePath: string): string {
  const normalized = normalizePath(filePath);
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

/**
 * 移除路径开头的斜杠
 */
export function removeLeadingSlash(filePath: string): string {
  const normalized = normalizePath(filePath);
  return normalized.startsWith('/') ? normalized.slice(1) : normalized;
}

/**
 * 确保路径以斜杠结尾（用于目录）
 */
export function ensureTrailingSlash(filePath: string): string {
  const normalized = normalizePath(filePath);
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

/**
 * 移除路径结尾的斜杠
 */
export function removeTrailingSlash(filePath: string): string {
  const normalized = normalizePath(filePath);
  return normalized.endsWith('/') && normalized.length > 1 
    ? normalized.slice(0, -1) 
    : normalized;
}

/**
 * 连接路径
 */
export function joinPath(...paths: string[]): string {
  return normalizePath(path.posix.join(...paths));
}

/**
 * 获取文件扩展名
 */
export function getExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * 获取文件的MIME类型
 */
export function getMimeType(filePath: string): string | undefined {
  return mimeTypes.lookup(filePath) || undefined;
}

/**
 * 获取文件名（不含扩展名）
 */
export function getBaseName(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

/**
 * 获取目录路径
 */
export function getDirName(filePath: string): string {
  return normalizePath(path.dirname(filePath));
}

/**
 * 检查路径是否为绝对路径
 */
export function isAbsolute(filePath: string): boolean {
  return path.isAbsolute(filePath);
}

/**
 * 将相对路径转换为绝对路径
 */
export function resolve(...paths: string[]): string {
  return normalizePath(path.resolve(...paths));
}

/**
 * 获取相对路径
 */
export function relative(from: string, to: string): string {
  return normalizePath(path.relative(from, to));
}

/**
 * 检查文件名是否匹配模式
 */
export function matchPattern(fileName: string, pattern: string): boolean {
  if (!pattern) return true;
  
  // 简单的通配符匹配
  const regex = new RegExp(
    '^' + pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.') + '$',
    'i'
  );
  
  return regex.test(fileName);
}

/**
 * 检查是否为隐藏文件
 */
export function isHidden(fileName: string): boolean {
  return fileName.startsWith('.');
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

/**
 * 验证路径安全性（防止路径遍历攻击）
 */
export function validatePath(filePath: string, rootPath?: string): boolean {
  const normalized = normalizePath(filePath);
  
  // 检查是否包含危险的路径组件
  if (normalized.includes('../') || normalized.includes('..\\')) {
    return false;
  }
  
  // 如果指定了根路径，检查是否在根路径内
  if (rootPath) {
    const normalizedRoot = normalizePath(rootPath);
    const absolutePath = isAbsolute(normalized) 
      ? normalized 
      : joinPath(normalizedRoot, normalized);
    
    return absolutePath.startsWith(normalizedRoot);
  }
  
  return true;
}

/**
 * 创建安全的文件路径
 */
export function createSafePath(basePath: string, relativePath: string): string {
  const normalized = removeLeadingSlash(normalizePath(relativePath));
  
  if (!validatePath(normalized)) {
    throw new Error(`Unsafe path: ${relativePath}`);
  }
  
  return joinPath(basePath, normalized);
}

/**
 * 延迟执行
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试执行函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries) {
        await delay(delayMs * Math.pow(2, i)); // 指数退避
      }
    }
  }
  
  throw lastError!;
}

/**
 * 带超时的Promise
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

/**
 * 计算字符串相似度（使用Levenshtein距离）
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  // 使用一维数组优化内存使用
  let prev = new Array(len2 + 1);
  let curr = new Array(len2 + 1);
  
  // 初始化第一行
  for (let j = 0; j <= len2; j++) {
    prev[j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    curr[0] = i;
    
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,        // 删除
        curr[j - 1] + 1,    // 插入
        prev[j - 1] + cost  // 替换
      );
    }
    
    // 交换数组
    [prev, curr] = [curr, prev];
  }
  
  const distance = prev[len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

/**
 * 转义正则表达式特殊字符
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 检查字符串是否匹配搜索查询
 */
export function matchesSearchQuery(
  text: string, 
  query: string, 
  options: {
    caseSensitive?: boolean;
    useRegex?: boolean;
    fuzzy?: boolean;
    fuzzyThreshold?: number;
  } = {}
): { matches: boolean; relevance: number; highlights?: string } {
  const {
    caseSensitive = false,
    useRegex = false,
    fuzzy = false,
    fuzzyThreshold = 0.6
  } = options;
  
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchQuery = caseSensitive ? query : query.toLowerCase();
  
  if (useRegex) {
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(query, flags);
      const matches = regex.test(searchText);
      
      if (matches) {
        // 生成高亮文本
        const highlighted = text.replace(regex, (match) => `<mark>${match}</mark>`);
        return { matches: true, relevance: 1, highlights: highlighted };
      }
      
      return { matches: false, relevance: 0 };
    } catch (error) {
      // 正则表达式错误，降级为普通匹配
      return matchesSearchQuery(text, query, { ...options, useRegex: false });
    }
  }
  
  if (fuzzy) {
    const similarity = calculateSimilarity(searchText, searchQuery);
    if (similarity >= fuzzyThreshold) {
      return { matches: true, relevance: similarity };
    }
    
    // 检查部分匹配
    const words = searchQuery.split(/\s+/);
    let totalRelevance = 0;
    let matchedWords = 0;
    
    for (const word of words) {
      if (searchText.includes(word)) {
        matchedWords++;
        totalRelevance += 1;
      } else {
        // 检查模糊匹配
        const wordSimilarity = calculateSimilarity(searchText, word);
        if (wordSimilarity >= fuzzyThreshold) {
          matchedWords++;
          totalRelevance += wordSimilarity;
        }
      }
    }
    
    if (matchedWords > 0) {
      const relevance = totalRelevance / words.length;
      return { matches: relevance >= fuzzyThreshold, relevance };
    }
    
    return { matches: false, relevance: 0 };
  }
  
  // 普通匹配
  if (searchText.includes(searchQuery)) {
    // 计算相关性：完全匹配 > 开头匹配 > 包含匹配
    let relevance = 0.5; // 基础包含匹配
    
    if (searchText === searchQuery) {
      relevance = 1.0; // 完全匹配
    } else if (searchText.startsWith(searchQuery)) {
      relevance = 0.8; // 开头匹配
    } else if (searchText.endsWith(searchQuery)) {
      relevance = 0.7; // 结尾匹配
    }
    
    // 生成高亮文本
    const regex = new RegExp(escapeRegExp(searchQuery), caseSensitive ? 'g' : 'gi');
    const highlighted = text.replace(regex, (match) => `<mark>${match}</mark>`);
    
    return { matches: true, relevance, highlights: highlighted };
  }
  
  return { matches: false, relevance: 0 };
}

/**
 * 检查文件是否匹配扩展名过滤器
 */
export function matchesExtensions(fileName: string, extensions: string[]): boolean {
  if (!extensions || extensions.length === 0) return true;
  
  const fileExt = getExtension(fileName).toLowerCase();
  return extensions.some(ext => {
    const normalizedExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
    return fileExt === normalizedExt;
  });
}

/**
 * 检查文件是否匹配MIME类型过滤器
 */
export function matchesMimeTypes(fileName: string, mimeTypes: string[]): boolean {
  if (!mimeTypes || mimeTypes.length === 0) return true;
  
  const fileMimeType = getMimeType(fileName);
  if (!fileMimeType) return false;
  
  return mimeTypes.some(mimeType => {
    // 支持通配符，如 'image/*'
    if (mimeType.endsWith('/*')) {
      const prefix = mimeType.slice(0, -2);
      return fileMimeType.startsWith(prefix);
    }
    return fileMimeType === mimeType;
  });
}

/**
 * 检查文件大小是否在指定范围内
 */
export function matchesSizeFilter(size: number, filter?: { min?: number; max?: number }): boolean {
  if (!filter) return true;
  
  if (filter.min !== undefined && size < filter.min) return false;
  if (filter.max !== undefined && size > filter.max) return false;
  
  return true;
}

/**
 * 检查文件修改时间是否在指定范围内
 */
export function matchesTimeFilter(modifiedTime: Date, filter?: { after?: Date; before?: Date }): boolean {
  if (!filter) return true;
  
  if (filter.after && modifiedTime < filter.after) return false;
  if (filter.before && modifiedTime > filter.before) return false;
  
  return true;
}