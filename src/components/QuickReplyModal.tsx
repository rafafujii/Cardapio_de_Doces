import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Copy, Check, Sparkles, Phone } from 'lucide-react';
import { QuickReplyPhrase } from '../types';
import { DEFAULT_QUICK_REPLIES, formatQuickReply, openWhatsAppWithMessage } from '../lib/quickRepliesHelper';
import { formatCurrency } from '../lib/utils';

interface QuickReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: any;
  customerProfile?: any;
  customPhrases?: QuickReplyPhrase[];
  globalSettings?: any;
}

export function QuickReplyModal({
  isOpen,
  onClose,
  order,
  customerProfile,
  customPhrases,
  globalSettings
}: QuickReplyModalProps) {
  const phrases = useMemo(() => {
    return (customPhrases && customPhrases.length > 0) ? customPhrases : DEFAULT_QUICK_REPLIES;
  }, [customPhrases]);

  const [selectedPhraseId, setSelectedPhraseId] = useState<string>(phrases[0]?.id || '');
  const [editedText, setEditedText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState(
    order?.customerPhone || order?.phone || customerProfile?.normalizedPhone || customerProfile?.displayPhone || ''
  );

  const selectedPhrase = useMemo(() => {
    return phrases.find(p => p.id === selectedPhraseId) || phrases[0];
  }, [phrases, selectedPhraseId]);

  // Derive template data
  const templateData = useMemo(() => {
    const customerName = order?.customerName || customerProfile?.customerName || 'Cliente';
    const orderNumber = order?.id ? order.id.slice(-6).toUpperCase() : '---';
    const itemsSummary = order?.items
      ? order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')
      : customerProfile?.favoriteFlavors?.map((f: any) => f.name).join(', ') || '';
    const totalAmount = order?.total ? formatCurrency(order.total) : '';
    const pickupDate = order?.date ? order.date.split('-').reverse().join('/') : '';
    const pickupTime = order?.time || '';
    const pickupAddress = globalSettings?.pickupAddress || 'Avenida Padre Jose Stefanello, n°340';
    const deliveryAddress = order?.deliveryAddress || '';
    const pixKey = globalSettings?.pixKey || '03972289960';
    const catalogUrl = window.location.origin;

    return {
      customerName,
      orderNumber,
      itemsSummary,
      totalAmount,
      pickupDate,
      pickupTime,
      pickupAddress,
      deliveryAddress,
      pixKey,
      catalogUrl
    };
  }, [order, customerProfile, globalSettings]);

  // Update text when selected phrase changes
  React.useEffect(() => {
    if (selectedPhrase) {
      const rendered = formatQuickReply(selectedPhrase.template, templateData);
      setEditedText(rendered);
    }
  }, [selectedPhrase, templateData]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const phoneToUse = customPhone || globalSettings?.contactPhone || '';
    if (!phoneToUse) {
      handleCopy();
      alert("Texto copiado! Insira o número de WhatsApp do cliente ou abra a conversa no aplicativo.");
      return;
    }
    openWhatsAppWithMessage(phoneToUse, editedText);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-brand-wine/10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-brand-wine to-brand-wine/90 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif italic text-xl font-bold text-brand-gold">Central de Respostas Rápidas</h3>
                <p className="text-xs text-white/70">
                  {order ? `Pedido #${order.id.slice(-6).toUpperCase()} • ${order.customerName}` : customerProfile ? `Cliente: ${customerProfile.customerName}` : 'Mensagens Rápidas de Atendimento'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-grow">
            {/* Phrase Selector Chips */}
            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                Selecione o Modelo de Mensagem:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {phrases.map((phrase) => {
                  const isSelected = phrase.id === selectedPhraseId;
                  return (
                    <button
                      key={phrase.id}
                      type="button"
                      onClick={() => setSelectedPhraseId(phrase.id)}
                      className={`text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-brand-wine bg-brand-wine/5 font-bold text-brand-wine shadow-sm ring-1 ring-brand-wine'
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-600 bg-neutral-50/50'
                      }`}
                    >
                      <span className="truncate mr-2">{phrase.title}</span>
                      {isSelected && <Sparkles className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Phone */}
            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">
                WhatsApp do Destinatário:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="DDD + Número (ex: 44 99854-2446)"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine focus:ring-1 focus:ring-brand-wine outline-none transition-all"
                />
              </div>
            </div>

            {/* Message Preview & Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Texto da Mensagem (Você pode editar antes de enviar):
                </label>
                <span className="text-[10px] text-neutral-400 font-medium">
                  {editedText.length} caracteres
                </span>
              </div>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={7}
                className="w-full p-4 bg-neutral-50/80 border border-neutral-200 rounded-2xl text-xs text-neutral-800 leading-relaxed font-sans focus:border-brand-wine focus:ring-1 focus:ring-brand-wine outline-none transition-all resize-none shadow-inner"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-neutral-500" />
                  Copiar Mensagem
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-neutral-700 text-xs font-black uppercase tracking-wider transition-all"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" />
                Enviar no WhatsApp
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
