import { registerPlugin } from '@capacitor/core';
import type { CapacitorAuthManagerPlugin } from './definitions';

// This provides backward compatibility for users who still want to use the Capacitor plugin interface
const CapacitorAuthManager = registerPlugin<CapacitorAuthManagerPlugin>(
  'CapacitorAuthManager',
  {
    web: () => import('./web').then(m => new m.CapacitorAuthManagerWeb()),
  },
);

export { CapacitorAuthManager };