import {
  PamFeedbackDeviceKind,
  PamFeedbackRuntime,
  type PamFeedbackClientContextType
} from '@schemas/PamUserFeedbackSchema';

type NavigatorExtrasType = Navigator & {
  readonly userAgentData?: { readonly platform?: string };
  readonly standalone?: boolean;
  readonly deviceMemory?: number;
  readonly connection?: {
    readonly effectiveType?: string;
    readonly saveData?: boolean;
  };
};

/**
 * 采集反馈提交瞬间的客户端环境快照（只读，无权限弹窗）。
 */
export class PamFeedbackClientContextService {
  public async collect(): Promise<PamFeedbackClientContextType | null> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return null;
    }
    const nav = navigator as NavigatorExtrasType;
    const ua =
      typeof navigator.userAgent === 'string' ? navigator.userAgent : '';
    const platform =
      (typeof nav.userAgentData?.platform === 'string'
        ? nav.userAgentData.platform.trim()
        : '') ||
      (typeof navigator.platform === 'string' ? navigator.platform : '');
    const displayMode = this.resolveDisplayMode(nav);
    const vv = window.visualViewport;
    return {
      reportedAt: new Date().toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      language: navigator.language || '',
      platform,
      userAgent: ua.slice(0, 1000),
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: Math.min(Math.max(navigator.maxTouchPoints || 0, 0), 64),
      displayMode,
      fullscreenEnabled: Boolean(document.fullscreenEnabled),
      window: {
        devicePixelRatio: Math.min(
          Math.max(window.devicePixelRatio || 1, 0.01),
          16
        ),
        screen: {
          width: window.screen?.width ?? 0,
          height: window.screen?.height ?? 0
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        visualViewport: vv
          ? {
              width: vv.width,
              height: vv.height,
              offsetTop: vv.offsetTop,
              scale: vv.scale
            }
          : null
      },
      device: {
        kind: this.resolveDeviceKind(),
        runtime:
          displayMode === 'standalone'
            ? PamFeedbackRuntime.pwa
            : PamFeedbackRuntime.browser,
        osName: '',
        osVersion: '',
        browserName: '',
        browserVersion: '',
        hostApp: '',
        model: ''
      },
      meta: {
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        deviceMemory:
          typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
        connection:
          typeof nav.connection?.effectiveType === 'string'
            ? nav.connection.effectiveType
            : null,
        saveData: nav.connection?.saveData ?? null
      }
    };
  }

  protected resolveDisplayMode(
    nav: NavigatorExtrasType
  ): 'standalone' | 'browser' {
    if (nav.standalone === true) {
      return 'standalone';
    }
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      return 'standalone';
    }
    return 'browser';
  }

  protected resolveDeviceKind():
    | typeof PamFeedbackDeviceKind.mobile
    | typeof PamFeedbackDeviceKind.tablet
    | typeof PamFeedbackDeviceKind.desktop
    | typeof PamFeedbackDeviceKind.unknown {
    const width = window.innerWidth;
    if (width <= 0) {
      return PamFeedbackDeviceKind.unknown;
    }
    if (width < 768) {
      return PamFeedbackDeviceKind.mobile;
    }
    if (width < 1024) {
      return PamFeedbackDeviceKind.tablet;
    }
    return PamFeedbackDeviceKind.desktop;
  }
}
