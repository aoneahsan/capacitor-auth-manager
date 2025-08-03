import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'capacitor-auth-manager/react';

function Login() {
  const { signIn, signUp, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSocialSignIn = async (provider: string) => {
    try {
      setIsLoading(true);
      setMessage('');
      await signIn(provider);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(`${provider} sign in error:`, err);
      setMessage(`Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setMessage('');

      if (isSignUp) {
        await signUp({ email, password });
        setMessage('Account created successfully! You can now sign in.');
        setIsSignUp(false);
      } else {
        await signIn('email-password', { email, password });
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Email auth error:', err);
      setMessage(isSignUp ? 'Failed to create account' : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');
      await signIn('magic-link', { email });
      setMessage('Magic link sent! Check your email.');
    } catch (err) {
      console.error('Magic link error:', err);
      setMessage('Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className='card'
      style={{ maxWidth: '400px', margin: '0 auto' }}
    >
      <h1>Sign In</h1>

      {error && <div className='error-message'>{error.message}</div>}
      {message && (
        <div
          className={
            message.includes('Failed') ? 'error-message' : 'success-message'
          }
        >
          {message}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h3>Social Login</h3>
        <button
          onClick={() => handleSocialSignIn('google')}
          className='btn btn-primary btn-social'
          disabled={isLoading}
        >
          Sign in with Google
        </button>
        <button
          onClick={() => handleSocialSignIn('github')}
          className='btn btn-primary btn-social'
          disabled={isLoading}
        >
          Sign in with GitHub
        </button>
        <button
          onClick={() => handleSocialSignIn('facebook')}
          className='btn btn-primary btn-social'
          disabled={isLoading}
        >
          Sign in with Facebook
        </button>
        <button
          onClick={() => handleSocialSignIn('microsoft')}
          className='btn btn-primary btn-social'
          disabled={isLoading}
        >
          Sign in with Microsoft
        </button>
      </div>

      <hr style={{ margin: '2rem 0' }} />

      <form onSubmit={handleEmailAuth}>
        <h3>{isSignUp ? 'Create Account' : 'Email & Password'}</h3>

        <div className='form-group'>
          <label
            htmlFor='email'
            className='form-label'
          >
            Email
          </label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='form-input'
            placeholder='your@email.com'
            required
            disabled={isLoading}
          />
        </div>

        <div className='form-group'>
          <label
            htmlFor='password'
            className='form-label'
          >
            Password
          </label>
          <input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='form-input'
            placeholder='••••••••'
            required
            disabled={isLoading}
          />
        </div>

        <button
          type='submit'
          className='btn btn-primary'
          style={{ width: '100%' }}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type='button'
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: 'none',
              border: 'none',
              color: '#3498db',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            disabled={isLoading}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </form>

      <hr style={{ margin: '2rem 0' }} />

      <div>
        <h3>Magic Link</h3>
        <p>Get a sign-in link sent to your email</p>
        <button
          onClick={handleMagicLink}
          className='btn btn-primary'
          style={{ width: '100%' }}
          disabled={isLoading || !email}
        >
          Send Magic Link
        </button>
      </div>
    </div>
  );
}

export default Login;
