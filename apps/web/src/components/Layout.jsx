import { Link, useLocation } from 'react-router-dom'

function Layout({ children }) {
  const location = useLocation()

  const navigation = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Roles', href: '/roles', icon: '🎭' },
    { name: 'Tools', href: '/tools', icon: '🔧' },
    { name: 'Status', href: '/status', icon: '📊' },
  ]

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
            <Link to="/" style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: 'white',
              textDecoration: 'none'
            }}>
              PromptX Web
            </Link>
            <div style={{ display: 'flex', gap: '24px' }}>
              {navigation.map((item) => (
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
                    gap: '8px'
                  }}
                >
                  <span>{item.icon}</span>
                  {item.name}
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
          <p>© 2024 Deepractice. PromptX Web v{__APP_VERSION__ || '1.25.2'}</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout