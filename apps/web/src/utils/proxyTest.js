/**
 * 代理配置测试工具
 */

/**
 * 测试代理连接
 */
export const testProxyConnection = async () => {
  console.log('🔍 开始测试代理连接...')
  
  try {
    // 测试基本连接
    const response = await fetch('/api/dav/', {
      method: 'PROPFIND',
      headers: {
        'Authorization': 'Basic ' + btoa('cccman:NSd7cXH548HVzsbj'),
        'Content-Type': 'application/xml',
        'Depth': '1'
      }
    })
    
    console.log('📡 代理响应状态:', response.status)
    console.log('📡 代理响应头:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      console.log('✅ 代理连接成功!')
      return {
        success: true,
        status: response.status,
        message: '代理连接正常'
      }
    } else {
      console.log('❌ 代理连接失败:', response.statusText)
      return {
        success: false,
        status: response.status,
        message: `代理连接失败: ${response.statusText}`
      }
    }
  } catch (error) {
    console.error('❌ 代理测试出错:', error)
    return {
      success: false,
      error: error.message,
      message: `代理测试失败: ${error.message}`
    }
  }
}

/**
 * 检查环境配置
 */
export const checkEnvironmentConfig = () => {
  console.log('🔧 检查环境配置...')
  
  const config = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE,
    baseUrl: import.meta.env.BASE_URL
  }
  
  console.log('📋 环境配置:', config)
  
  // 统一使用代理，不区分环境
  const expectedUrl = '/api/dav/'
  
  console.log('🎯 预期 WebDAV URL:', expectedUrl, '(统一代理模式)')
  
  return {
    ...config,
    expectedWebdavUrl: expectedUrl
  }
}

/**
 * 测试代理路径重写
 */
export const testProxyRewrite = async () => {
  console.log('🔄 测试代理路径重写...')
  
  const testPaths = [
    '/api/dav/',
    '/api/dav/test.txt',
    '/api/dav/folder/'
  ]
  
  const results = []
  
  for (const path of testPaths) {
    try {
      console.log(`📤 测试路径: ${path}`)
      
      const response = await fetch(path, {
        method: 'HEAD',
        headers: {
          'Authorization': 'Basic ' + btoa('cccman:NSd7cXH548HVzsbj')
        }
      })
      
      results.push({
        path,
        status: response.status,
        success: response.status < 500 // 404 也算成功，说明代理工作了
      })
      
      console.log(`📥 ${path} -> ${response.status}`)
    } catch (error) {
      results.push({
        path,
        error: error.message,
        success: false
      })
      console.log(`❌ ${path} -> ${error.message}`)
    }
  }
  
  return results
}

/**
 * 完整的代理诊断
 */
export const runProxyDiagnostics = async () => {
  console.log('🚀 开始完整的代理诊断...')
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: checkEnvironmentConfig(),
    connection: null,
    pathRewrite: null
  }
  
  // 测试连接
  diagnostics.connection = await testProxyConnection()
  
  // 测试路径重写
  diagnostics.pathRewrite = await testProxyRewrite()
  
  console.log('📊 诊断结果:', diagnostics)
  
  return diagnostics
}

/**
 * 在控制台显示代理状态
 */
export const showProxyStatus = () => {
  const isDev = import.meta.env.DEV
  
  console.log('🔧 WebDAV 代理状态:')
  console.log(`   环境: ${isDev ? '开发环境' : '生产环境'}`)
  console.log(`   URL: /api/dav/ (统一代理模式)`)
  console.log(`   代理: 启用`)
  
  console.log('💡 提示: 统一使用 Vite 代理解决跨域问题')
  console.log('💡 提示: 可以在网络面板查看代理请求')
}