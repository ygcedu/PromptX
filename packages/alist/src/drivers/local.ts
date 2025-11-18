import fs from 'fs-extra';
import * as path from 'path';
import { 
  StorageDriver, 
  LocalDriverConfig, 
  FileInfo, 
  ListOptions, 
  ReadOptions, 
  WriteOptions, 
  CopyOptions, 
  MoveOptions,
  SearchOptions,
  SearchResult,
  FileNotFoundError,
  PermissionError,
  StorageError
} from '../types/index.js';
import { 
  normalizePath, 
  createSafePath, 
  getMimeType, 
  getExtension, 
  matchPattern, 
  isHidden,
  matchesSearchQuery,
  matchesExtensions,
  matchesMimeTypes,
  matchesSizeFilter,
  matchesTimeFilter
} from '../utils/index.js';

/**
 * 本地文件系统驱动器
 */
export class LocalDriver implements StorageDriver {
  public readonly name: string;
  public readonly type = 'local';
  public readonly connected = true;

  private readonly config: LocalDriverConfig;
  private readonly rootPath: string;

  constructor(config: LocalDriverConfig) {
    this.config = config;
    this.name = config.name || 'local';
    this.rootPath = path.resolve(config.rootPath);
  }

  async connect(): Promise<void> {
    // 检查根目录是否存在，不存在则创建
    try {
      await fs.ensureDir(this.rootPath);
    } catch (error) {
      throw new StorageError(
        `Failed to ensure root directory: ${this.rootPath}`,
        'ROOT_DIR_ERROR',
        this.name
      );
    }
  }

  async disconnect(): Promise<void> {
    // 本地文件系统不需要断开连接
  }

  /**
   * 获取绝对路径
   */
  private getAbsolutePath(relativePath: string): string {
    const safePath = createSafePath(this.rootPath, relativePath);
    
    // 如果不允许访问根目录外的文件，进行额外检查
    if (!this.config.allowOutsideRoot) {
      const resolved = path.resolve(safePath);
      if (!resolved.startsWith(this.rootPath)) {
        throw new PermissionError(relativePath, 'access', this.name);
      }
    }
    
    return safePath;
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const absolutePath = this.getAbsolutePath(filePath);
      return await fs.pathExists(absolutePath);
    } catch (error) {
      if (error instanceof PermissionError) {
        throw error;
      }
      return false;
    }
  }

  async stat(filePath: string): Promise<FileInfo> {
    try {
      const absolutePath = this.getAbsolutePath(filePath);
      const stats = await fs.stat(absolutePath);
      const fileName = path.basename(absolutePath);
      
      return {
        name: fileName,
        path: normalizePath(filePath),
        size: stats.size,
        isDirectory: stats.isDirectory(),
        modifiedTime: stats.mtime,
        createdTime: stats.birthtime,
        mimeType: stats.isFile() ? getMimeType(fileName) : undefined,
        extension: stats.isFile() ? getExtension(fileName) : undefined,
        permissions: stats.mode.toString(8),
        metadata: {
          uid: stats.uid,
          gid: stats.gid,
          dev: stats.dev,
          ino: stats.ino,
          nlink: stats.nlink
        }
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(filePath, this.name);
      }
      if (error.code === 'EACCES') {
        throw new PermissionError(filePath, 'stat', this.name);
      }
      throw new StorageError(
        `Failed to get file stats: ${error.message}`,
        'STAT_ERROR',
        this.name,
        filePath
      );
    }
  }

  async list(dirPath: string, options: ListOptions = {}): Promise<FileInfo[]> {
    try {
      const absolutePath = this.getAbsolutePath(dirPath);
      const entries = await fs.readdir(absolutePath);
      const results: FileInfo[] = [];

      for (const entry of entries) {
        const entryPath = path.join(absolutePath, entry);
        const relativePath = normalizePath(path.join(dirPath, entry));
        
        try {
          const stats = await fs.stat(entryPath);
          
          // 过滤隐藏文件
          if (!options.includeHidden && isHidden(entry)) {
            continue;
          }
          
          // 过滤模式匹配
          if (options.pattern && !matchPattern(entry, options.pattern)) {
            continue;
          }
          
          const fileInfo: FileInfo = {
            name: entry,
            path: relativePath,
            size: stats.size,
            isDirectory: stats.isDirectory(),
            modifiedTime: stats.mtime,
            createdTime: stats.birthtime,
            mimeType: stats.isFile() ? getMimeType(entry) : undefined,
            extension: stats.isFile() ? getExtension(entry) : undefined,
            permissions: stats.mode.toString(8)
          };
          
          results.push(fileInfo);
          
          // 递归处理子目录
          if (options.recursive && stats.isDirectory()) {
            const subResults = await this.list(relativePath, options);
            results.push(...subResults);
          }
        } catch (error) {
          // 跳过无法访问的文件
          continue;
        }
      }

      // 排序
      if (options.sortBy) {
        results.sort((a, b) => {
          let comparison = 0;
          
          switch (options.sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'size':
              comparison = a.size - b.size;
              break;
            case 'modifiedTime':
              comparison = a.modifiedTime.getTime() - b.modifiedTime.getTime();
              break;
          }
          
          return options.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // 分页
      if (options.offset !== undefined || options.limit !== undefined) {
        const start = options.offset || 0;
        const end = options.limit ? start + options.limit : undefined;
        return results.slice(start, end);
      }

      return results;
    } catch (error: any) {
      if (error instanceof StorageError) {
        throw error;
      }
      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(dirPath, this.name);
      }
      if (error.code === 'EACCES') {
        throw new PermissionError(dirPath, 'list', this.name);
      }
      throw new StorageError(
        `Failed to list directory: ${error.message}`,
        'LIST_ERROR',
        this.name,
        dirPath
      );
    }
  }

  async read(filePath: string, options: ReadOptions = {}): Promise<Buffer> {
    try {
      const absolutePath = this.getAbsolutePath(filePath);
      
      if (options.start !== undefined || options.end !== undefined) {
        // 部分读取
        const fd = await fs.open(absolutePath, 'r');
        try {
          const stats = await fs.fstat(fd);
          const start = options.start || 0;
          const end = options.end || stats.size;
          const length = end - start;
          
          const buffer = Buffer.alloc(length);
          await fs.read(fd, buffer, 0, length, start);
          return buffer;
        } finally {
          await fs.close(fd);
        }
      } else {
        // 完整读取
        return await fs.readFile(absolutePath);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(filePath, this.name);
      }
      if (error.code === 'EACCES') {
        throw new PermissionError(filePath, 'read', this.name);
      }
      throw new StorageError(
        `Failed to read file: ${error.message}`,
        'READ_ERROR',
        this.name,
        filePath
      );
    }
  }

  async readText(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    const buffer = await this.read(filePath);
    return buffer.toString(encoding);
  }

  async write(filePath: string, content: Buffer | string, options: WriteOptions = {}): Promise<void> {
    try {
      const absolutePath = this.getAbsolutePath(filePath);
      
      // 检查是否覆盖
      if (!options.overwrite && await fs.pathExists(absolutePath)) {
        throw new StorageError(
          `File already exists: ${filePath}`,
          'FILE_EXISTS',
          this.name,
          filePath
        );
      }
      
      // 创建父目录
      if (options.createParents) {
        await fs.ensureDir(path.dirname(absolutePath));
      }
      
      // 写入文件
      const writeOptions: any = {};
      if (options.encoding) {
        writeOptions.encoding = options.encoding;
      }
      if (options.mode) {
        writeOptions.mode = options.mode;
      }
      
      await fs.writeFile(absolutePath, content, writeOptions);
    } catch (error: any) {
      if (error instanceof StorageError) {
        throw error;
      }
      if (error.code === 'EACCES') {
        throw new PermissionError(filePath, 'write', this.name);
      }
      throw new StorageError(
        `Failed to write file: ${error.message}`,
        'WRITE_ERROR',
        this.name,
        filePath
      );
    }
  }

  async mkdir(dirPath: string, recursive: boolean = false): Promise<void> {
    try {
      const absolutePath = this.getAbsolutePath(dirPath);
      
      if (recursive) {
        await fs.ensureDir(absolutePath);
      } else {
        await fs.mkdir(absolutePath);
      }
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        // 目录已存在，不抛出错误
        return;
      }
      if (error.code === 'EACCES') {
        throw new PermissionError(dirPath, 'mkdir', this.name);
      }
      throw new StorageError(
        `Failed to create directory: ${error.message}`,
        'MKDIR_ERROR',
        this.name,
        dirPath
      );
    }
  }

  async remove(filePath: string, recursive: boolean = false): Promise<void> {
    try {
      const absolutePath = this.getAbsolutePath(filePath);
      
      if (recursive) {
        await fs.remove(absolutePath);
      } else {
        const stats = await fs.stat(absolutePath);
        if (stats.isDirectory()) {
          await fs.rmdir(absolutePath);
        } else {
          await fs.unlink(absolutePath);
        }
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(filePath, this.name);
      }
      if (error.code === 'EACCES') {
        throw new PermissionError(filePath, 'remove', this.name);
      }
      throw new StorageError(
        `Failed to remove: ${error.message}`,
        'REMOVE_ERROR',
        this.name,
        filePath
      );
    }
  }

  async copy(sourcePath: string, targetPath: string, options: CopyOptions = {}): Promise<void> {
    try {
      const sourceAbsolute = this.getAbsolutePath(sourcePath);
      const targetAbsolute = this.getAbsolutePath(targetPath);
      
      const copyOptions: any = {};
      if (options.overwrite !== undefined) {
        copyOptions.overwrite = options.overwrite;
      }
      if (options.preserveTimestamps !== undefined) {
        copyOptions.preserveTimestamps = options.preserveTimestamps;
      }
      
      await fs.copy(sourceAbsolute, targetAbsolute, copyOptions);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(sourcePath, this.name);
      }
      if (error.code === 'EACCES') {
        throw new PermissionError(sourcePath, 'copy', this.name);
      }
      throw new StorageError(
        `Failed to copy: ${error.message}`,
        'COPY_ERROR',
        this.name,
        sourcePath
      );
    }
  }

  async move(sourcePath: string, targetPath: string, options: MoveOptions = {}): Promise<void> {
    try {
      const sourceAbsolute = this.getAbsolutePath(sourcePath);
      const targetAbsolute = this.getAbsolutePath(targetPath);
      
      // 检查是否覆盖
      if (!options.overwrite && await fs.pathExists(targetAbsolute)) {
        throw new StorageError(
          `Target file already exists: ${targetPath}`,
          'FILE_EXISTS',
          this.name,
          targetPath
        );
      }
      
      await fs.move(sourceAbsolute, targetAbsolute, { overwrite: options.overwrite });
    } catch (error: any) {
      if (error instanceof StorageError) {
        throw error;
      }
      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(sourcePath, this.name);
      }
      if (error.code === 'EACCES') {
        throw new PermissionError(sourcePath, 'move', this.name);
      }
      throw new StorageError(
        `Failed to move: ${error.message}`,
        'MOVE_ERROR',
        this.name,
        sourcePath
      );
    }
  }

  async search(basePath: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      const absoluteBasePath = this.getAbsolutePath(basePath);
      const results: SearchResult[] = [];
      
      await this.searchRecursive(
        absoluteBasePath,
        basePath,
        options,
        results,
        0
      );
      
      // 排序结果
      results.sort((a, b) => {
        if (options.sortBy === 'relevance') {
          return options.sortOrder === 'desc' 
            ? b.relevance - a.relevance 
            : a.relevance - b.relevance;
        }
        
        let comparison = 0;
        switch (options.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'size':
            comparison = a.size - b.size;
            break;
          case 'modifiedTime':
            comparison = a.modifiedTime.getTime() - b.modifiedTime.getTime();
            break;
          default:
            comparison = b.relevance - a.relevance; // 默认按相关性排序
        }
        
        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
      
      // 分页
      if (options.offset !== undefined || options.limit !== undefined) {
        const start = options.offset || 0;
        const end = options.limit ? start + options.limit : undefined;
        return results.slice(start, end);
      }
      
      return results;
    } catch (error: any) {
      if (error instanceof StorageError) {
        throw error;
      }
      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(basePath, this.name);
      }
      if (error.code === 'EACCES') {
        throw new PermissionError(basePath, 'search', this.name);
      }
      throw new StorageError(
        `Failed to search: ${error.message}`,
        'SEARCH_ERROR',
        this.name,
        basePath
      );
    }
  }
  
  private async searchRecursive(
    absolutePath: string,
    relativePath: string,
    options: SearchOptions,
    results: SearchResult[],
    currentDepth: number
  ): Promise<void> {
    // 检查深度限制
    if (options.maxDepth !== undefined && currentDepth > options.maxDepth) {
      return;
    }
    
    try {
      const entries = await fs.readdir(absolutePath);
      
      for (const entry of entries) {
        const entryAbsolutePath = path.join(absolutePath, entry);
        const entryRelativePath = normalizePath(path.join(relativePath, entry));
        
        try {
          const stats = await fs.stat(entryAbsolutePath);
          
          // 过滤隐藏文件
          if (!options.includeHidden && isHidden(entry)) {
            continue;
          }
          
          // 过滤文件类型
          if (options.type === 'file' && stats.isDirectory()) {
            continue;
          }
          if (options.type === 'directory' && !stats.isDirectory()) {
            continue;
          }
          
          // 过滤文件大小
          if (!matchesSizeFilter(stats.size, options.sizeFilter)) {
            continue;
          }
          
          // 过滤修改时间
          if (!matchesTimeFilter(stats.mtime, options.modifiedTimeFilter)) {
            continue;
          }
          
          // 过滤扩展名（仅对文件）
          if (!stats.isDirectory() && options.extensions && options.extensions.length > 0) {
            if (!matchesExtensions(entry, options.extensions)) {
              continue;
            }
          }
          
          // 过滤MIME类型（仅对文件）
          if (!stats.isDirectory() && options.mimeTypes && options.mimeTypes.length > 0) {
            if (!matchesMimeTypes(entry, options.mimeTypes)) {
              continue;
            }
          }
          
          // 如果查询为空，则匹配所有文件（仅依赖过滤条件）
          let nameMatch: { matches: boolean; relevance: number; highlights?: string } = { matches: false, relevance: 0 };
          let pathMatch: { matches: boolean; relevance: number; highlights?: string } = { matches: false, relevance: 0 };
          
          if (options.query.trim() === '') {
            // 空查询，匹配所有文件
            nameMatch = { matches: true, relevance: 0.5, highlights: undefined };
          } else {
            // 检查文件名匹配
            nameMatch = matchesSearchQuery(entry, options.query, {
              caseSensitive: options.caseSensitive,
              useRegex: options.useRegex,
              fuzzy: true,
              fuzzyThreshold: 0.3
            });
            
            // 检查路径匹配
            pathMatch = matchesSearchQuery(entryRelativePath, options.query, {
              caseSensitive: options.caseSensitive,
              useRegex: options.useRegex,
              fuzzy: true,
              fuzzyThreshold: 0.3
            });
          }
          
          // 如果文件名或路径匹配，添加到结果中
          if (nameMatch.matches || pathMatch.matches) {
            const relevance = Math.max(nameMatch.relevance, pathMatch.relevance);
            
            const searchResult: SearchResult = {
              name: entry,
              path: entryRelativePath,
              size: stats.size,
              isDirectory: stats.isDirectory(),
              modifiedTime: stats.mtime,
              createdTime: stats.birthtime,
              mimeType: stats.isFile() ? getMimeType(entry) : undefined,
              extension: stats.isFile() ? getExtension(entry) : undefined,
              permissions: stats.mode.toString(8),
              metadata: {
                uid: stats.uid,
                gid: stats.gid,
                dev: stats.dev,
                ino: stats.ino,
                nlink: stats.nlink
              },
              relevance,
              matchedParts: {
                name: nameMatch.matches,
                path: pathMatch.matches
              },
              highlights: {
                name: nameMatch.highlights,
                path: pathMatch.highlights
              }
            };
            
            results.push(searchResult);
          }
          
          // 递归搜索子目录
          if (options.recursive && stats.isDirectory()) {
            await this.searchRecursive(
              entryAbsolutePath,
              entryRelativePath,
              options,
              results,
              currentDepth + 1
            );
          }
        } catch (error) {
          // 跳过无法访问的文件
          continue;
        }
      }
    } catch (error) {
      // 跳过无法访问的目录
      return;
    }
  }
}