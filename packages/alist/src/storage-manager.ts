import { 
  StorageDriver, 
  AnyDriverConfig, 
  LocalDriverConfig, 
  WebDAVDriverConfig,
  StorageManagerOptions,
  FileInfo,
  ListOptions,
  ReadOptions,
  WriteOptions,
  CopyOptions,
  MoveOptions,
  SearchOptions,
  SearchResult,
  StorageError
} from './types/index.js';
import { LocalDriver } from './drivers/local.js';
import { WebDAVDriver } from './drivers/webdav.js';
import { withTimeout, retry } from './utils/index.js';

/**
 * 存储管理器 - 统一的文件操作API
 */
export class StorageManager {
  private drivers = new Map<string, StorageDriver>();
  private options: StorageManagerOptions;

  constructor(options: StorageManagerOptions = {}) {
    this.options = {
      enableLogging: true,
      globalTimeout: 30000,
      ...options
    };
  }

  /**
   * 注册驱动器
   */
  async registerDriver(config: AnyDriverConfig): Promise<void> {
    const driver = this.createDriver(config);
    
    if (config.enabled !== false) {
      await this.connectDriver(driver, config);
    }
    
    this.drivers.set(driver.name, driver);
    
    if (this.options.enableLogging) {
      console.log(`Registered ${config.type} driver: ${driver.name}`);
    }
  }

  /**
   * 创建驱动器实例
   */
  private createDriver(config: AnyDriverConfig): StorageDriver {
    switch (config.type) {
      case 'local':
        return new LocalDriver(config as LocalDriverConfig);
      case 'webdav':
        return new WebDAVDriver(config as WebDAVDriverConfig);
      default:
        throw new StorageError(
          `Unsupported driver type: ${(config as any).type}`,
          'UNSUPPORTED_DRIVER'
        );
    }
  }

  /**
   * 连接驱动器
   */
  private async connectDriver(driver: StorageDriver, config: AnyDriverConfig): Promise<void> {
    const timeout = config.timeout || this.options.globalTimeout || 30000;
    const retries = config.retries || 3;
    
    await retry(
      () => withTimeout(driver.connect(), timeout),
      retries
    );
  }

  /**
   * 获取驱动器
   */
  getDriver(name?: string): StorageDriver {
    const driverName = name || this.options.defaultDriver;
    
    if (!driverName) {
      throw new StorageError(
        'No driver name specified and no default driver set',
        'NO_DRIVER'
      );
    }
    
    const driver = this.drivers.get(driverName);
    if (!driver) {
      throw new StorageError(
        `Driver not found: ${driverName}`,
        'DRIVER_NOT_FOUND'
      );
    }
    
    if (!driver.connected) {
      throw new StorageError(
        `Driver not connected: ${driverName}`,
        'DRIVER_NOT_CONNECTED'
      );
    }
    
    return driver;
  }

  /**
   * 列出所有驱动器
   */
  listDrivers(): Array<{ name: string; type: string; connected: boolean }> {
    return Array.from(this.drivers.values()).map(driver => ({
      name: driver.name,
      type: driver.type,
      connected: driver.connected
    }));
  }

  /**
   * 移除驱动器
   */
  async removeDriver(name: string): Promise<void> {
    const driver = this.drivers.get(name);
    if (driver) {
      await driver.disconnect();
      this.drivers.delete(name);
      
      if (this.options.enableLogging) {
        console.log(`Removed driver: ${name}`);
      }
    }
  }

  /**
   * 断开所有驱动器连接
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.drivers.values()).map(driver => 
      driver.disconnect().catch(error => {
        if (this.options.enableLogging) {
          console.error(`Failed to disconnect driver ${driver.name}:`, error);
        }
      })
    );
    
    await Promise.all(promises);
    this.drivers.clear();
  }

  // 以下是代理到驱动器的方法

  /**
   * 检查文件或目录是否存在
   */
  async exists(path: string, driverName?: string): Promise<boolean> {
    const driver = this.getDriver(driverName);
    return driver.exists(path);
  }

  /**
   * 获取文件或目录信息
   */
  async stat(path: string, driverName?: string): Promise<FileInfo> {
    const driver = this.getDriver(driverName);
    return driver.stat(path);
  }

  /**
   * 列出目录内容
   */
  async list(path: string, options?: ListOptions, driverName?: string): Promise<FileInfo[]> {
    const driver = this.getDriver(driverName);
    return driver.list(path, options);
  }

  /**
   * 读取文件内容
   */
  async read(path: string, options?: ReadOptions, driverName?: string): Promise<Buffer> {
    const driver = this.getDriver(driverName);
    return driver.read(path, options);
  }

  /**
   * 读取文本文件内容
   */
  async readText(path: string, encoding?: BufferEncoding, driverName?: string): Promise<string> {
    const driver = this.getDriver(driverName);
    return driver.readText(path, encoding);
  }

  /**
   * 写入文件内容
   */
  async write(path: string, content: Buffer | string, options?: WriteOptions, driverName?: string): Promise<void> {
    const driver = this.getDriver(driverName);
    return driver.write(path, content, options);
  }

  /**
   * 创建目录
   */
  async mkdir(path: string, recursive?: boolean, driverName?: string): Promise<void> {
    const driver = this.getDriver(driverName);
    return driver.mkdir(path, recursive);
  }

  /**
   * 删除文件或目录
   */
  async remove(path: string, recursive?: boolean, driverName?: string): Promise<void> {
    const driver = this.getDriver(driverName);
    return driver.remove(path, recursive);
  }

  /**
   * 复制文件或目录
   */
  async copy(sourcePath: string, targetPath: string, options?: CopyOptions, driverName?: string): Promise<void> {
    const driver = this.getDriver(driverName);
    return driver.copy(sourcePath, targetPath, options);
  }

  /**
   * 移动文件或目录
   */
  async move(sourcePath: string, targetPath: string, options?: MoveOptions, driverName?: string): Promise<void> {
    const driver = this.getDriver(driverName);
    return driver.move(sourcePath, targetPath, options);
  }

  /**
   * 获取文件下载URL（如果支持）
   */
  async getDownloadUrl(path: string, expiresIn?: number, driverName?: string): Promise<string | undefined> {
    const driver = this.getDriver(driverName);
    if (driver.getDownloadUrl) {
      return driver.getDownloadUrl(path, expiresIn);
    }
    return undefined;
  }

  /**
   * 获取文件上传URL（如果支持）
   */
  async getUploadUrl(path: string, expiresIn?: number, driverName?: string): Promise<string | undefined> {
    const driver = this.getDriver(driverName);
    if (driver.getUploadUrl) {
      return driver.getUploadUrl(path, expiresIn);
    }
    return undefined;
  }

  /**
   * 跨驱动器复制
   */
  async copyBetweenDrivers(
    sourcePath: string, 
    targetPath: string, 
    sourceDriver: string, 
    targetDriver: string,
    options?: CopyOptions
  ): Promise<void> {
    const source = this.getDriver(sourceDriver);
    const target = this.getDriver(targetDriver);
    
    // 读取源文件
    const content = await source.read(sourcePath);
    
    // 写入目标文件
    await target.write(targetPath, content, {
      overwrite: options?.overwrite,
      createParents: true
    });
    
    // 如果需要保留时间戳
    if (options?.preserveTimestamps) {
      try {
        // const sourceInfo = await source.stat(sourcePath);
        // 注意：不是所有驱动器都支持设置时间戳
        // 这里只是示例，实际实现可能需要驱动器特定的方法
      } catch (error) {
        // 忽略时间戳设置失败
      }
    }
  }

  /**
   * 跨驱动器移动
   */
  async moveBetweenDrivers(
    sourcePath: string, 
    targetPath: string, 
    sourceDriver: string, 
    targetDriver: string,
    options?: MoveOptions
  ): Promise<void> {
    await this.copyBetweenDrivers(sourcePath, targetPath, sourceDriver, targetDriver, {
      overwrite: options?.overwrite,
      preserveTimestamps: true
    });
    
    // 删除源文件
    const source = this.getDriver(sourceDriver);
    await source.remove(sourcePath);
  }

  /**
   * 搜索文件和目录
   */
  async search(basePath: string, options: SearchOptions, driverName?: string): Promise<SearchResult[]> {
    const driver = this.getDriver(driverName);
    return driver.search(basePath, options);
  }

  /**
   * 跨驱动器搜索
   */
  async searchAcrossDrivers(basePath: string, options: SearchOptions, driverNames?: string[]): Promise<SearchResult[]> {
    const drivers = driverNames 
      ? driverNames.map(name => this.getDriver(name))
      : Array.from(this.drivers.values()).filter(driver => driver.connected);
    
    const searchPromises = drivers.map(async driver => {
      try {
        const results = await driver.search(basePath, options);
        // 为结果添加驱动器信息
        return results.map(result => ({
          ...result,
          metadata: {
            ...result.metadata,
            driver: driver.name,
            driverType: driver.type
          }
        }));
      } catch (error) {
        if (this.options.enableLogging) {
          console.warn(`Search failed on driver ${driver.name}:`, error);
        }
        return [];
      }
    });
    
    const allResults = await Promise.all(searchPromises);
    const combinedResults = allResults.flat();
    
    // 按相关性排序
    combinedResults.sort((a, b) => {
      if (options.sortBy === 'relevance' || !options.sortBy) {
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
      }
      
      return options.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // 分页
    if (options.offset !== undefined || options.limit !== undefined) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      return combinedResults.slice(start, end);
    }
    
    return combinedResults;
  }
}