export type Platform = 'web' | 'ios' | 'android' | 'electron' | 'unknown';

export interface PlatformInfo {
  platform: Platform;
  isNative: boolean;
  isWeb: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  userAgent: string;
}

export class PlatformDetector {
  private static platformInfo: PlatformInfo | null = null;

  static getPlatform(): PlatformInfo {
    if (this.platformInfo) {
      return this.platformInfo;
    }

    const userAgent =
      typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const platform = this.detectPlatform(userAgent);

    this.platformInfo = {
      platform,
      isNative: platform === 'ios' || platform === 'android',
      isWeb: platform === 'web',
      isMobile:
        platform === 'ios' ||
        platform === 'android' ||
        this.isMobileWeb(userAgent),
      isDesktop:
        platform === 'electron' ||
        (platform === 'web' && !this.isMobileWeb(userAgent)),
      userAgent,
    };

    return this.platformInfo;
  }

  private static detectPlatform(userAgent: string): Platform {
    // Check if running in Capacitor
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const capacitor = (window as any).Capacitor;
      if (capacitor.getPlatform) {
        const platform = capacitor.getPlatform();
        if (platform === 'ios' || platform === 'android') {
          return platform;
        }
      }
    }

    // Check if running in Electron
    if (
      typeof window !== 'undefined' &&
      (window as any).process?.versions?.electron
    ) {
      return 'electron';
    }

    // Check for React Native
    if (
      typeof navigator !== 'undefined' &&
      navigator.product === 'ReactNative'
    ) {
      if (/iPhone|iPad|iPod/i.test(userAgent)) {
        return 'ios';
      }
      if (/Android/i.test(userAgent)) {
        return 'android';
      }
    }

    // Check for native iOS/Android webviews
    if (
      /iPhone|iPad|iPod/i.test(userAgent) &&
      /WebKit/i.test(userAgent) &&
      !/Safari/i.test(userAgent)
    ) {
      return 'ios';
    }
    if (/Android/i.test(userAgent) && /wv/i.test(userAgent)) {
      return 'android';
    }

    // Default to web
    return 'web';
  }

  private static isMobileWeb(userAgent: string): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
  }

  static isCapacitorAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).Capacitor;
  }

  static async checkCapacitorPlugin(pluginName: string): Promise<boolean> {
    if (!this.isCapacitorAvailable()) {
      return false;
    }

    try {
      const { Capacitor } = window as any;
      return !!(Capacitor.Plugins && Capacitor.Plugins[pluginName]);
    } catch {
      return false;
    }
  }
}
