/**
 * 路径调试工具
 */

/**
 * 标准化路径
 * @param {string} path - 原始路径
 * @returns {string} 标准化后的路径
 */
export const normalizePath = (path) => {
  if (!path || path === '') return '/'

  // 确保以 / 开头
  if (!path.startsWith('/')) {
    path = '/' + path
  }

  // 移除重复的斜杠
  path = path.replace(/\/+/g, '/')

  return path
}

/**
 * 构建文件路径
 * @param {string} currentPath - 当前目录路径
 * @param {string} fileName - 文件名
 * @returns {string} 完整的文件路径
 */
export const buildFilePath = (currentPath, fileName) => {
  const normalizedCurrent = normalizePath(currentPath)

  if (normalizedCurrent === '/') {
    return '/' + fileName
  }

  // 确保当前路径以 / 结尾
  const basePath = normalizedCurrent.endsWith('/') ? normalizedCurrent : normalizedCurrent + '/'
  return basePath + fileName
}

/**
 * 构建目录路径
 * @param {string} currentPath - 当前目录路径
 * @param {string} dirName - 目录名
 * @returns {string} 完整的目录路径
 */
export const buildDirPath = (currentPath, dirName) => {
  const normalizedCurrent = normalizePath(currentPath)

  if (normalizedCurrent === '/') {
    return '/' + dirName + '/'
  }

  // 确保当前路径以 / 结尾
  const basePath = normalizedCurrent.endsWith('/') ? normalizedCurrent : normalizedCurrent + '/'
  return basePath + dirName + '/'
}

/**
 * 获取父目录路径
 * @param {string} currentPath - 当前路径
 * @returns {string} 父目录路径
 */
export const getParentPath = (currentPath) => {
  const normalizedPath = normalizePath(currentPath)

  if (normalizedPath === '/') {
    return '/'
  }

  // 移除末尾的斜杠（如果有的话）
  let cleanPath = normalizedPath
  if (cleanPath.endsWith('/') && cleanPath !== '/') {
    cleanPath = cleanPath.slice(0, -1)
  }

  // 分割路径并移除最后一个部分
  const pathParts = cleanPath.split('/').filter(part => part !== '')
  pathParts.pop()

  return pathParts.length === 0 ? '/' : '/' + pathParts.join('/') + '/'
}

/**
 * 确保目录路径格式正确
 * @param {string} path - 路径
 * @returns {string} 格式化后的目录路径
 */
export const ensureDirPath = (path) => {
  const normalized = normalizePath(path)

  if (normalized === '/') {
    return '/'
  }

  return normalized.endsWith('/') ? normalized : normalized + '/'
}

/**
 * 调试路径信息
 * @param {string} path - 路径
 * @param {string} context - 上下文信息
 */
export const debugPath = (path, context = '') => {
  console.log(`🔍 路径调试 ${context}:`, {
    original: path,
    normalized: normalizePath(path),
    isRoot: path === '/',
    endsWithSlash: path.endsWith('/'),
    startsWithSlash: path.startsWith('/'),
    parts: path.split('/').filter(p => p !== '')
  })
}
