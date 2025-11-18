import React, { useState, useEffect } from 'react'
import { testWebDAVConnection, quickConnectionTest, testBatchOperations } from '../services/webdavTest.js'
import { runDemo, cleanupDemo, quickTest } from '../services/demo.js'
import { testProxyConnection, runProxyDiagnostics, showProxyStatus } from '../utils/proxyTest.js'
import { Play, CheckCircle, XCircle, Loader, Sparkles, Trash2, Network } from 'lucide-react'

const WebDAVTest = () => {
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState({})
  
  // 组件加载时显示代理状态
  useEffect(() => {
    showProxyStatus()
  }, [])

  const runTest = async (testName, testFunction) => {
    setLoading(prev => ({ ...prev, [testName]: true }))
    try {
      const result = await testFunction()
      setTestResults(prev => ({ ...prev, [testName]: result }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          message: error.message,
          error
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }))
    }
  }

  const tests = [
    {
      name: 'proxyTest',
      title: '代理连接测试',
      description: '测试 Vite 代理配置是否正常工作',
      function: testProxyConnection,
      icon: Network
    },
    {
      name: 'quickConnection',
      title: '快速连接测试',
      description: '测试 WebDAV 服务器连接',
      function: quickConnectionTest,
      icon: Play
    },
    {
      name: 'quickTest',
      title: '快速功能测试',
      description: '快速测试基本的增删改查功能',
      function: quickTest,
      icon: Play
    },
    {
      name: 'fullTest',
      title: '完整功能测试',
      description: '测试文件的增删改查功能',
      function: testWebDAVConnection,
      icon: CheckCircle
    },
    {
      name: 'batchTest',
      title: '批量操作测试',
      description: '测试批量上传和搜索功能',
      function: testBatchOperations,
      icon: CheckCircle
    },
    {
      name: 'demo',
      title: '功能演示',
      description: '创建演示文件并展示所有功能',
      function: runDemo,
      icon: Sparkles
    },
    {
      name: 'cleanup',
      title: '清理演示文件',
      description: '删除演示过程中创建的文件',
      function: cleanupDemo,
      icon: Trash2
    },
    {
      name: 'proxyDiagnostics',
      title: '代理诊断',
      description: '完整的代理配置诊断和测试',
      function: runProxyDiagnostics,
      icon: Network
    }
  ]

  const getStatusIcon = (testName) => {
    if (loading[testName]) {
      return <Loader className="w-5 h-5 animate-spin text-blue-500" />
    }

    const result = testResults[testName]
    if (!result) {
      return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
    }

    return result.success
      ? <CheckCircle className="w-5 h-5 text-green-500" />
      : <XCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusColor = (testName) => {
    if (loading[testName]) return 'border-blue-200 bg-blue-50'

    const result = testResults[testName]
    if (!result) return 'border-gray-200 bg-white'

    return result.success
      ? 'border-green-200 bg-green-50'
      : 'border-red-200 bg-red-50'
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">WebDAV 功能测试</h2>

        <div className="space-y-4">
          {tests.map((test) => (
            <div
              key={test.name}
              className={`border rounded-lg p-4 transition-all duration-200 ${getStatusColor(test.name)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.name)}
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <test.icon className="w-4 h-4 mr-2 text-gray-500" />
                      {test.title}
                    </h3>
                    <p className="text-sm text-gray-600">{test.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => runTest(test.name, test.function)}
                  disabled={loading[test.name]}
                  className={`flex items-center px-4 py-2 text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${
                    test.name === 'cleanup' ? 'bg-red-500 hover:bg-red-600' :
                    test.name === 'demo' ? 'bg-purple-500 hover:bg-purple-600' :
                    'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  <test.icon className="w-4 h-4 mr-1" />
                  {loading[test.name] ? '执行中...' :
                   test.name === 'cleanup' ? '清理文件' :
                   test.name === 'demo' ? '运行演示' : '运行测试'}
                </button>
              </div>

              {testResults[test.name] && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <div className={`text-sm font-medium mb-2 ${
                    testResults[test.name].success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResults[test.name].success ? '✅ 测试通过' : '❌ 测试失败'}
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    {testResults[test.name].message}
                  </div>

                  {testResults[test.name].details && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>详细信息:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {JSON.stringify(testResults[test.name].details, null, 2)}
                      </pre>
                    </div>
                  )}

                  {testResults[test.name].error && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                      <strong>错误信息:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {testResults[test.name].error.message || testResults[test.name].error}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">测试说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>代理连接测试</strong>: 验证 Vite 代理配置是否正常工作</li>
            <li>• <strong>快速连接测试</strong>: 验证能否连接到 WebDAV 服务器并获取文件列表</li>
            <li>• <strong>快速功能测试</strong>: 快速验证基本的文件增删改查功能</li>
            <li>• <strong>完整功能测试</strong>: 测试文件的创建、读取、更新、删除等完整流程</li>
            <li>• <strong>批量操作测试</strong>: 测试批量文件上传和搜索功能</li>
            <li>• <strong>功能演示</strong>: 创建演示文件并展示所有功能特性</li>
            <li>• <strong>清理演示文件</strong>: 删除演示过程中创建的所有文件</li>
            <li>• <strong>代理诊断</strong>: 完整的代理配置诊断和测试</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">WebDAV 配置信息</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <div><strong>原始服务器:</strong> https://rausu.infini-cloud.net/dav/</div>
            <div><strong>代理地址:</strong> /api/dav/ (统一代理)</div>
            <div><strong>用户名:</strong> cccman</div>
            <div><strong>密码:</strong> ••••••••••••••••</div>
            <div><strong>跨域解决:</strong> Vite 代理配置</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">使用建议</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• 首次使用建议先运行 <strong>代理连接测试</strong> 验证代理配置</li>
            <li>• 然后运行 <strong>快速连接测试</strong> 验证 WebDAV 连接</li>
            <li>• 运行 <strong>功能演示</strong> 可以快速了解所有功能特性</li>
            <li>• 测试完成后使用 <strong>清理演示文件</strong> 保持目录整洁</li>
            <li>• 所有操作都会在浏览器控制台输出详细日志</li>
            <li>• 统一使用 Vite 代理解决跨域问题</li>
          </ul>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">代理配置说明</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• 统一使用 <code>/api/dav/</code> 代理到 WebDAV 服务器</li>
            <li>• 不区分开发和生产环境，一律使用代理</li>
            <li>• 代理配置在 <code>vite.config.js</code> 中定义</li>
            <li>• 自动处理路径重写和跨域头</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default WebDAVTest
