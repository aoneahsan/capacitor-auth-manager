import { registerPlugin } from '@capacitor/core';
import type { CapacitorAuthManagerPlugin } from './definitions.js';

let plugin: CapacitorAuthManagerPlugin | null = null;
function getPlugin(): CapacitorAuthManagerPlugin {
  plugin ??= registerPlugin<CapacitorAuthManagerPlugin>(
    'CapacitorAuthManager',
    {
      web: () =>
        import('./web.js').then((m) => new m.CapacitorAuthManagerWeb()),
    }
  );
  return plugin;
}

// Importing the package never registers a native plugin or touches a browser global.
export const CapacitorAuthManager = new Proxy(
  {} as CapacitorAuthManagerPlugin,
  {
    get(_target, property) {
      const target = getPlugin();
      const value: unknown = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }
);
