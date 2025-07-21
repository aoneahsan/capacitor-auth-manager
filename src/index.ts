import { registerPlugin } from '@capacitor/core';

import type { CapacitorAuthManagerPlugin } from './definitions';

const CapacitorAuthManager = registerPlugin<CapacitorAuthManagerPlugin>(
  'CapacitorAuthManager',
  {
    web: () => import('./web').then(m => new m.CapacitorAuthManagerWeb()),
  },
);

export * from './definitions';
export { CapacitorAuthManager };

// Export useful utilities for end users
export { AuthError, isAuthError } from './utils/auth-error';
export type { LogLevel } from './utils/logger';