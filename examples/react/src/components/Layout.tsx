import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from 'capacitor-auth-manager/react'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user, signOut } = useAuth()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            Auth Manager Demo
          </Link>
          <div className="navbar-nav">
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''}
            >
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <Link 
                  to="/profile" 
                  className={location.pathname === '/profile' ? 'active' : ''}
                >
                  Profile
                </Link>
                <span>Hello, {user?.displayName || user?.email || 'User'}</span>
                <button onClick={handleSignOut} className="btn btn-danger">
                  Sign Out
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className={`btn btn-primary ${location.pathname === '/login' ? 'active' : ''}`}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
      <main className="container">
        {children}
      </main>
    </>
  )
}

export default Layout