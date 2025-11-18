import webdavStorage from './webdavStorage.js'
import { ensureDirPath } from "../utils/pathDebug.js"

/**
 * 文件管理服务
 * 提供文件的增删改查功能
 */
class FileManager {
  constructor() {
    this.storage = webdavStorage.getStorage()
    this.client = webdavStorage.getClient()
  }

  /**
   * 创建文件
   * @param {string} filename - 文件路径
   * @param {string} content - 文件内容
   * @returns {Promise<boolean>} 是否创建成功
   */
  async createFile(filename, content = '') {
    try {
      console.log(`📝 创建文件: ${filename}`)
      // 直接使用 WebDAV 客户端创建文件
      await this.client.putFileContents(filename, content, { overwrite: true })
      console.log(`文件 ${filename} 创建成功`)
      return true
    } catch (error) {
      console.error(`创建文件 ${filename} 失败:`, error)
      throw new Error(`创建文件失败: ${error.message}`)
    }
  }

  /**
   * 读取文件内容
   * @param {string} filename - 文件路径
   * @returns {Promise<string|null>} 文件内容
   */
  async readFile(filename) {
    try {
      // 直接使用 WebDAV 客户端读取文件
      const content = await this.client.getFileContents(filename, { format: 'text' })
      console.log(`文件 ${filename} 读取成功`)
      return content
    } catch (error) {
      console.error(`读取文件 ${filename} 失败:`, error)
      throw new Error(`读取文件失败: ${error.message}`)
    }
  }

  /**
   * 更新文件内容
   * @param {string} filename - 文件路径
   * @param {string} content - 新的文件内容
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateFile(filename, content) {
    try {
      // 直接使用 WebDAV 客户端更新文件
      await this.client.putFileContents(filename, content, { overwrite: true })
      console.log(`文件 ${filename} 更新成功`)
      return true
    } catch (error) {
      console.error(`更新文件 ${filename} 失败:`, error)
      throw new Error(`更新文件失败: ${error.message}`)
    }
  }

  /**
   * 删除文件
   * @param {string} filename - 文件路径
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteFile(filename) {
    try {
      console.log(`🗑️ 删除文件: ${filename}`)
      // 直接使用 WebDAV 客户端删除文件
      await this.client.deleteFile(filename)
      console.log(`文件 ${filename} 删除成功`)
      return true
    } catch (error) {
      console.error(`删除文件 ${filename} 失败:`, error)
      throw new Error(`删除文件失败: ${error.message}`)
    }
  }

  /**
   * 检查文件是否存在
   * @param {string} filename - 文件路径
   * @returns {Promise<boolean>} 文件是否存在
   */
  async fileExists(filename) {
    try {
      const exists = await this.client.exists(filename)
      return exists
    } catch (error) {
      console.error(`检查文件 ${filename} 是否存在失败:`, error)
      return false
    }
  }

  /**
   * 获取文件列表
   * @param {string} path - 目录路径，默认为根目录
   * @returns {Promise<Array>} 文件列表
   */
  async listFiles(path = '/') {
    try {
      console.log(`📁 获取目录内容: ${path}`)
      const contents = await this.client.getDirectoryContents(path, { includeSelf: false })
      const files = contents.map(item => {
        console.log(`📄 文件项目:`, {
          basename: item.basename,
          filename: item.filename,
          type: item.type,
          size: item.size
        })

        return {
          name: item.basename,
          path: item.filename,
          type: item.type, // 'file' 或 'directory'
          size: item.size,
          lastModified: item.lastmod,
          etag: item.etag,
          mime: item.mime
        }
      })

      console.log(`获取目录 ${path} 的文件列表成功，共 ${files.length} 个项目`)
      return files
    } catch (error) {
      console.error(`获取文件列表失败:`, error)
      throw new Error(`获取文件列表失败: ${error.message}`)
    }
  }

  /**
   * 创建目录
   * @param {string} dirPath - 目录路径
   * @returns {Promise<boolean>} 是否创建成功
   */
  async createDirectory(dirPath) {
    try {
      console.log(`📁 创建目录: ${dirPath}`)
      await this.client.createDirectory(dirPath)
      console.log(`目录 ${dirPath} 创建成功`)
      return true
    } catch (error) {
      console.error(`创建目录 ${dirPath} 失败:`, error)
      throw new Error(`创建目录失败: ${error.message}`)
    }
  }

  /**
   * 删除目录
   * @param {string} dirPath - 目录路径
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteDirectory(dirPath) {
    try {
      // 使用路径工具确保目录路径格式正确
      const newPath = ensureDirPath(dirPath)

      console.log(`🗑️ 删除目录: ${newPath}`)
      // WebDAV 中删除目录也使用 deleteFile 方法
      await this.client.deleteFile(newPath)
      console.log(`目录 ${newPath} 删除成功`)
      return true
    } catch (error) {
      console.error(`删除目录 ${dirPath} 失败:`, error)
      throw new Error(`删除目录失败: ${error.message}`)
    }
  }

  /**
   * 移动/重命名文件
   * @param {string} fromPath - 源路径
   * @param {string} toPath - 目标路径
   * @returns {Promise<boolean>} 是否移动成功
   */
  async moveFile(fromPath, toPath) {
    try {
      await this.client.moveFile(fromPath, toPath)
      console.log(`文件从 ${fromPath} 移动到 ${toPath} 成功`)
      return true
    } catch (error) {
      console.error(`移动文件失败:`, error)
      throw new Error(`移动文件失败: ${error.message}`)
    }
  }

  /**
   * 复制文件
   * @param {string} fromPath - 源路径
   * @param {string} toPath - 目标路径
   * @returns {Promise<boolean>} 是否复制成功
   */
  async copyFile(fromPath, toPath) {
    try {
      await this.client.copyFile(fromPath, toPath)
      console.log(`文件从 ${fromPath} 复制到 ${toPath} 成功`)
      return true
    } catch (error) {
      console.error(`复制文件失败:`, error)
      throw new Error(`复制文件失败: ${error.message}`)
    }
  }

  /**
   * 获取文件信息
   * @param {string} filename - 文件名
   * @returns {Promise<Object>} 文件信息
   */
  async getFileInfo(filename) {
    try {
      const stat = await this.client.stat(filename)

      const fileInfo = {
        name: stat.basename,
        path: stat.filename,
        type: stat.type,
        size: stat.size,
        lastModified: stat.lastmod,
        etag: stat.etag,
        mime: stat.mime
      }

      console.log(`获取文件 ${filename} 信息成功`)
      return fileInfo
    } catch (error) {
      console.error(`获取文件信息失败:`, error)
      throw new Error(`获取文件信息失败: ${error.message}`)
    }
  }

  /**
   * 批量上传文件
   * @param {Array} files - 文件数组 [{name, content}, ...]，name 应该是完整路径
   * @returns {Promise<Array>} 上传结果
   */
  async uploadFiles(files) {
    const results = []

    for (const file of files) {
      try {
        await this.createFile(file.name, file.content)
        // 只显示文件名，不显示完整路径
        const displayName = file.name.split('/').pop()
        results.push({ name: displayName, success: true })
      } catch (error) {
        const displayName = file.name.split('/').pop()
        results.push({ name: displayName, success: false, error: error.message })
      }
    }

    console.log(`批量上传完成，成功: ${results.filter(r => r.success).length}，失败: ${results.filter(r => !r.success).length}`)
    return results
  }

  /**
   * 搜索文件
   * @param {string} keyword - 搜索关键词
   * @param {string} path - 搜索路径，默认为根目录
   * @returns {Promise<Array>} 匹配的文件列表
   */
  async searchFiles(keyword, path = '/') {
    try {
      const allFiles = await this.listFiles(path)
      const matchedFiles = allFiles.filter(file =>
        file.name.toLowerCase().includes(keyword.toLowerCase())
      )

      console.log(`搜索关键词 "${keyword}" 找到 ${matchedFiles.length} 个匹配文件`)
      return matchedFiles
    } catch (error) {
      console.error(`搜索文件失败:`, error)
      throw new Error(`搜索文件失败: ${error.message}`)
    }
  }
}

// 创建单例实例
const fileManager = new FileManager()

export default fileManager
