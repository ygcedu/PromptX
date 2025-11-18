import fileManager from './fileManager.js'

/**
 * WebDAV 文件管理功能演示
 * 这个脚本展示了如何使用文件管理器的各种功能
 */

// 演示数据
const demoFiles = [
  {
    name: 'welcome.txt',
    content: `欢迎使用 WebDAV 文件管理器！

这是一个演示文件，展示了文件管理器的基本功能：

✅ 文件创建和写入
✅ 文件读取和显示
✅ 文件更新和修改
✅ 文件删除和清理
✅ 目录浏览和管理
✅ 文件搜索和过滤

创建时间: ${new Date().toISOString()}
`
  },
  {
    name: 'config.json',
    content: JSON.stringify({
      "app": "PromptX WebDAV Manager",
      "version": "1.0.0",
      "features": [
        "文件增删改查",
        "目录管理",
        "批量操作",
        "搜索功能"
      ],
      "webdav": {
        "server": "https://rausu.infini-cloud.net/dav/",
        "username": "cccman"
      },
      "created": new Date().toISOString()
    }, null, 2)
  },
  {
    name: 'notes.md',
    content: `# WebDAV 使用笔记

## 基本操作

### 文件操作
- 创建文件: \`fileManager.createFile(name, content)\`
- 读取文件: \`fileManager.readFile(name)\`
- 更新文件: \`fileManager.updateFile(name, content)\`
- 删除文件: \`fileManager.deleteFile(name)\`

### 目录操作
- 列出文件: \`fileManager.listFiles(path)\`
- 创建目录: \`fileManager.createDirectory(path)\`
- 删除目录: \`fileManager.deleteDirectory(path)\`

### 高级功能
- 搜索文件: \`fileManager.searchFiles(keyword)\`
- 批量上传: \`fileManager.uploadFiles(files)\`
- 移动文件: \`fileManager.moveFile(from, to)\`
- 复制文件: \`fileManager.copyFile(from, to)\`

## 注意事项

1. 所有操作都是异步的，需要使用 await
2. 错误处理很重要，建议使用 try-catch
3. 文件路径使用 Unix 风格的斜杠 (/)
4. 文件名避免使用特殊字符

## 示例代码

\`\`\`javascript
// 创建文件
await fileManager.createFile('example.txt', 'Hello World!')

// 读取文件
const content = await fileManager.readFile('example.txt')
console.log(content)

// 更新文件
await fileManager.updateFile('example.txt', 'Updated content')

// 删除文件
await fileManager.deleteFile('example.txt')
\`\`\`

更新时间: ${new Date().toISOString()}
`
  }
]

/**
 * 运行完整演示
 */
export const runDemo = async () => {
  console.log('🚀 开始 WebDAV 文件管理器演示...')
  
  try {
    // 1. 检查连接
    console.log('\n📡 步骤 1: 检查 WebDAV 连接...')
    const files = await fileManager.listFiles('/')
    console.log(`✅ 连接成功！当前目录有 ${files.length} 个项目`)
    
    // 2. 创建演示文件
    console.log('\n📝 步骤 2: 创建演示文件...')
    for (const file of demoFiles) {
      await fileManager.createFile(file.name, file.content)
      console.log(`✅ 创建文件: ${file.name}`)
    }
    
    // 3. 验证文件创建
    console.log('\n🔍 步骤 3: 验证文件创建...')
    const updatedFiles = await fileManager.listFiles('/')
    console.log(`✅ 当前目录有 ${updatedFiles.length} 个项目`)
    
    // 4. 读取文件内容
    console.log('\n📖 步骤 4: 读取文件内容...')
    for (const file of demoFiles) {
      const content = await fileManager.readFile(file.name)
      console.log(`✅ 读取文件 ${file.name} (${content.length} 字符)`)
    }
    
    // 5. 搜索功能演示
    console.log('\n🔎 步骤 5: 搜索功能演示...')
    const searchResults = await fileManager.searchFiles('demo')
    console.log(`✅ 搜索 "demo" 找到 ${searchResults.length} 个文件`)
    
    // 6. 文件信息获取
    console.log('\n📊 步骤 6: 获取文件信息...')
    for (const file of demoFiles) {
      const info = await fileManager.getFileInfo(file.name)
      console.log(`✅ ${file.name}: ${info.size} 字节, 修改时间: ${info.lastModified}`)
    }
    
    // 7. 文件更新演示
    console.log('\n✏️ 步骤 7: 文件更新演示...')
    const updateContent = `${demoFiles[0].content}\n\n--- 更新内容 ---\n演示更新功能\n更新时间: ${new Date().toISOString()}`
    await fileManager.updateFile(demoFiles[0].name, updateContent)
    console.log(`✅ 更新文件: ${demoFiles[0].name}`)
    
    // 8. 验证更新
    console.log('\n✅ 步骤 8: 验证文件更新...')
    const updatedContent = await fileManager.readFile(demoFiles[0].name)
    console.log(`✅ 更新后文件大小: ${updatedContent.length} 字符`)
    
    console.log('\n🎉 演示完成！所有功能正常工作')
    
    return {
      success: true,
      message: '演示完成，所有功能正常',
      filesCreated: demoFiles.length,
      totalFiles: updatedFiles.length
    }
    
  } catch (error) {
    console.error('❌ 演示过程中出现错误:', error)
    return {
      success: false,
      message: `演示失败: ${error.message}`,
      error: error
    }
  }
}

/**
 * 清理演示文件
 */
export const cleanupDemo = async () => {
  console.log('🧹 开始清理演示文件...')
  
  try {
    for (const file of demoFiles) {
      const exists = await fileManager.fileExists(file.name)
      if (exists) {
        await fileManager.deleteFile(file.name)
        console.log(`✅ 删除文件: ${file.name}`)
      }
    }
    
    console.log('🎉 清理完成！')
    return {
      success: true,
      message: '清理完成',
      filesDeleted: demoFiles.length
    }
    
  } catch (error) {
    console.error('❌ 清理过程中出现错误:', error)
    return {
      success: false,
      message: `清理失败: ${error.message}`,
      error: error
    }
  }
}

/**
 * 快速功能测试
 */
export const quickTest = async () => {
  console.log('⚡ 开始快速功能测试...')
  
  const testFileName = `quick-test-${Date.now()}.txt`
  const testContent = 'Quick test content'
  
  try {
    // 创建
    await fileManager.createFile(testFileName, testContent)
    console.log('✅ 创建测试')
    
    // 读取
    const content = await fileManager.readFile(testFileName)
    console.log('✅ 读取测试')
    
    // 更新
    await fileManager.updateFile(testFileName, testContent + ' - updated')
    console.log('✅ 更新测试')
    
    // 删除
    await fileManager.deleteFile(testFileName)
    console.log('✅ 删除测试')
    
    console.log('🎉 快速测试通过！')
    return { success: true, message: '快速测试通过' }
    
  } catch (error) {
    console.error('❌ 快速测试失败:', error)
    
    // 清理测试文件
    try {
      await fileManager.deleteFile(testFileName)
    } catch (cleanupError) {
      console.warn('⚠️ 清理测试文件失败:', cleanupError)
    }
    
    return {
      success: false,
      message: `快速测试失败: ${error.message}`,
      error: error
    }
  }
}

// 导出演示文件数据，供其他地方使用
export { demoFiles }