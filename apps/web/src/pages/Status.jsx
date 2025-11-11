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
        <h2 style={{ color: '#dc3545' }}>Error Loading Status</h2>
        <p>{error}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={refresh} className="btn btn-primary">
            Retry
          </button>
          <button onClick={clearError} className="btn btn-secondary">
            Clear Error
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
        <h1 style={{ color: 'white' }}>System Status</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Monitor PromptX MCP Server status and performance metrics
        </p>
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
          <button 
            onClick={refresh} 
            className="btn btn-secondary"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Status'}
          </button>
          {lastUpdated && (
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <h3>🚀 Service Information</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Name:</span>
              <strong>{service.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Version:</span>
              <span className="badge badge-primary">{service.version}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Status:</span>
              <span className={`badge ${service.status === 'running' ? 'badge-success' : 'badge-danger'}`}>
                {service.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Transport:</span>
              <span>{service.transport}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Address:</span>
              <span>{service.host}:{service.port}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>🌍 Environment</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Node.js:</span>
              <span>{environment.nodeVersion}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Platform:</span>
              <span>{environment.platform}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Architecture:</span>
              <span>{environment.arch}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Process ID:</span>
              <span>{environment.pid}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <h3>📊 Request Metrics</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Requests:</span>
              <strong>{metrics.requests.total.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Errors:</span>
              <span style={{ color: metrics.requests.errors > 0 ? '#dc3545' : '#28a745' }}>
                {metrics.requests.errors}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Success Rate:</span>
              <span className="badge badge-success">{metrics.requests.successRate}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>⚙️ Worker Pool</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Status:</span>
              <span className="badge badge-success">{workerPool.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Active Workers:</span>
              <strong>{workerPool.workers.active}/{workerPool.workers.total}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pending:</span>
              <span>{workerPool.workers.pending}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Available:</span>
              <span>{workerPool.workers.available}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <h3>🔧 MCP Tools</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Tools:</span>
              <strong>{mcpTools.total}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Worker Pool Tools:</span>
              <span>{mcpTools.workerPoolTools}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Direct Tools:</span>
              <span>{mcpTools.directTools}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>🎭 PromptX Resources</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Roles:</span>
              <strong>{stats.totalRoles}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>System Roles:</span>
              <span className="badge badge-primary">{stats.systemRoles}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>User Roles:</span>
              <span className="badge badge-success">{stats.userRoles}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Tools:</span>
              <strong>{stats.totalTools}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>System Tools:</span>
              <span className="badge badge-primary">{stats.systemTools}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>User Tools:</span>
              <span className="badge badge-success">{stats.userTools}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>📈 System Health</h3>
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
            <h4>Service</h4>
            <p className="text-muted">{service.status}</p>
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
            <h4>Worker Pool</h4>
            <p className="text-muted">{workerPool.status}</p>
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
            <h4>Success Rate</h4>
            <p className="text-muted">{metrics.requests.successRate}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Status