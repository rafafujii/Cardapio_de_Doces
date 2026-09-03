import { useEffect, useState, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';

export interface PWAUpdateState {
  needRefresh: boolean;
  offlineReady: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  updateApp: () => Promise<void>;
  checkForUpdate: () => Promise<boolean>;
  forceHardReset: () => Promise<void>;
  dismissUpdate: () => void;
}

/**
 * Global cache buster & hard reload utility
 */
export async function forceHardResetApp(): Promise<void> {
  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // 2. Clear CacheStorage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    // 3. Clear session storage
    sessionStorage.clear();

    // 4. Force reload from server with cache-busting timestamp
    const url = new URL(window.location.href);
    url.searchParams.set('_pwa_refresh', Date.now().toString());
    window.location.href = url.toString();
  } catch (err) {
    console.error('Failed to force hard reset:', err);
    window.location.reload();
  }
}

// Shared singleton store so multiple UI components share identical state
let needRefreshShared = false;
let offlineReadyShared = false;
let isCheckingShared = false;
let lastCheckedShared: Date | null = null;
let updateSWInstance: ((reloadPage?: boolean) => Promise<void>) | null = null;
let registrationInstance: ServiceWorkerRegistration | null = null;
let isInitialized = false;

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function initPWA() {
  if (isInitialized || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  isInitialized = true;

  try {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[PWA] Nova versão detectada! Forçando ativação e recarregamento...');
        needRefreshShared = true;
        notifyListeners();

        // Força a ativação imediata do novo Service Worker e reload da página
        try {
          if (updateSWInstance) {
            updateSWInstance(true).catch(() => {
              window.location.reload();
            });
          } else {
            window.location.reload();
          }
        } catch {
          window.location.reload();
        }
      },
      onOfflineReady() {
        console.log('[PWA] App em cache e pronto para uso offline.');
        offlineReadyShared = true;
        notifyListeners();
      },
      onRegistered(r) {
        if (r) {
          registrationInstance = r;
          lastCheckedShared = new Date();
          notifyListeners();

          // Se já houver um worker esperando, força o skipWaiting
          if (r.waiting) {
            console.log('[PWA] Worker em espera detectado. Forçando ativação...');
            r.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          // Trigger an immediate check on startup
          r.update().catch(() => {});
        }
      },
      onRegisterError(error) {
        console.warn('[PWA] Service worker registration error:', error);
      }
    });

    updateSWInstance = updateSW;

    // Listen for controller changes (quando o novo SW assume controle)
    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      console.log('[PWA] Novo Service Worker ativo. Recarregando para aplicar atualizações...');

      const lastReload = sessionStorage.getItem('pwa_auto_reload_timestamp');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 5000) {
        sessionStorage.setItem('pwa_auto_reload_timestamp', now.toString());
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Checagem silenciosa periódica e ao focar a janela
    const checkUpdateSilently = () => {
      if (navigator.onLine && registrationInstance) {
        lastCheckedShared = new Date();
        notifyListeners();
        registrationInstance.update().catch((err) => {
          console.debug('[PWA] Background update check:', err);
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkUpdateSilently();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkUpdateSilently);
    window.addEventListener('online', checkUpdateSilently);

    // Checagem a cada 60 segundos com o app aberto
    setInterval(checkUpdateSilently, 60 * 1000);
  } catch (err) {
    console.warn('[PWA] Falha ao inicializar o registro do Service Worker:', err);
  }
}

export function usePWAUpdate(): PWAUpdateState {
  const [, setTick] = useState(0);

  useEffect(() => {
    initPWA();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateApp = useCallback(async () => {
    try {
      if (updateSWInstance) {
        await updateSWInstance(true);
      } else {
        window.location.reload();
      }
    } catch (e) {
      console.error('[PWA] Update execution error:', e);
      window.location.reload();
    }
  }, []);

  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    isCheckingShared = true;
    lastCheckedShared = new Date();
    notifyListeners();

    try {
      if ('serviceWorker' in navigator) {
        const registration = registrationInstance || await navigator.serviceWorker.getRegistration();
        if (registration) {
          registrationInstance = registration;
          await registration.update();

          if (registration.waiting || registration.installing) {
            needRefreshShared = true;
            notifyListeners();
            return true;
          }
        }
      }
      return false;
    } catch (err) {
      console.warn('[PWA] Manual update check error:', err);
      return false;
    } finally {
      isCheckingShared = false;
      notifyListeners();
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    needRefreshShared = false;
    notifyListeners();
  }, []);

  return {
    needRefresh: needRefreshShared,
    offlineReady: offlineReadyShared,
    isChecking: isCheckingShared,
    lastChecked: lastCheckedShared,
    updateApp,
    checkForUpdate,
    forceHardReset: forceHardResetApp,
    dismissUpdate
  };
}
