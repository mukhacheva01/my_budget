declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
        MainButton: {
          isVisible: boolean;
          text: string;
          show: () => void;
          hide: () => void;
          setText: (t: string) => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
      };
    };
  }
}

export function initTelegram() {
  const wa = window.Telegram?.WebApp;
  if (wa) {
    wa.ready();
    wa.expand();
  }
}

export function getInitData(): string {
  return window.Telegram?.WebApp?.initData ?? '';
}

export function haptic() {
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
}

export function notifySuccess() {
  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
}

export function notifyError() {
  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
}

interface MainButtonHandler {
  show: (text: string, onClick: () => void) => void;
  hide: () => void;
}
let currentHandler: (() => void) | null = null;
const mainButton = window.Telegram?.WebApp?.MainButton;

export const mainButtonApi: MainButtonHandler = {
  show(text, onClick) {
    if (!mainButton) return;
    const prev = currentHandler;
    if (prev) mainButton.offClick(prev);
    currentHandler = onClick;
    mainButton.setText(text);
    mainButton.onClick(onClick);
    mainButton.show();
  },
  hide() {
    if (!mainButton) return;
    if (currentHandler) mainButton.offClick(currentHandler);
    currentHandler = null;
    mainButton.hide();
  },
};

interface BackButtonHandler {
  show: (onClick: () => void) => void;
  hide: () => void;
}
let currentBack: (() => void) | null = null;
const backButton = window.Telegram?.WebApp?.BackButton;

export const backButtonApi: BackButtonHandler = {
  show(onClick) {
    if (!backButton) return;
    if (currentBack) backButton.offClick(currentBack);
    currentBack = onClick;
    backButton.onClick(onClick);
    backButton.show();
  },
  hide() {
    if (!backButton) return;
    if (currentBack) backButton.offClick(currentBack);
    currentBack = null;
    backButton.hide();
  },
};