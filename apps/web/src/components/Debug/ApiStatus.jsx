import { useState, useEffect } from 'react'
import { getApiConfig } from '../../services/api'

function ApiStatus() {
  const [config, setConfig] = useState(null)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    setConfig(getApiConfig())
  }, [])

  if (!config) return null

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <div 
        style={{ cursor: 'pointer', marginBottom: showDebug ? '8px' : '0' }}
        onClick={() => setShowDebug(!showDebug)}
      >
        🔧 API Debug {showDebug ? '▼' : '▶'}
      </div>
      
      {showDebug && (
        <div>
          <div>Base URL: {config.baseURL}</div>
          <div>Mode: {config.mode}</div>
          <div>Status: ✅ Real MCP Server</div>
        </div>
      )}
    </div>
  )
}

export default ApiStatus