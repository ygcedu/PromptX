import { Link } from 'react-router-dom'
import { usePromptX } from '../contexts/PromptXContext'

function Home() {
  const { stats, isReady, isLoading } = usePromptX()
  return (
    <div>
      <div className="text-center mb-4">
        <h1 style={{ color: 'white', marginBottom: '16px' }}>
          Welcome to PromptX Web
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
          DPML-powered AI prompt framework - Revolutionary AI-First CLI system based on 
          Deepractice Prompt Markup Language. Build sophisticated AI agents with structured 
          prompts, memory systems, and execution frameworks.
        </p>
      </div>

      <div className="grid grid-3 mt-4">
        <div className="card">
          <h3>🎭 AI Roles</h3>
          <p className="text-muted">
            Manage and activate AI roles including built-in system roles and custom roles created by Nuwa.
          </p>
          {isReady && (
            <div style={{ margin: '12px 0', fontSize: '14px', color: '#666' }}>
              📊 {stats.totalRoles} roles available ({stats.systemRoles} system, {stats.userRoles} user)
            </div>
          )}
          <Link to="/roles" className="btn btn-primary">
            Explore Roles
          </Link>
        </div>

        <div className="card">
          <h3>🔧 Tools</h3>
          <p className="text-muted">
            Discover and use powerful tools including system tools and custom tools created by Luban.
          </p>
          {isReady && (
            <div style={{ margin: '12px 0', fontSize: '14px', color: '#666' }}>
              📊 {stats.totalTools} tools available ({stats.systemTools} system, {stats.userTools} user)
            </div>
          )}
          <Link to="/tools" className="btn btn-primary">
            Browse Tools
          </Link>
        </div>

        <div className="card">
          <h3>📊 System Status</h3>
          <p className="text-muted">
            Monitor PromptX MCP Server status, resource statistics, and system health.
          </p>
          {isLoading && (
            <div style={{ margin: '12px 0', fontSize: '14px', color: '#666' }}>
              🔄 Loading status...
            </div>
          )}
          {isReady && (
            <div style={{ margin: '12px 0', fontSize: '14px', color: '#28a745' }}>
              ✓ Server running
            </div>
          )}
          <Link to="/status" className="btn btn-primary">
            View Status
          </Link>
        </div>
      </div>

      <div className="card mt-4">
        <h2>🚀 Features</h2>
        <div className="grid grid-2">
          <div>
            <h4>🎯 Role Management</h4>
            <ul>
              <li>Built-in system roles (Sean, Luban, Nuwa, Writer, etc.)</li>
              <li>Custom roles created by Nuwa</li>
              <li>Easy role activation and management</li>
            </ul>
          </div>
          <div>
            <h4>🛠️ Tool Integration</h4>
            <ul>
              <li>System tools (filesystem, PDF reader, Excel, Word)</li>
              <li>Custom tools created by Luban</li>
              <li>Tool documentation and execution</li>
            </ul>
          </div>
          <div>
            <h4>📈 Real-time Monitoring</h4>
            <ul>
              <li>MCP Server status and metrics</li>
              <li>Resource usage statistics</li>
              <li>Worker pool monitoring</li>
            </ul>
          </div>
          <div>
            <h4>🔄 Live Updates</h4>
            <ul>
              <li>Real-time resource discovery</li>
              <li>Dynamic content updates</li>
              <li>Responsive design</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home