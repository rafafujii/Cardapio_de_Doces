import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { formatCurrency } from './utils';

export const DEFAULT_48H_REMINDER_TEMPLATE = 
`Olá, {nome}! Tudo bem? 🍫✨

Notamos que a sua encomenda #{numero_pedido} na *S.E Doces Gourmet* ainda está pendente de confirmação há mais de 48 horas ({tempo_espera}).

📋 *Itens:* {itens}
💰 *Total:* {total}
📅 *Data Solicitada:* {data} às {horario}
📍 *Retirada:* {endereco}

Gostaria de confirmar a sua encomenda para garantirmos a sua data na nossa esteira de produção?
Se preferir adiantar o sinal/pagamento via PIX:
🔑 *Chave PIX:* {chave_pix}

Caso precise alterar algum item, data ou tenha alguma dúvida, é só responder por aqui! Ficamos à total disposição com muito carinho. ❤️`;

/**
 * Calculates how many hours an order has been pending without updates
 */
export function getPendingHours(order: any): number {
  if (order.status !== 'pending') return 0;
  let lastActivityMs: number | null = null;

  if (order.updatedAt?.toDate) {
    lastActivityMs = order.updatedAt.toDate().getTime();
  } else if (order.updatedAt?.seconds) {
    lastActivityMs = order.updatedAt.seconds * 1000;
  } else if (order.createdAt?.toDate) {
    lastActivityMs = order.createdAt.toDate().getTime();
  } else if (order.createdAt?.seconds) {
    lastActivityMs = order.createdAt.seconds * 1000;
  } else if (typeof order.createdAt === 'string') {
    const t = new Date(order.createdAt).getTime();
    if (!isNaN(t)) lastActivityMs = t;
  } else if (order.date) {
    const parsed = new Date(`${order.date}T${order.time || '12:00'}`).getTime();
    if (!isNaN(parsed)) lastActivityMs = parsed;
  }

  if (!lastActivityMs) return 0;
  return Math.max(0, (Date.now() - lastActivityMs) / (1000 * 60 * 60));
}

/**
 * Returns true if an order has been pending for 48 hours or more
 */
export function isOrderPendingOver48h(order: any): boolean {
  if (order.status !== 'pending') return false;
  return getPendingHours(order) >= 48;
}

/**
 * Formats elapsed hours into human-friendly Portuguese text
 */
export function formatPendingDuration(hours: number): string {
  const roundedHours = Math.floor(hours);
  if (roundedHours < 24) {
    return `${roundedHours} hora${roundedHours === 1 ? '' : 's'}`;
  }
  const days = Math.floor(roundedHours / 24);
  const remainingHours = roundedHours % 24;
  if (remainingHours === 0) {
    return `${days} dia${days === 1 ? '' : 's'}`;
  }
  return `${days} dia${days === 1 ? '' : 's'} e ${remainingHours}h`;
}

/**
 * Generates items summary text for reminders
 */
export function formatOrderItemsSummary(order: any): string {
  if (!order.items || !Array.isArray(order.items)) return 'Doces artesanais';
  return order.items
    .slice(0, 3)
    .map((i: any) => `${i.quantity}x ${i.name}`)
    .join(', ') + (order.items.length > 3 ? ` (+${order.items.length - 3} outros)` : '');
}

/**
 * Replaces placeholders in the reminder template
 */
export function formatReminderMessage(
  template: string,
  order: any,
  globalSettings?: any
): string {
  let result = template || DEFAULT_48H_REMINDER_TEMPLATE;
  const hours = getPendingHours(order);
  const tempoEspera = formatPendingDuration(hours);
  const shortId = order.id ? order.id.slice(-6).toUpperCase() : 'DOCES';
  const customerName = order.customerName || 'Cliente';
  const totalStr = order.total ? formatCurrency(order.total) : 'R$ 0,00';
  const itemsText = formatOrderItemsSummary(order);
  const dataStr = order.date || 'A combinar';
  const timeStr = order.time || '12:00';
  const pixKey = globalSettings?.pixKey || '03972289960';
  const endereco = globalSettings?.pickupAddress || 'Avenida Padre Jose Stefanello, n°340';

  result = result.replace(/{nome}/g, customerName);
  result = result.replace(/{numero_pedido}/g, shortId);
  result = result.replace(/{tempo_espera}/g, tempoEspera);
  result = result.replace(/{itens}/g, itemsText);
  result = result.replace(/{total}/g, totalStr);
  result = result.replace(/{data}/g, dataStr);
  result = result.replace(/{horario}/g, timeStr);
  result = result.replace(/{chave_pix}/g, pixKey);
  result = result.replace(/{endereco}/g, endereco);

  return result;
}

/**
 * Persists a scheduled reminder date/time and message to Firestore for an order
 */
export async function scheduleOrderReminder(
  orderId: string,
  scheduledAtIso: string,
  message: string
): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    scheduledReminderAt: scheduledAtIso,
    scheduledReminderMessage: message,
    scheduledReminderStatus: 'scheduled',
    scheduledReminderUpdatedAt: serverTimestamp()
  });
}

/**
 * Cancels a scheduled reminder for an order
 */
export async function cancelOrderReminder(orderId: string): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    scheduledReminderStatus: 'cancelled',
    scheduledReminderUpdatedAt: serverTimestamp()
  });
}

/**
 * Marks a reminder as sent and increments reminder count
 */
export async function markOrderReminderSent(
  orderId: string,
  currentCount: number = 0
): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    lastReminderSentAt: serverTimestamp(),
    reminderCount: (currentCount || 0) + 1,
    scheduledReminderStatus: 'sent',
    scheduledReminderUpdatedAt: serverTimestamp()
  });
}

/**
 * Dispatches WhatsApp message directly and records the event
 */
export async function sendWhatsAppReminder(
  order: any,
  message: string,
  onSentSuccess?: () => void
): Promise<boolean> {
  const phone = order.phone || order.customerPhone || '';
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) {
    return false;
  }
  const targetPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${targetPhone}?text=${encoded}`;
  
  window.open(url, '_blank');
  
  if (order.id) {
    try {
      await markOrderReminderSent(order.id, order.reminderCount || 0);
      onSentSuccess?.();
    } catch (err) {
      console.error('Failed to mark reminder sent:', err);
    }
  }
  return true;
}
