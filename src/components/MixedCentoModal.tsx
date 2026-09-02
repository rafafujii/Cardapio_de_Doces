import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Package, 
  Plus, 
  Check, 
  Trash2, 
  ShoppingBag, 
  AlertCircle,
  HelpCircle,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn, formatCurrency, getProductUnitPrice } from '../lib/utils';
import type { CategoryGroup, Product, CartItem } from '../types';

interface MixedCentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CategoryGroup[];
  onAddCustomItemToCart: (customItem: CartItem) => void;
}

export const MixedCentoModal: React.FC<MixedCentoModalProps> = ({
  isOpen,
  onClose,
  catalog,
  onAddCustomItemToCart
}) => {
  // 4 slots of 25 doces each = 100 doces (1 Cento)
  const [slots, setSlots] = useState<(Product | null)[]>([null, null, null, null]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Available sweet products
  const availableProducts = useMemo(() => {
    const list: Product[] = [];
    catalog.forEach(group => {
      group.items.forEach(item => {
        if (item.priceCento || item.unitPrice) {
          list.push(item);
        }
      });
    });
    return list.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [catalog, searchTerm]);

  // Assign product to a specific slot
  const handleSelectProductForSlot = (product: Product) => {
    const targetIndex = activeSlotIndex !== null ? activeSlotIndex : slots.findIndex(s => s === null);
    const indexToUse = targetIndex >= 0 ? targetIndex : 0;

    const newSlots = [...slots];
    newSlots[indexToUse] = product;
    setSlots(newSlots);

    // Auto-advance to next empty slot
    const nextEmpty = newSlots.findIndex((s, i) => i > indexToUse && s === null);
    if (nextEmpty >= 0) {
      setActiveSlotIndex(nextEmpty);
    } else {
      const anyEmpty = newSlots.findIndex(s => s === null);
      setActiveSlotIndex(anyEmpty >= 0 ? anyEmpty : null);
    }
  };

  const handleClearSlot = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
    setActiveSlotIndex(index);
  };

  // Calculate total price for this mixed cento
  const filledSlotsCount = slots.filter(Boolean).length;
  const isComplete = filledSlotsCount === 4;

  const totalCentoPrice = useMemo(() => {
    return slots.reduce((acc, prod) => {
      if (!prod) return acc;
      const unit = getProductUnitPrice(prod);
      // Each slot is 25 doces
      return acc + (unit * 25);
    }, 0);
  }, [slots]);

  const handleAddToCart = () => {
    if (!isComplete) {
      alert("Por favor, selecione os 4 sabores para completar o seu Cento Misto de 100 doces!");
      return;
    }

    // Build breakdown description
    const flavorCounts: Record<string, number> = {};
    slots.forEach(prod => {
      if (prod) {
        flavorCounts[prod.name] = (flavorCounts[prod.name] || 0) + 25;
      }
    });

    const breakdownText = Object.entries(flavorCounts)
      .map(([name, qty]) => `${qty}x ${name}`)
      .join(' + ');

    const customProduct: CartItem = {
      id: Date.now(),
      category: "Cento Misto",
      name: `Cento Misto (${breakdownText})`,
      priceCento: totalCentoPrice,
      unitPrice: totalCentoPrice / 100,
      imageUrl: slots[0]?.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80",
      badge: "4 Sabores",
      quantity: 100,
      isUnitItem: false
    };

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#800020', '#D4AF37', '#ffffff']
    });

    onAddCustomItemToCart(customProduct);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 border border-neutral-100"
      >
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-brand-wine to-[#5a0017] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold block">
                Caixa de Festa Personalizada
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold italic">
                Construtor de Cento Misto (4 Sabores)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 text-white/70 hover:text-white rounded-full transition-colors shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* Bento Box of 4 Slots (25 units each) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-wine" />
                Sua Caixa de 100 Doces ({filledSlotsCount}/4 slots preenchidos)
              </span>
              <span className="text-xs font-black text-brand-wine">
                Valor Total: {formatCurrency(totalCentoPrice)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {slots.map((prod, index) => {
                const isActive = activeSlotIndex === index;
                const unit = prod ? getProductUnitPrice(prod) : 0;
                const slotTotal = unit * 25;

                return (
                  <div
                    key={index}
                    onClick={() => setActiveSlotIndex(index)}
                    className={cn(
                      "p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between min-h-[140px]",
                      isActive
                        ? "border-brand-wine ring-2 ring-brand-wine/20 bg-brand-cream/60 shadow-md"
                        : prod
                        ? "border-neutral-200 bg-white hover:border-brand-wine/40"
                        : "border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100"
                    )}
                  >
                    {/* Slot Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">
                        Slot {index + 1} • 25 un
                      </span>
                      {prod && (
                        <button
                          type="button"
                          onClick={(e) => handleClearSlot(index, e)}
                          className="p-1 text-neutral-400 hover:text-red-600 rounded-full hover:bg-white"
                          title="Remover este sabor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Slot Body Content */}
                    {prod ? (
                      <div className="space-y-1.5 my-1 text-center">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover mx-auto shadow-xs border border-white"
                        />
                        <h4 className="font-bold text-xs text-neutral-800 line-clamp-2 leading-tight">
                          {prod.name}
                        </h4>
                        <span className="text-[10px] font-bold text-brand-wine block">
                          {formatCurrency(slotTotal)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center py-4 space-y-1">
                        <div className="w-8 h-8 rounded-full bg-brand-wine/10 text-brand-wine flex items-center justify-center mx-auto">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-neutral-400 block">
                          {isActive ? "Escolha o sabor abaixo" : "Clique para escolher"}
                        </span>
                      </div>
                    )}

                    {/* Status indicator */}
                    <div className="text-center pt-1 border-t border-neutral-100/80">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider",
                        prod ? "text-emerald-700" : "text-neutral-400"
                      )}>
                        {prod ? "✓ Selecionado (25 un)" : (isActive ? "👉 Editando" : "Vazio")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flavor Selection Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Toque em um sabor para adicionar ao Slot {activeSlotIndex !== null ? activeSlotIndex + 1 : 1}:
              </span>
              <input
                type="text"
                placeholder="Buscar sabor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-brand-wine w-full sm:w-48"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {availableProducts.map(product => {
                const unit = getProductUnitPrice(product);
                const centoPrice = product.priceCento || (unit * 100);
                const slotPrice = unit * 25;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProductForSlot(product)}
                    className="p-2.5 bg-white hover:bg-brand-cream/50 border border-neutral-200 hover:border-brand-wine rounded-2xl transition-all text-left flex items-center gap-3 group active:scale-[0.98]"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-neutral-100"
                    />
                    <div className="min-w-0 flex-grow">
                      <h5 className="font-bold text-xs text-neutral-800 truncate group-hover:text-brand-wine">
                        {product.name}
                      </h5>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-neutral-400">
                          {formatCurrency(centoPrice)} / cento
                        </span>
                        <span className="text-[10px] font-black text-brand-wine bg-brand-wine/10 px-1.5 py-0.5 rounded">
                          + {formatCurrency(slotPrice)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-600 text-center sm:text-left">
            {!isComplete ? (
              <span className="text-amber-800 font-semibold flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Escolha os {4 - filledSlotsCount} sabor(es) restantes para fechar as 100 unidades.
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Cento de 100 doces completo!
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isComplete}
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-wine hover:bg-[#68001a] text-brand-gold font-black rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xl shadow-brand-wine/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-4 h-4" />
            ADICIONAR CENTO MISTO AO PEDIDO ({formatCurrency(totalCentoPrice)})
          </button>
        </div>
      </motion.div>
    </div>
  );
};
