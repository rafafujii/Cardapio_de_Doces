import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Clock, Flame, Check, ArrowRight, Package, ShoppingBag } from 'lucide-react';
import { ReadyBox } from '../types';
import { formatCurrency } from '../lib/utils';
import { ReadyBoxOrderModal } from './ReadyBoxOrderModal';

interface ReadyBoxesSectionProps {
  readyBoxes: ReadyBox[];
  globalSettings?: any;
  onSubmitOrder?: (orderDetails: any, items: any[], total: number, boxId?: string) => Promise<any>;
}

export function ReadyBoxesSection({
  readyBoxes = [],
  globalSettings,
  onSubmitOrder
}: ReadyBoxesSectionProps) {
  const activeBoxes = readyBoxes.filter(b => b.active && b.quantityAvailable > 0);
  const [selectedBox, setSelectedBox] = useState<ReadyBox | null>(null);

  if (activeBoxes.length === 0) return null;

  return (
    <section className="my-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="bg-gradient-to-r from-amber-950 via-brand-wine to-neutral-900 rounded-[36px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-brand-gold/40">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-black text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-current" />
                Pronta Entrega de Hoje
              </span>
              <span className="text-brand-gold text-xs font-bold">• Sem prazo de 48h</span>
            </div>
            <h3 className="font-serif italic text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Doces Fresquinhos Para Retirar Hoje
            </h3>
            <p className="text-xs text-white/70 max-w-xl">
              Caixinhas especiais com nossa produção fresca do dia! Quantidades limitadas para retirada imediata.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
            <Clock className="w-4 h-4 text-brand-gold animate-spin" style={{ animationDuration: '10s' }} />
            <div className="text-right">
              <p className="text-[9px] uppercase font-black tracking-widest text-brand-gold">Disponibilidade</p>
              <p className="text-xs font-bold text-white">
                {activeBoxes.reduce((sum, b) => sum + b.quantityAvailable, 0)} caixinhas prontas
              </p>
            </div>
          </div>
        </div>

        {/* Boxes Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeBoxes.map((box) => {
            const hasDiscount = box.originalPrice && box.originalPrice > box.price;
            return (
              <div
                key={box.id}
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[28px] p-5 flex flex-col justify-between hover:bg-white/15 hover:border-brand-gold/60 transition-all duration-300 group shadow-lg"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-brand-gold text-neutral-950 font-black text-[9px] uppercase rounded-full tracking-wider shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {box.badgeText || `${box.itemsCount} Doces Finos`}
                    </span>

                    <span className="px-2 py-0.5 bg-white/20 text-white font-bold text-[10px] rounded-lg">
                      🔥 Apenas {box.quantityAvailable} un.
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-serif italic text-lg font-bold text-white group-hover:text-brand-gold transition-colors">
                    {box.title}
                  </h4>
                  <p className="text-xs text-white/80 mt-1.5 leading-relaxed">
                    {box.description}
                  </p>

                  {/* Pickup Time info */}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-brand-gold/90 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{box.pickupUntilTime || 'Retirada hoje até às 19h30'}</span>
                  </div>
                </div>

                {/* Price and CTA Button */}
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <div>
                    {hasDiscount && (
                      <span className="text-[10px] text-white/50 line-through block">
                        {formatCurrency(box.originalPrice!)}
                      </span>
                    )}
                    <span className="text-xl font-black text-brand-gold leading-none">
                      {formatCurrency(box.price)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedBox(box)}
                    className="px-4 py-2.5 bg-gradient-to-r from-brand-gold to-amber-400 hover:from-amber-400 hover:to-brand-gold text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 group-hover:scale-105"
                  >
                    <span>Pedir Agora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Modal */}
      {selectedBox && (
        <ReadyBoxOrderModal
          isOpen={Boolean(selectedBox)}
          onClose={() => setSelectedBox(null)}
          box={selectedBox}
          globalSettings={globalSettings}
          onSubmitOrder={onSubmitOrder}
        />
      )}
    </section>
  );
}
