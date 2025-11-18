import fileManager from './fileManager.js'

/**
 * WebDAV 连接测试
 */
export const testWebDAVConnection = async () => {
  console.log('开始测试 WebDAV 连接...')
  
  try {
    // 测试1: 获取文件列表
    console.log('测试1: 获取文件列表')
    const files = await fileManager.listFiles('/')
    console.log('✅ 文件列表获取成功:', files)
    
    // 测试2: 创建测试文件
    console.log('测试2: 创建测试文件')
    const testFileName = `test-${Date.now()}.txt`
    const testContent = `这是一个测试文件\n创建时间: ${new Date().toISOString()}\n测试内容: Hello WebDAV!`
    
    await fileManager.createFile(testFileName, testContent)
    console.log('✅ 测试文件创建成功:', testFileName)
    
    // 测试3: 读取文件内容
    console.log('测试3: 读取文件内容')
    const readContent = await fileManager.readFile(testFileName)
    console.log('✅ 文件内容读取成功:', readContent)
    
    // 测试4: 更新文件内容
    console.log('测试4: 更新文件内容')
    const updatedContent = testContent + '\n\n更新时间: ' + new Date().toISOString()
    await fileManager.updateFile(testFileName, updatedContent)
    console.log('✅ 文件更新成功')
    
    // 测试5: 验证更新
    console.log('测试5: 验证更新')
    const updatedReadContent = await fileManager.readFile(testFileName)
    console.log('✅ 更新后的文件内容:', updatedReadContent)
    
    // 测试6: 获取文件信息
    console.log('测试6: 获取文件信息')
    const fileInfo = await fileManager.getFileInfo(testFileName)
    console.log('✅ 文件信息获取成功:', fileInfo)
    
    // 测试7: 删除测试文件
    console.log('测试7: 删除测试文件')
    await fileManager.deleteFile(testFileName)
    console.log('✅ 测试文件删除成功')
    
    console.log('🎉 所有测试通过！WebDAV 连接正常')
    return {
      success: true,
      message: '所有测试通过！WebDAV 连接正常',
      details: {
        filesCount: files.length,
        testFileName,
        fileInfo
      }
    }
    
  } catch (error) {
    console.error('❌ WebDAV 测试失败:', error)
    return {
      success: false,
      message: `WebDAV 测试失败: ${error.message}`,
      error: error
    }
  }
}

/**
 * 快速连接测试
 */
export const quickConnectionTest = async () => {
  try {
    console.log('执行快速连接测试...')
    const files = await fileManager.listFiles('/')
    console.log('✅ 快速连接测试成功')
    return {
      success: true,
      message: '连接正常',
      filesCount: files.length
    }
  } catch (error) {
    console.error('❌ 快速连接测试失败:', error)
    return {
      success: false,
      message: `连接失败: ${error.message}`,
      error: error
    }
  }
}

/**
 * 批量操作测试
 */
export const testBatchOperations = async () => {
  console.log('开始批量操作测试...')
  
  try {
    // 创建多个测试文件
    const testFiles = [
      { name: `batch-test-1-${Date.now()}.txt`, content: '批量测试文件 1' },
      { name: `batch-test-2-${Date.now()}.txt`, content: '批量测试文件 2' },
      { name: `batch-test-3-${Date.now()}.txt`, content: '批量测试文件 3' }
    ]
    
    console.log('创建批量测试文件...')
    const uploadResults = await fileManager.uploadFiles(testFiles)
    console.log('✅ 批量上传结果:', uploadResults)
    
    // 搜索测试
    console.log('测试搜索功能...')
    const searchResults = await fileManager.searchFiles('batch-test')
    console.log('✅ 搜索结果:', searchResults)
    
    // 清理测试文件
    console.log('清理测试文件...')
    for (const file of testFiles) {
      try {
        await fileManager.deleteFile(file.name)
        console.log(`✅ 删除文件: ${file.name}`)
      } catch (error) {
        console.warn(`⚠️ 删除文件失败: ${file.name}`, error)
      }
    }
    
    console.log('🎉 批量操作测试完成')
    return {
      success: true,
      message: '批量操作测试完成',
      uploadResults,
      searchResults
    }
    
  } catch (error) {
    console.error('❌ 批量操作测试失败:', error)
    return {
      success: false,
      message: `批量操作测试失败: ${error.message}`,
      error: error
    }
  }
}