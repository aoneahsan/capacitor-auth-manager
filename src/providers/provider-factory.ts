import {
  AuthProvider,
  AuthProviderConfig,
  AuthPersistence,
} from '../definitions';
import { BaseAuthProvider } from './base-provider';
import { StorageInterface } from '../utils/storage';
import { Logger } from '../utils/logger';
import { GoogleAuthProviderWeb } from './web/google-provider';
import { AppleAuthProviderWeb } from './web/apple-provider';

export class ProviderFactory {
  static async createProvider(
    config: AuthProviderConfig,
    storage: StorageInterface,
    logger: Logger,
    persistence: AuthPersistence
  ): Promise<BaseAuthProvider | null> {
    const providerConfig = {
      provider: config.provider,
      options: config.options,
      storage,
      logger,
      persistence,
    };

    switch (config.provider) {
      case AuthProvider.GOOGLE:
        return new GoogleAuthProviderWeb(providerConfig);

      case AuthProvider.APPLE:
        return new AppleAuthProviderWeb(providerConfig);

      case AuthProvider.MICROSOFT:
        // TODO: Implement Microsoft provider
        logger.warn('Microsoft provider not yet implemented');
        return null;

      case AuthProvider.FACEBOOK:
        // TODO: Implement Facebook provider
        logger.warn('Facebook provider not yet implemented');
        return null;

      case AuthProvider.GITHUB:
        // TODO: Implement GitHub provider
        logger.warn('GitHub provider not yet implemented');
        return null;

      case AuthProvider.SLACK:
        // TODO: Implement Slack provider
        logger.warn('Slack provider not yet implemented');
        return null;

      case AuthProvider.LINKEDIN:
        // TODO: Implement LinkedIn provider
        logger.warn('LinkedIn provider not yet implemented');
        return null;

      case AuthProvider.FIREBASE:
        // TODO: Implement Firebase provider
        logger.warn('Firebase provider not yet implemented');
        return null;

      case AuthProvider.EMAIL_MAGIC_LINK:
        // TODO: Implement Email Magic Link provider
        logger.warn('Email Magic Link provider not yet implemented');
        return null;

      case AuthProvider.SMS:
        // TODO: Implement SMS provider
        logger.warn('SMS provider not yet implemented');
        return null;

      case AuthProvider.EMAIL_PASSWORD:
        // TODO: Implement Email/Password provider
        logger.warn('Email/Password provider not yet implemented');
        return null;

      case AuthProvider.PHONE_PASSWORD:
        // TODO: Implement Phone/Password provider
        logger.warn('Phone/Password provider not yet implemented');
        return null;

      case AuthProvider.USERNAME_PASSWORD:
        // TODO: Implement Username/Password provider
        logger.warn('Username/Password provider not yet implemented');
        return null;

      case AuthProvider.EMAIL_CODE:
        // TODO: Implement Email Code provider
        logger.warn('Email Code provider not yet implemented');
        return null;

      case AuthProvider.BIOMETRIC:
        // TODO: Implement Biometric provider
        logger.warn('Biometric provider not yet implemented');
        return null;

      default:
        logger.error(`Unknown provider: ${config.provider}`);
        return null;
    }
  }
}
