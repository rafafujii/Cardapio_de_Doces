import { playNewOrderNotification } from './audioNotifier';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Checks whether the current environment supports Web Notifications / Push API
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns the current notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/**
 * Requests push notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isPushNotificationSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (err) {
    console.warn("Error requesting notification permission:", err);
    return getNotificationPermission();
  }
}

export interface PwaOrderNotificationOptions {
  title: string;
  body: string;
  orderId?: string;
  customerName?: string;
  total?: number;
  playSound?: boolean;
  vibrate?: boolean;
}

/**
 * Dispatches a push notification via Service Worker (if registered/supported)
 * or falls back to standard window Notification. Also plays audio chime and mobile vibration.
 */
export async function sendPwaOrderNotification(options: PwaOrderNotificationOptions): Promise<boolean> {
  const {
    title,
    body,
    orderId,
    playSound = true,
    vibrate = true,
  } = options;

  // 1. Play Audio Chime
  if (playSound) {
    try {
      playNewOrderNotification();
    } catch (e) {
      console.warn("Could not play audio chime:", e);
    }
  }

  // 2. Mobile Tactile Vibration (if supported)
  if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Vibration pattern: buzz - pause - buzz - pause - long buzz
      navigator.vibrate([250, 100, 250, 100, 400]);
    } catch {}
  }

  // 3. Visual System / Background Push Notification
  if (!isPushNotificationSupported()) return false;

  const permission = getNotificationPermission();
  if (permission !== 'granted') return false;

  const notificationOptions: NotificationOptions & Record<string, any> = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/favicon.ico',
    tag: orderId ? `se-doces-order-${orderId}` : `se-doces-alert-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: '/?view=admin',
      orderId: orderId || '',
      date: new Date().toISOString()
    }
  };

  try {
    // Attempt Service Worker Notification (vital for background mobile tabs and installed PWAs)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    }
  } catch (swErr) {
    console.warn("ServiceWorker showNotification failed, using fallback:", swErr);
  }

  // Fallback: standard Window Notification
  try {
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (windowNotifErr) {
    console.warn("Window Notification fallback failed:", windowNotifErr);
    return false;
  }
}

/**
 * Triggers a test push notification with sound and tactile feedback for the admin
 */
export async function sendPwaTestNotification(): Promise<boolean> {
  let perm = getNotificationPermission();
  if (perm === 'default') {
    perm = await requestNotificationPermission();
  }

  return sendPwaOrderNotification({
    title: "🔔 Teste de Notificação PWA • S.E Doces",
    body: "Excelente! As notificações push em segundo plano estão ativas e funcionando no seu dispositivo.",
    playSound: true,
    vibrate: true
  });
}
