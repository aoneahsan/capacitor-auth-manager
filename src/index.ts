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