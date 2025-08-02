import { useAuth, useAuthState, useToken } from 'capacitor-auth-manager/react'

function Profile() {
  const { user, signOut } = useAuth()
  const authState = useAuthState()
  const { token, expiresAt } = useToken()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="card">
      <h1>User Profile</h1>
      
      <div className="user-info">
        <h3>User Information</h3>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="user-info">
        <h3>Auth State</h3>
        <pre>{JSON.stringify(authState, null, 2)}</pre>
      </div>

      {token && (
        <div className="user-info">
          <h3>Token Information</h3>
          <p><strong>Token:</strong> {token.substring(0, 20)}...</p>
          {expiresAt && (
            <p><strong>Expires:</strong> {new Date(expiresAt).toLocaleString()}</p>
          )}
        </div>
      )}

      <h3>Hooks Demo</h3>
      <p>This page demonstrates the different React hooks available:</p>
      <ul>
        <li><code>useAuth()</code> - Main hook with all auth methods</li>
        <li><code>useAuthState()</code> - Just the auth state</li>
        <li><code>useToken()</code> - Access token management</li>
        <li><code>useUser()</code> - Just the user object</li>
      </ul>

      <button onClick={handleSignOut} className="btn btn-danger" style={{ marginTop: '2rem' }}>
        Sign Out
      </button>
    </div>
  )
}

export default Profile