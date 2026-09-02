import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Sparkles, Check, Heart, Tag, Copy, MessageSquareHeart } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp } from '../firebase';
import type { Product } from '../types';

interface CustomerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  customerName?: string;
  catalog?: Product[];
  globalSettings?: any;
}

export const CustomerReviewModal: React.FC<CustomerReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  customerName = '',
  catalog = [],
  globalSettings
}) => {
  const [name, setName] = useState(customerName);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<string>('Experiência Geral (Atendimento & Doces)');
  const [comment, setComment] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  useEffect(() => {
    if (customerName) {
      setName(customerName);
    }
  }, [customerName]);

  if (!isOpen) return null;

  const rewardCoupon = globalSettings?.enableReviewRewardCoupon ? globalSettings?.reviewRewardCouponCode : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      alert("Por favor, preencha seu nome e seu comentário!");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productName: selectedProduct,
        userName: name.trim(),
        userPhone: phone.trim() || null,
        orderId: orderId || null,
        rating,
        comment: comment.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Erro ao enviar avaliação:", err);
      alert("Houve um erro ao enviar sua avaliação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCoupon = () => {
    if (rewardCoupon) {
      navigator.clipboard.writeText(rewardCoupon);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden z-10 border border-brand-gold/20 my-auto"
      >
        {/* Header Ribbon */}
        <div className="bg-brand-wine p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold shrink-0">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-brand-gold">Avaliar Doces & Atendimento</h2>
              <p className="text-xs text-brand-gold/70 mt-0.5">
                {orderId ? `Pedido #${orderId}` : 'Sua opinião é o nosso maior ingrediente'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-2xl font-serif text-brand-wine">Muito Obrigado pelo Carinho!</h3>
                <p className="text-xs text-neutral-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  Sua avaliação foi enviada com sucesso e será publicada em nosso cardápio em breve.
                </p>
              </div>

              {/* Reward Coupon if enabled */}
              {rewardCoupon && (
                <div className="bg-gradient-to-br from-brand-wine/5 via-brand-gold/10 to-brand-wine/5 border border-brand-gold/40 rounded-2xl p-5 mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-brand-wine font-black text-xs uppercase tracking-widest">
                    <Sparkles className="w-4 h-4 text-brand-gold" /> Presentinho Especial Para Você!
                  </div>
                  <p className="text-[11px] text-neutral-600">
                    Use o cupom abaixo no seu próximo pedido para ganhar um desconto exclusivo:
                  </p>
                  
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <div className="px-4 py-2 bg-brand-wine text-brand-gold font-mono font-black text-base rounded-xl border border-brand-gold/30 tracking-wider">
                      {rewardCoupon}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCoupon}
                      className="px-4 py-2 bg-brand-gold hover:bg-brand-wine hover:text-brand-gold text-brand-wine font-black text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      {copiedCoupon ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedCoupon ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-brand-wine hover:bg-black text-brand-gold rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-brand-wine/20"
                >
                  VOLTAR AO CARDÁPIO
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating Selector */}
              <div className="text-center space-y-2 pb-2 border-b border-neutral-100">
                <label className="text-[11px] font-black text-neutral-500 uppercase tracking-widest block">
                  Como você avalia a sua experiência?
                </label>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1.5 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                            : 'text-neutral-200 fill-neutral-100'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-brand-wine block">
                  {rating === 5 && '⭐⭐⭐⭐⭐ Excepcional! Perfeito!'}
                  {rating === 4 && '⭐⭐⭐⭐ Muito bom!'}
                  {rating === 3 && '⭐⭐⭐ Bom'}
                  {rating === 2 && '⭐⭐ Regular'}
                  {rating === 1 && '⭐ Precisa melhorar'}
                </span>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                    Seu Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria Silva"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-wine outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                    WhatsApp (Opcional)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-wine outline-none transition-all"
                  />
                </div>
              </div>

              {/* Product selection */}
              <div>
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                  O que você está avaliando?
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-wine outline-none transition-all"
                >
                  <option value="Experiência Geral (Atendimento & Doces)">🌟 Experiência Geral (Atendimento & Doces)</option>
                  {catalog.map((prod) => (
                    <option key={prod.id} value={prod.name}>
                      🍬 {prod.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Feedback comment */}
              <div>
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                  Seu Comentário / Elogio *
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte-nos o que achou do sabor, da apresentação e da entrega..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-wine outline-none transition-all resize-none"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-brand-wine hover:bg-black disabled:bg-neutral-300 text-brand-gold rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-brand-wine/20 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>ENVIANDO AVALIAÇÃO...</>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-brand-gold" /> PUBLICAR AVALIAÇÃO
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
