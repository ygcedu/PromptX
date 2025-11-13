import { usePromptX } from '../contexts/PromptXContext'

function Roles() {
  const { 
    roles, 
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
        <h2 style={{ color: '#dc3545' }}>加载角色错误</h2>
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
        <h1 style={{ color: 'white' }}>AI 角色</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          管理和激活不同任务和场景的 AI 角色
        </p>
      </div>

      <div className="card mb-4">
        <h2>📊 角色统计</h2>
        <div className="grid grid-3">
          <div className="text-center">
            <h3 style={{ color: '#667eea' }}>{stats.systemRoles}</h3>
            <p className="text-muted">系统角色</p>
          </div>
          <div className="text-center">
            <h3 style={{ color: '#28a745' }}>{stats.userRoles}</h3>
            <p className="text-muted">用户角色</p>
          </div>
          <div className="text-center">
            <h3 style={{ color: '#ffc107' }}>{stats.projectRoles}</h3>
            <p className="text-muted">项目角色</p>
          </div>
        </div>
      </div>

      {roles.system.length > 0 && (
        <div className="card mb-4">
          <h2>📦 系统角色</h2>
          <p className="text-muted mb-4">由 PromptX 提供的内置角色</p>
          <div className="grid grid-2">
            {roles.system.map((role) => (
              <div key={role.id} style={{ 
                border: '1px solid #dee2e6', 
                borderRadius: '8px', 
                padding: '16px',
                background: '#f8f9fa'
              }}>
                <h4>{role.name}</h4>
                <p className="text-muted">{role.description}</p>
                <div style={{ marginTop: '12px' }}>
                  <span className="badge badge-primary">{role.id}</span>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <code style={{ fontSize: '12px' }}>{role.activateCommand}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {roles.user.length > 0 && (
        <div className="card mb-4">
          <h2>👤 用户角色</h2>
          <p className="text-muted mb-4">由女娲创建的自定义角色</p>
          <div className="grid grid-2">
            {roles.user.map((role) => (
              <div key={role.id} style={{ 
                border: '1px solid #dee2e6', 
                borderRadius: '8px', 
                padding: '16px',
                background: '#f8f9fa'
              }}>
                <h4>{role.name}</h4>
                <p className="text-muted">{role.description}</p>
                <div style={{ marginTop: '12px' }}>
                  <span className="badge badge-success">{role.id}</span>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <code style={{ fontSize: '12px' }}>{role.activateCommand}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {roles.project.length === 0 && roles.user.length === 0 && roles.system.length === 0 && (
        <div className="card text-center">
          <h3>未找到角色</h3>
          <p className="text-muted">当前没有可用的角色。</p>
          <button onClick={refresh} className="btn btn-primary">
            刷新
          </button>
        </div>
      )}
    </div>
  )
}

export default Roles