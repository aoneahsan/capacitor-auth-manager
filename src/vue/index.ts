export {
  useAuth,
  useAuthState,
  useUser,
  useAuthProvider,
  useAuthConfig,
} from './composables';

// Re-export the AuthProvider enum (+ error codes) so consumers get `useAuth().signIn(AuthProvider.GOOGLE)`
// with a single import. Using the enum is the recommended, typo-safe way to name a provider — plain
// strings like 'google' still work.
export { AuthProvider, AuthErrorCode } from '../definitions';
