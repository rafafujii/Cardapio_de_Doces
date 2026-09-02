import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Minus, Star, MessageCircle, Package, Eye, Sparkles, Check, Trash2 } from 'lucide-react';
import { cn, formatCurrency, getProductUnitPrice } from '../lib/utils';
import type { Product, CartItem } from '../types';

interface ProductCardProps {
  item: Product;
  cartItem?: CartItem;
  onAdd: (isUnit?: boolean, initialQty?: number) => void;
  onUpdateQuantity: (newQty: number) => void;
  onRemove: () => void;
  onViewDetails: () => void;
  contactPhone: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  cartItem,
  onAdd,
  onUpdateQuantity,
  onRemove,
  onViewDetails,
  contactPhone
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Pricing logic
  const isConsult = item.priceCento === null && item.unitPrice === null;
  const unitPrice = getProductUnitPrice(item);
  const minOrderTotal = unitPrice * 25;

  const isItemInCart = !!cartItem && cartItem.quantity > 0;

  // Handle in-card mini-selector clicks (step of 1, minimum of 25)
  const handleDecrement = () => {
    if (!cartItem) return;
    if (cartItem.quantity <= 25) {
      onRemove();
    } else {
      onUpdateQuantity(cartItem.quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (!cartItem) return;
    onUpdateQuantity(cartItem.quantity + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-3xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
    >
      {/* Luxury Floating Pill Badge */}
      {item.badge && (
        <div className="absolute top-3 left-3 z-20 max-w-[85%] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white text-[10px] sm:text-xs font-black tracking-wide shadow-lg shadow-red-950/30 border border-white/40 backdrop-blur-sm pointer-events-none select-none">
          <span className="truncate drop-shadow-sm">{item.badge.trim()}</span>
        </div>
      )}

      {/* Product Image Box */}
      <div 
        className="relative aspect-square overflow-hidden bg-neutral-100 group-hover:scale-[1.02] transition-transform duration-500 cursor-pointer"
        onClick={onViewDetails}
      >
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-neutral-200 animate-pulse flex items-center justify-center">
            <Package className="w-8 h-8 text-neutral-300" />
          </div>
        )}
        {imgError ? (
          <div className="w-full h-full bg-gradient-to-br from-brand-wine/10 via-brand-gold/10 to-brand-cream flex flex-col items-center justify-center p-4 text-center">
            <Package className="w-10 h-10 text-brand-wine/40 mb-2" />
            <span className="text-xs font-serif italic text-brand-wine/70">{item.name}</span>
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none">
          <span className="text-white text-[11px] font-bold flex items-center gap-1 drop-shadow-sm">
            <Eye className="w-3.5 h-3.5 text-brand-gold" /> Toque para ver detalhes
          </span>
        </div>

        {/* Reviews pill button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1.5 text-xs font-black text-brand-wine hover:bg-white hover:scale-105 active:scale-95 transition-all"
          title="Ver detalhes e avaliações"
        >
          <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
          <span>5.0</span>
        </button>
      </div>

      {/* Info & Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between gap-3">
        <div>
          <h3 
            onClick={onViewDetails}
            className="font-serif text-base sm:text-lg leading-snug font-bold group-hover:text-brand-wine transition-colors line-clamp-2 cursor-pointer"
          >
            {item.name}
          </h3>

          {/* Pricing Info */}
          {!isConsult && (
            <div className="mt-2 space-y-0.5">
              <div>
                <span className="text-brand-wine font-black text-base sm:text-lg">
                  {formatCurrency(item.priceCento || (unitPrice * 100))} <span className="text-xs font-semibold text-neutral-500">/ cento</span>
                </span>
              </div>
              <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200/50">
                Mínimo 25 un • {formatCurrency(minOrderTotal)}
              </p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div>
          {isConsult ? (
            <button
              onClick={() =>
                window.open(
                  `https://wa.me/${contactPhone}?text=Olá! Gostaria de consultar o valor do doce: ${item.name}`,
                  '_blank'
                )
              }
              className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              CONSULTAR VALOR
            </button>
          ) : isItemInCart ? (
            /* Interactive In-Card Mini-Selector: typeable quantity, step controls, and quick presets */
            <div className="w-full space-y-1.5">
              <div className="w-full flex items-center justify-between p-1 bg-brand-wine/5 border border-brand-wine/20 rounded-xl">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-10 h-10 rounded-lg bg-white text-brand-wine border border-brand-wine/20 hover:bg-brand-wine hover:text-white flex items-center justify-center active:scale-90 transition-all font-black"
                  title={cartItem.quantity <= 25 ? "Remover do pedido" : "Diminuir 1 unidade"}
                >
                  {cartItem.quantity <= 25 ? (
                    <Trash2 className="w-4 h-4 text-red-500" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                </button>

                <div className="flex flex-col items-center px-1">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min={25}
                      value={cartItem.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          if (val <= 0) {
                            onRemove();
                          } else {
                            onUpdateQuantity(val);
                          }
                        }
                      }}
                      onBlur={() => {
                        if (cartItem.quantity < 25) {
                          onUpdateQuantity(25);
                        }
                      }}
                      className="w-14 text-center font-black text-brand-wine text-base bg-white border border-brand-wine/20 rounded-md py-0.5 outline-none focus:ring-1 focus:ring-brand-wine"
                      title="Digite a quantidade desejada"
                    />
                    <span className="text-xs font-bold text-brand-wine">un</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-semibold mt-0.5">
                    {formatCurrency(unitPrice * cartItem.quantity)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-10 h-10 rounded-lg bg-brand-wine text-brand-gold hover:bg-brand-wine/90 flex items-center justify-center active:scale-90 transition-all font-black shadow-sm"
                  title="Aumentar 1 unidade"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Buttons for Instant Selection */}
              <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(25)}
                  className={cn(
                    "py-1 px-1 rounded-lg border transition-all text-center",
                    cartItem.quantity === 25
                      ? "bg-brand-wine text-brand-gold border-brand-wine shadow-xs"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                  )}
                  title="Definir para 25 unidades"
                >
                  25 un
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(50)}
                  className={cn(
                    "py-1 px-1 rounded-lg border transition-all text-center",
                    cartItem.quantity === 50
                      ? "bg-brand-wine text-brand-gold border-brand-wine shadow-xs"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                  )}
                  title="Definir para 50 unidades (Meio cento)"
                >
                  50 un
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(100)}
                  className={cn(
                    "py-1 px-1 rounded-lg border transition-all text-center",
                    cartItem.quantity === 100
                      ? "bg-brand-wine text-brand-gold border-brand-wine shadow-xs"
                      : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 font-black"
                  )}
                  title="Definir para 100 unidades (1 Cento)"
                >
                  1 Cento
                </button>
              </div>
            </div>
          ) : (
            /* Direct options: Add 25 un (Minimum) or Add 100 un (1 Cento) directly */
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onAdd(false, 25)}
                className="py-2.5 px-2 bg-brand-wine/10 hover:bg-brand-wine text-brand-wine hover:text-brand-gold font-black rounded-xl active:scale-[0.98] transition-all text-[11px] flex flex-col items-center justify-center border border-brand-wine/20"
                title="Adicionar pedido mínimo de 25 unidades"
              >
                <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> 25 un</span>
                <span className="text-[10px] font-medium opacity-80">{formatCurrency(unitPrice * 25)}</span>
              </button>

              <button
                type="button"
                onClick={() => onAdd(false, 100)}
                className="py-2.5 px-2 bg-brand-wine text-brand-gold font-black rounded-xl hover:bg-brand-wine/90 active:scale-[0.98] transition-all text-[11px] flex flex-col items-center justify-center shadow-sm"
                title="Adicionar 1 Cento completo (100 unidades)"
              >
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> 1 Cento</span>
                <span className="text-[10px] font-medium opacity-90">{formatCurrency(unitPrice * 100)}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
