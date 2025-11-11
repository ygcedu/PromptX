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
        <h2 style={{ color: '#dc3545' }}>Error Loading Roles</h2>
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

  return (
    <div>
      <div className="text-center mb-4">
        <h1 style={{ color: 'white' }}>AI Roles</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Manage and activate AI roles for different tasks and scenarios
        </p>
      </div>

      <div className="card mb-4">
        <h2>📊 Role Statistics</h2>
        <div className="grid grid-3">
          <div className="text-center">
            <h3 style={{ color: '#667eea' }}>{stats.systemRoles}</h3>
            <p className="text-muted">System Roles</p>
          </div>
          <div className="text-center">
            <h3 style={{ color: '#28a745' }}>{stats.userRoles}</h3>
            <p className="text-muted">User Roles</p>
          </div>
          <div className="text-center">
            <h3 style={{ color: '#ffc107' }}>{stats.projectRoles}</h3>
            <p className="text-muted">Project Roles</p>
          </div>
        </div>
      </div>

      {roles.system.length > 0 && (
        <div className="card mb-4">
          <h2>📦 System Roles</h2>
          <p className="text-muted mb-4">Built-in roles provided by PromptX</p>
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
          <h2>👤 User Roles</h2>
          <p className="text-muted mb-4">Custom roles created by Nuwa</p>
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
          <h3>No Roles Found</h3>
          <p className="text-muted">No roles are currently available.</p>
          <button onClick={refresh} className="btn btn-primary">
            Refresh
          </button>
        </div>
      )}
    </div>
  )
}

export default Roles