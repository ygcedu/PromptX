import { useEffect } from 'react'
import { usePromptX } from '../contexts/PromptXContext'

function Status() {
  const { 
    service,
    environment,
    metrics,
    workerPool,
    mcpTools,
    stats,
    isLoading, 
    hasError, 
    error, 
    refresh, 
    clearError,
    lastUpdated
  } = usePromptX()

  // 设置定时刷新
  useEffect(() => {
    const interval = setInterval(() => {
      refresh()
    }, 30000) // 每30秒刷新一次
    
    return () => clearInterval(interval)
  }, [refresh])

  if (isLoading && !service) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="card">
        <h2 className="text-red-500">加载状态错误</h2>
        <p>{error}</p>
        <div className="flex gap-3">
          <button onClick={refresh} className="btn btn-primary">
            重试
          </button>
          <button onClick={clearError} className="btn btn-secondary">
            清除错误
          </button>
        </div>
      </div>
    )
  }

  // 如果没有数据，显示加载状态
  if (!service) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 mb-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              📊
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">系统状态</h1>
              <p className="text-white/80 text-sm leading-tight">
                监控 PromptX MCP 服务器状态和性能指标
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
              <div className={`w-3 h-3 rounded-full ${
                service.status === 'running' ? 'bg-green-300' : 'bg-red-300'
              }`}></div>
              <span className="text-white font-medium text-sm">
                {service.status === 'running' ? '运行中' : service.status}
              </span>
            </div>
            <button 
              onClick={refresh} 
              className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all duration-200 text-sm font-medium"
              disabled={isLoading}
            >
              {isLoading ? '刷新中...' : '刷新'}
            </button>
            {lastUpdated && (
              <span className="text-white/70 text-xs">
                {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
              🚀
            </div>
            <h3 className="text-lg font-bold text-gray-900">服务信息</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-gray-600 text-sm">名称</span>
              <span className="font-semibold text-gray-900">{service.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-gray-600 text-sm">版本</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {service.version}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-gray-600 text-sm">状态</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                service.status === 'running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {service.status === 'running' ? '运行中' : service.status}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-gray-600 text-sm">传输</span>
              <span className="font-medium text-gray-900">{service.transport}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 text-sm">地址</span>
              <span className="font-mono text-sm text-gray-900">{service.host}:{service.port}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
              🌍
            </div>
            <h3 className="text-lg font-bold text-gray-900">环境信息</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-emerald-100">
              <span className="text-gray-600 text-sm">Node.js</span>
              <span className="font-semibold text-gray-900">{environment.nodeVersion}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-emerald-100">
              <span className="text-gray-600 text-sm">平台</span>
              <span className="font-medium text-gray-900">{environment.platform}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-emerald-100">
              <span className="text-gray-600 text-sm">架构</span>
              <span className="font-medium text-gray-900">{environment.arch}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 text-sm">进程 ID</span>
              <span className="font-mono text-sm text-gray-900">{environment.pid}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
              📊
            </div>
            <h3 className="text-lg font-bold text-gray-900">请求指标</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-purple-100">
              <span className="text-gray-600 text-sm">总请求数</span>
              <span className="font-bold text-lg text-gray-900">{metrics.requests.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-purple-100">
              <span className="text-gray-600 text-sm">错误数</span>
              <span className={`font-semibold ${
                metrics.requests.errors > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {metrics.requests.errors}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 text-sm">成功率</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {metrics.requests.successRate}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
              ⚙️
            </div>
            <h3 className="text-lg font-bold text-gray-900">工作线程池</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-orange-100">
              <span className="text-gray-600 text-sm">状态</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {workerPool.status === 'initialized' ? '已初始化' : workerPool.status}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-orange-100">
              <span className="text-gray-600 text-sm">活跃线程</span>
              <span className="font-bold text-lg text-gray-900">{workerPool.workers.active}/{workerPool.workers.total}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-orange-100">
              <span className="text-gray-600 text-sm">等待中</span>
              <span className="font-medium text-gray-900">{workerPool.workers.pending}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 text-sm">可用</span>
              <span className="font-medium text-gray-900">{workerPool.workers.available}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
              🔧
            </div>
            <h3 className="text-lg font-bold text-gray-900">MCP 工具</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-cyan-100">
              <span className="text-gray-600 text-sm">总工具数</span>
              <span className="font-bold text-lg text-gray-900">{mcpTools.total}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-cyan-100">
              <span className="text-gray-600 text-sm">线程池工具</span>
              <span className="font-medium text-gray-900">{mcpTools.workerPoolTools}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 text-sm">直接工具</span>
              <span className="font-medium text-gray-900">{mcpTools.directTools}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
              🎭
            </div>
            <h3 className="text-lg font-bold text-gray-900">PromptX 资源</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-rose-100">
              <span className="text-gray-600 text-sm">总角色数</span>
              <span className="font-bold text-lg text-gray-900">{stats.totalRoles}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-rose-100">
              <span className="text-gray-600 text-sm">系统角色</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {stats.systemRoles}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-rose-100">
              <span className="text-gray-600 text-sm">用户角色</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                {stats.userRoles}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-rose-100">
              <span className="text-gray-600 text-sm">总工具数</span>
              <span className="font-bold text-lg text-gray-900">{stats.totalTools}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-rose-100">
              <span className="text-gray-600 text-sm">系统工具</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {stats.systemTools}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 text-sm">用户工具</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                {stats.userTools}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
            📈
          </div>
          <h3 className="text-lg font-bold text-gray-900">系统健康</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-2xl shadow-lg
              ${service.status === 'running' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}
            `}>
              {service.status === 'running' ? '✓' : '✗'}
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">服务</h4>
            <p className="text-sm text-gray-600">{service.status === 'running' ? '运行中' : service.status}</p>
          </div>
          <div className="text-center bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-2xl shadow-lg
              ${workerPool.status === 'initialized' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}
            `}>
              {workerPool.status === 'initialized' ? '✓' : '✗'}
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">线程池</h4>
            <p className="text-sm text-gray-600">{workerPool.status === 'initialized' ? '已初始化' : workerPool.status}</p>
          </div>
          <div className="text-center bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-2xl shadow-lg
              ${parseFloat(metrics.requests.successRate) > 95 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-yellow-500 to-orange-600'}
            `}>
              {parseFloat(metrics.requests.successRate) > 95 ? '✓' : '!'}
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">成功率</h4>
            <p className="text-sm text-gray-600">{metrics.requests.successRate}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Status