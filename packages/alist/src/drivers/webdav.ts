import { createClient, WebDAVClient, FileStat } from 'webdav';
import { 
  StorageDriver, 
  WebDAVDriverConfig, 
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
  StorageError,
  ConnectionError
} from '../types/index.js';
import { 
  normalizePath, 
  joinPath, 
  getMimeType, 
  getExtension, 
  matchPattern, 
  isHidden,
  ensureLeadingSlash,
  removeTrailingSlash,
  matchesSearchQuery,
  matchesExtensions,
  matchesMimeTypes,
  matchesSizeFilter,
  matchesTimeFilter
} from '../utils/index.js';

/**
 * WebDAV驱动器
 */
export class WebDAVDriver implements StorageDriver {
  public readonly name: string;
  public readonly type = 'webdav';
  
  private readonly config: WebDAVDriverConfig;
  private client: WebDAVClient | null = null;
  private _connected = false;

  constructor(config: WebDAVDriverConfig) {
    this.config = config;
    this.name = config.name || 'webdav';
  }

  get connected(): boolean {
    return this._connected;
  }

  async connect(): Promise<void> {
    try {
      const clientOptions: any = {
        username: this.config.username,
        password: this.config.password,
        headers: this.config.headers || {}
      };

      if (this.config.token) {
        clientOptions.headers.Authorization = `Bearer ${this.config.token}`;
      }

      this.client = createClient(this.config.url, clientOptions);
      
      // 测试连接
      await this.client.getDirectoryContents('/');
      this._connected = true;
    } catch (error: any) {
      this._connected = false;
      throw new ConnectionError(
        `Failed to connect to WebDAV server: ${error.message}`,
        this.name
      );
    }
  }

  async disconnect(): Promise<void> {
    this.client = null;
    this._connected = false;
  }

  /**
   * 确保客户端已连接
   */
  private ensureConnected(): WebDAVClient {
    if (!this.client || !this._connected) {
      throw new ConnectionError('WebDAV client not connected', this.name);
    }
    return this.client;
  }

  /**
   * 获取完整路径
   */
  private getFullPath(relativePath: string): string {
    const rootPath = this.config.rootPath || '/';
    const normalizedRoot = removeTrailingSlash(ensureLeadingSlash(rootPath));
    const normalizedPath = ensureLeadingSlash(normalizePath(relativePath));
    
    if (normalizedRoot === '/') {
      return normalizedPath;
    }
    
    return joinPath(normalizedRoot, normalizedPath);
  }

  /**
   * 转换WebDAV文件状态为FileInfo
   */
  private convertToFileInfo(stat: FileStat, relativePath: string): FileInfo {
    const fileName = stat.basename;
    
    return {
      name: fileName,
      path: normalizePath(relativePath),
      size: stat.size || 0,
      isDirectory: stat.type === 'directory',
      modifiedTime: new Date(stat.lastmod),
      mimeType: stat.type === 'file' ? (stat.mime || getMimeType(fileName)) : undefined,
      extension: stat.type === 'file' ? getExtension(fileName) : undefined,
      metadata: {
        etag: stat.etag,
        mime: stat.mime
      }
    };
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const client = this.ensureConnected();
      const fullPath = this.getFullPath(filePath);
      
      return await client.exists(fullPath);
    } catch (error: any) {
      if (error instanceof ConnectionError) {
        throw error;
      }
      return false;
    }
  }

  async stat(filePath: string): Promise<FileInfo> {
    try {
      const client = this.ensureConnected();
      const fullPath = this.getFullPath(filePath);
      
      const stat = await client.stat(fullPath) as FileStat;
      return this.convertToFileInfo(stat, filePath);
    } catch (error: any) {
      if (error instanceof ConnectionError) {
        throw error;
      }
      if (error.status === 404) {
        throw new FileNotFoundError(filePath, this.name);
      }
      if (error.status === 403) {
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
      const client = this.ensureConnected();
      const fullPath = this.getFullPath(dirPath);
      
      const contents = await client.getDirectoryContents(fullPath, {
        deep: options.recursive || false
      }) as FileStat[];
      
      const results: FileInfo[] = [];
      
      for (const item of contents) {
        const itemName = item.basename;
        
        // 过滤隐藏文件
        if (!options.includeHidden && isHidden(itemName)) {
          continue;
        }
        
        // 过滤模式匹配
        if (options.pattern && !matchPattern(itemName, options.pattern)) {
          continue;
        }
        
        // 计算相对路径
        const itemFullPath = item.filename;
        const rootPath = this.config.rootPath || '/';
        const normalizedRoot = removeTrailingSlash(ensureLeadingSlash(rootPath));
        
        let relativePath: string;
        if (normalizedRoot === '/') {
          relativePath = itemFullPath;
        } else {
          relativePath = itemFullPath.startsWith(normalizedRoot) 
            ? itemFullPath.slice(normalizedRoot.length)
            : itemFullPath;
        }
        
        relativePath = ensureLeadingSlash(relativePath);
        
        const fileInfo = this.convertToFileInfo(item, relativePath);
        results.push(fileInfo);
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
      if (error.status === 404) {
        throw new FileNotFoundError(dirPath, this.name);
      }
      if (error.status === 403) {
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
      const client = this.ensureConnected();
      const fullPath = this.getFullPath(filePath);
      
      let readOptions: any = {};
      
      if (options.start !== undefined || options.end !== undefined) {
        // 部分读取
        const start = options.start || 0;
        let rangeHeader = `bytes=${start}-`;
        
        if (options.end !== undefined) {
          rangeHeader += options.end;
        }
        
        readOptions.headers = {
          Range: rangeHeader
        };
      }
      
      const content = await client.getFileContents(fullPath, readOptions);
      
      if (content instanceof Buffer) {
        return content;
      } else if (typeof content === 'string') {
        return Buffer.from(content, options.encoding || 'utf8');
      } else {
        // ArrayBuffer
        return Buffer.from(content as ArrayBuffer);
      }
    } catch (error: any) {
      if (error instanceof ConnectionError) {
        throw error;
      }
      if (error.status === 404) {
        throw new FileNotFoundError(filePath, this.name);
      }
      if (error.status === 403) {
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
    const buffer = await this.read(filePath, { encoding });
    return buffer.toString(encoding);
  }

  async write(filePath: string, content: Buffer | string, options: WriteOptions = {}): Promise<void> {
    try {
      const client = this.ensureConnected();
      const fullPath = this.getFullPath(filePath);
      
      // 检查是否覆盖
      if (!options.overwrite && await this.exists(filePath)) {
        throw new StorageError(
          `File already exists: ${filePath}`,
          'FILE_EXISTS',
          this.name,
          filePath
        );
      }
      
      // 创建父目录
      if (options.createParents) {
        const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
        if (dirPath && dirPath !== '/') {
          await this.mkdir(dirPath.replace(this.config.rootPath || '', ''), true);
        }
      }
      
      const writeOptions: any = {};
      if (options.overwrite !== undefined) {
        writeOptions.overwrite = options.overwrite;
      }
      
      await client.putFileContents(fullPath, content, writeOptions);
    } catch (error: any) {
      if (error instanceof StorageError) {
        throw error;
      }
      if (error.status === 403) {
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
      const client = this.ensureConnected();
      const fullPath = this.getFullPath(dirPath);
      
      await client.createDirectory(fullPath, { recursive });
    } catch (error: any) {
      if (error instanceof ConnectionError) {
        throw error;
      }
      if (error.status === 405 || error.message?.includes('exists')) {
        // 目录已存在，不抛出错误
        return;
      }
      if (error.status === 403) {
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

  async remove(filePath: string, _recursive: boolean = false): Promise<void> {
    try {
      const client = this.ensureConnected();
      const fullPath = this.getFullPath(filePath);
      
      await client.deleteFile(fullPath);
    } catch (error: any) {
      if (error instanceof ConnectionError) {
        throw error;
      }
      if (error.status === 404) {
        throw new FileNotFoundError(filePath, this.name);
      }
      if (error.status === 403) {
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
      const client = this.ensureConnected();
      const sourceFullPath = this.getFullPath(sourcePath);
      const targetFullPath = this.getFullPath(targetPath);
      
      // 检查是否覆盖
      if (!options.overwrite && await this.exists(targetPath)) {
        throw new StorageError(
          `Target file already exists: ${targetPath}`,
          'FILE_EXISTS',
          this.name,
          targetPath
        );
      }
      
      await client.copyFile(sourceFullPath, targetFullPath, {
        overwrite: options.overwrite
      });
    } catch (error: any) {
      if (error instanceof StorageError) {
        throw error;
      }
      if (error.status === 404) {
        throw new FileNotFoundError(sourcePath, this.name);
      }
      if (error.status === 403) {
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
      const client = this.ensureConnected();
      const sourceFullPath = this.getFullPath(sourcePath);
      const targetFullPath = this.getFullPath(targetPath);
      
      // 检查是否覆盖
      if (!options.overwrite && await this.exists(targetPath)) {
        throw new StorageError(
          `Target file already exists: ${targetPath}`,
          'FILE_EXISTS',
          this.name,
          targetPath
        );
      }
      
      await client.moveFile(sourceFullPath, targetFullPath, {
        overwrite: options.overwrite
      });
    } catch (error: any) {
      if (error instanceof StorageError) {
        throw error;
      }
      if (error.status === 404) {
        throw new FileNotFoundError(sourcePath, this.name);
      }
      if (error.status === 403) {
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

  async getDownloadUrl(filePath: string, _expiresIn: number = 3600): Promise<string> {
    // WebDAV通常不支持预签名URL，返回直接访问URL
    const fullPath = this.getFullPath(filePath);
    return `${this.config.url}${fullPath}`;
  }

  async search(basePath: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      const client = this.ensureConnected();
      const fullPath = this.getFullPath(basePath);
      
      // WebDAV搜索通过递归列出所有文件然后过滤
      const allFiles = await client.getDirectoryContents(fullPath, {
        deep: options.recursive !== false // 默认递归搜索
      }) as FileStat[];
      
      const results: SearchResult[] = [];
      const rootPath = this.config.rootPath || '/';
      const normalizedRoot = removeTrailingSlash(ensureLeadingSlash(rootPath));
      
      for (const item of allFiles) {
        const itemName = item.basename;
        
        // 过滤隐藏文件
        if (!options.includeHidden && isHidden(itemName)) {
          continue;
        }
        
        // 过滤文件类型
        if (options.type === 'file' && item.type === 'directory') {
          continue;
        }
        if (options.type === 'directory' && item.type === 'file') {
          continue;
        }
        
        // 过滤文件大小
        if (!matchesSizeFilter(item.size || 0, options.sizeFilter)) {
          continue;
        }
        
        // 过滤修改时间
        const modifiedTime = new Date(item.lastmod);
        if (!matchesTimeFilter(modifiedTime, options.modifiedTimeFilter)) {
          continue;
        }
        
        // 过滤扩展名（仅对文件）
        if (item.type === 'file' && options.extensions && options.extensions.length > 0) {
          if (!matchesExtensions(itemName, options.extensions)) {
            continue;
          }
        }
        
        // 过滤MIME类型（仅对文件）
        if (item.type === 'file' && options.mimeTypes && options.mimeTypes.length > 0) {
          if (!matchesMimeTypes(itemName, options.mimeTypes)) {
            continue;
          }
        }
        
        // 计算相对路径
        const itemFullPath = item.filename;
        let relativePath: string;
        if (normalizedRoot === '/') {
          relativePath = itemFullPath;
        } else {
          relativePath = itemFullPath.startsWith(normalizedRoot) 
            ? itemFullPath.slice(normalizedRoot.length)
            : itemFullPath;
        }
        relativePath = ensureLeadingSlash(relativePath);
        
        // 如果查询为空，则匹配所有文件（仅依赖过滤条件）
        let nameMatch: { matches: boolean; relevance: number; highlights?: string } = { matches: false, relevance: 0 };
        let pathMatch: { matches: boolean; relevance: number; highlights?: string } = { matches: false, relevance: 0 };
        
        if (options.query.trim() === '') {
          // 空查询，匹配所有文件
          nameMatch = { matches: true, relevance: 0.5, highlights: undefined };
        } else {
          // 检查文件名匹配
          nameMatch = matchesSearchQuery(itemName, options.query, {
            caseSensitive: options.caseSensitive,
            useRegex: options.useRegex,
            fuzzy: true,
            fuzzyThreshold: 0.3
          });
          
          // 检查路径匹配
          pathMatch = matchesSearchQuery(relativePath, options.query, {
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
            name: itemName,
            path: normalizePath(relativePath),
            size: item.size || 0,
            isDirectory: item.type === 'directory',
            modifiedTime,
            mimeType: item.type === 'file' ? (item.mime || getMimeType(itemName)) : undefined,
            extension: item.type === 'file' ? getExtension(itemName) : undefined,
            metadata: {
              etag: item.etag,
              mime: item.mime
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
      }
      
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
      if (error.status === 404) {
        throw new FileNotFoundError(basePath, this.name);
      }
      if (error.status === 403) {
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
}