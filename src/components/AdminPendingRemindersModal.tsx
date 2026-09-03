import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  X, 
  Send, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Settings2, 
  Sparkles, 
  Phone, 
  MessageCircle, 
  FileText, 
  Trash2,
  ChevronRight,
  BellRing,
  RotateCcw
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { 
  getPendingHours, 
  formatPendingDuration, 
  formatReminderMessage,
  formatOrderItemsSummary,
  DEFAULT_48H_REMINDER_TEMPLATE 
} from '../lib/reminderHelper';

interface AdminPendingRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  globalSettings: any;
  onSaveGlobalSettings?: (settingsUpdates: any) => Promise<void> | void;
  onScheduleSingle: (orderId: string, scheduledAtIso: string, customMessage: string) => Promise<void>;
  onScheduleBulk: (orderIds: string[], scheduledAtIso: string, template: string) => Promise<void>;
  onCancelSchedule: (orderId: string) => Promise<void>;
  onDispatchWhatsApp: (order: any, customMessage?: string, onSentSuccess?: () => void) => Promise<boolean>;
  preSelectedOrderId?: string | null;
}

export const AdminPendingRemindersModal: React.FC<AdminPendingRemindersModalProps> = ({
  isOpen,
  onClose,
  orders,
  globalSettings,
  onSaveGlobalSettings,
  onScheduleSingle,
  onScheduleBulk,
  onCancelSchedule,
  onDispatchWhatsApp,
  preSelectedOrderId
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'schedule' | 'due' | 'settings'>('queue');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(() => {
    // Default to tomorrow at 10:00 AM
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [messageTemplate, setMessageTemplate] = useState<string>(
    globalSettings?.autoReminder48hTemplate || DEFAULT_48H_REMINDER_TEMPLATE
  );
  const [previewOrderId, setPreviewOrderId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings tab form state
  const [autoReminderEnabled, setAutoReminderEnabled] = useState<boolean>(
    !!globalSettings?.autoReminder48hEnabled
  );
  const [autoReminderTime, setAutoReminderTime] = useState<string>(
    globalSettings?.autoReminder48hTime || '10:00'
  );

  // Filter pending orders >= 48 hours
  const pendingOrdersOver48h = useMemo(() => {
    return orders.filter(o => {
      if (o.status !== 'pending') return false;
      return getPendingHours(o) >= 48;
    }).sort((a, b) => getPendingHours(b) - getPendingHours(a));
  }, [orders]);

  // Due reminders (scheduled time has passed)
  const dueReminders = useMemo(() => {
    const now = Date.now();
    return orders.filter(o => {
      if (o.status !== 'pending') return false;
      if (o.scheduledReminderStatus !== 'scheduled' || !o.scheduledReminderAt) return false;
      const t = new Date(o.scheduledReminderAt).getTime();
      return !isNaN(t) && t <= now;
    });
  }, [orders]);

  // Initialize pre-selected order if specified
  React.useEffect(() => {
    if (preSelectedOrderId && isOpen) {
      setSelectedOrderIds([preSelectedOrderId]);
      setPreviewOrderId(preSelectedOrderId);
    } else if (isOpen && pendingOrdersOver48h.length > 0 && selectedOrderIds.length === 0) {
      // Default: select all pending > 48h
      setSelectedOrderIds(pendingOrdersOver48h.map(o => o.id));
      setPreviewOrderId(pendingOrdersOver48h[0].id);
    }
  }, [preSelectedOrderId, isOpen, pendingOrdersOver48h]);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => setFeedbackToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [feedbackToast]);

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    if (!previewOrderId || previewOrderId === id) {
      setPreviewOrderId(id);
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === pendingOrdersOver48h.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(pendingOrdersOver48h.map(o => o.id));
    }
  };

  // Preset datetime helpers
  const applyPresetTime = (hoursFromNow: number) => {
    const d = new Date(Date.now() + hoursFromNow * 3600 * 1000);
    setScheduledDateTime(d.toISOString().slice(0, 16));
  };

  const applyTomorrowMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 30, 0, 0);
    setScheduledDateTime(d.toISOString().slice(0, 16));
  };

  const applyTodayAfternoon = () => {
    const d = new Date();
    d.setHours(15, 0, 0, 0);
    if (d.getTime() < Date.now()) {
      d.setDate(d.getDate() + 1);
    }
    setScheduledDateTime(d.toISOString().slice(0, 16));
  };

  // Execute bulk scheduling
  const handleConfirmSchedule = async () => {
    if (selectedOrderIds.length === 0) {
      setFeedbackToast({ type: 'error', message: 'Selecione ao menos um pedido para agendar.' });
      return;
    }
    if (!scheduledDateTime) {
      setFeedbackToast({ type: 'error', message: 'Defina a data e hora do agendamento.' });
      return;
    }

    setIsSaving(true);
    try {
      const scheduledIso = new Date(scheduledDateTime).toISOString();
      await onScheduleBulk(selectedOrderIds, scheduledIso, messageTemplate);
      setFeedbackToast({
        type: 'success',
        message: `Lembrete agendado com sucesso para ${selectedOrderIds.length} ${selectedOrderIds.length === 1 ? 'pedido' : 'pedidos'}!`
      });
      setActiveTab('queue');
    } catch (err) {
      console.error(err);
      setFeedbackToast({ type: 'error', message: 'Erro ao agendar lembretes. Tente novamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Direct WhatsApp dispatch for single order
  const handleSendSingleWhatsApp = async (order: any) => {
    const phone = order.phone || order.customerPhone;
    if (!phone) {
      setFeedbackToast({ type: 'error', message: 'Este pedido não possui telefone cadastrado.' });
      return;
    }
    const success = await onDispatchWhatsApp(order, messageTemplate, () => {
      setFeedbackToast({ type: 'success', message: `Lembrete via WhatsApp registrado para ${order.customerName}!` });
    });
    if (!success) {
      setFeedbackToast({ type: 'error', message: 'Número de WhatsApp inválido.' });
    }
  };

  // Save global auto-reminder settings
  const handleSaveAutomationSettings = async () => {
    if (!onSaveGlobalSettings) return;
    setIsSaving(true);
    try {
      await onSaveGlobalSettings({
        autoReminder48hEnabled: autoReminderEnabled,
        autoReminder48hTime: autoReminderTime,
        autoReminder48hTemplate: messageTemplate
      });
      setFeedbackToast({ type: 'success', message: 'Configurações de automação salvas com sucesso!' });
    } catch (err) {
      console.error(err);
      setFeedbackToast({ type: 'error', message: 'Erro ao salvar configurações de automação.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Live preview order
  const previewOrder = useMemo(() => {
    if (previewOrderId) {
      const found = orders.find(o => o.id === previewOrderId);
      if (found) return found;
    }
    return pendingOrdersOver48h[0] || null;
  }, [previewOrderId, orders, pendingOrdersOver48h]);

  const livePreviewText = useMemo(() => {
    if (!previewOrder) return 'Nenhum pedido selecionado para pré-visualização.';
    return formatReminderMessage(messageTemplate, previewOrder, globalSettings);
  }, [messageTemplate, previewOrder, globalSettings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 dark:from-neutral-800 dark:via-neutral-850 dark:to-neutral-800 border-b border-rose-200/70 dark:border-neutral-700 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  Lembretes Automáticos (Pendentes &gt; 48h)
                </h3>
                <span className="px-2 py-0.5 bg-rose-200 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 text-[11px] font-black uppercase tracking-wider rounded-full border border-rose-300 dark:border-rose-700">
                  {pendingOrdersOver48h.length} {pendingOrdersOver48h.length === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Agende disparos automáticos ou envie notificações gentis para clientes que ainda não confirmaram a encomenda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-xl hover:bg-white/60 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-neutral-50 dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0",
              activeTab === 'queue'
                ? "bg-brand-wine text-brand-gold shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Fila de Pedidos ({pendingOrdersOver48h.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0",
              activeTab === 'schedule'
                ? "bg-brand-wine text-brand-gold shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agendar Disparo ({selectedOrderIds.length})</span>
          </button>

          {dueReminders.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('due')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 animate-pulse",
                activeTab === 'due'
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
              )}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Vencidos Hoje ({dueReminders.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ml-auto",
              activeTab === 'settings'
                ? "bg-brand-wine text-brand-gold shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
            )}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Regra Automática</span>
          </button>
        </div>

        {/* Toast Feedback */}
        <AnimatePresence>
          {feedbackToast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn(
                "mx-6 mt-3 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm border",
                feedbackToast.type === 'success' 
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800"
              )}
            >
              {feedbackToast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackToast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: QUEUE */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-850 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 hover:text-brand-wine"
                  >
                    {selectedOrderIds.length === pendingOrdersOver48h.length && pendingOrdersOver48h.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-brand-wine" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400" />
                    )}
                    <span>{selectedOrderIds.length === pendingOrdersOver48h.length ? 'Desmarcar Todos' : 'Selecionar Todos'}</span>
                  </button>
                  <span className="text-xs text-neutral-400">
                    ({selectedOrderIds.length} selecionados)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={selectedOrderIds.length === 0}
                    onClick={() => setActiveTab('schedule')}
                    className="px-4 py-2 bg-brand-wine hover:bg-black text-brand-gold rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agendar Selecionados</span>
                  </button>
                </div>
              </div>

              {pendingOrdersOver48h.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-900 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                    Nenhum pedido pendente há mais de 48 horas!
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto">
                    Excelente trabalho! Todas as encomendas estão em dia ou foram confirmadas/atualizadas dentro do prazo de 48 horas.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden bg-white dark:bg-neutral-900">
                  {pendingOrdersOver48h.map((order) => {
                    const hours = getPendingHours(order);
                    const durationText = formatPendingDuration(hours);
                    const isSelected = selectedOrderIds.includes(order.id);
                    const isScheduled = order.scheduledReminderStatus === 'scheduled' && order.scheduledReminderAt;
                    const isSent = order.scheduledReminderStatus === 'sent' || (order.reminderCount && order.reminderCount > 0);

                    return (
                      <div 
                        key={order.id}
                        className={cn(
                          "p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                          isSelected ? "bg-amber-50/40 dark:bg-amber-950/20" : "hover:bg-neutral-50 dark:hover:bg-neutral-850"
                        )}
                      >
                        <div className="flex items-start gap-3.5">
                          <button
                            type="button"
                            onClick={() => toggleSelectOrder(order.id)}
                            className="mt-1 text-neutral-400 hover:text-brand-wine shrink-0 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-brand-wine" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-neutral-900 dark:text-white text-sm">
                                {order.customerName || 'Cliente'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                #{order.id.slice(-6).toUpperCase()}
                              </span>
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-md text-[10px] font-black uppercase">
                                ⏳ {durationText} pendente
                              </span>
                            </div>

                            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 flex-wrap">
                              <span>Total: <strong className="text-neutral-800 dark:text-neutral-200">{formatCurrency(order.total || 0)}</strong></span>
                              <span>•</span>
                              <span>{formatOrderItemsSummary(order)}</span>
                              {order.phone && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 font-mono text-neutral-600 dark:text-neutral-300">
                                    <Phone className="w-3 h-3" />
                                    {order.phone}
                                  </span>
                                </>
                              )}
                            </p>

                            {/* Status badges for reminder */}
                            <div className="flex items-center gap-2 flex-wrap pt-1">
                              {isScheduled ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 rounded-lg text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Agendado para: {new Date(order.scheduledReminderAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              ) : isSent ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200 rounded-lg text-[10px] font-bold border border-teal-200 dark:border-teal-800">
                                  <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                  Lembrete enviado ({order.reminderCount || 1}x)
                                </span>
                              ) : (
                                <span className="text-[10px] text-neutral-400 font-medium">
                                  Nenhum lembrete agendado
                                </span>
                              )}

                              {isScheduled && (
                                <button
                                  type="button"
                                  onClick={() => onCancelSchedule(order.id)}
                                  className="text-[10px] text-rose-600 hover:underline font-bold"
                                >
                                  Cancelar agendamento
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrderIds([order.id]);
                              setPreviewOrderId(order.id);
                              setActiveTab('schedule');
                            }}
                            className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                            title="Personalizar agendamento para este cliente"
                          >
                            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Agendar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendSingleWhatsApp(order)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                            title="Disparar lembrete amigável agora via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Enviar Agora</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SCHEDULE BULK / CUSTOM */}
          {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Form: Date, Time & Presets */}
              <div className="space-y-4">
                <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-wine" />
                      Data e Horário do Disparo Automático:
                    </label>
                    <span className="text-[11px] font-bold text-brand-wine">
                      {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'pedido selecionado' : 'pedidos selecionados'}
                    </span>
                  </div>

                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold/50"
                  />

                  {/* Quick Presets */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black uppercase text-neutral-400">Atalhos rápidos de horário:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyPresetTime(2)}
                        className="px-2.5 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-brand-gold"
                      >
                        Em 2 horas
                      </button>
                      <button
                        type="button"
                        onClick={applyTodayAfternoon}
                        className="px-2.5 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-brand-gold"
                      >
                        Hoje às 15:00
                      </button>
                      <button
                        type="button"
                        onClick={applyTomorrowMorning}
                        className="px-2.5 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-brand-gold"
                      >
                        Amanhã às 09:30
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetTime(24)}
                        className="px-2.5 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-brand-gold"
                      >
                        Em 24 horas
                      </button>
                    </div>
                  </div>
                </div>

                {/* Template Editor */}
                <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-wine" />
                      Modelo da Mensagem do Lembrete:
                    </label>
                    <button
                      type="button"
                      onClick={() => setMessageTemplate(DEFAULT_48H_REMINDER_TEMPLATE)}
                      className="text-[10px] font-bold text-brand-wine hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restaurar padrão
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono text-neutral-900 dark:text-white leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-brand-gold/50 resize-y"
                  />

                  {/* Placeholders Guide */}
                  <div className="flex flex-wrap gap-1 text-[10px] text-neutral-500 pt-1">
                    <span className="font-bold">Tags disponíveis:</span>
                    {['{nome}', '{numero_pedido}', '{tempo_espera}', '{itens}', '{total}', '{data}', '{horario}', '{chave_pix}', '{endereco}'].map(tag => (
                      <span key={tag} className="px-1.5 py-0.2 bg-neutral-200 dark:bg-neutral-800 rounded font-mono text-neutral-700 dark:text-neutral-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmSchedule}
                    disabled={isSaving || selectedOrderIds.length === 0}
                    className="flex-1 px-5 py-3 bg-brand-wine hover:bg-black text-brand-gold rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 active:scale-98"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{isSaving ? 'Salvando...' : `Confirmar Agendamento (${selectedOrderIds.length})`}</span>
                  </button>
                </div>
              </div>

              {/* Right: Live Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Pré-Visualização em Tempo Real:
                  </span>
                  {pendingOrdersOver48h.length > 1 && (
                    <select
                      value={previewOrderId}
                      onChange={(e) => setPreviewOrderId(e.target.value)}
                      className="text-xs font-medium px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200"
                    >
                      {pendingOrdersOver48h.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.customerName || 'Cliente'} (#{o.id.slice(-6).toUpperCase()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* WhatsApp style balloon */}
                <div className="p-4 bg-emerald-50/50 dark:bg-neutral-800/80 border border-emerald-200/60 dark:border-neutral-700 rounded-3xl space-y-3 shadow-inner">
                  <div className="flex items-center gap-2 pb-2 border-b border-emerald-200/40 dark:border-neutral-700">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      SE
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                        S.E Doces Gourmet
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                        WhatsApp Oficial
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-neutral-900 rounded-2xl rounded-tl-xs shadow-xs border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {livePreviewText}
                  </div>

                  {previewOrder && (
                    <div className="pt-1 flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Destinatário: <strong>{previewOrder.customerName}</strong> ({previewOrder.phone || 'Sem telefone'})</span>
                      <button
                        type="button"
                        onClick={() => handleSendSingleWhatsApp(previewOrder)}
                        className="text-emerald-700 dark:text-emerald-400 font-black hover:underline flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Testar no WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DUE TODAY / READY TO SEND */}
          {activeTab === 'due' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <BellRing className="w-6 h-6 text-rose-600 animate-bounce" />
                  <div>
                    <h4 className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                      Lembretes Vencidos e Prontos para Disparo
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      O horário programado para estes clientes já chegou. Você pode dispará-los pelo WhatsApp com um clique.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden bg-white dark:bg-neutral-900">
                {dueReminders.map(order => (
                  <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 dark:text-white text-sm">
                          {order.customerName}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        Programado para: {new Date(order.scheduledReminderAt).toLocaleString('pt-BR')} • {formatCurrency(order.total || 0)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendSingleWhatsApp(order)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Disparar WhatsApp</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AUTOMATION SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="bg-neutral-50 dark:bg-neutral-850 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                      Lembretes Automáticos Contínuos
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Sempre que um pedido completar 48 horas pendente sem confirmação, agendar ou alertar automaticamente.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={autoReminderEnabled} 
                      onChange={(e) => setAutoReminderEnabled(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block">
                    Horário Padrão de Disparo Diário:
                  </label>
                  <input
                    type="time"
                    value={autoReminderTime}
                    onChange={(e) => setAutoReminderTime(e.target.value)}
                    className="px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-900 dark:text-white"
                  />
                  <p className="text-[11px] text-neutral-400">
                    O sistema prioriza este horário comercial para sugerir ou programar os lembretes diários.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAutomationSettings}
                disabled={isSaving}
                className="w-full px-5 py-3 bg-brand-wine hover:bg-black text-brand-gold rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaving ? 'Salvando Configurações...' : 'Salvar Regra de Automação'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-neutral-500">
            {pendingOrdersOver48h.length} pendente(s) há &gt;48h • {dueReminders.length} lembrete(s) pronto(s) para disparo
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-100 rounded-xl text-xs font-bold transition-all"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
