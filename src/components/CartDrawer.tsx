import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Info, Trash2, Plus, Minus, Download, ChevronRight, Tag, Check, Sparkles } from 'lucide-react';
import { cn, formatCurrency, getProductUnitPrice } from '../lib/utils';
import type { CartItem, Coupon } from '../types';
import { validateCoupon } from '../lib/couponHelper';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Record<number, CartItem>;
  cartTotal: number;
  cartCount: number;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemoveFromCart: (id: number) => void;
  onProceedToCheckout: () => void;
  onDownloadPdf: () => void;
  coupons?: Coupon[];
  appliedCouponCode?: string;
  onApplyCoupon?: (code: string) => void;
  onRemoveCoupon?: () => void;
  enableCoupons?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  cartTotal,
  cartCount,
  onUpdateQuantity,
  onRemoveFromCart,
  onProceedToCheckout,
  onDownloadPdf,
  coupons = [],
  appliedCouponCode = '',
  onApplyCoupon,
  onRemoveCoupon,
  enableCoupons = true
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ msg: string; isError: boolean } | null>(null);

  // Validate applied coupon against current subtotal
  const currentValidation = appliedCouponCode 
    ? validateCoupon(appliedCouponCode, cartTotal, coupons, enableCoupons)
    : null;

  const couponDiscount = currentValidation?.valid ? currentValidation.discountAmount : 0;
  const estimatedTotal = Math.max(0, cartTotal - couponDiscount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    const res = validateCoupon(couponInput, cartTotal, coupons, enableCoupons);
    if (res.valid) {
      if (onApplyCoupon) {
        onApplyCoupon(couponInput.trim().toUpperCase());
      }
      setCouponFeedback({ msg: res.message, isError: false });
      setCouponInput('');
    } else {
      setCouponFeedback({ msg: res.message, isError: true });
    }
    setTimeout(() => setCouponFeedback(null), 4000);
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[100]"
          />
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-brand-cream z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-brand-wine" />
                <h2 className="text-xl font-serif text-brand-wine font-bold">Seu Pedido</h2>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                title="Fechar Carrinho"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {/* Info Alert */}
              <div className="bg-brand-gold/10 border border-brand-gold/30 p-4 rounded-2xl flex gap-3">
                <Info className="w-5 h-5 text-brand-wine shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 text-brand-wine/80">
                  <p><strong>Atenção:</strong> Pedido de cento mínimo de 25 unidades por doce.</p>
                  <p>Todos os doces acompanham forminha de acetato (padrão).</p>
                </div>
              </div>

              {cartCount === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
                  <p className="font-serif italic">Seu carrinho está vazio.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Minimum order guidance banner */}
                  <div className="p-3 bg-brand-cream/80 border border-brand-wine/15 rounded-xl text-xs text-brand-wine flex items-center justify-between font-semibold">
                    <span>📌 Pedido mín. de 25 un por doce</span>
                    <span className="text-[10px] bg-white/90 px-2 py-0.5 rounded-md border border-brand-wine/20">
                      Passo de 1 em 1
                    </span>
                  </div>

                  {(Object.values(cart) as CartItem[]).map(item => {
                    const price = getProductUnitPrice(item);
                    return (
                      <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        <div className="flex-grow min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <div className="flex items-baseline gap-2">
                            <p className="text-brand-wine font-black text-sm">{formatCurrency(price * item.quantity)}</p>
                            <span className="text-[11px] text-neutral-400">({formatCurrency(item.priceCento || price * 100)} / cento)</span>
                          </div>
                          
                          <div className="flex flex-col gap-2 mt-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 border border-neutral-200 rounded-lg p-1 bg-neutral-50">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    if (item.quantity <= 25) {
                                      onRemoveFromCart(item.id);
                                    } else {
                                      onUpdateQuantity(item.id, item.quantity - 1);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-white rounded transition-colors text-neutral-500 active:scale-90"
                                  title={item.quantity <= 25 ? "Remover do pedido" : "Diminuir 1 unidade"}
                                >
                                  {item.quantity <= 25 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                                </button>
                                <input 
                                  type="number" 
                                  min={25}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                      if (val < 25) {
                                        onUpdateQuantity(item.id, Math.max(0, val));
                                      } else {
                                        onUpdateQuantity(item.id, val);
                                      }
                                    }
                                  }}
                                  onBlur={() => {
                                    if (item.quantity < 25) {
                                      onUpdateQuantity(item.id, 25);
                                    }
                                  }}
                                  className="w-14 text-center text-xs font-black text-brand-wine bg-white border border-neutral-200 rounded px-1 py-0.5 outline-none"
                                  title="Digite a quantidade"
                                />
                                <button 
                                  type="button"
                                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                  className="p-1.5 hover:bg-white rounded transition-colors text-neutral-500 active:scale-90"
                                  title="Adicionar 1 unidade"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-xs text-brand-wine font-black">{item.quantity} un</span>
                            </div>

                            {/* Quick shortcuts in cart */}
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, 25)}
                                className={cn(
                                  "px-2 py-0.5 rounded border font-semibold transition-all",
                                  item.quantity === 25 ? "bg-brand-wine text-white border-brand-wine" : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                                )}
                              >
                                25 un
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, 50)}
                                className={cn(
                                  "px-2 py-0.5 rounded border font-semibold transition-all",
                                  item.quantity === 50 ? "bg-brand-wine text-white border-brand-wine" : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                                )}
                              >
                                50 un
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, 100)}
                                className={cn(
                                  "px-2 py-0.5 rounded border font-bold transition-all",
                                  item.quantity === 100 ? "bg-brand-wine text-brand-gold border-brand-wine" : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                                )}
                              >
                                1 Cento
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cartCount > 0 && (
              <div className="p-6 bg-white border-t border-neutral-200 space-y-3">
                {/* Coupon Box in Cart */}
                {enableCoupons && (
                  <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-2">
                    {appliedCouponCode && currentValidation?.valid ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-emerald-700" />
                          <div>
                            <span className="text-xs font-black text-emerald-900 font-mono">
                              {appliedCouponCode}
                            </span>
                            <p className="text-[10px] text-emerald-700 font-medium">
                              Desconto de {formatCurrency(couponDiscount)} aplicado!
                            </p>
                          </div>
                        </div>
                        {onRemoveCoupon && (
                          <button
                            type="button"
                            onClick={onRemoveCoupon}
                            className="p-1 hover:bg-emerald-200/50 rounded-lg text-emerald-800 transition-colors"
                            title="Remover cupom"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                            placeholder="Cupom de desconto"
                            className="w-full pl-8 pr-2 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-brand-wine outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-brand-wine hover:bg-black text-brand-gold text-xs font-black rounded-xl transition-all uppercase tracking-wider shrink-0"
                        >
                          APLICAR
                        </button>
                      </form>
                    )}

                    {couponFeedback && (
                      <p className={cn(
                        "text-[10px] font-bold px-1 animate-in fade-in",
                        couponFeedback.isError ? "text-red-600" : "text-emerald-700"
                      )}>
                        {couponFeedback.msg}
                      </p>
                    )}
                  </div>
                )}

                {/* Subtotal & Discount breakdown */}
                <div className="space-y-1.5 py-1">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="font-medium tracking-wider uppercase">Subtotal</span>
                    <span className="font-bold text-neutral-700">{formatCurrency(cartTotal)}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" /> Desconto Cupom ({appliedCouponCode})
                      </span>
                      <span>-{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                    <span className="text-neutral-500 font-medium tracking-wider text-xs uppercase">Total Estimado</span>
                    <span className="text-2xl font-black text-brand-wine">{formatCurrency(estimatedTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onDownloadPdf}
                  className="w-full py-2.5 bg-neutral-100 text-brand-wine hover:bg-neutral-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs border border-neutral-200 shadow-sm"
                >
                  <Download className="w-4 h-4 text-brand-wine" />
                  BAIXAR ORÇAMENTO EM PDF
                </button>
                
                <button 
                  type="button"
                  onClick={onProceedToCheckout}
                  className="w-full py-4 bg-brand-wine text-brand-gold font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-xl shadow-brand-wine/20"
                >
                  CONTINUAR PARA ENTREGA
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
