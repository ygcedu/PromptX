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
        <h2 style={{ color: '#dc3545' }}>Error Loading Tools</h2>
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
        <h1 style={{ color: 'white' }}>Tools</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Discover and use powerful tools for various tasks and integrations
        </p>
      </div>

      <div className="card mb-4">
        <h2>📊 Tool Statistics</h2>
        <div className="grid grid-3">
          <div className="text-center">
            <h3 style={{ color: '#667eea' }}>{stats.systemTools}</h3>
            <p className="text-muted">System Tools</p>
          </div>
          <div className="text-center">
            <h3 style={{ color: '#28a745' }}>{stats.userTools}</h3>
            <p className="text-muted">User Tools</p>
          </div>
          <div className="text-center">
            <h3 style={{ color: '#ffc107' }}>{stats.projectTools}</h3>
            <p className="text-muted">Project Tools</p>
          </div>
        </div>
      </div>

      {tools.system.length > 0 && (
        <div className="card mb-4">
          <h2>📦 System Tools</h2>
          <p className="text-muted mb-4">Built-in tools provided by PromptX</p>
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
                    <strong>Manual:</strong>
                    <br />
                    <code>{tool.manualCommand}</code>
                  </div>
                  <div>
                    <strong>Execute:</strong>
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
          <h2>🛠️ User Tools</h2>
          <p className="text-muted mb-4">Custom tools created by Luban</p>
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
                    <strong>Manual:</strong>
                    <br />
                    <code>{tool.manualCommand}</code>
                  </div>
                  <div>
                    <strong>Execute:</strong>
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
          <h3>No Tools Found</h3>
          <p className="text-muted">No tools are currently available.</p>
          <button onClick={refresh} className="btn btn-primary">
            Refresh
          </button>
        </div>
      )}
    </div>
  )
}

export default Tools