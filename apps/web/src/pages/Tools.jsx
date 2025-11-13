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
        <h2 style={{ color: '#dc3545' }}>加载工具错误</h2>
        <p>{error}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
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
      <div className="text-center mb-4">
        <h1 style={{ color: 'white' }}>工具</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          发现和使用强大的工具来完成各种任务和集成
        </p>
      </div>

      <div className="card mb-4">
        <h2>📊 工具统计</h2>
        <div className="grid grid-3">
          <div className="text-center">
            <h3 style={{ color: '#667eea' }}>{stats.systemTools}</h3>
            <p className="text-muted">系统工具</p>
          </div>
          <div className="text-center">
            <h3 style={{ color: '#28a745' }}>{stats.userTools}</h3>
            <p className="text-muted">用户工具</p>
          </div>
          <div className="text-center">
            <h3 style={{ color: '#ffc107' }}>{stats.projectTools}</h3>
            <p className="text-muted">项目工具</p>
          </div>
        </div>
      </div>

      {tools.system.length > 0 && (
        <div className="card mb-4">
          <h2>📦 系统工具</h2>
          <p className="text-muted mb-4">由 PromptX 提供的内置工具</p>
          <div className="grid grid-2">
            {tools.system.map((tool) => (
              <div key={tool.id} style={{ 
                border: '1px solid #dee2e6', 
                borderRadius: '8px', 
                padding: '16px',
                background: '#f8f9fa'
              }}>
                <h4>{tool.name}</h4>
                <p className="text-muted">{tool.description}</p>
                <div style={{ marginTop: '12px' }}>
                  <span className="badge badge-primary">{tool.id}</span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>手册：</strong>
                    <br />
                    <code>{tool.manualCommand}</code>
                  </div>
                  <div>
                    <strong>执行：</strong>
                    <br />
                    <code>{tool.executeCommand}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tools.user.length > 0 && (
        <div className="card mb-4">
          <h2>🛠️ 用户工具</h2>
          <p className="text-muted mb-4">由鲁班创建的自定义工具</p>
          <div className="grid grid-2">
            {tools.user.map((tool) => (
              <div key={tool.id} style={{ 
                border: '1px solid #dee2e6', 
                borderRadius: '8px', 
                padding: '16px',
                background: '#f8f9fa'
              }}>
                <h4>{tool.name}</h4>
                <p className="text-muted">{tool.description}</p>
                <div style={{ marginTop: '12px' }}>
                  <span className="badge badge-success">{tool.id}</span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>手册：</strong>
                    <br />
                    <code>{tool.manualCommand}</code>
                  </div>
                  <div>
                    <strong>执行：</strong>
                    <br />
                    <code>{tool.executeCommand}</code>
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