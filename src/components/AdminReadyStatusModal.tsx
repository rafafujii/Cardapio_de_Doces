import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  BellRing, 
  Check, 
  Sparkles, 
  Bike, 
  Store, 
  Gift, 
  Clock, 
  MessageSquare,
  Send,
  AlertCircle,
  Phone
} from 'lucide-react';
import { cn } from '../lib/utils';
import { openWhatsAppWithMessage } from '../lib/quickRepliesHelper';

interface AdminReadyStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  globalSettings?: any;
  onConfirm: (orderId: string, status: string, customMessage?: string, notifyPwa?: boolean) => Promise<void> | void;
}

export const AdminReadyStatusModal: React.FC<AdminReadyStatusModalProps> = ({
  isOpen,
  onClose,
  order,
  globalSettings,
  onConfirm
}) => {
  if (!isOpen || !order) return null;

  const isDelivery = order.deliveryType === 'delivery';
  const customerFirstName = (order.customerName || 'Cliente').trim().split(' ')[0];
  const orderNumber = order.id.slice(-6).toUpperCase();
  const rawPhone = (order.customerPhone || order.phone || '').replace(/\D/g, '');

  // Smart default message depending on delivery vs pickup
  const defaultInitialMessage = isDelivery
    ? `Olá, ${customerFirstName}! Seus doces gourmet estão fresquinhos, embalados e nosso entregador já está a caminho com o seu pedido #${orderNumber}! 🛵💨`
    : `Olá, ${customerFirstName}! Seus doces gourmet estão fresquinhos, embalados com todo o carinho e prontos para retirada na confeitaria! 🛍️✨`;

  const [message, setMessage] = useState(defaultInitialMessage);
  const [notifyPwa, setNotifyPwa] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick preset templates
  const presets = [
    {
      id: 'pickup_standard',
      icon: Store,
      label: 'Retirada no Balcão',
      text: `Olá, ${customerFirstName}! Seu pedido #${orderNumber} está fresquinho, embalado e pronto para retirada no balcão da confeitaria! 🛍️✨`
    },
    {
      id: 'delivery_out',
      icon: Bike,
      label: 'Saiu para Entrega',
      text: `Olá, ${customerFirstName}! Seu pedido #${orderNumber} foi finalizado e nosso entregador já saiu para entrega no seu endereço! 🛵💨`
    },
    {
      id: 'gift_box',
      icon: Gift,
      label: 'Caixa de Presente',
      text: `Olá, ${customerFirstName}! Sua caixinha especial #${orderNumber} foi finalizada com lindo laço artesanal e está pronta para retirada! 🎁✨`
    },
    {
      id: 'schedule_notice',
      icon: Clock,
      label: 'Aviso de Horário',
      text: `Olá, ${customerFirstName}! Seus doces #${orderNumber} estão prontos e refrigerados na temperatura perfeita. Aguardamos sua retirada! ❄️🕒`
    }
  ];

  const handlePresetClick = (presetText: string) => {
    setMessage(presetText);
  };

  const handleConfirmWithNotification = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(order.id, 'ready', message.trim(), notifyPwa);
      onClose();
    } catch (err) {
      console.error("Error updating status to ready:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnlyChangeStatus = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(order.id, 'ready', undefined, false);
      onClose();
    } catch (err) {
      console.error("Error updating status to ready:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendViaWhatsApp = () => {
    if (!rawPhone) {
      alert("Este pedido não possui telefone do cliente cadastrado.");
      return;
    }
    openWhatsAppWithMessage(rawPhone, message);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-neutral-100 w-full max-w-xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner">
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                    Transição de Status
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-100">
                    #{orderNumber}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold italic mt-0.5">
                  Marcar como Pronto & Notificar Cliente
                </h3>
              </div>
            </div>

            <p className="text-xs text-emerald-50 mt-2 leading-relaxed opacity-95">
              Envie uma notificação customizada diretamente para o histórico de pedidos do cliente (via PWA) avisando que a encomenda está pronta.
            </p>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Order Brief Info */}
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Cliente</p>
                <p className="font-bold text-neutral-800 text-sm">{order.customerName}</p>
                {(order.customerPhone || order.phone) && (
                  <p className="text-neutral-500 flex items-center gap-1 font-mono text-[11px]">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {order.customerPhone || order.phone}
                  </p>
                )}
              </div>

              <div className="text-right space-y-0.5">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Tipo</p>
                <span className={cn(
                  "inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[11px]",
                  isDelivery ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                )}>
                  {isDelivery ? <Bike className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                  {isDelivery ? 'Entrega em Domicílio' : 'Retirada no Balcão'}
                </span>
                <p className="text-neutral-500 text-[11px]">{(order.items || []).length} itens no pedido</p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Mensagens Rápidas Sugeridas (1 Clique)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = message === preset.text;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetClick(preset.text)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer min-h-[44px]",
                        isSelected 
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs" 
                          : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                        isSelected ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-600"
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate text-[11px]">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Message Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-neutral-600 tracking-wider">
                  Mensagem Customizada de Notificação
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {message.length} caracteres
                </span>
              </div>

              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva uma mensagem especial para o cliente..."
                className="w-full p-3.5 text-sm bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 transition-all text-neutral-800 leading-relaxed font-sans"
              />
              <p className="text-[11px] text-neutral-400 italic">
                💡 Esta mensagem será gravada no histórico do pedido do cliente no PWA e disparará um alerta sonoro no dispositivo.
              </p>
            </div>

            {/* PWA Notification Option Checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyPwa}
                onChange={(e) => setNotifyPwa(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-emerald-950 block">
                  Disparar Alerta PWA e fixar no Histórico de Pedidos
                </span>
                <span className="text-emerald-800 text-[11px] leading-snug block mt-0.5">
                  Atualiza a barra de progresso para "Pronto", toca sinal sonoro e exibe o aviso em destaque na tela do cliente.
                </span>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-neutral-50 border-t border-neutral-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* WhatsApp Alternative */}
            {rawPhone ? (
              <button
                type="button"
                onClick={handleSendViaWhatsApp}
                className="px-3 py-2 text-emerald-700 hover:bg-emerald-100/60 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-emerald-300/60 cursor-pointer active:scale-95"
                title="Abrir WhatsApp com este mesmo texto"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Enviar tb pelo WhatsApp
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleOnlyChangeStatus}
                disabled={isSubmitting}
                className="px-3.5 py-2.5 text-neutral-600 hover:text-neutral-900 text-xs font-bold rounded-xl transition-all cursor-pointer hover:bg-neutral-200/50"
              >
                Apenas marcar status
              </button>

              <button
                type="button"
                onClick={handleConfirmWithNotification}
                disabled={isSubmitting || !message.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Atualizando...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar 'Pronto' & Notificar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
