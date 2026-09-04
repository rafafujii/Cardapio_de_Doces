import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Sparkles, 
  Send, 
  Check, 
  Copy, 
  Heart, 
  MessageSquareHeart, 
  Tag, 
  Edit3,
  ThumbsUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, collection, addDoc, updateDoc, doc, serverTimestamp } from '../firebase';
import { cn } from '../lib/utils';

interface OrderRatingCardProps {
  order: any;
  globalSettings?: any;
  onRatingSubmitted?: (orderId: string, rating: number, comment: string) => void;
  isNewlyDelivered?: boolean;
}

const QUICK_TAGS = [
  '🍬 Doces maravilhosos!',
  '✨ Apresentação impecável',
  '🛵 Entrega super rápida',
  '❤️ Atendimento atencioso',
  '⭐ Super recomendo!'
];

export const OrderRatingCard: React.FC<OrderRatingCardProps> = ({
  order,
  globalSettings,
  onRatingSubmitted,
  isNewlyDelivered = false
}) => {
  // Check if previously saved in order or localStorage
  const savedLocalReview = React.useMemo(() => {
    if (!order?.id) return null;
    try {
      const raw = localStorage.getItem(`reviewed_order_${order.id}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [order?.id]);

  const initialRating = order?.rating || savedLocalReview?.rating || 5;
  const initialComment = order?.reviewComment || savedLocalReview?.comment || '';
  const isAlreadyReviewed = Boolean(order?.rating || savedLocalReview?.rating);

  const [rating, setRating] = useState<number>(initialRating);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(initialComment);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(isAlreadyReviewed);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copiedCoupon, setCopiedCoupon] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if order updates from Firestore
  useEffect(() => {
    if (order?.rating) {
      setRating(order.rating);
      setComment(order.reviewComment || '');
      setSubmitted(true);
    }
  }, [order?.rating, order?.reviewComment]);

  const rewardCoupon = globalSettings?.enableReviewRewardCoupon ? globalSettings?.reviewRewardCouponCode : null;

  const handleRatingSelect = (selectedStar: number) => {
    setRating(selectedStar);
    setErrorMessage(null);
  };

  const handleToggleTag = (tag: string) => {
    setComment(prev => {
      if (prev.includes(tag)) {
        return prev.replace(tag, '').replace(/\s{2,}/g, ' ').trim();
      }
      return prev ? `${prev} • ${tag}` : tag;
    });
  };

  const getRatingFeedback = (stars: number) => {
    switch (stars) {
      case 5:
        return { text: 'Excepcional! Amamos saber que você adorou!', emoji: '⭐⭐⭐⭐⭐' };
      case 4:
        return { text: 'Muito bom! Que alegria poder adoçar seu dia!', emoji: '⭐⭐⭐⭐' };
      case 3:
        return { text: 'Bom! Seu feedback nos ajuda a melhorar sempre.', emoji: '⭐⭐⭐' };
      case 2:
        return { text: 'Regular. Queremos entender como melhorar.', emoji: '⭐⭐' };
      case 1:
        return { text: 'Poxa, sentimos muito! Por favor conte-nos o que houve.', emoji: '⭐' };
      default:
        return { text: 'Avalie sua experiência', emoji: '⭐⭐⭐⭐⭐' };
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      setErrorMessage('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const finalComment = comment.trim() || 'Pedido entregue com sucesso! Experiência excelente.';
    const customerName = order.customerName || 'Cliente';
    const firstItems = (order.items || []).map((i: any) => i.name).slice(0, 2).join(', ');
    const productName = firstItems ? `Doces: ${firstItems}` : 'Experiência Geral (Doces Gourmet)';

    try {
      // 1. Save into public reviews collection
      await addDoc(collection(db, 'reviews'), {
        productName,
        userName: customerName,
        userPhone: order.customerPhone || null,
        orderId: order.id,
        rating,
        comment: finalComment,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 2. Update order document with the review fields
      try {
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
          rating,
          reviewComment: finalComment,
          reviewedAt: new Date().toISOString()
        });
      } catch (orderUpdateErr) {
        console.warn("Could not update rating on order doc directly (handled gracefully):", orderUpdateErr);
      }

      // 3. Persist in local storage for instant offline / reload permanence
      try {
        localStorage.setItem(
          `reviewed_order_${order.id}`,
          JSON.stringify({
            rating,
            comment: finalComment,
            timestamp: new Date().toISOString()
          })
        );
      } catch (localErr) {
        console.warn("LocalStorage review cache warning:", localErr);
      }

      // 4. Trigger celebration confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#D4AF37', '#800020', '#10B981', '#F59E0B']
        });
      } catch {
        // Confetti fallback
      }

      setSubmitted(true);
      setIsEditing(false);
      if (onRatingSubmitted) {
        onRatingSubmitted(order.id, rating, finalComment);
      }
    } catch (err: any) {
      console.error("Erro ao enviar avaliação:", err);
      // Even if Firestore had a network glitch, save locally so customer is not blocked
      try {
        localStorage.setItem(
          `reviewed_order_${order.id}`,
          JSON.stringify({
            rating,
            comment: finalComment,
            timestamp: new Date().toISOString()
          })
        );
        setSubmitted(true);
        setIsEditing(false);
        if (onRatingSubmitted) {
          onRatingSubmitted(order.id, rating, finalComment);
        }
      } catch {
        setErrorMessage('Ocorreu um erro ao enviar sua avaliação. Verifique sua conexão e tente novamente.');
      }
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

  const activeStars = hoverRating || rating;
  const feedback = getRatingFeedback(activeStars);

  return (
    <div 
      className={cn(
        "mt-4 rounded-2xl border transition-all overflow-hidden relative",
        submitted && !isEditing
          ? "bg-gradient-to-br from-amber-50/50 via-white to-emerald-50/40 border-emerald-200/80 shadow-xs"
          : "bg-gradient-to-br from-brand-wine/[0.03] via-white to-brand-gold/[0.08] border-brand-gold/40 shadow-sm",
        isNewlyDelivered && "ring-2 ring-brand-gold/60"
      )}
    >
      {/* Header Banner */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
              submitted && !isEditing 
                ? "bg-emerald-100 text-emerald-700" 
                : "bg-brand-wine text-brand-gold"
            )}>
              {submitted && !isEditing ? (
                <Check className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <MessageSquareHeart className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold font-serif text-brand-wine">
                  {submitted && !isEditing ? 'Sua Avaliação Deste Pedido' : 'Classifique Seu Pedido Entregue'}
                </h4>
                {isNewlyDelivered && !submitted && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                    Recém Entregue!
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {submitted && !isEditing 
                  ? 'Muito obrigado! Sua opinião ajuda a manter a nossa qualidade impecável.' 
                  : 'Conta pra gente como foi o sabor, a embalagem e o atendimento!'}
              </p>
            </div>
          </div>

          {submitted && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-[11px] font-bold text-neutral-500 hover:text-brand-wine flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-200 hover:border-brand-wine/30 transition-all bg-white shadow-2xs cursor-pointer shrink-0"
              title="Editar sua avaliação"
            >
              <Edit3 className="w-3 h-3" /> Editar
            </button>
          )}
        </div>

        {/* ALREADY REVIEWED VIEW */}
        {submitted && !isEditing ? (
          <div className="mt-4 pt-3 border-t border-neutral-100 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-5 h-5",
                      rating >= star 
                        ? "text-amber-400 fill-amber-400 drop-shadow-xs" 
                        : "text-neutral-200 fill-neutral-100"
                    )}
                  />
                ))}
                <span className="text-xs font-black text-brand-wine ml-1.5">
                  {rating}/5 estrelas
                </span>
              </div>

              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Avaliação Registrada
              </span>
            </div>

            {comment && (
              <div className="p-3 bg-white rounded-xl border border-neutral-200/80 text-xs text-neutral-700 italic relative">
                <p className="not-italic text-[10px] font-black uppercase text-neutral-400 mb-1">
                  Seu Comentário:
                </p>
                "{comment}"
              </div>
            )}

            {/* Gift Coupon Reward if active */}
            {rewardCoupon && (
              <div className="p-3.5 bg-gradient-to-r from-brand-wine/5 via-brand-gold/10 to-brand-wine/5 rounded-xl border border-brand-gold/40 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-gold shrink-0" />
                  <div>
                    <p className="text-[11px] font-black text-brand-wine">
                      Presente de agradecimento pelo seu pedido!
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      Use no seu próximo pedido: <strong className="text-brand-wine font-mono">{rewardCoupon}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCoupon}
                  className="px-3 py-1.5 bg-brand-wine text-brand-gold rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedCoupon ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCoupon ? 'Copiado!' : 'Copiar Cupom'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* REVIEW SUBMISSION FORM */
          <form onSubmit={handleSubmitReview} className="mt-4 pt-3 border-t border-neutral-100 space-y-4">
            {/* Interactive Stars */}
            <div className="text-center sm:text-left space-y-1.5 bg-white/70 p-3 rounded-xl border border-brand-gold/20">
              <label className="text-[11px] font-black text-neutral-500 uppercase tracking-wider block">
                Escolha sua nota de 1 a 5:
              </label>

              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRatingSelect(star)}
                    className="p-1.5 transition-transform hover:scale-125 active:scale-95 focus:outline-none cursor-pointer"
                    title={`Nota ${star} de 5`}
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition-colors",
                        activeStars >= star
                          ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                          : "text-neutral-200 fill-neutral-100 hover:text-amber-200"
                      )}
                    />
                  </button>
                ))}
                <span className="text-xs font-black text-brand-wine ml-2 font-mono">
                  {activeStars}/5
                </span>
              </div>

              <p className="text-xs font-semibold text-brand-wine/90">
                {feedback.text}
              </p>
            </div>

            {/* Quick tags */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">
                Comentários Rápidos (toque para adicionar):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((tag) => {
                  const isSelected = comment.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer",
                        isSelected
                          ? "bg-brand-wine text-brand-gold border-brand-wine shadow-2xs"
                          : "bg-white text-neutral-600 border-neutral-200 hover:border-brand-gold/50 hover:bg-brand-wine/5"
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">
                Seu comentário ou elogio rápido:
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                placeholder="Ex: Os brigadeiros estavam fresquinhos e deliciosos! Parabéns pelo capricho."
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-medium text-neutral-800 placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-gold/40 focus:border-brand-wine outline-none transition-all resize-none shadow-inner"
              />
              <div className="flex justify-between items-center text-[10px] text-neutral-400">
                <span>Opcional, mas faz toda a diferença para a nossa equipe! ❤️</span>
                <span>{comment.length}/500</span>
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {errorMessage}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-4 bg-brand-wine hover:bg-black disabled:bg-neutral-300 text-brand-gold font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-brand-wine/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {submitting ? (
                  <>ENVIANDO AVALIAÇÃO...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> ENVIAR AVALIAÇÃO ({rating} ⭐)
                  </>
                )}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
