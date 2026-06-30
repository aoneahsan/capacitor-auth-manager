export {
  AuthService,
  AuthProviderService,
  AuthProviderFactory,
} from './auth.service';
export { AuthModule, AuthModuleConfig, AUTH_CONFIG } from './auth.module';
export { AuthGuard, NoAuthGuard } from './auth.guard';

// Re-export the AuthProvider enum (+ error codes) so consumers get `authService.signIn(AuthProvider.GOOGLE)`
// with a single import. Using the enum is the recommended, typo-safe way to name a provider — plain
// strings like 'google' still work.
export { AuthProvider, AuthErrorCode } from '../definitions';
