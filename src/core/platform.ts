export type Platform = 'web' | 'ios' | 'android' | 'electron' | 'unknown';

/** Minimal shape of the Capacitor global this detector inspects (the real bridge has far more). */
interface CapacitorGlobal {
  getPlatform?: () => string;
  Plugins?: Record<string, unknown>;
}

/** The subset of `window` this detector reads; cast the `window` boundary through this. */
interface PlatformWindow {
  Capacitor?: CapacitorGlobal;
  process?: { versions?: { electron?: string } };
}

function getPlatformWindow(): PlatformWindow | undefined {
  return typeof window !== 'undefined'
    ? (window as unknown as PlatformWindow)
    : undefined;
}

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
    // A cached NON-web result is final (native/electron never reverts to web). But a cached
    // 'web' result is NOT treated as final: Capacitor can inject `window.Capacitor` after this
    // module first runs (the native bridge initializes asynchronously), so re-evaluate while
    // the last verdict was 'web' to pick up a late native environment. See F-26.
    if (this.platformInfo && this.platformInfo.platform !== 'web') {
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

  /**
   * Forces a fresh platform detection on the next {@link getPlatform} call, discarding any cached
   * result. Useful if the runtime environment changes after startup (e.g. a Capacitor bridge that
   * initializes late). Most callers can rely on the automatic re-check while the cached value is
   * still 'web'.
   */
  static reset(): void {
    this.platformInfo = null;
  }

  private static detectPlatform(userAgent: string): Platform {
    const win = getPlatformWindow();

    // Check if running in Capacitor
    if (win?.Capacitor) {
      const capacitor = win.Capacitor;
      if (capacitor.getPlatform) {
        const platform = capacitor.getPlatform();
        if (platform === 'ios' || platform === 'android') {
          return platform;
        }
      }
    }

    // Check if running in Electron
    if (win?.process?.versions?.electron) {
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
    return !!getPlatformWindow()?.Capacitor;
  }

  static async checkCapacitorPlugin(pluginName: string): Promise<boolean> {
    const capacitor = getPlatformWindow()?.Capacitor;
    if (!capacitor) {
      return false;
    }

    try {
      return !!(capacitor.Plugins && capacitor.Plugins[pluginName]);
    } catch {
      return false;
    }
  }
}
