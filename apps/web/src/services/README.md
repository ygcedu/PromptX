# WebDAV 文件管理功能

这个模块实现了基于 `unstorage` 和 `webdav` 库的完整文件增删改查功能。

## 功能特性

### 🔧 核心功能
- ✅ **文件创建** - 支持创建新文件并写入内容
- ✅ **文件读取** - 读取文件内容
- ✅ **文件更新** - 修改现有文件内容
- ✅ **文件删除** - 删除文件
- ✅ **文件列表** - 获取目录下的所有文件和文件夹
- ✅ **文件搜索** - 根据关键词搜索文件
- ✅ **文件信息** - 获取文件的详细信息（大小、修改时间等）

### 📁 目录操作
- ✅ **创建目录** - 创建新文件夹
- ✅ **删除目录** - 删除文件夹及其内容
- ✅ **目录浏览** - 浏览不同目录的内容

### 🚀 高级功能
- ✅ **文件移动/重命名** - 移动文件到不同位置或重命名
- ✅ **文件复制** - 复制文件到新位置
- ✅ **批量上传** - 一次上传多个文件
- ✅ **文件下载** - 下载文件到本地

## 技术架构

### 依赖库
- **unstorage** (v1.12.0) - 统一存储接口
- **webdav** (v5.7.1) - WebDAV 客户端

### 核心文件
```
src/services/
├── webdavStorage.js    # WebDAV 存储配置和驱动
├── fileManager.js      # 文件管理服务（主要API）
├── webdavTest.js       # 连接和功能测试
└── README.md          # 本文档
```

### 组件文件
```
src/components/
├── FileManager.jsx     # 文件管理器UI组件
└── WebDAVTest.jsx     # 测试界面组件

src/pages/
└── FileManagerPage.jsx # 文件管理页面
```

## WebDAV 配置

### 服务器信息
- **原始服务器**: https://rausu.infini-cloud.net/dav/
- **用户名**: cccman
- **密码**: NSd7cXH548HVzsbj

### 代理配置
由于 WebDAV 服务器不支持跨域访问，我们在 Vite 中配置了代理：

- **统一代理**: 使用 `/api/dav/` 代理到原始服务器
- **不区分环境**: 开发和生产环境一律使用代理

代理配置在 `vite.config.js` 中定义，自动处理路径重写和 CORS 头。

## API 使用示例

### 基本文件操作

```javascript
import fileManager from './services/fileManager.js'

// 创建文件
await fileManager.createFile('example.txt', 'Hello World!')

// 读取文件
const content = await fileManager.readFile('example.txt')

// 更新文件
await fileManager.updateFile('example.txt', 'Updated content')

// 删除文件
await fileManager.deleteFile('example.txt')

// 检查文件是否存在
const exists = await fileManager.fileExists('example.txt')
```

### 目录操作

```javascript
// 获取文件列表
const files = await fileManager.listFiles('/')

// 创建目录
await fileManager.createDirectory('/new-folder')

// 删除目录
await fileManager.deleteDirectory('/old-folder')
```

### 高级操作

```javascript
// 移动/重命名文件
await fileManager.moveFile('/old-path.txt', '/new-path.txt')

// 复制文件
await fileManager.copyFile('/source.txt', '/copy.txt')

// 批量上传
const files = [
  { name: 'file1.txt', content: 'Content 1' },
  { name: 'file2.txt', content: 'Content 2' }
]
const results = await fileManager.uploadFiles(files)

// 搜索文件
const searchResults = await fileManager.searchFiles('keyword')

// 获取文件信息
const fileInfo = await fileManager.getFileInfo('example.txt')
```

## UI 组件使用

### 文件管理器组件

```jsx
import FileManager from './components/FileManager.jsx'

function App() {
  return (
    <div>
      <FileManager />
    </div>
  )
}
```

### 测试组件

```jsx
import WebDAVTest from './components/WebDAVTest.jsx'

function TestPage() {
  return (
    <div>
      <WebDAVTest />
    </div>
  )
}
```

## 功能测试

系统提供了三种测试模式：

### 1. 快速连接测试
验证 WebDAV 服务器连接是否正常

### 2. 完整功能测试
测试文件的完整生命周期：
- 创建文件
- 读取内容
- 更新内容
- 获取文件信息
- 删除文件

### 3. 批量操作测试
测试批量文件操作：
- 批量上传多个文件
- 搜索功能验证
- 批量清理

## 错误处理

所有 API 都包含完善的错误处理：

```javascript
try {
  await fileManager.createFile('test.txt', 'content')
  console.log('文件创建成功')
} catch (error) {
  console.error('操作失败:', error.message)
  // 错误信息会包含具体的失败原因
}
```

### 安全注意事项

1. **凭据安全**: WebDAV 凭据直接写在代码中，生产环境应使用环境变量
2. **跨域问题**: 统一使用 Vite 代理解决跨域问题
3. **权限控制**: 当前使用的账户具有完整读写权限

## 扩展建议

### 可能的改进方向
1. **配置管理** - 支持动态配置 WebDAV 服务器信息
2. **文件预览** - 支持图片、文档等文件的在线预览
3. **权限管理** - 实现更细粒度的文件权限控制
4. **版本控制** - 支持文件版本历史管理
5. **同步功能** - 实现本地和远程的文件同步

### 性能优化
1. **缓存机制** - 实现文件列表和内容缓存
2. **分页加载** - 大目录的分页显示
3. **断点续传** - 大文件的断点上传/下载
4. **压缩传输** - 启用 gzip 压缩减少传输量

## 故障排除

### 常见问题

1. **连接失败**
   - 检查网络连接
   - 验证 WebDAV 服务器地址
   - 确认用户名密码正确

2. **跨域错误 (CORS)**
   - 确保 Vite 代理配置正确
   - 检查代理路径是否为 `/api/dav/`
   - 检查浏览器控制台的具体错误信息

3. **代理问题**
   - 检查 Vite 服务器是否正常运行
   - 查看控制台代理日志
   - 验证代理路径配置

3. **权限错误**
   - 验证账户是否有相应的读写权限
   - 检查文件路径是否正确

4. **文件操作失败**
   - 确认文件名不包含特殊字符
   - 检查文件大小是否超出限制
   - 验证目录路径是否存在

### 调试模式

开启浏览器开发者工具的控制台，所有操作都会输出详细的日志信息，包括：
- 操作开始和结束状态
- 成功/失败消息
- 详细的错误信息
- 性能统计数据

## 更新日志

### v1.2.0 (2024-01-27)
- ✅ 统一使用 `/api/dav/` 代理，不区分开发和生产环境
- ✅ 简化配置逻辑，移除环境检测
- ✅ 更新所有相关文档和测试工具

### v1.1.0 (2024-01-27)
- ✅ 添加 Vite 代理配置解决跨域问题
- ✅ 自动检测开发/生产环境切换 URL
- ✅ 添加代理日志和错误处理
- ✅ 更新文档和配置说明

### v1.0.0 (2024-01-27)
- ✅ 实现基础文件 CRUD 操作
- ✅ 添加目录管理功能
- ✅ 实现文件搜索和批量操作
- ✅ 创建完整的 UI 界面
- ✅ 添加连接测试功能
- ✅ 完善错误处理和日志记录