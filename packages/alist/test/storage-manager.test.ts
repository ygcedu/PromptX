import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { StorageManager, LocalDriver } from '../src/index.js';

describe('StorageManager', () => {
  let storage: StorageManager;
  let tempDir: string;

  beforeEach(async () => {
    // 创建临时目录
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'alist-test-'));
    
    storage = new StorageManager({
      defaultDriver: 'test-local',
      enableLogging: false
    });

    await storage.registerDriver({
      type: 'local',
      name: 'test-local',
      rootPath: tempDir
    });
  });

  afterEach(async () => {
    await storage.disconnectAll();
    await fs.remove(tempDir);
  });

  describe('Driver Management', () => {
    it('should register and list drivers', () => {
      const drivers = storage.listDrivers();
      expect(drivers).toHaveLength(1);
      expect(drivers[0]).toEqual({
        name: 'test-local',
        type: 'local',
        connected: true
      });
    });

    it('should get driver by name', () => {
      const driver = storage.getDriver('test-local');
      expect(driver).toBeInstanceOf(LocalDriver);
      expect(driver.name).toBe('test-local');
    });

    it('should use default driver when no name specified', () => {
      const driver = storage.getDriver();
      expect(driver.name).toBe('test-local');
    });

    it('should throw error for non-existent driver', () => {
      expect(() => storage.getDriver('non-existent')).toThrow('Driver not found');
    });
  });

  describe('File Operations', () => {
    it('should write and read text file', async () => {
      const content = 'Hello, World!';
      await storage.write('/test.txt', content);
      
      const readContent = await storage.readText('/test.txt');
      expect(readContent).toBe(content);
    });

    it('should write and read binary file', async () => {
      const content = Buffer.from([1, 2, 3, 4, 5]);
      await storage.write('/test.bin', content);
      
      const readContent = await storage.read('/test.bin');
      expect(readContent).toEqual(content);
    });

    it('should check file existence', async () => {
      expect(await storage.exists('/test.txt')).toBe(false);
      
      await storage.write('/test.txt', 'content');
      expect(await storage.exists('/test.txt')).toBe(true);
    });

    it('should get file stats', async () => {
      const content = 'Hello, World!';
      await storage.write('/test.txt', content);
      
      const stats = await storage.stat('/test.txt');
      expect(stats.name).toBe('test.txt');
      expect(stats.path).toBe('/test.txt');
      expect(stats.size).toBe(Buffer.byteLength(content));
      expect(stats.isDirectory).toBe(false);
      expect(stats.extension).toBe('.txt');
    });
  });

  describe('Directory Operations', () => {
    it('should create and list directories', async () => {
      await storage.mkdir('/testdir');
      await storage.write('/testdir/file1.txt', 'content1');
      await storage.write('/testdir/file2.txt', 'content2');
      
      const files = await storage.list('/testdir');
      expect(files).toHaveLength(2);
      expect(files.map(f => f.name).sort()).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should create nested directories', async () => {
      await storage.mkdir('/level1/level2/level3', true);
      expect(await storage.exists('/level1/level2/level3')).toBe(true);
    });

    it('should list files with options', async () => {
      await storage.mkdir('/testdir');
      await storage.write('/testdir/file1.txt', 'content1');
      await storage.write('/testdir/file2.md', 'content2');
      await storage.write('/testdir/.hidden', 'hidden');
      
      // Test pattern filtering
      const txtFiles = await storage.list('/testdir', { pattern: '*.txt' });
      expect(txtFiles).toHaveLength(1);
      expect(txtFiles[0].name).toBe('file1.txt');
      
      // Test hidden files
      const allFiles = await storage.list('/testdir', { includeHidden: true });
      expect(allFiles).toHaveLength(3);
      
      const visibleFiles = await storage.list('/testdir', { includeHidden: false });
      expect(visibleFiles).toHaveLength(2);
    });
  });

  describe('File Manipulation', () => {
    beforeEach(async () => {
      await storage.write('/source.txt', 'source content');
    });

    it('should copy files', async () => {
      await storage.copy('/source.txt', '/copy.txt');
      
      expect(await storage.exists('/source.txt')).toBe(true);
      expect(await storage.exists('/copy.txt')).toBe(true);
      
      const content = await storage.readText('/copy.txt');
      expect(content).toBe('source content');
    });

    it('should move files', async () => {
      await storage.move('/source.txt', '/moved.txt');
      
      expect(await storage.exists('/source.txt')).toBe(false);
      expect(await storage.exists('/moved.txt')).toBe(true);
      
      const content = await storage.readText('/moved.txt');
      expect(content).toBe('source content');
    });

    it('should remove files', async () => {
      expect(await storage.exists('/source.txt')).toBe(true);
      
      await storage.remove('/source.txt');
      expect(await storage.exists('/source.txt')).toBe(false);
    });

    it('should remove directories recursively', async () => {
      await storage.mkdir('/testdir');
      await storage.write('/testdir/file.txt', 'content');
      
      await storage.remove('/testdir', true);
      expect(await storage.exists('/testdir')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw FileNotFoundError for non-existent files', async () => {
      await expect(storage.read('/non-existent.txt')).rejects.toThrow('File not found');
    });

    it('should handle overwrite protection', async () => {
      await storage.write('/test.txt', 'original');
      
      await expect(
        storage.write('/test.txt', 'new content', { overwrite: false })
      ).rejects.toThrow('File already exists');
      
      // Should work with overwrite: true
      await storage.write('/test.txt', 'new content', { overwrite: true });
      const content = await storage.readText('/test.txt');
      expect(content).toBe('new content');
    });
  });
});