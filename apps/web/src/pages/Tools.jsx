import { usePromptX } from '../contexts/PromptXContext'

function Tools() {
  const { 
    tools, 
    stats, 
    isLoading, 
    hasError, 
    error, 
    refresh, 
    clearError 
  } = usePromptX()

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="card">
        <h2 className="text-red-500">加载工具错误</h2>
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

  return (
    <div>
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 mb-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              🔧
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">工具箱</h1>
              <p className="text-white/80 text-sm leading-tight">
                发现和使用强大的工具来完成各种任务和集成
              </p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <div className="text-2xl font-bold text-white">{stats.systemTools}</div>
              <div className="text-xs text-white/70 font-medium">系统工具</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <div className="text-2xl font-bold text-white">{stats.userTools}</div>
              <div className="text-xs text-white/70 font-medium">用户工具</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <div className="text-2xl font-bold text-white">{stats.projectTools}</div>
              <div className="text-xs text-white/70 font-medium">项目工具</div>
            </div>
          </div>
        </div>
      </div>

      {tools.system.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
              📦
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">系统工具</h2>
              <p className="text-gray-600 text-sm">由 PromptX 提供的内置工具</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.system.map((tool) => (
              <div key={tool.id} className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🔧</span>
                  </div>
                </div>
                <div className="pr-12">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h4>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{tool.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {tool.id}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">手册命令</p>
                      <code className="text-xs text-gray-700 font-mono break-all">{tool.manualCommand}</code>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">执行命令</p>
                      <code className="text-xs text-gray-700 font-mono break-all">{tool.executeCommand}</code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tools.user.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
              🛠️
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">用户工具</h2>
              <p className="text-gray-600 text-sm">由鲁班创建的自定义工具</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.user.map((tool) => (
              <div key={tool.id} className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🔧</span>
                  </div>
                </div>
                <div className="pr-12">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h4>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{tool.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {tool.id}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">手册命令</p>
                      <code className="text-xs text-gray-700 font-mono break-all">{tool.manualCommand}</code>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">执行命令</p>
                      <code className="text-xs text-gray-700 font-mono break-all">{tool.executeCommand}</code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tools.project.length === 0 && tools.user.length === 0 && tools.system.length === 0 && (
        <div className="card text-center">
          <h3>未找到工具</h3>
          <p className="text-muted">当前没有可用的工具。</p>
          <button onClick={refresh} className="btn btn-primary">
            刷新
          </button>
        </div>
      )}
    </div>
  )
}

export default Tools