import { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  getPendingHours, 
  isOrderPendingOver48h, 
  formatReminderMessage, 
  scheduleOrderReminder, 
  cancelOrderReminder, 
  sendWhatsAppReminder,
  DEFAULT_48H_REMINDER_TEMPLATE 
} from '../lib/reminderHelper';

export function useAutoReminders(orders: any[], globalSettings: any) {
  const [tick, setTick] = useState(Date.now());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Interval to check due scheduled reminders every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter all pending orders that have been waiting for >= 48 hours
  const pendingOrdersOver48h = useMemo(() => {
    return orders.filter(o => {
      if (o.status !== 'pending') return false;
      return isOrderPendingOver48h(o);
    });
  }, [orders, tick]);

  // Orders that have a scheduled reminder whose time has arrived (due)
  const dueScheduledReminders = useMemo(() => {
    const now = Date.now();
    return orders.filter(o => {
      if (o.status !== 'pending') return false;
      if (o.scheduledReminderStatus !== 'scheduled' || !o.scheduledReminderAt) return false;
      const scheduledMs = new Date(o.scheduledReminderAt).getTime();
      return !isNaN(scheduledMs) && scheduledMs <= now;
    });
  }, [orders, tick]);

  // Orders that have an upcoming scheduled reminder (future)
  const upcomingScheduledReminders = useMemo(() => {
    const now = Date.now();
    return orders.filter(o => {
      if (o.status !== 'pending') return false;
      if (o.scheduledReminderStatus !== 'scheduled' || !o.scheduledReminderAt) return false;
      const scheduledMs = new Date(o.scheduledReminderAt).getTime();
      return !isNaN(scheduledMs) && scheduledMs > now;
    });
  }, [orders, tick]);

  // Single order schedule
  const scheduleOrder = useCallback(async (orderId: string, scheduledAtIso: string, customMessage: string) => {
    await scheduleOrderReminder(orderId, scheduledAtIso, customMessage);
  }, []);

  // Bulk schedule
  const scheduleBulk = useCallback(async (orderIds: string[], scheduledAtIso: string, template: string) => {
    setIsProcessingBulk(true);
    try {
      const promises = orderIds.map(async (id) => {
        const targetOrder = orders.find(o => o.id === id);
        if (!targetOrder) return;
        const msg = formatReminderMessage(template, targetOrder, globalSettings);
        await scheduleOrderReminder(id, scheduledAtIso, msg);
      });
      await Promise.all(promises);
    } finally {
      setIsProcessingBulk(false);
    }
  }, [orders, globalSettings]);

  // Cancel schedule
  const cancelSchedule = useCallback(async (orderId: string) => {
    await cancelOrderReminder(orderId);
  }, []);

  // Direct WhatsApp dispatch
  const dispatchWhatsApp = useCallback(async (order: any, customMessage?: string, onSentSuccess?: () => void) => {
    const template = customMessage || order.scheduledReminderMessage || globalSettings?.autoReminder48hTemplate || DEFAULT_48H_REMINDER_TEMPLATE;
    const finalMsg = formatReminderMessage(template, order, globalSettings);
    return await sendWhatsAppReminder(order, finalMsg, onSentSuccess);
  }, [globalSettings]);

  return {
    pendingOrdersOver48h,
    dueScheduledReminders,
    upcomingScheduledReminders,
    scheduleOrder,
    scheduleBulk,
    cancelSchedule,
    dispatchWhatsApp,
    isProcessingBulk
  };
}
