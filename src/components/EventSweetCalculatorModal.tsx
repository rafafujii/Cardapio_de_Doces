import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Users, 
  Sparkles, 
  Calculator, 
  Check, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn, formatCurrency, getProductUnitPrice } from '../lib/utils';
import type { CategoryGroup, Product } from '../types';

interface EventSweetCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CategoryGroup[];
  onAddMultipleToCart: (items: { product: Product; quantity: number }[]) => void;
}

export const EventSweetCalculatorModal: React.FC<EventSweetCalculatorModalProps> = ({
  isOpen,
  onClose,
  catalog,
  onAddMultipleToCart
}) => {
  const [guestsCount, setGuestsCount] = useState<number>(50);
  const [selectedFlavors, setSelectedFlavors] = useState<Record<number, number>>({});
  const [activeTab, setActiveTab] = useState<'calc' | 'flavors'>('calc');

  // Flatten all available products from catalog (excluding consult items or pure non-sweet categories if any)
  const allProducts = useMemo(() => {
    const list: Product[] = [];
    catalog.forEach(group => {
      group.items.forEach(item => {
        if (item.priceCento || item.unitPrice) {
          list.push(item);
        }
      });
    });
    return list;
  }, [catalog]);

  // Exact 8 sweets per person conversion
  const totalRecommendedDoces = useMemo(() => {
    return Math.max(8, guestsCount * 8);
  }, [guestsCount]);

  const recommendedCentos = useMemo(() => {
    return (totalRecommendedDoces / 100).toFixed(1);
  }, [totalRecommendedDoces]);

  // Total chosen doces in flavor selector
  const totalChosenDoces = useMemo(() => {
    return (Object.values(selectedFlavors) as number[]).reduce((acc: number, qty: number) => acc + qty, 0);
  }, [selectedFlavors]);

  // Auto-distribute recommended doces among top popular products
  const handleAutoDistribute = () => {
    if (allProducts.length === 0) return;
    
    // Choose up to 4 to 8 popular products
    const selectedCount = Math.min(allProducts.length, Math.max(4, Math.floor(totalRecommendedDoces / 50)));
    const targetPerProduct = Math.floor(totalRecommendedDoces / selectedCount / 25) * 25 || 25;
    
    const newSelection: Record<number, number> = {};
    let allocated = 0;

    for (let i = 0; i < selectedCount; i++) {
      const prod = allProducts[i];
      if (!prod) break;
      const amount = (i === selectedCount - 1) ? (totalRecommendedDoces - allocated) : targetPerProduct;
      newSelection[prod.id] = Math.max(25, amount);
      allocated += amount;
    }

    setSelectedFlavors(newSelection);
    setActiveTab('flavors');
  };

  const handleUpdateFlavorQty = (productId: number, delta: number) => {
    setSelectedFlavors(prev => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return {
        ...prev,
        [productId]: Math.max(25, next)
      };
    });
  };

  const handleConfirmAndAddToCart = () => {
    const itemsToAdd: { product: Product; quantity: number }[] = [];

    Object.entries(selectedFlavors).forEach(([prodIdStr, qty]) => {
      const prod = allProducts.find(p => p.id === Number(prodIdStr));
      const quantity = Number(qty);
      if (prod && quantity > 0) {
        itemsToAdd.push({ product: prod, quantity });
      }
    });

    if (itemsToAdd.length === 0) {
      handleAutoDistribute();
      return;
    }

    confetti({
      particleCount: 140,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#800020', '#D4AF37', '#ffffff']
    });

    onAddMultipleToCart(itemsToAdd);
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

      {/* Modal Content */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 border border-neutral-100"
      >
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-brand-wine to-[#580016] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold block">
                Planejador de Eventos
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold italic">
                Calculadora de Doces para Eventos
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-100 bg-neutral-50 px-6 pt-3">
          <button
            onClick={() => setActiveTab('calc')}
            className={cn(
              "pb-3 px-4 text-xs font-bold transition-all border-b-2",
              activeTab === 'calc'
                ? "border-brand-wine text-brand-wine"
                : "border-transparent text-neutral-400 hover:text-neutral-600"
            )}
          >
            1. Calcular Quantidade
          </button>
          <button
            onClick={() => setActiveTab('flavors')}
            className={cn(
              "pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5",
              activeTab === 'flavors'
                ? "border-brand-wine text-brand-wine"
                : "border-transparent text-neutral-400 hover:text-neutral-600"
            )}
          >
            2. Distribuir Sabores ({totalChosenDoces} un)
            {totalChosenDoces >= totalRecommendedDoces && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {activeTab === 'calc' ? (
            <div className="space-y-6">
              {/* Event Type & Guests Controls */}
              <div className="p-5 bg-brand-cream/60 rounded-2xl border border-brand-wine/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-wine flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-gold" />
                    Tipo: Evento Completo
                  </span>
                  <span className="text-[11px] bg-brand-wine/10 text-brand-wine font-bold px-2.5 py-1 rounded-full">
                    Regra: 8 doces / convidado
                  </span>
                </div>

                {/* Number of Guests Slider & Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-neutral-600 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-brand-wine" />
                      Número de Convidados:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={guestsCount}
                        onChange={(e) => setGuestsCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 p-1.5 text-center font-black text-brand-wine text-lg bg-white border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-wine/20"
                      />
                      <span className="text-xs font-bold text-neutral-500">pessoas</span>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <input
                    type="range"
                    min={10}
                    max={300}
                    step={5}
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(parseInt(e.target.value))}
                    className="w-full accent-brand-wine h-2 bg-neutral-200 rounded-lg cursor-pointer"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[20, 30, 50, 80, 100, 150, 200].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setGuestsCount(n)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border",
                          guestsCount === n
                            ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                            : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                        )}
                      >
                        {n} pessoas
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendation Result Hero Box */}
              <div className="p-6 bg-gradient-to-br from-brand-wine via-[#6b001b] to-brand-wine text-white rounded-3xl shadow-xl space-y-4">
                <div className="flex items-center justify-between text-brand-gold text-xs font-bold uppercase tracking-widest">
                  <span>Recomendação de Pedido</span>
                  <span>{guestsCount} Convidados</span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] uppercase font-bold text-brand-gold/80 block">
                      Total de Doces
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-brand-gold">
                      {totalRecommendedDoces}
                    </span>
                    <span className="text-[11px] text-white/80 block">unidades</span>
                  </div>

                  <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] uppercase font-bold text-brand-gold/80 block">
                      Equivalente em Centos
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-white">
                      {recommendedCentos}
                    </span>
                    <span className="text-[11px] text-white/80 block">centos completos</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-brand-cream/90 bg-black/20 p-3 rounded-xl">
                  <Info className="w-4 h-4 text-brand-gold shrink-0" />
                  <span>
                    A média ideal para eventos é de <strong>8 doces finos por pessoa</strong> para garantir mesa farta e encantar todos os convidados durante a festa.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAutoDistribute}
                  className="w-full py-4 bg-brand-wine hover:bg-[#68001a] text-brand-gold font-black rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg shadow-brand-wine/20 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  SUGERIR SABORES AUTOMÁTICOS
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('flavors')}
                  className="w-full py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  ESCOLHER SABORES MANUALMENTE
                </button>
              </div>
            </div>
          ) : (
            /* Tab 2: Flavor distribution */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
                <div>
                  <span className="text-neutral-500 font-medium">Meta para {guestsCount} pessoas: </span>
                  <strong className="text-brand-wine font-black">{totalRecommendedDoces} doces</strong>
                </div>
                <div>
                  <span className="text-neutral-500 font-medium">Selecionados: </span>
                  <strong className={cn(
                    "font-black px-2 py-0.5 rounded-md",
                    totalChosenDoces >= totalRecommendedDoces ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                  )}>
                    {totalChosenDoces} un
                  </strong>
                </div>
              </div>

              {/* Flavor list with + / - 25 buttons */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {allProducts.map(prod => {
                  const qty = selectedFlavors[prod.id] || 0;
                  const unitPrice = getProductUnitPrice(prod);
                  const centoPrice = prod.priceCento || (unitPrice * 100);

                  return (
                    <div
                      key={prod.id}
                      className={cn(
                        "p-3 rounded-2xl border transition-all flex items-center justify-between gap-3",
                        qty > 0
                          ? "bg-brand-cream/50 border-brand-wine/30 shadow-xs"
                          : "bg-white border-neutral-150 hover:border-neutral-300"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-neutral-100"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-neutral-800 truncate">
                            {prod.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-brand-wine block">
                            {formatCurrency(centoPrice)} / cento
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {qty > 0 ? (
                          <div className="flex items-center gap-1 bg-white border border-brand-wine/20 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateFlavorQty(prod.id, -25)}
                              className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-black"
                              title="Diminuir 25 unidades"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-12 text-center text-xs font-black text-brand-wine">
                              {qty} un
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateFlavorQty(prod.id, 25)}
                              className="w-7 h-7 rounded-lg bg-brand-wine text-brand-gold hover:bg-[#68001a] flex items-center justify-center font-black"
                              title="Adicionar 25 unidades"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateFlavorQty(prod.id, 25)}
                            className="px-3 py-1.5 rounded-xl bg-brand-wine/10 hover:bg-brand-wine text-brand-wine hover:text-brand-gold font-bold text-xs transition-all border border-brand-wine/20 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> 25 un
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-500 text-center sm:text-left">
            Total selecionado: <strong className="text-brand-wine font-black">{totalChosenDoces > 0 ? totalChosenDoces : totalRecommendedDoces} doces</strong>
          </div>

          <button
            type="button"
            onClick={handleConfirmAndAddToCart}
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-wine hover:bg-[#68001a] text-brand-gold font-black rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xl shadow-brand-wine/20 transition-all active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4" />
            ADICIONAR SELEÇÃO AO PEDIDO
          </button>
        </div>
      </motion.div>
    </div>
  );
};
