# @promptx/alist

Unified file storage API with multiple driver support, inspired by [Alist](https://alist.nn.ci/).

## Features

- 🔌 **Multiple Storage Drivers**: Support for local filesystem and WebDAV
- 🎯 **Unified API**: Same interface for all storage systems
- 🛡️ **Type Safe**: Full TypeScript support with comprehensive type definitions
- 🔄 **Async/Await**: Modern Promise-based API
- 📁 **Rich File Operations**: Read, write, copy, move, list, and more
- 🚀 **Extensible**: Easy to add new storage drivers
- 🔒 **Security**: Path validation and permission handling
- ⚡ **Performance**: Optimized for both small and large files

## Installation

```bash
npm install @promptx/alist
```

## Quick Start

```typescript
import { StorageManager, createLocalDriver, createWebDAVDriver } from '@promptx/alist';

// Create storage manager
const storage = new StorageManager({
  defaultDriver: 'local'
});

// Register local filesystem driver
await storage.registerDriver({
  type: 'local',
  name: 'local',
  rootPath: '/path/to/storage'
});

// Register WebDAV driver
await storage.registerDriver({
  type: 'webdav',
  name: 'webdav',
  url: 'https://webdav.example.com',
  username: 'user',
  password: 'pass',
  rootPath: '/remote'
});

// Use unified API
const files = await storage.list('/documents');
const content = await storage.readText('/documents/readme.txt');
await storage.write('/documents/new-file.txt', 'Hello World!');
```

## Drivers

### Local Filesystem Driver

```typescript
import { LocalDriver } from '@promptx/alist';

const driver = new LocalDriver({
  type: 'local',
  name: 'local-storage',
  rootPath: '/home/user/storage',
  allowOutsideRoot: false // Security: prevent access outside root
});

await driver.connect();
```

### WebDAV Driver

```typescript
import { WebDAVDriver } from '@promptx/alist';

const driver = new WebDAVDriver({
  type: 'webdav',
  name: 'cloud-storage',
  url: 'https://webdav.example.com',
  username: 'username',
  password: 'password',
  rootPath: '/cloud-files',
  timeout: 30000
});

await driver.connect();
```

## API Reference

### StorageManager

The main class that manages multiple storage drivers and provides a unified API.

#### Methods

##### `registerDriver(config: AnyDriverConfig): Promise<void>`

Register a new storage driver.

##### `getDriver(name?: string): StorageDriver`

Get a registered driver by name.

##### `exists(path: string, driverName?: string): Promise<boolean>`

Check if a file or directory exists.

##### `stat(path: string, driverName?: string): Promise<FileInfo>`

Get file or directory information.

##### `list(path: string, options?: ListOptions, driverName?: string): Promise<FileInfo[]>`

List directory contents.

```typescript
const files = await storage.list('/documents', {
  recursive: true,
  pattern: '*.txt',
  sortBy: 'modifiedTime',
  sortOrder: 'desc'
});
```

##### `read(path: string, options?: ReadOptions, driverName?: string): Promise<Buffer>`

Read file contents as Buffer.

##### `readText(path: string, encoding?: BufferEncoding, driverName?: string): Promise<string>`

Read file contents as text.

##### `write(path: string, content: Buffer | string, options?: WriteOptions, driverName?: string): Promise<void>`

Write content to a file.

```typescript
await storage.write('/documents/file.txt', 'Hello World!', {
  overwrite: true,
  createParents: true
});
```

##### `mkdir(path: string, recursive?: boolean, driverName?: string): Promise<void>`

Create a directory.

##### `remove(path: string, recursive?: boolean, driverName?: string): Promise<void>`

Remove a file or directory.

##### `copy(sourcePath: string, targetPath: string, options?: CopyOptions, driverName?: string): Promise<void>`

Copy a file or directory.

##### `move(sourcePath: string, targetPath: string, options?: MoveOptions, driverName?: string): Promise<void>`

Move a file or directory.

### Cross-Driver Operations

##### `copyBetweenDrivers(sourcePath: string, targetPath: string, sourceDriver: string, targetDriver: string, options?: CopyOptions): Promise<void>`

Copy files between different storage drivers.

```typescript
// Copy from local to WebDAV
await storage.copyBetweenDrivers(
  '/local/file.txt',
  '/remote/file.txt',
  'local',
  'webdav'
);
```

##### `moveBetweenDrivers(sourcePath: string, targetPath: string, sourceDriver: string, targetDriver: string, options?: MoveOptions): Promise<void>`

Move files between different storage drivers.

## Types

### FileInfo

```typescript
interface FileInfo {
  name: string;           // File name
  path: string;           // File path
  size: number;           // File size in bytes
  isDirectory: boolean;   // Whether it's a directory
  modifiedTime: Date;     // Last modified time
  createdTime?: Date;     // Creation time (if available)
  mimeType?: string;      // MIME type
  extension?: string;     // File extension
  permissions?: string;   // File permissions
  metadata?: Record<string, any>; // Additional metadata
}
```

### ListOptions

```typescript
interface ListOptions {
  recursive?: boolean;        // List subdirectories recursively
  pattern?: string;          // File name pattern (supports wildcards)
  includeHidden?: boolean;   // Include hidden files
  sortBy?: 'name' | 'size' | 'modifiedTime';
  sortOrder?: 'asc' | 'desc';
  offset?: number;           // Pagination offset
  limit?: number;            // Pagination limit
}
```

### Driver Configuration

#### LocalDriverConfig

```typescript
interface LocalDriverConfig {
  type: 'local';
  name?: string;
  rootPath: string;              // Root directory path
  allowOutsideRoot?: boolean;    // Allow access outside root (default: false)
  timeout?: number;
  retries?: number;
}
```

#### WebDAVDriverConfig

```typescript
interface WebDAVDriverConfig {
  type: 'webdav';
  name?: string;
  url: string;                   // WebDAV server URL
  username?: string;             // Username for authentication
  password?: string;             // Password for authentication
  token?: string;                // Bearer token for authentication
  rootPath?: string;             // Root path on server
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>; // Custom headers
}
```

## Error Handling

The package provides specific error types for different scenarios:

```typescript
import { 
  StorageError, 
  FileNotFoundError, 
  PermissionError, 
  ConnectionError 
} from '@promptx/alist';

try {
  await storage.read('/nonexistent-file.txt');
} catch (error) {
  if (error instanceof FileNotFoundError) {
    console.log('File not found:', error.path);
  } else if (error instanceof PermissionError) {
    console.log('Permission denied:', error.path);
  } else if (error instanceof ConnectionError) {
    console.log('Connection failed:', error.message);
  }
}
```

## Utility Functions

The package includes useful utility functions for path manipulation:

```typescript
import { 
  normalizePath, 
  joinPath, 
  getExtension, 
  getMimeType,
  formatFileSize,
  validatePath 
} from '@promptx/alist';

const normalized = normalizePath('/path//to///file.txt'); // '/path/to/file.txt'
const joined = joinPath('/base', 'sub', 'file.txt');      // '/base/sub/file.txt'
const ext = getExtension('document.pdf');                 // '.pdf'
const mime = getMimeType('image.jpg');                    // 'image/jpeg'
const size = formatFileSize(1024);                        // '1.00 KB'
const isValid = validatePath('../../../etc/passwd');      // false
```

## Examples

### Basic File Operations

```typescript
import { StorageManager } from '@promptx/alist';

const storage = new StorageManager({ defaultDriver: 'local' });

await storage.registerDriver({
  type: 'local',
  name: 'local',
  rootPath: './storage'
});

// Create directory
await storage.mkdir('/documents', true);

// Write file
await storage.write('/documents/hello.txt', 'Hello, World!');

// Read file
const content = await storage.readText('/documents/hello.txt');
console.log(content); // 'Hello, World!'

// List files
const files = await storage.list('/documents');
console.log(files);

// Copy file
await storage.copy('/documents/hello.txt', '/documents/hello-copy.txt');

// Move file
await storage.move('/documents/hello-copy.txt', '/documents/moved.txt');

// Remove file
await storage.remove('/documents/moved.txt');
```

### Working with Multiple Drivers

```typescript
const storage = new StorageManager();

// Register multiple drivers
await storage.registerDriver({
  type: 'local',
  name: 'local',
  rootPath: './local-storage'
});

await storage.registerDriver({
  type: 'webdav',
  name: 'cloud',
  url: 'https://webdav.example.com',
  username: 'user',
  password: 'pass'
});

// Use specific driver
await storage.write('/file.txt', 'Local content', undefined, 'local');
await storage.write('/file.txt', 'Cloud content', undefined, 'cloud');

// Copy between drivers
await storage.copyBetweenDrivers('/file.txt', '/backup.txt', 'local', 'cloud');
```

### Advanced Listing with Filters

```typescript
// List all PDF files recursively, sorted by size
const pdfFiles = await storage.list('/documents', {
  recursive: true,
  pattern: '*.pdf',
  sortBy: 'size',
  sortOrder: 'desc',
  includeHidden: false
});

// Paginated listing
const page1 = await storage.list('/large-directory', {
  offset: 0,
  limit: 50
});

const page2 = await storage.list('/large-directory', {
  offset: 50,
  limit: 50
});
```

## Search Features

### Query Types

- **Text Search**: Simple text matching in file names and paths
- **Regex Search**: Use regular expressions for complex patterns
- **Fuzzy Search**: Automatic typo tolerance and similarity matching
- **Empty Query**: Use filters only (extensions, MIME types, etc.)

### Filtering Options

- **File Type**: Filter by files, directories, or both
- **Extensions**: Match specific file extensions
- **MIME Types**: Filter by content type (supports wildcards like `image/*`)
- **File Size**: Filter by minimum and maximum file size
- **Modification Time**: Filter by date ranges
- **Hidden Files**: Include or exclude hidden files
- **Search Depth**: Limit recursive search depth

### Sorting and Pagination

- **Sort By**: Name, size, modification time, or relevance score
- **Sort Order**: Ascending or descending
- **Pagination**: Offset and limit for large result sets

### Search Results

- **Relevance Scoring**: Each result includes a relevance score (0-1)
- **Match Highlighting**: Shows which parts of the name/path matched
- **Matched Parts**: Indicates whether name, path, or content matched
- **Rich Metadata**: Full file information including size, dates, MIME type

### Performance

- **Optimized Algorithms**: Efficient string matching and filtering
- **Memory Efficient**: Streaming results for large directories
- **Concurrent Search**: Search multiple drivers simultaneously
- **Early Termination**: Stop search when limit is reached

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.