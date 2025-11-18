import { Link, useLocation } from 'react-router-dom'
import { usePromptX } from '../contexts/PromptXContext'

function Layout({ children }) {
  const location = useLocation()
  const { stats, isReady } = usePromptX()

  const getNavigationItems = () => {
    const baseItems = [
      { name: '角色', href: '/roles', icon: '🎭', count: isReady && stats.totalRoles },
      { name: '工具', href: '/tools', icon: '🔧', count: isReady && stats.totalTools },
      { name: '文件', href: '/files', icon: '📁' },
      { name: '状态', href: '/status', icon: '📊' },
    ]
    return baseItems
  }

  return (
    <div className="app">
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 py-4">
        <div className="container">
          <div className="flex justify-between items-center">
            <Link 
              to="/roles" 
              className="text-2xl font-bold text-white no-underline hover:no-underline"
            >
              PromptX
            </Link>
            <div className="flex gap-6">
              {getNavigationItems().map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    no-underline px-4 py-2 rounded-lg transition-all duration-200 
                    flex items-center gap-2 relative hover:no-underline
                    ${
                      location.pathname === item.href 
                        ? 'text-white bg-white/20' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                  {typeof item.count === 'number' && (
                    <span className="bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full ml-1">
                      {item.count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="py-10">
        <div className="container">
          {children}
        </div>
      </main>
      
      <footer className="bg-black/10 text-white/80 py-6 text-center mt-auto">
        <div className="container">
          <p>© 2024 Deepractice. PromptX v{__APP_VERSION__ || '1.25.2'}</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
