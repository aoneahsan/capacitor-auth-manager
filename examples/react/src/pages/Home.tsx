import { Link } from 'react-router-dom'
import { useAuth } from 'capacitor-auth-manager/react'

function Home() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="card">
      <h1>Welcome to Capacitor Auth Manager</h1>
      <p>
        This is a React example demonstrating the provider-less authentication system.
        No context providers needed - just import and use!
      </p>
      
      {isAuthenticated ? (
        <div>
          <h2>You're logged in!</h2>
          <p>Welcome back, {user?.displayName || user?.email || 'User'}!</p>
          <Link to="/profile" className="btn btn-primary">
            View Profile
          </Link>
        </div>
      ) : (
        <div>
          <h2>Get Started</h2>
          <p>Sign in to access your profile and protected features.</p>
          <Link to="/login" className="btn btn-primary">
            Sign In
          </Link>
        </div>
      )}
      
      <div style={{ marginTop: '2rem' }}>
        <h3>Features:</h3>
        <ul>
          <li>✅ No context providers required</li>
          <li>✅ Works with any React version (16.8+)</li>
          <li>✅ Multiple authentication providers</li>
          <li>✅ Persistent sessions</li>
          <li>✅ TypeScript support</li>
          <li>✅ Protected routes</li>
          <li>✅ Real-time auth state updates</li>
        </ul>
      </div>
    </div>
  )
}

export default Home