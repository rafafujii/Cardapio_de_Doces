import { useEffect, useState, useCallback, useRef } from 'react';
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

export function usePWAUpdate(): PWAUpdateState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  // Setup virtual:pwa-register
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[PWA] Nova versão detectada! Forçando ativação e recarregamento dos arquivos mais recentes...');
        setNeedRefresh(true);
        // Força a ativação imediata do novo Service Worker e reload da página
        try {
          if (updateSWRef.current) {
            updateSWRef.current(true).catch(() => {
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
        console.log('[PWA] App está em cache e pronto para uso offline.');
        setOfflineReady(true);
      },
      onRegistered(r) {
        if (r) {
          registrationRef.current = r;
          setLastChecked(new Date());

          // Se já houver um worker esperando, força o skipWaiting
          if (r.waiting) {
            console.log('[PWA] Worker em espera detectado na inicialização. Forçando ativação...');
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

    updateSWRef.current = updateSW;

    // Listen for controller changes (quando o novo SW assume controle com skipWaiting + clientsClaim)
    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      console.log('[PWA] Novo Service Worker ativo. Forçando reload para carregar os arquivos mais recentes...');
      
      const lastReload = sessionStorage.getItem('pwa_auto_reload_timestamp');
      const now = Date.now();
      // Previne loops com margem segura de 5 segundos
      if (!lastReload || now - parseInt(lastReload, 10) > 5000) {
        sessionStorage.setItem('pwa_auto_reload_timestamp', now.toString());
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Event listeners to check for updates whenever the user returns to the installed app
    const checkUpdateSilently = () => {
      if (navigator.onLine && registrationRef.current) {
        setLastChecked(new Date());
        registrationRef.current.update().catch((err) => {
          console.debug('[PWA] Background update check:', err);
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkUpdateSilently();
      }
    };

    const handleFocus = () => {
      checkUpdateSilently();
    };

    const handleOnline = () => {
      checkUpdateSilently();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // Periodic check every 60 seconds while open
    const intervalId = setInterval(checkUpdateSilently, 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      clearInterval(intervalId);
    };
  }, []);

  const updateApp = useCallback(async () => {
    try {
      if (updateSWRef.current) {
        await updateSWRef.current(true);
      } else {
        window.location.reload();
      }
    } catch (e) {
      console.error('[PWA] Update execution error:', e);
      window.location.reload();
    }
  }, []);

  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    setLastChecked(new Date());
    try {
      if ('serviceWorker' in navigator) {
        const registration = registrationRef.current || await navigator.serviceWorker.getRegistration();
        if (registration) {
          registrationRef.current = registration;
          await registration.update();
          
          // If a waiting worker exists or installation started
          if (registration.waiting || registration.installing) {
            setNeedRefresh(true);
            return true;
          }
        }
      }
      return false;
    } catch (err) {
      console.warn('[PWA] Manual update check error:', err);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  return {
    needRefresh,
    offlineReady,
    isChecking,
    lastChecked,
    updateApp,
    checkForUpdate,
    forceHardReset: forceHardResetApp,
    dismissUpdate
  };
}
