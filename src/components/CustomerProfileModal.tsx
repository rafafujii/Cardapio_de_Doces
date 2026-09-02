import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Crown, Sparkles, Heart, Calendar, DollarSign, Package, ShoppingBag, MessageSquare, Plus, Trash2, Check, Tag } from 'lucide-react';
import { CustomerCRMProfile, CustomerNoteData } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { openWhatsAppWithMessage } from '../lib/quickRepliesHelper';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerCRMProfile | null;
  onSaveCustomerNotes?: (phoneKey: string, noteData: CustomerNoteData) => Promise<void>;
  onOpenQuickReply?: (profile: CustomerCRMProfile) => void;
}

export function CustomerProfileModal({
  isOpen,
  onClose,
  profile,
  onSaveCustomerNotes,
  onOpenQuickReply
}: CustomerProfileModalProps) {
  if (!isOpen || !profile) return null;

  const [notesText, setNotesText] = useState(profile.notes?.notes || '');
  const [birthday, setBirthday] = useState(profile.notes?.birthday || '');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(profile.notes?.tags || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (!tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSaveNotes = async () => {
    if (!onSaveCustomerNotes) return;
    setIsSaving(true);
    try {
      const notePayload: CustomerNoteData = {
        customerName: profile.customerName,
        customerPhone: profile.normalizedPhone || profile.displayPhone,
        birthday: birthday.trim(),
        notes: notesText.trim(),
        tags
      };
      await onSaveCustomerNotes(profile.normalizedPhone || profile.customerName, notePayload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar notas do cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDirectWhatsApp = () => {
    const topFlavor = profile.favoriteFlavors[0]?.name || 'doces gourmet';
    const message = `Olá, ${profile.customerName}! Tudo bem? ❤️\n\nPassando aqui da *S.E Doces Gourmet* para agradecer por sempre confiar no nosso trabalho! Como sabemos que você adora nossos *${topFlavor}*, estamos sempre à sua disposição quando precisar de doces finos e frescos!\n\nUm grande abraço! ✨🍫`;
    openWhatsAppWithMessage(profile.normalizedPhone || profile.displayPhone, message);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-brand-gold/30 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-neutral-900 via-brand-wine to-brand-wine text-white flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30 font-serif italic text-xl font-bold">
                {profile.customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif italic text-xl font-bold text-white">
                    {profile.customerName}
                  </h3>
                  {profile.vipTier === 'gold' && (
                    <span className="px-2.5 py-0.5 bg-brand-gold text-neutral-950 font-black text-[9px] rounded-full uppercase flex items-center gap-1 shadow-sm">
                      <Crown className="w-3 h-3 fill-current" />
                      Cliente VIP Ouro
                    </span>
                  )}
                  {profile.vipTier === 'frequent' && (
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-black text-[9px] rounded-full uppercase">
                      💎 Frequente
                    </span>
                  )}
                  {profile.vipTier === 'new' && (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[9px] rounded-full uppercase">
                      🌟 Novo
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/70 mt-0.5 flex items-center gap-2">
                  {profile.displayPhone && <span>📱 {profile.displayPhone}</span>}
                  <span>• {profile.orderCount} {profile.orderCount === 1 ? 'pedido' : 'pedidos'} realizados</span>
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

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-grow">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                <p className="text-[9px] font-black uppercase text-neutral-400">Total Gasto (LTV)</p>
                <p className="text-lg font-black text-brand-wine mt-0.5">{formatCurrency(profile.totalSpent)}</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                <p className="text-[9px] font-black uppercase text-neutral-400">Ticket Médio</p>
                <p className="text-lg font-black text-neutral-800 mt-0.5">{formatCurrency(profile.averageTicket)}</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                <p className="text-[9px] font-black uppercase text-neutral-400">Última Compra</p>
                <p className="text-xs font-bold text-neutral-700 mt-1">
                  {profile.lastOrderDate.split('-').reverse().join('/')}
                </p>
              </div>
            </div>

            {/* Favorite Flavors */}
            {profile.favoriteFlavors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
                  Sabores Favoritos do Cliente (Mais Pedidos)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.favoriteFlavors.slice(0, 6).map((flavor, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-brand-gold/15 text-brand-wine border border-brand-gold/30 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-brand-gold" />
                      {flavor.name} ({flavor.count} un)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Confectioner Notes & Preferences */}
            <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/70 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-serif italic font-bold text-amber-950 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-700" />
                  Anotações & Preferências do Confeiteiro
                </h4>
                {saveSuccess && (
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Salvo!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-amber-900 block mb-1">
                    Data de Aniversário (DD/MM)
                  </label>
                  <input
                    type="text"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    placeholder="Ex: 15/10"
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-medium outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-amber-900 block mb-1">
                    Adicionar Tag / Perfil
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                      placeholder="Ex: Noiva, Corporativo..."
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-medium outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-white text-amber-900 rounded-lg text-[10px] font-bold border border-amber-300 flex items-center gap-1 shadow-sm"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-amber-500 hover:text-red-600 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-amber-900 block mb-1">
                  Observações de Paladar & Restrições
                </label>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  rows={2}
                  placeholder="Ex: Gosta de doces menos doces; sempre pede para colocar fita dourada; cliente de casamento..."
                  className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs text-neutral-800 outline-none focus:border-amber-400 resize-none shadow-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSaving ? 'Salvando...' : 'Salvar Preferências'}
                </button>
              </div>
            </div>

            {/* Order History */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Histórico de Pedidos ({profile.recentOrders.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {profile.recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-neutral-800">
                        Pedido #{order.id.slice(-6).toUpperCase()} • {order.date.split('-').reverse().join('/')}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5 truncate max-w-sm">
                        {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-brand-wine block">{formatCurrency(order.total)}</span>
                      <span className="text-[9px] uppercase font-bold text-neutral-400">{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-neutral-700"
            >
              Fechar
            </button>

            <div className="flex items-center gap-2">
              {onOpenQuickReply && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenQuickReply(profile); }}
                  className="px-4 py-2 bg-brand-wine hover:bg-black text-brand-gold text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Respostas Rápidas
                </button>
              )}

              <button
                type="button"
                onClick={handleDirectWhatsApp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
              >
                <Phone className="w-3.5 h-3.5" />
                Conversar no WhatsApp
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
