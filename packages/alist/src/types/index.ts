/**
 * 文件信息接口
 */
export interface FileInfo {
  /** 文件名 */
  name: string;
  /** 文件路径 */
  path: string;
  /** 文件大小（字节） */
  size: number;
  /** 是否为目录 */
  isDirectory: boolean;
  /** 修改时间 */
  modifiedTime: Date;
  /** 创建时间（可选） */
  createdTime?: Date;
  /** MIME类型（可选） */
  mimeType?: string;
  /** 文件扩展名（可选） */
  extension?: string;
  /** 文件权限（可选） */
  permissions?: string;
  /** 额外的元数据 */
  metadata?: Record<string, any>;
}

/**
 * 文件列表选项
 */
export interface ListOptions {
  /** 是否递归列出子目录 */
  recursive?: boolean;
  /** 文件名过滤模式 */
  pattern?: string;
  /** 是否包含隐藏文件 */
  includeHidden?: boolean;
  /** 排序方式 */
  sortBy?: 'name' | 'size' | 'modifiedTime';
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc';
  /** 分页偏移量 */
  offset?: number;
  /** 分页大小 */
  limit?: number;
}

/**
 * 文件读取选项
 */
export interface ReadOptions {
  /** 编码格式（文本文件） */
  encoding?: BufferEncoding;
  /** 读取起始位置 */
  start?: number;
  /** 读取结束位置 */
  end?: number;
}

/**
 * 文件写入选项
 */
export interface WriteOptions {
  /** 编码格式（文本文件） */
  encoding?: BufferEncoding;
  /** 是否覆盖现有文件 */
  overwrite?: boolean;
  /** 文件权限 */
  mode?: string | number;
  /** 是否创建父目录 */
  createParents?: boolean;
}

/**
 * 文件复制选项
 */
export interface CopyOptions {
  /** 是否覆盖现有文件 */
  overwrite?: boolean;
  /** 是否保留时间戳 */
  preserveTimestamps?: boolean;
  /** 是否递归复制目录 */
  recursive?: boolean;
}

/**
 * 文件移动选项
 */
export interface MoveOptions {
  /** 是否覆盖现有文件 */
  overwrite?: boolean;
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 搜索查询字符串 */
  query: string;
  /** 搜索类型 */
  type?: 'all' | 'file' | 'directory';
  /** 是否区分大小写 */
  caseSensitive?: boolean;
  /** 是否使用正则表达式 */
  useRegex?: boolean;
  /** 是否递归搜索子目录 */
  recursive?: boolean;
  /** 搜索深度限制（递归时有效） */
  maxDepth?: number;
  /** 是否包含隐藏文件 */
  includeHidden?: boolean;
  /** 文件大小过滤 */
  sizeFilter?: {
    min?: number;
    max?: number;
  };
  /** 修改时间过滤 */
  modifiedTimeFilter?: {
    after?: Date;
    before?: Date;
  };
  /** 文件扩展名过滤 */
  extensions?: string[];
  /** MIME类型过滤 */
  mimeTypes?: string[];
  /** 排序方式 */
  sortBy?: 'name' | 'size' | 'modifiedTime' | 'relevance';
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc';
  /** 分页偏移量 */
  offset?: number;
  /** 分页大小 */
  limit?: number;
}

/**
 * 搜索结果
 */
export interface SearchResult extends FileInfo {
  /** 匹配的相关性评分（0-1） */
  relevance: number;
  /** 匹配的部分（文件名、路径等） */
  matchedParts: {
    /** 文件名是否匹配 */
    name: boolean;
    /** 路径是否匹配 */
    path: boolean;
    /** 内容是否匹配（如果支持内容搜索） */
    content?: boolean;
  };
  /** 匹配的高亮信息 */
  highlights?: {
    /** 高亮的文件名 */
    name?: string;
    /** 高亮的路径 */
    path?: string;
    /** 高亮的内容片段 */
    contentSnippets?: string[];
  };
}

/**
 * 驱动器配置基类
 */
export interface DriverConfig {
  /** 驱动器类型 */
  type: string;
  /** 驱动器名称 */
  name?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
}

/**
 * 本地文件系统驱动器配置
 */
export interface LocalDriverConfig extends DriverConfig {
  type: 'local';
  /** 根目录路径 */
  rootPath: string;
  /** 是否允许访问根目录外的文件 */
  allowOutsideRoot?: boolean;
}

/**
 * WebDAV驱动器配置
 */
export interface WebDAVDriverConfig extends DriverConfig {
  type: 'webdav';
  /** WebDAV服务器URL */
  url: string;
  /** 用户名 */
  username?: string;
  /** 密码 */
  password?: string;
  /** 认证令牌 */
  token?: string;
  /** 根路径 */
  rootPath?: string;
  /** 是否使用HTTPS */
  secure?: boolean;
  /** 自定义请求头 */
  headers?: Record<string, string>;
}

/**
 * 统一驱动器配置类型
 */
export type AnyDriverConfig = LocalDriverConfig | WebDAVDriverConfig;

/**
 * 存储驱动器接口
 */
export interface StorageDriver {
  /** 驱动器名称 */
  readonly name: string;
  /** 驱动器类型 */
  readonly type: string;
  /** 是否已连接 */
  readonly connected: boolean;

  /**
   * 连接到存储系统
   */
  connect(): Promise<void>;

  /**
   * 断开连接
   */
  disconnect(): Promise<void>;

  /**
   * 检查文件或目录是否存在
   */
  exists(path: string): Promise<boolean>;

  /**
   * 获取文件或目录信息
   */
  stat(path: string): Promise<FileInfo>;

  /**
   * 列出目录内容
   */
  list(path: string, options?: ListOptions): Promise<FileInfo[]>;

  /**
   * 读取文件内容
   */
  read(path: string, options?: ReadOptions): Promise<Buffer>;

  /**
   * 读取文本文件内容
   */
  readText(path: string, encoding?: BufferEncoding): Promise<string>;

  /**
   * 写入文件内容
   */
  write(path: string, content: Buffer | string, options?: WriteOptions): Promise<void>;

  /**
   * 创建目录
   */
  mkdir(path: string, recursive?: boolean): Promise<void>;

  /**
   * 删除文件或目录
   */
  remove(path: string, recursive?: boolean): Promise<void>;

  /**
   * 复制文件或目录
   */
  copy(sourcePath: string, targetPath: string, options?: CopyOptions): Promise<void>;

  /**
   * 移动文件或目录
   */
  move(sourcePath: string, targetPath: string, options?: MoveOptions): Promise<void>;

  /**
   * 获取文件下载URL（如果支持）
   */
  getDownloadUrl?(path: string, expiresIn?: number): Promise<string>;

  /**
   * 获取文件上传URL（如果支持）
   */
  getUploadUrl?(path: string, expiresIn?: number): Promise<string>;

  /**
   * 搜索文件和目录
   */
  search(basePath: string, options: SearchOptions): Promise<SearchResult[]>;
}

/**
 * 存储管理器选项
 */
export interface StorageManagerOptions {
  /** 默认驱动器名称 */
  defaultDriver?: string;
  /** 是否启用日志 */
  enableLogging?: boolean;
  /** 全局超时时间 */
  globalTimeout?: number;
}

/**
 * 错误类型
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly driver?: string,
    public readonly path?: string
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * 文件不存在错误
 */
export class FileNotFoundError extends StorageError {
  constructor(path: string, driver?: string) {
    super(`File not found: ${path}`, 'FILE_NOT_FOUND', driver, path);
    this.name = 'FileNotFoundError';
  }
}

/**
 * 权限错误
 */
export class PermissionError extends StorageError {
  constructor(path: string, operation: string, driver?: string) {
    super(`Permission denied for ${operation} on: ${path}`, 'PERMISSION_DENIED', driver, path);
    this.name = 'PermissionError';
  }
}

/**
 * 连接错误
 */
export class ConnectionError extends StorageError {
  constructor(message: string, driver?: string) {
    super(`Connection error: ${message}`, 'CONNECTION_ERROR', driver);
    this.name = 'ConnectionError';
  }
}