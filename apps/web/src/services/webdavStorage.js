import { createStorage } from 'unstorage'
import { createClient } from 'webdav'

/**
 * WebDAV 存储配置
 */
class WebDAVStorage {
  constructor() {
    // 统一使用代理，不区分开发和生产环境
    this.webdavUrl = '/api/dav/'
    this.username = 'cccman'
    this.password = 'NSd7cXH548HVzsbj'
    
    console.log('WebDAV URL:', this.webdavUrl, '(统一代理模式)')
    
    // 创建 WebDAV 客户端
    this.client = createClient(this.webdavUrl, {
      username: this.username,
      password: this.password,
      // 代理模式下的配置
      withCredentials: false,
      maxRedirects: 5,
      // 设置远程基础路径，告诉客户端实际的服务器路径结构
      // 这样可以避免路径计算错误
      remoteBasePath: '/dav'
    })
    
    // 创建 unstorage 实例
    this.storage = createStorage({
      driver: this.createWebDAVDriver()
    })
  }

  /**
   * 创建自定义 WebDAV 驱动
   */
  createWebDAVDriver() {
    const client = this.client
    
    return {
      name: 'webdav',
      options: {},
      
      async hasItem(key) {
        try {
          const exists = await client.exists(key)
          return exists
        } catch (error) {
          console.error('检查文件是否存在失败:', error)
          return false
        }
      },
      
      async getItem(key) {
        try {
          const content = await client.getFileContents(key, { format: 'text' })
          return content
        } catch (error) {
          console.error('读取文件失败:', error)
          return null
        }
      },
      
      async setItem(key, value) {
        try {
          await client.putFileContents(key, value, { overwrite: true })
          return true
        } catch (error) {
          console.error('写入文件失败:', error)
          throw error
        }
      },
      
      async removeItem(key) {
        try {
          await client.deleteFile(key)
          return true
        } catch (error) {
          console.error('删除文件失败:', error)
          throw error
        }
      },
      
      async getKeys() {
        try {
          const contents = await client.getDirectoryContents('/')
          return contents
            .filter(item => item.type === 'file')
            .map(item => item.filename)
        } catch (error) {
          console.error('获取文件列表失败:', error)
          return []
        }
      },
      
      async clear() {
        try {
          const contents = await client.getDirectoryContents('/')
          const deletePromises = contents
            .filter(item => item.type === 'file')
            .map(item => client.deleteFile(item.filename))
          
          await Promise.all(deletePromises)
          return true
        } catch (error) {
          console.error('清空目录失败:', error)
          throw error
        }
      }
    }
  }

  /**
   * 获取存储实例
   */
  getStorage() {
    return this.storage
  }

  /**
   * 获取 WebDAV 客户端
   */
  getClient() {
    return this.client
  }
}

// 创建单例实例
const webdavStorage = new WebDAVStorage()

export default webdavStorage