import React, { useState, useEffect } from 'react'
import fileManager from '../services/fileManager.js'
import { buildFilePath, buildDirPath, getParentPath, ensureDirPath, debugPath } from '../utils/pathDebug.js'
import {
  FileText,
  Folder,
  Upload,
  Download,
  Trash2,
  Edit,
  Plus,
  Search,
  RefreshCw,
  Save,
  X
} from 'lucide-react'

const FileManager = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPath, setCurrentPath] = useState('/')
  const [searchKeyword, setSearchKeyword] = useState('')

  // 文件编辑状态
  const [editingFile, setEditingFile] = useState(null)
  const [fileContent, setFileContent] = useState('')

  // 新建文件状态
  const [showCreateFile, setShowCreateFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileContent, setNewFileContent] = useState('')
  
  // 新建文件夹状态
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // 加载文件列表
  const loadFiles = async (path = '/') => {
    setLoading(true)
    setError('')
    try {
      const fileList = await fileManager.listFiles(path)
      console.log('📁 加载文件列表:', { path, fileList })
      setFiles(fileList)
      setCurrentPath(path)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadFiles()
  }, [])

  // 显示成功消息
  const showSuccess = (message) => {
    setSuccess(message)
    setTimeout(() => setSuccess(''), 3000)
  }

  // 创建文件
  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      setError('请输入文件名')
      return
    }

    try {
      setLoading(true)
      // 使用路径工具构建完整路径
      const fullPath = buildFilePath(currentPath, newFileName)
      
      console.log('📝 创建文件:', { currentPath, newFileName, fullPath })
      debugPath(fullPath, '创建文件')
      
      await fileManager.createFile(fullPath, newFileContent)
      showSuccess(`文件 ${newFileName} 创建成功`)
      setShowCreateFile(false)
      setNewFileName('')
      setNewFileContent('')
      await loadFiles(currentPath)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('请输入文件夹名')
      return
    }

    try {
      setLoading(true)
      // 使用路径工具构建完整路径
      const fullPath = buildDirPath(currentPath, newFolderName)
      
      console.log('📁 创建文件夹:', { currentPath, newFolderName, fullPath })
      debugPath(fullPath, '创建文件夹')
      
      await fileManager.createDirectory(fullPath)
      showSuccess(`文件夹 ${newFolderName} 创建成功`)
      setShowCreateFolder(false)
      setNewFolderName('')
      await loadFiles(currentPath)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 删除文件或目录
  const handleDeleteItem = async (item) => {
    const itemType = item.type === 'directory' ? '文件夹' : '文件'
    if (!confirm(`确定要删除${itemType} ${item.name} 吗？`)) {
      return
    }

    try {
      setLoading(true)
      console.log('🗑️ 删除项目:', { item, type: item.type, path: item.path })
      
      if (item.type === 'directory') {
        await fileManager.deleteDirectory(item.path)
      } else {
        await fileManager.deleteFile(item.path)
      }
      showSuccess(`${itemType} ${item.name} 删除成功`)
      await loadFiles(currentPath)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 编辑文件
  const handleEditFile = async (filename) => {
    try {
      setLoading(true)
      const content = await fileManager.readFile(filename)
      setEditingFile(filename)
      setFileContent(content || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 保存文件
  const handleSaveFile = async () => {
    try {
      setLoading(true)
      await fileManager.updateFile(editingFile, fileContent)
      showSuccess(`文件 ${editingFile} 保存成功`)
      setEditingFile(null)
      setFileContent('')
      await loadFiles(currentPath)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingFile(null)
    setFileContent('')
  }

  // 搜索文件
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      await loadFiles(currentPath)
      return
    }

    try {
      setLoading(true)
      const results = await fileManager.searchFiles(searchKeyword, currentPath)
      setFiles(results)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 下载文件
  const handleDownloadFile = async (filename) => {
    try {
      const content = await fileManager.readFile(filename)
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showSuccess(`文件 ${filename} 下载成功`)
    } catch (err) {
      setError(err.message)
    }
  }

  // 文件上传处理
  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files)

    try {
      setLoading(true)
      const filePromises = uploadedFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            // 使用路径工具构建完整路径
            const fullPath = buildFilePath(currentPath, file.name)
            
            console.log('📤 上传文件:', { fileName: file.name, currentPath, fullPath })
            debugPath(fullPath, '上传文件')
            
            resolve({
              name: fullPath,
              content: e.target.result
            })
          }
          reader.readAsText(file)
        })
      })

      const fileContents = await Promise.all(filePromises)
      const results = await fileManager.uploadFiles(fileContents)

      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      if (failCount === 0) {
        showSuccess(`成功上传 ${successCount} 个文件`)
      } else {
        setError(`上传完成：成功 ${successCount} 个，失败 ${failCount} 个`)
      }

      await loadFiles(currentPath)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString('zh-CN')
  }

  // 处理文件夹点击
  const handleFolderClick = (folder) => {
    console.log('📂 点击文件夹:', { folder, currentPath })
    
    // 使用路径工具确保目录路径格式正确
    const newPath = ensureDirPath(folder.path)
    
    console.log('📂 导航到:', newPath)
    debugPath(newPath, '文件夹导航')
    
    loadFiles(newPath)
  }

  // 处理返回上级目录
  const handleGoBack = () => {
    if (currentPath === '/') return
    
    console.log('⬆️ 返回上级目录，当前路径:', currentPath)
    
    // 使用路径工具计算上级目录
    const parentPath = getParentPath(currentPath)
    
    console.log('⬆️ 导航到上级目录:', parentPath)
    debugPath(parentPath, '上级目录')
    
    loadFiles(parentPath)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* 头部 */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">WebDAV 文件管理器</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadFiles(currentPath)}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              <button
                onClick={() => setShowCreateFile(true)}
                className="flex items-center px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                新建文件
              </button>
              <button
                onClick={() => setShowCreateFolder(true)}
                className="flex items-center px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                <Folder className="w-4 h-4 mr-1" />
                新建文件夹
              </button>
              <label className="flex items-center px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 cursor-pointer">
                <Upload className="w-4 h-4 mr-1" />
                上传文件
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 搜索栏 */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索文件..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              搜索
            </button>
            {searchKeyword && (
              <button
                onClick={() => {
                  setSearchKeyword('')
                  loadFiles(currentPath)
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                清除
              </button>
            )}
          </div>

          {/* 当前路径和导航 */}
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              当前路径: {currentPath}
            </div>
            {currentPath !== '/' && (
              <button
                onClick={handleGoBack}
                className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
              >
                ← 返回上级目录
              </button>
            )}
          </div>
        </div>

        {/* 消息提示 */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mx-4 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* 文件列表 */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              加载中...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchKeyword ? '没有找到匹配的文件' : '目录为空'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">名称</th>
                    <th className="px-4 py-2 text-left">类型</th>
                    <th className="px-4 py-2 text-left">大小</th>
                    <th className="px-4 py-2 text-left">修改时间</th>
                    <th className="px-4 py-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="flex items-center">
                          {file.type === 'directory' ? (
                            <>
                              <Folder className="w-4 h-4 mr-2 text-blue-500" />
                              <button
                                onClick={() => handleFolderClick(file)}
                                className="truncate text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {file.name}
                              </button>
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2 text-gray-500" />
                              <span className="truncate">{file.name}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {file.type === 'directory' ? '文件夹' : '文件'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {file.type === 'file' ? formatFileSize(file.size) : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {formatDate(file.lastModified)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-1">
                          {file.type === 'file' && (
                            <>
                              <button
                                onClick={() => handleEditFile(file.path)}
                                className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                                title="编辑"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadFile(file.path)}
                                className="p-1 text-green-500 hover:bg-green-100 rounded"
                                title="下载"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteItem(file)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 新建文件模态框 */}
      {showCreateFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">新建文件</h2>
              <button
                onClick={() => setShowCreateFile(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文件名
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="例如: example.txt"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文件内容
                </label>
                <textarea
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="输入文件内容..."
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateFile(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateFile}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新建文件夹模态框 */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">新建文件夹</h2>
              <button
                onClick={() => setShowCreateFolder(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文件夹名
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="例如: documents"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateFolder(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑文件模态框 */}
      {editingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 h-3/4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">编辑文件: {editingFile}</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveFile}
                  disabled={loading}
                  className="flex items-center px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-1" />
                  保存
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full h-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default FileManager
