import { Link, useLocation } from 'react-router-dom'
import { usePromptX } from '../contexts/PromptXContext'

function Layout({ children }) {
  const location = useLocation()
  const { stats, isReady } = usePromptX()

  const getNavigationItems = () => {
    const baseItems = [
      { name: '角色', href: '/roles', icon: '🎭', count: isReady && stats.totalRoles },
      { name: '工具', href: '/tools', icon: '🔧', count: isReady && stats.totalTools },
      { name: '状态', href: '/status', icon: '📊' },
    ]
    return baseItems
  }

  return (
    <div className="app">
      <nav style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '16px 0'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Link to="/roles" style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              textDecoration: 'none'
            }}>
              PromptX
            </Link>
            <div style={{ display: 'flex', gap: '24px' }}>
              {getNavigationItems().map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  style={{
                    color: location.pathname === item.href ? '#fff' : 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: location.pathname === item.href ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    position: 'relative'
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                  {typeof item.count === 'number' && (
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '500',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      marginLeft: '4px'
                    }}>
                      {item.count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main style={{ padding: '40px 0' }}>
        <div className="container">
          {children}
        </div>
      </main>

      <footer style={{
        background: 'rgba(0, 0, 0, 0.1)',
        color: 'rgba(255, 255, 255, 0.8)',
        padding: '24px 0',
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <div className="container">
          <p>© 2024 Deepractice. PromptX v{__APP_VERSION__ || '1.25.2'}</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
