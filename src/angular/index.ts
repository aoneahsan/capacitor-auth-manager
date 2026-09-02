export {
  AuthService,
  AuthProviderService,
  AuthProviderFactory,
} from './auth.service.js';
export { AuthModule, AuthModuleConfig, AUTH_CONFIG } from './auth.module.js';
export { AuthGuard, NoAuthGuard } from './auth.guard.js';

// Re-export the AuthProvider enum (+ error codes) so consumers get `authService.signIn(AuthProvider.GOOGLE)`
// with a single import. Using the enum is the recommended, typo-safe way to name a provider — plain
// strings like 'google' still work.
export { AuthProvider, AuthErrorCode } from '../definitions.js';
