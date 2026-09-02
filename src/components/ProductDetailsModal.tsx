import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Package, Plus, Minus, MessageCircle, Sparkles, Check, Heart, ShieldCheck, Trash2 } from 'lucide-react';
import { cn, formatCurrency, getProductUnitPrice } from '../lib/utils';
import type { Product, CartItem } from '../types';
import { db, auth, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from '../firebase';

interface ProductDetailsModalProps {
  product: Product | null;
  cartItem?: CartItem;
  onClose: () => void;
  onAddToCart: (product: Product, isUnit?: boolean, quantity?: number) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveFromCart: (id: number) => void;
  contactPhone: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  showWishlist?: boolean;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  cartItem,
  onClose,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  contactPhone,
  isFavorite = false,
  onToggleFavorite,
  showWishlist = true
}) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [modalQuantity, setModalQuantity] = useState<number>(25);

  useEffect(() => {
    if (product) {
      if (cartItem) {
        setModalQuantity(cartItem.quantity);
      } else {
        setModalQuantity(25);
      }

      // Load approved reviews
      const q = query(
        collection(db, 'reviews'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snap) => {
        setReviews(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((r: any) => r.productName === product.name)
        );
      }, (err) => {
        console.warn("Reviews load error", err);
      });

      return () => unsubscribe();
    }
  }, [product, cartItem]);

  if (!product) return null;

  const isConsult = product.priceCento === null && product.unitPrice === null;
  const unitPrice = getProductUnitPrice(product);
  const totalModalPrice = unitPrice * modalQuantity;

  const avgRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length
    : 5.0;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Você precisa estar logado para avaliar!");
      return;
    }
    if (!comment.trim()) return;

    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productName: product.name,
        userName: auth.currentUser.displayName || 'Cliente Gourmet',
        userEmail: auth.currentUser.email,
        rating,
        comment: comment.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setComment('');
      setReviewSent(true);
      setTimeout(() => setReviewSent(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 border border-neutral-100"
      >
        {/* Header Action Buttons */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {showWishlist && onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className={cn(
                "p-2.5 rounded-full backdrop-blur-md transition-all active:scale-95 shadow-md flex items-center gap-1.5 text-xs font-bold",
                isFavorite 
                  ? "bg-rose-600 text-white" 
                  : "bg-black/40 hover:bg-black/60 text-white"
              )}
              title={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
            >
              <Heart className={cn("w-5 h-5", isFavorite ? "fill-white text-white" : "text-white")} />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all active:scale-95 shadow-md"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-grow">
          {/* Product Image Stage */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-neutral-900 overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {product.badge && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-black shadow-lg border border-white/40">
                <span>{product.badge}</span>
              </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-xs uppercase font-bold tracking-widest text-brand-gold block">
                {product.category}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-black italic drop-shadow-md">
                {product.name}
              </h2>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Rating summary & tags */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="flex text-brand-gold">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "w-4 h-4",
                        s <= Math.round(avgRating) ? "fill-current" : "opacity-30"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-neutral-700">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-xs text-neutral-400">
                  ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200/60">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Chocolate Nobre
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-full">
                  Artesanal
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase font-bold tracking-widest text-brand-wine">
                Descrição & Ingredientes Nobres
              </h4>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-sans">
                Doce artesanal feito com base cremosa em ponto perfeito de colher, ingredientes selecionados de alta confeitaria e confeitos finos. Preparado sob encomenda para garantir frescor e maciez incomparáveis.
              </p>
            </div>

            {/* Pricing details and Minimum Notice */}
            {!isConsult && (
              <div className="p-4 bg-brand-cream/60 border border-brand-wine/15 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider block">
                      Valor do Cento
                    </span>
                    <span className="text-2xl font-black text-brand-wine">
                      {formatCurrency(product.priceCento || (unitPrice * 100))} <span className="text-xs font-semibold text-neutral-500">/ cento</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider block">
                      Pedido Mínimo (25 un)
                    </span>
                    <span className="text-sm font-bold text-amber-800">
                      {formatCurrency(unitPrice * 25)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-brand-wine/10 flex items-center justify-between text-xs text-brand-wine font-medium">
                  <span>📌 <strong>Regra de Encomenda:</strong> Pedido mínimo de 25 unidades.</span>
                  <span className="font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                    Passo de 1 em 1
                  </span>
                </div>
              </div>
            )}

            {/* Quantity Selector Section with Direct 1 Cento & Custom Typing */}
            {!isConsult && (
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-neutral-600 tracking-wider">
                    Escolha a Quantidade:
                  </span>
                  <span className="text-xs font-bold text-brand-wine">
                    Subtotal: {formatCurrency(totalModalPrice)}
                  </span>
                </div>

                {/* Quick Presets for Instant 1-Click Selection (25 un, 50 un, 100 un / 1 Cento, 200 un) */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalQuantity(25);
                      if (cartItem) onUpdateQuantity(product.id, 25);
                    }}
                    className={cn(
                      "py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold",
                      modalQuantity === 25
                        ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-brand-wine/40"
                    )}
                  >
                    <span className="block text-[10px] text-neutral-400">Mínimo</span>
                    25 un
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalQuantity(50);
                      if (cartItem) onUpdateQuantity(product.id, 50);
                    }}
                    className={cn(
                      "py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold",
                      modalQuantity === 50
                        ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-brand-wine/40"
                    )}
                  >
                    <span className="block text-[10px] text-neutral-400">½ Cento</span>
                    50 un
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalQuantity(100);
                      if (cartItem) onUpdateQuantity(product.id, 100);
                    }}
                    className={cn(
                      "py-2 px-1 rounded-xl border text-center transition-all text-xs font-black",
                      modalQuantity === 100
                        ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                        : "bg-amber-50 text-amber-950 border-amber-300 hover:border-brand-wine/40"
                    )}
                  >
                    <span className="block text-[10px] text-amber-700">Festa</span>
                    1 Cento
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalQuantity(200);
                      if (cartItem) onUpdateQuantity(product.id, 200);
                    }}
                    className={cn(
                      "py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold",
                      modalQuantity === 200
                        ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-brand-wine/40"
                    )}
                  >
                    <span className="block text-[10px] text-neutral-400">Grande</span>
                    200 un
                  </button>
                </div>

                {/* Direct Stepper + Typeable input */}
                <div className="flex items-center justify-between gap-4 bg-white p-2.5 rounded-xl border border-neutral-200 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      if (cartItem && modalQuantity <= 25) {
                        onRemoveFromCart(product.id);
                        onClose();
                      } else {
                        const newQ = Math.max(25, modalQuantity - 1);
                        setModalQuantity(newQ);
                        if (cartItem) {
                          onUpdateQuantity(product.id, newQ);
                        }
                      }
                    }}
                    className="w-12 h-12 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-brand-wine flex items-center justify-center font-black active:scale-95 transition-all text-lg"
                    title={modalQuantity <= 25 ? "Mínimo 25 unidades" : "Diminuir 1 unidade"}
                  >
                    {cartItem && modalQuantity <= 25 ? (
                      <Trash2 className="w-5 h-5 text-red-500" />
                    ) : (
                      <Minus className="w-5 h-5" />
                    )}
                  </button>

                  <div className="text-center flex flex-col items-center">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min={25}
                        value={modalQuantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            setModalQuantity(val);
                            if (cartItem && val >= 25) {
                              onUpdateQuantity(product.id, val);
                            }
                          }
                        }}
                        onBlur={() => {
                          if (modalQuantity < 25) {
                            setModalQuantity(25);
                            if (cartItem) onUpdateQuantity(product.id, 25);
                          } else if (cartItem) {
                            onUpdateQuantity(product.id, modalQuantity);
                          }
                        }}
                        className="w-24 text-center text-2xl font-black text-brand-wine bg-neutral-50 border border-neutral-200 rounded-lg py-0.5 outline-none focus:ring-2 focus:ring-brand-wine/20"
                        title="Digite qualquer quantidade desejada (mínimo 25)"
                      />
                      <span className="text-xs font-bold text-neutral-500">un</span>
                    </div>
                    <span className="text-[11px] font-medium text-neutral-400 mt-0.5">
                      (digite ou ajuste pelos botões)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = modalQuantity + 1;
                      setModalQuantity(next);
                      if (cartItem) {
                        onUpdateQuantity(product.id, next);
                      }
                    }}
                    className="w-12 h-12 rounded-xl bg-brand-wine text-brand-gold flex items-center justify-center font-black active:scale-95 transition-all shadow-sm text-lg hover:bg-brand-wine/90"
                    title="Adicionar 1 unidade"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase font-bold tracking-widest text-brand-wine">
                  Avaliações de Clientes
                </h4>
              </div>

              {/* Add review form */}
              <div className="p-4 sm:p-5 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                <span className="text-xs font-bold text-neutral-700 block">
                  Deixe sua nota para este doce:
                </span>
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRating(v)}
                        className={cn(
                          "p-1 transition-transform active:scale-90",
                          rating >= v ? "text-brand-gold" : "text-neutral-300"
                        )}
                      >
                        <Star className={cn("w-5 h-5", rating >= v && "fill-current")} />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-neutral-500 ml-2">
                      {rating === 5 ? 'Perfeito! ⭐' : `${rating} estrelas`}
                    </span>
                  </div>

                  <textarea
                    placeholder="Conte como foi sua experiência, sabor e apresentação..."
                    className="w-full p-3 text-xs sm:text-sm bg-white border border-neutral-200 rounded-xl focus:border-brand-wine focus:ring-1 focus:ring-brand-wine/20 outline-none resize-none h-20"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />

                  <div className="flex items-center justify-between">
                    {reviewSent && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Avaliação enviada com sucesso!
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="ml-auto px-5 py-2.5 bg-brand-wine text-brand-gold text-xs font-black rounded-xl hover:bg-brand-wine/90 active:scale-95 transition-all shadow-md shadow-brand-wine/20 disabled:opacity-50"
                    >
                      {submittingReview ? "ENVIANDO..." : "PUBLICAR AVALIAÇÃO"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Review list */}
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-center py-6 text-neutral-400 text-xs italic font-serif">
                    Nenhuma avaliação publicada ainda. Seja o primeiro a avaliar!
                  </p>
                ) : (
                  reviews.slice(0, 5).map((r: any) => (
                    <div key={r.id} className="p-3 bg-white rounded-xl border border-neutral-100 shadow-sm space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-brand-wine">{r.userName}</span>
                        <span className="text-[10px] text-neutral-400">
                          {r.createdAt instanceof Timestamp
                            ? r.createdAt.toDate().toLocaleDateString('pt-BR')
                            : 'Recente'}
                        </span>
                      </div>
                      <div className="flex text-brand-gold">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn("w-3 h-3 fill-current", i >= (r.rating || 5) && "opacity-20")}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-neutral-600 italic">"{r.comment}"</p>
                      {r.adminReply && (
                        <div className="mt-2 pl-3 border-l-2 border-brand-gold bg-amber-50/70 p-2.5 rounded-r-xl space-y-0.5">
                          <span className="text-[10px] font-black uppercase text-brand-wine tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-brand-gold" /> Resposta da Confeitaria:
                          </span>
                          <p className="text-xs text-neutral-800 font-medium">{r.adminReply}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-neutral-50 border-t border-neutral-200 flex items-center gap-3">
          {isConsult ? (
            <button
              onClick={() => {
                window.open(
                  `https://wa.me/${contactPhone}?text=Olá! Gostaria de consultar o valor do doce: ${product.name}`,
                  '_blank'
                );
              }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md active:scale-98 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              CONSULTAR VALOR NO WHATSAPP
            </button>
          ) : cartItem ? (
            <div className="w-full flex items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-[11px] uppercase font-bold text-neutral-400 block">No seu pedido</span>
                <span className="text-base font-black text-brand-wine">{cartItem.quantity} un ({formatCurrency(unitPrice * cartItem.quantity)})</span>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-3.5 bg-brand-wine text-brand-gold text-xs font-black rounded-2xl hover:bg-brand-wine/90 active:scale-95 transition-all shadow-md"
              >
                CONCLUIR & VOLTAR
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                const qty = Math.max(25, modalQuantity);
                onAddToCart(product, false, qty);
                onClose();
              }}
              className="w-full py-4 bg-brand-wine text-brand-gold font-black rounded-2xl flex items-center justify-center gap-2 text-sm shadow-xl shadow-brand-wine/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              ADICIONAR {Math.max(25, modalQuantity)} UNIDADES AO PEDIDO ({formatCurrency(totalModalPrice)})
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
