import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Clock, MapPin, Send, Check, Phone, User, DollarSign, Package } from 'lucide-react';
import { ReadyBox, OrderDetails } from '../types';
import { formatCurrency } from '../lib/utils';
import { openWhatsAppWithMessage } from '../lib/quickRepliesHelper';

interface ReadyBoxOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  box: ReadyBox | null;
  globalSettings?: any;
  onSubmitOrder?: (orderDetails: OrderDetails, items: any[], total: number) => Promise<any>;
}

export function ReadyBoxOrderModal({
  isOpen,
  onClose,
  box,
  globalSettings,
  onSubmitOrder
}: ReadyBoxOrderModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('Em 30 a 60 minutos');
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Dinheiro'>('Pix');
  const [changeAmount, setChangeAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !box) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Por favor, informe seu nome.');
      return;
    }

    setIsSubmitting(true);

    const orderDetails: OrderDetails = {
      name: customerName.trim(),
      date: todayStr,
      time: pickupTime,
      paymentMethod,
      changeAmount: paymentMethod === 'Dinheiro' ? changeAmount : '',
      notes: notes.trim() ? `[PRONTA ENTREGA DE HOJE] ${notes}` : '[PRONTA ENTREGA DE HOJE]',
      phone: phone.trim(),
      isReadyBoxOrder: true
    };

    const items = [
      {
        name: `🎁 ${box.title} (${box.itemsCount} doces)`,
        quantity: 1,
        price: box.price,
        isUnitItem: true
      }
    ];

    try {
      if (onSubmitOrder) {
        await onSubmitOrder(orderDetails, items, box.price);
      }

      // Format direct WhatsApp message for the confectioner
      const contactPhone = globalSettings?.contactPhone || '5544998542446';
      const pixKey = globalSettings?.pixKey || '03972289960';
      const pickupAddress = globalSettings?.pickupAddress || 'Avenida Padre Jose Stefanello, n°340';

      const whatsappText = `✨ *NOVO PEDIDO - PRONTA ENTREGA DE HOJE!* ✨\n\n` +
        `👤 *Cliente:* ${customerName.trim()}\n` +
        `📱 *Contato:* ${phone.trim() || 'Não informado'}\n` +
        `🎁 *Caixa Escolhida:* ${box.title} (${box.itemsCount} doces)\n` +
        `🍫 *Sabores:* ${box.description}\n` +
        `💰 *Valor:* ${formatCurrency(box.price)}\n` +
        `💳 *Pagamento:* ${paymentMethod}${paymentMethod === 'Dinheiro' && changeAmount ? ` (Troco para ${changeAmount})` : ''}\n` +
        `⏰ *Previsão de Retirada:* ${pickupTime} (HOJE)\n` +
        `📍 *Local:* ${pickupAddress}\n` +
        (notes.trim() ? `📝 *Obs:* ${notes.trim()}\n` : '') +
        `\n🔑 *Chave PIX:* ${pixKey}\n\n` +
        `_Olá! Gostaria de confirmar a reserva desta caixinha de pronta entrega!_`;

      openWhatsAppWithMessage(contactPhone, whatsappText);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Houve um erro ao registrar seu pedido. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-brand-gold/40 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-amber-700 via-brand-wine to-brand-wine text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <span className="px-2 py-0.5 bg-brand-gold text-brand-wine font-black text-[9px] rounded-full uppercase tracking-wider">
                  Retirada Imediata Hoje
                </span>
                <h3 className="font-serif italic text-xl font-bold text-white mt-0.5">
                  {box.title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-grow">
            {/* Box Summary Card */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-serif italic text-neutral-800 font-bold">{box.description}</p>
                  <p className="text-[10px] text-amber-900 font-bold mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    {box.pickupUntilTime || 'Retirada hoje até o fim do expediente'}
                  </p>
                </div>
                <div className="text-right">
                  {box.originalPrice && box.originalPrice > box.price && (
                    <span className="text-[10px] text-neutral-400 line-through block">
                      {formatCurrency(box.originalPrice)}
                    </span>
                  )}
                  <span className="text-xl font-black text-brand-wine">
                    {formatCurrency(box.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                  Seu Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Beatriz Lima"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                  Seu WhatsApp (com DDD)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(44) 99999-9999"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                    Previsão de Retirada Hoje
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine outline-none"
                  >
                    <option value="Em 30 a 60 minutos">Em 30 a 60 minutos</option>
                    <option value="Em até 2 horas">Em até 2 horas</option>
                    <option value="Final da tarde (17h - 18h)">Final da tarde (17h - 18h)</option>
                    <option value="À noite (18h - 19:30)">À noite (18h - 19:30)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine outline-none"
                  >
                    <option value="Pix">PIX (Chave no WhatsApp)</option>
                    <option value="Dinheiro">Dinheiro na Retirada</option>
                  </select>
                </div>
              </div>

              {paymentMethod === 'Dinheiro' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                    Precisa de troco para quanto?
                  </label>
                  <input
                    type="text"
                    value={changeAmount}
                    onChange={(e) => setChangeAmount(e.target.value)}
                    placeholder="Ex: Troco para R$ 50,00"
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                  Observações adicionais (opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Colocar sacola de presente"
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine outline-none"
                />
              </div>
            </div>

            {/* Pickup Info Banner */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-wine flex-shrink-0" />
              <span>
                Retirada em: <strong className="text-neutral-800">{globalSettings?.pickupAddress || 'Avenida Padre Jose Stefanello, n°340'}</strong>
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Confirmando...' : 'Reservar Caixinha no WhatsApp'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
