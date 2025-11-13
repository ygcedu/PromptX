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
        <h2 style={{ color: '#dc3545' }}>加载状态错误</h2>
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
      <div className="text-center mb-4">
        <h1 style={{ color: 'white' }}>系统状态</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          监控 PromptX MCP 服务器状态和性能指标
        </p>
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
          <button 
            onClick={refresh} 
            className="btn btn-secondary"
            disabled={isLoading}
          >
            {isLoading ? '刷新中...' : '刷新状态'}
          </button>
          {lastUpdated && (
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              最后更新： {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <h3>🚀 服务信息</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>名称：</span>
              <strong>{service.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>版本：</span>
              <span className="badge badge-primary">{service.version}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>状态：</span>
              <span className={`badge ${service.status === 'running' ? 'badge-success' : 'badge-danger'}`}>
                {service.status === 'running' ? '运行中' : service.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>传输：</span>
              <span>{service.transport}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>地址：</span>
              <span>{service.host}:{service.port}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>🌍 环境信息</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Node.js：</span>
              <span>{environment.nodeVersion}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>平台：</span>
              <span>{environment.platform}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>架构：</span>
              <span>{environment.arch}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>进程 ID：</span>
              <span>{environment.pid}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <h3>📊 请求指标</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>总请求数：</span>
              <strong>{metrics.requests.total.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>错误数：</span>
              <span style={{ color: metrics.requests.errors > 0 ? '#dc3545' : '#28a745' }}>
                {metrics.requests.errors}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>成功率：</span>
              <span className="badge badge-success">{metrics.requests.successRate}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>⚙️ 工作线程池</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>状态：</span>
              <span className="badge badge-success">{workerPool.status === 'initialized' ? '已初始化' : workerPool.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>活跃工作线程：</span>
              <strong>{workerPool.workers.active}/{workerPool.workers.total}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>等待中：</span>
              <span>{workerPool.workers.pending}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>可用：</span>
              <span>{workerPool.workers.available}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <h3>🔧 MCP 工具</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>总工具数：</span>
              <strong>{mcpTools.total}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>工作线程池工具：</span>
              <span>{mcpTools.workerPoolTools}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>直接工具：</span>
              <span>{mcpTools.directTools}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>🎭 PromptX 资源</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>总角色数：</span>
              <strong>{stats.totalRoles}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>系统角色：</span>
              <span className="badge badge-primary">{stats.systemRoles}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>用户角色：</span>
              <span className="badge badge-success">{stats.userRoles}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>总工具数：</span>
              <strong>{stats.totalTools}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>系统工具：</span>
              <span className="badge badge-primary">{stats.systemTools}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>用户工具：</span>
              <span className="badge badge-success">{stats.userTools}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>📈 系统健康</h3>
        <div className="grid grid-3">
          <div className="text-center">
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: service.status === 'running' ? '#28a745' : '#dc3545',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'white',
              fontSize: '24px'
            }}>
              {service.status === 'running' ? '✓' : '✗'}
            </div>
            <h4>服务</h4>
            <p className="text-muted">{service.status === 'running' ? '运行中' : service.status}</p>
          </div>
          <div className="text-center">
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: workerPool.status === 'initialized' ? '#28a745' : '#dc3545',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'white',
              fontSize: '24px'
            }}>
              {workerPool.status === 'initialized' ? '✓' : '✗'}
            </div>
            <h4>工作线程池</h4>
            <p className="text-muted">{workerPool.status === 'initialized' ? '已初始化' : workerPool.status}</p>
          </div>
          <div className="text-center">
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: parseFloat(metrics.requests.successRate) > 95 ? '#28a745' : '#ffc107',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'white',
              fontSize: '24px'
            }}>
              {parseFloat(metrics.requests.successRate) > 95 ? '✓' : '!'}
            </div>
            <h4>成功率</h4>
            <p className="text-muted">{metrics.requests.successRate}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Status