import {
  NgModule,
  ModuleWithProviders,
  InjectionToken,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, AuthProviderFactory } from './auth.service';
import type { ProviderOptions } from '../definitions';

export interface AuthModuleConfig {
  providers?: Record<string, ProviderOptions>;
  persistence?: 'local' | 'session' | 'memory';
  autoRefreshToken?: boolean;
  tokenRefreshBuffer?: number;
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * DI token carrying the config passed to {@link AuthModule.forRoot}. Typed `InjectionToken`
 * (string tokens aren't assignable to the typed `inject()` overload in Angular's current API).
 */
export const AUTH_CONFIG = new InjectionToken<AuthModuleConfig>('AUTH_CONFIG');

@NgModule({
  imports: [CommonModule],
  providers: [AuthService, AuthProviderFactory],
})
export class AuthModule {
  static forRoot(config?: AuthModuleConfig): ModuleWithProviders<AuthModule> {
    return {
      ngModule: AuthModule,
      providers: [
        AuthService,
        AuthProviderFactory,
        {
          provide: AUTH_CONFIG,
          useValue: config || {},
        },
      ],
    };
  }

  constructor() {
    // Apply the config supplied to AuthModule.forRoot(...). Previously this read a phantom
    // `authService.config`, so forRoot(config) was silently ignored. Now the injected
    // 'AUTH_CONFIG' token is forwarded to the manager via configure(). `inject()` is used
    // (instead of parameter decorators) because this package compiles without
    // experimentalDecorators — parameter decorators would not type-check.
    const authService = inject(AuthService);
    const config = inject(AUTH_CONFIG, { optional: true });
    if (config && Object.keys(config).length > 0) {
      authService.configure(config);
    }
  }
}
