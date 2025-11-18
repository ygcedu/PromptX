import { describe, it, expect } from 'vitest';
import {
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
  matchPattern,
  isHidden,
  formatFileSize,
  validatePath,
  createSafePath
} from '../src/utils/index.js';

describe('Utils', () => {
  describe('Path Normalization', () => {
    it('should normalize paths', () => {
      expect(normalizePath('path\\to\\file')).toBe('path/to/file');
      expect(normalizePath('path//to///file')).toBe('path/to/file');
      expect(normalizePath('/path/to/file')).toBe('/path/to/file');
    });

    it('should ensure leading slash', () => {
      expect(ensureLeadingSlash('path/to/file')).toBe('/path/to/file');
      expect(ensureLeadingSlash('/path/to/file')).toBe('/path/to/file');
    });

    it('should remove leading slash', () => {
      expect(removeLeadingSlash('/path/to/file')).toBe('path/to/file');
      expect(removeLeadingSlash('path/to/file')).toBe('path/to/file');
    });

    it('should ensure trailing slash', () => {
      expect(ensureTrailingSlash('/path/to/dir')).toBe('/path/to/dir/');
      expect(ensureTrailingSlash('/path/to/dir/')).toBe('/path/to/dir/');
    });

    it('should remove trailing slash', () => {
      expect(removeTrailingSlash('/path/to/dir/')).toBe('/path/to/dir');
      expect(removeTrailingSlash('/path/to/dir')).toBe('/path/to/dir');
      expect(removeTrailingSlash('/')).toBe('/'); // Root should remain
    });

    it('should join paths', () => {
      expect(joinPath('/base', 'sub', 'file.txt')).toBe('/base/sub/file.txt');
      expect(joinPath('base', '/sub/', 'file.txt')).toBe('base/sub/file.txt');
    });
  });

  describe('File Information', () => {
    it('should get file extension', () => {
      expect(getExtension('file.txt')).toBe('.txt');
      expect(getExtension('file.tar.gz')).toBe('.gz');
      expect(getExtension('file')).toBe('');
      expect(getExtension('.hidden')).toBe('');
    });

    it('should get MIME type', () => {
      expect(getMimeType('file.txt')).toBe('text/plain');
      expect(getMimeType('image.jpg')).toBe('image/jpeg');
      expect(getMimeType('document.pdf')).toBe('application/pdf');
      expect(getMimeType('unknown.unknownext')).toBeUndefined();
    });

    it('should get base name', () => {
      expect(getBaseName('/path/to/file.txt')).toBe('file');
      expect(getBaseName('file.tar.gz')).toBe('file.tar');
      expect(getBaseName('file')).toBe('file');
    });

    it('should get directory name', () => {
      expect(getDirName('/path/to/file.txt')).toBe('/path/to');
      expect(getDirName('file.txt')).toBe('.');
      expect(getDirName('/file.txt')).toBe('/');
    });
  });

  describe('Pattern Matching', () => {
    it('should match patterns', () => {
      expect(matchPattern('file.txt', '*.txt')).toBe(true);
      expect(matchPattern('file.pdf', '*.txt')).toBe(false);
      expect(matchPattern('test.file.txt', '*.txt')).toBe(true);
      expect(matchPattern('file.txt', 'file.*')).toBe(true);
      expect(matchPattern('file.txt', 'file.?xt')).toBe(true);
      expect(matchPattern('file.txt', '')).toBe(true); // Empty pattern matches all
    });

    it('should detect hidden files', () => {
      expect(isHidden('.hidden')).toBe(true);
      expect(isHidden('.gitignore')).toBe(true);
      expect(isHidden('visible.txt')).toBe(false);
      expect(isHidden('file.hidden')).toBe(false);
    });
  });

  describe('File Size Formatting', () => {
    it('should format file sizes', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1023)).toBe('1023 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1536)).toBe('1.50 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    });
  });

  describe('Path Validation', () => {
    it('should validate safe paths', () => {
      expect(validatePath('/safe/path')).toBe(true);
      expect(validatePath('safe/path')).toBe(true);
      expect(validatePath('../unsafe')).toBe(false);
      expect(validatePath('path/../unsafe')).toBe(false);
      expect(validatePath('path\\..\\unsafe')).toBe(false);
    });

    it('should validate paths within root', () => {
      expect(validatePath('/safe/path', '/safe')).toBe(true);
      expect(validatePath('subpath', '/safe')).toBe(true);
      expect(validatePath('/outside/path', '/safe')).toBe(false);
    });

    it('should create safe paths', () => {
      expect(createSafePath('/base', 'sub/file.txt')).toBe('/base/sub/file.txt');
      expect(createSafePath('/base', '/sub/file.txt')).toBe('/base/sub/file.txt');
      
      expect(() => createSafePath('/base', '../unsafe')).toThrow('Unsafe path');
    });
  });
});