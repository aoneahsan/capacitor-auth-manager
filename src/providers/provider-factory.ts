import {
  AuthProvider,
  AuthProviderConfig,
  AuthPersistence,
} from '../definitions.js';
import { BaseAuthProvider } from './base-provider.js';
import { AuthProviderInterface } from '../core/types.js';
import { StorageInterface } from '../utils/storage.js';
import { Logger } from '../utils/logger.js';
import { GoogleAuthProviderWeb } from './web/google-provider.js';

export type AnyAuthProvider = BaseAuthProvider | AuthProviderInterface;

/**
 * Legacy web-bridge factory (used by `CapacitorAuthManagerWeb` in `src/web.ts`).
 *
 * WIP: as of 2.4.1 only Google is enabled. Every other provider returns `null` here — the web bridge
 * then leaves it unconfigured, and the modern `auth` API reports `AuthErrorCode.PROVIDER_NOT_ENABLED`.
 * Providers are re-added one at a time as each is hardened (see
 * docs/features/google-provider-production-v3). Their implementations still live under `web/` but are
 * excluded from the published build until then.
 */
export class ProviderFactory {
  static async createProvider(
    config: AuthProviderConfig,
    storage: StorageInterface,
    logger: Logger,
    persistence: AuthPersistence
  ): Promise<AnyAuthProvider | null> {
    if (config.provider === AuthProvider.GOOGLE) {
      return new GoogleAuthProviderWeb({
        provider: config.provider,
        options: config.options,
        storage,
        logger,
        persistence,
      });
    }

    logger.warn(
      `Provider '${config.provider}' is not enabled yet — capacitor-auth-manager currently ships a ` +
        `hardened Google provider; the rest are re-enabled one at a time.`
    );
    return null;
  }
}
