import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  ChevronRight, 
  Calendar, 
  Clock, 
  CreditCard, 
  Download, 
  MessageSquare, 
  Trash2, 
  Check,
  Star,
  Sparkles,
  AlertTriangle,
  Phone,
  ChefHat,
  BellRing,
  ClipboardPen
} from 'lucide-react';
import { Timestamp } from '../firebase';
import { cn, formatCurrency } from '../lib/utils';
import { generateOrderPdf } from '../lib/pdfGenerator';
import { QuickReplyModal } from './QuickReplyModal';
import { AdminReadyStatusModal } from './AdminReadyStatusModal';
import { buildPostSaleReviewMessage } from '../lib/couponHelper';
import { openWhatsAppWithMessage } from '../lib/quickRepliesHelper';

interface AdminOrderCardProps {
  order: any;
  globalSettings?: any;
  onUpdateStatus: (id: string, status: string, customMessage?: string, notifyPwa?: boolean) => void;
  onDeletePermanent: (id: string) => void;
  onOpenScheduleReminder?: (orderId: string) => void;
}

export const AdminOrderCard: React.FC<AdminOrderCardProps> = ({
  order,
  globalSettings,
  onUpdateStatus,
  onDeletePermanent,
  onOpenScheduleReminder,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isQuickReplyOpen, setIsQuickReplyOpen] = useState(false);
  const [isReadyModalOpen, setIsReadyModalOpen] = useState(false);
  const isCompleted = order.status === 'completed';
  const isReady = order.status === 'ready';
  const isPreparing = order.status === 'preparing';
  const isDeleted = order.status === 'deleted';

  // Check if pending order has been waiting without update for >24 hours
  const isPendingOverdue = useMemo(() => {
    if (order.status !== 'pending') return false;
    let lastActivityMs: number | null = null;
    if (order.updatedAt?.toDate) {
      lastActivityMs = order.updatedAt.toDate().getTime();
    } else if (order.updatedAt?.seconds) {
      lastActivityMs = order.updatedAt.seconds * 1000;
    } else if (order.createdAt?.toDate) {
      lastActivityMs = order.createdAt.toDate().getTime();
    } else if (order.createdAt?.seconds) {
      lastActivityMs = order.createdAt.seconds * 1000;
    } else if (order.date) {
      const parsed = new Date(`${order.date}T${order.time || '12:00'}`).getTime();
      if (!isNaN(parsed)) lastActivityMs = parsed;
    }
    if (!lastActivityMs) return false;
    const diffHours = (Date.now() - lastActivityMs) / (1000 * 60 * 60);
    return diffHours >= 24;
  }, [order]);

  const isPendingOver48h = useMemo(() => {
    if (order.status !== 'pending') return false;
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
      const parsed = new Date(order.createdAt).getTime();
      if (!isNaN(parsed)) lastActivityMs = parsed;
    } else if (order.date) {
      const parsed = new Date(`${order.date}T${order.time || '12:00'}`).getTime();
      if (!isNaN(parsed)) lastActivityMs = parsed;
    }
    if (!lastActivityMs) return false;
    const diffHours = (Date.now() - lastActivityMs) / (1000 * 60 * 60);
    return diffHours >= 48;
  }, [order]);

  const pendingHoursText = useMemo(() => {
    if (!isPendingOverdue) return null;
    let lastActivityMs: number | null = null;
    if (order.updatedAt?.toDate) {
      lastActivityMs = order.updatedAt.toDate().getTime();
    } else if (order.updatedAt?.seconds) {
      lastActivityMs = order.updatedAt.seconds * 1000;
    } else if (order.createdAt?.toDate) {
      lastActivityMs = order.createdAt.toDate().getTime();
    } else if (order.createdAt?.seconds) {
      lastActivityMs = order.createdAt.seconds * 1000;
    } else if (order.date) {
      const parsed = new Date(`${order.date}T${order.time || '12:00'}`).getTime();
      if (!isNaN(parsed)) lastActivityMs = parsed;
    }
    if (!lastActivityMs) return null;
    const hours = Math.floor((Date.now() - lastActivityMs) / (1000 * 60 * 60));
    if (hours >= 48) {
      return `${Math.floor(hours / 24)} dias`;
    }
    return `${hours} horas`;
  }, [isPendingOverdue, order]);

  const handleDownloadPdf = () => {
    generateOrderPdf({
      orderDetails: {
        name: order.customerName,
        date: order.date,
        time: order.time,
        paymentMethod: order.paymentMethod,
        changeAmount: order.changeAmount,
        notes: order.notes
      },
      items: order.items,
      total: order.total,
      pixKey: globalSettings?.pixKey || '03972289960',
      pickupAddress: globalSettings?.pickupAddress || 'Avenida Padre Jose Stefanello, n°340',
      contactPhone: globalSettings?.contactPhone || '5544998542446',
      orderNumber: order.id.slice(-6).toUpperCase(),
      isFormalProposal: false
    });
  };

  const handleSendPostSaleReview = () => {
    let targetPhone = order.phone || '';
    if (!targetPhone) {
      const input = prompt("Informe o WhatsApp do cliente para enviar a solicitação de avaliação pós-venda:", "");
      if (!input) return;
      targetPhone = input;
    }

    const msg = buildPostSaleReviewMessage({
      customerName: order.customerName || 'Cliente',
      orderId: order.id,
      template: globalSettings?.postSaleReviewTemplate,
      globalSettings
    });

    openWhatsAppWithMessage(targetPhone, msg);
  };

  return (
    <div className={cn(
      "bg-white rounded-[24px] overflow-hidden border transition-all duration-300",
      isDeleted ? "border-red-100 bg-red-50/20" : (isCompleted ? "opacity-60 border-neutral-100 grayscale-[0.5]" : "border-neutral-100 shadow-sm hover:shadow-md"),
      isReady && !isDeleted && "ring-2 ring-emerald-500/20 border-emerald-500/30 shadow-emerald-100 shadow-lg",
      isPreparing && !isDeleted && "ring-2 ring-amber-500/20 border-amber-400/40 bg-amber-50/10 shadow-amber-50 shadow-sm",
      isPendingOverdue && !isDeleted && "border-rose-300 ring-2 ring-rose-400/30 bg-rose-50/20 shadow-rose-100 shadow-md"
    )}>
      {/* Summary Section */}
      <div className="p-6 flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-serif text-brand-wine italic">{order.customerName}</h3>
            {(order.customerPhone || order.phone) && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-emerald-600" />
                {order.customerPhone || order.phone}
              </span>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              {order.status === 'pending' && !isPendingOverdue && (
                <span className="text-[10px] font-black px-2 py-0.5 bg-brand-gold/15 text-brand-wine rounded-full border border-brand-gold/30 flex items-center gap-1" title="Pedido recebido aguardando envio da mensagem pelo WhatsApp para iniciar produção">
                  <Clock className="w-2.5 h-2.5 text-brand-gold" />
                  AGUARDANDO WHATSAPP
                </span>
              )}
              {order.status === 'pending' && isPendingOverdue && (
                <span className="text-[10px] font-black px-2.5 py-0.5 bg-rose-600 text-white rounded-full border border-rose-700 animate-pulse flex items-center gap-1 shadow-2xs" title={`Pedido pendente aguardando há mais de ${pendingHoursText} sem atualização!`}>
                  <AlertTriangle className="w-3 h-3 text-amber-200" />
                  PENDENTE HÁ +{pendingHoursText} ⚠️
                </span>
              )}
              {isPendingOver48h && (
                <span className="text-[10px] font-black px-2.5 py-0.5 bg-rose-800 text-amber-200 rounded-full border border-rose-900 flex items-center gap-1 shadow-xs" title="Pedido pendente há mais de 48 horas! Recomenda-se agendar ou enviar lembrete ao cliente.">
                  <Clock className="w-3 h-3 text-amber-300" />
                  &gt; 48H PENDENTE
                </span>
              )}
              {order.scheduledReminderStatus === 'scheduled' && order.scheduledReminderAt && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full flex items-center gap-1" title={`Lembrete agendado para ${new Date(order.scheduledReminderAt).toLocaleString('pt-BR')}`}>
                  <Clock className="w-3 h-3 text-amber-600" />
                  Lembrete: {new Date(order.scheduledReminderAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {new Date(order.scheduledReminderAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {Boolean(order.reminderCount && order.reminderCount > 0) && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-900 border border-teal-300 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 text-teal-600" />
                  {order.reminderCount}x Lembrete(s)
                </span>
              )}
              {order.status === 'preparing' && (
                <span className="text-[10px] font-black px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-300 flex items-center gap-1">
                  <ChefHat className="w-3 h-3 text-amber-600" />
                  PREPARANDO NA COZINHA
                </span>
              )}
              {order.status === 'ready' && <span className="text-[10px] font-black px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200 font-bold flex items-center gap-1"><Sparkles className="w-3 h-3 text-emerald-600" /> PRONTO!</span>}
              {order.status === 'completed' && <span className="text-[10px] font-black px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full border border-neutral-200">ENTREGUE</span>}
              {order.status === 'deleted' && <span className="text-[10px] font-black px-2 py-0.5 bg-red-100 text-red-600 rounded-full border border-red-200">EXCLUÍDO</span>}
              {Boolean(order.isManualOrder || order.origin) && (
                <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full flex items-center gap-1" title="Pedido lançado manualmente (fora do cardápio)">
                  <ClipboardPen className="w-3 h-3 text-indigo-600" />
                  {order.origin ? order.origin.toUpperCase() : 'MANUAL'}
                </span>
              )}
              {Boolean(order.rating) && (
                <span className="text-[10px] font-black px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-full flex items-center gap-1 shadow-2xs" title={`Avaliação do cliente: ${order.rating}/5 estrelas`}>
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  {order.rating}/5 ⭐
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 font-medium">#{order.id.slice(-6).toUpperCase()} {order.deletedAt && `• Excluído em: ${order.deletedAt.toDate().toLocaleDateString('pt-BR')}`}</p>
          {order.customNotificationMessage && (
            <div className="mt-1.5 p-2 bg-emerald-50/80 rounded-xl border border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-1.5 max-w-xl">
              <BellRing className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold text-[9px] uppercase tracking-wider text-emerald-800">
                  Notificação PWA enviada{order.statusNotificationAt ? ` (${order.statusNotificationAt})` : ''}:
                </span>
                <span className="italic text-[11px] text-emerald-950 font-medium block">"{order.customNotificationMessage}"</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-neutral-400 uppercase font-black mb-1">Total</p>
            <p className="text-xl font-black text-brand-wine leading-none">{formatCurrency(order.total)}</p>
          </div>
          
          <button 
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[10px] font-black text-brand-wine hover:text-brand-gold transition-colors uppercase tracking-widest"
          >
            {isExpanded ? 'Esconder' : 'Ver Detalhes'}
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronRight className="w-4 h-4 ml-1 rotate-90" />
            </motion.div>
          </button>
        </div>
      </div>
      
      {/* Expandable Details Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 bg-brand-cream/30 border-t border-brand-wine/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                {/* Items List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-brand-wine uppercase tracking-widest flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Itens do Pedido
                  </h4>
                  <div className="space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-brand-wine/5 last:border-0">
                        <span className="text-neutral-600 font-medium font-serif">
                          <span className="text-brand-wine font-black mr-2 not-italic">{item.quantity}x</span>
                          {item.name}
                        </span>
                        <span className="text-neutral-400 italic text-xs">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logistics & Payment */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-neutral-400 uppercase font-black">Data/Hora</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-wine" />
                        {order.date.split('-').reverse().join('/')}
                      </p>
                      <div className="flex items-center gap-1 pl-4.5">
                        <Clock className="w-3.5 h-3.5 text-brand-wine" />
                        <span className="text-sm font-medium">{order.time}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-neutral-400 uppercase font-black">Pagamento</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-brand-wine" />
                        {order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="p-3 bg-white/80 rounded-xl border border-brand-wine/10 text-xs italic text-neutral-500">
                      <span className="font-bold text-brand-wine not-italic mr-1">Obs:</span> {order.notes}
                    </div>
                  )}

                  {Boolean(order.rating) && (
                    <div className="p-3.5 bg-gradient-to-r from-amber-50/90 via-amber-50/60 to-yellow-50/40 rounded-xl border border-amber-300/80 text-xs text-neutral-800 flex items-start gap-3 shadow-2xs">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 shadow-inner">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-[10px] uppercase tracking-wider text-amber-900">
                            Avaliação do Cliente
                          </span>
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star 
                                key={s} 
                                className={cn(
                                  "w-3.5 h-3.5",
                                  (order.rating || 0) >= s ? "fill-amber-400 text-amber-400" : "text-neutral-200 fill-neutral-100"
                                )} 
                              />
                            ))}
                          </div>
                          <span className="text-xs font-black text-amber-950 font-mono">
                            {order.rating}/5 estrelas
                          </span>
                        </div>
                        {order.reviewComment && (
                          <div className="mt-1.5 p-2 bg-white/80 rounded-lg border border-amber-200/60 text-neutral-700 italic text-xs">
                            "{order.reviewComment}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 justify-end pt-4">
                    {/* Baixar PDF do Pedido */}
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-brand-wine text-[11px] font-black rounded-xl transition-all flex items-center gap-1.5 border border-neutral-200 shadow-sm min-h-[42px] active:scale-95"
                      title="Baixar Pedido/Orçamento em PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-wine" />
                      BAIXAR PDF
                    </button>

                    {/* Resposta Rápida WhatsApp */}
                    <button
                      type="button"
                      onClick={() => setIsQuickReplyOpen(true)}
                      className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm min-h-[42px] active:scale-95"
                      title="Enviar Resposta Rápida no WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WHATSAPP RÁPIDO
                    </button>

                    {/* Pedir Avaliação Pós-Venda (WhatsApp) */}
                    <button
                      type="button"
                      onClick={handleSendPostSaleReview}
                      className="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm min-h-[42px] active:scale-95"
                      title="Enviar Convite de Avaliação com Link de Feedback no WhatsApp"
                    >
                      <Star className="w-3.5 h-3.5 fill-white" />
                      PEDIR AVALIAÇÃO
                    </button>

                    {/* Normal Actions */}
                    {!isDeleted && (
                      <>
                        <button 
                         type="button"
                         onClick={() => onUpdateStatus(order.id, 'deleted')}
                         className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all min-h-[42px] min-w-[42px] flex items-center justify-center active:scale-90"
                         title="Excluir (Mover para Lixeira)"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>

                        {order.status === 'pending' && (
                          <>
                            {onOpenScheduleReminder && (
                              <button 
                                type="button"
                                onClick={() => onOpenScheduleReminder(order.id)}
                                className={cn(
                                  "px-3.5 py-2.5 text-[11px] font-black rounded-xl border transition-all flex items-center gap-1.5 min-h-[42px] active:scale-95 cursor-pointer shadow-xs",
                                  isPendingOver48h
                                    ? "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                )}
                                title="Agendar ou enviar lembrete amigável para este pedido pendente"
                              >
                                <Clock className="w-3.5 h-3.5 text-rose-600" />
                                <span>{order.scheduledReminderStatus === 'scheduled' ? 'VER LEMBRETE' : 'AGENDAR LEMBRETE (48H)'}</span>
                              </button>
                            )}
                            <button 
                              type="button"
                              onClick={() => onUpdateStatus(order.id, 'preparing')}
                              className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 min-h-[42px] active:scale-95 cursor-pointer"
                              title="Mudar status para Em Preparação na Cozinha"
                            >
                              <ChefHat className="w-3.5 h-3.5" /> INICIAR PREPARO
                            </button>
                            <button 
                              type="button"
                              onClick={() => setIsReadyModalOpen(true)}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 min-h-[42px] active:scale-95 cursor-pointer"
                              title="Marcar como Pronto e enviar notificação PWA customizada ao cliente"
                            >
                              <BellRing className="w-3.5 h-3.5" /> MARCAR COMO PRONTO
                            </button>
                          </>
                        )}

                        {order.status === 'preparing' && (
                          <button 
                            type="button"
                            onClick={() => setIsReadyModalOpen(true)}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-500/30 transition-all flex items-center gap-2 min-h-[42px] active:scale-95 cursor-pointer"
                            title="Pronto! Enviar notificação customizada via PWA diretamente ao cliente"
                          >
                            <BellRing className="w-4 h-4" /> MARCAR COMO PRONTO & NOTIFICAR
                          </button>
                        )}

                        {order.status === 'ready' && (
                          <button 
                            type="button"
                            onClick={() => setIsReadyModalOpen(true)}
                            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-300 transition-all flex items-center gap-1.5 min-h-[42px] active:scale-95 cursor-pointer"
                            title="Editar mensagem de status e reenviar notificação PWA ao cliente"
                          >
                            <BellRing className="w-3.5 h-3.5 text-emerald-600" /> EDITAR NOTIFICAÇÃO PWA
                          </button>
                        )}

                        {(order.status === 'pending' || order.status === 'preparing' || order.status === 'ready') && (
                          <button 
                            type="button"
                            onClick={() => onUpdateStatus(order.id, 'completed')}
                            className="px-4 py-2.5 bg-brand-wine text-brand-gold text-[11px] font-black rounded-xl shadow-md shadow-brand-wine/20 hover:bg-black transition-all min-h-[42px] active:scale-95 cursor-pointer"
                          >
                            FINALIZAR ENTREGA
                          </button>
                        )}
                      </>
                    )}

                    {/* Trash Actions */}
                    {isDeleted && (
                      <>
                        <button 
                         type="button"
                         onClick={() => onUpdateStatus(order.id, 'pending')}
                         className="px-4 py-2.5 bg-brand-wine text-white text-[11px] font-black rounded-xl transition-all min-h-[42px] active:scale-95"
                        >
                          RESTAURAR PEDIDO
                        </button>
                        <button 
                         type="button"
                         onClick={() => onDeletePermanent(order.id)}
                         className="px-4 py-2.5 bg-red-600 text-white text-[11px] font-black rounded-xl transition-all min-h-[42px] active:scale-95"
                        >
                          EXCLUIR PERMANENTE
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-neutral-400 font-mono text-center pb-4">
                REGISTRADO EM: {order.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleString('pt-BR') : 'Agora'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Reply Modal */}
      {isQuickReplyOpen && (
        <QuickReplyModal
          isOpen={isQuickReplyOpen}
          onClose={() => setIsQuickReplyOpen(false)}
          order={order}
          customPhrases={globalSettings?.quickReplyPhrases}
          globalSettings={globalSettings}
        />
      )}

      {/* Admin Ready Status Modal with Custom Notification to PWA */}
      {isReadyModalOpen && (
        <AdminReadyStatusModal
          isOpen={isReadyModalOpen}
          onClose={() => setIsReadyModalOpen(false)}
          order={order}
          globalSettings={globalSettings}
          onConfirm={(orderId, status, customMessage, notifyPwa) => {
            onUpdateStatus(orderId, status, customMessage, notifyPwa);
          }}
        />
      )}
    </div>
  );
};
