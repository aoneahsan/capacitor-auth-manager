import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, AuthProviderFactory } from './auth.service';

export interface AuthModuleConfig {
  providers?: Record<string, any>;
  persistence?: 'local' | 'session' | 'memory';
  autoRefreshToken?: boolean;
  tokenRefreshBuffer?: number;
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

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
          provide: 'AUTH_CONFIG',
          useValue: config || {},
        },
      ],
    };
  }

  constructor(authService: AuthService) {
    // Initialize with module config if provided
    const config = (authService as any).config;
    if (config) {
      authService.configure(config);
    }
  }
}
