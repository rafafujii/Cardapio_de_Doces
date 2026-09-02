import React from 'react';
import { MapPin, Clock, MessageCircle, Sparkles, Award, ShieldCheck, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface HeroBannerProps {
  contactPhone: string;
  pickupAddress: string;
  businessHours?: string;
  storeStatusText?: string;
  storeStatusMode?: 'open' | 'limited' | 'paused';
  announcementBanner?: string;
  onOpenOrder: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  contactPhone,
  pickupAddress,
  businessHours = "Ter a Dom • 10h às 18h",
  storeStatusText = "Aceitando Encomendas & Pronta Entrega",
  storeStatusMode = 'open',
  announcementBanner,
  onOpenOrder
}) => {
  return (
    <div className="space-y-3 mb-8">
      {/* Optional Announcement Banner */}
      {announcementBanner && announcementBanner.trim() && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white text-xs sm:text-sm font-medium rounded-2xl shadow-sm border border-amber-500/30 flex items-center justify-between gap-3 px-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-gold shrink-0 animate-spin" />
            <span>{announcementBanner}</span>
          </div>
        </motion.div>
      )}

      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-wine via-[#5c0017] to-neutral-900 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-brand-gold/30"
      >
        {/* Decorative Golden Ambient Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand-gold/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-brand-wine/40 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          {/* Status Live Pill */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/40 border border-brand-gold/30 backdrop-blur-md text-xs font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                storeStatusMode === 'open' ? "bg-emerald-400" : storeStatusMode === 'limited' ? "bg-amber-400" : "bg-rose-400"
              )}></span>
              <span className={cn(
                "relative inline-flex rounded-full h-2.5 w-2.5",
                storeStatusMode === 'open' ? "bg-emerald-500" : storeStatusMode === 'limited' ? "bg-amber-500" : "bg-rose-500"
              )}></span>
            </span>
            <span className="text-brand-cream/90 font-medium">
              {storeStatusText || "Aceitando Encomendas & Pronta Entrega"}
            </span>
          </div>

          {/* Brand Headline */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black tracking-tight leading-tight text-white">
              Confeitaria Fina & <span className="text-brand-gold italic">Doces Gourmet</span>
            </h2>
            <p className="text-sm sm:text-base text-brand-cream/80 font-light leading-relaxed max-w-2xl">
              Receitas artesanais com <strong className="text-brand-gold font-semibold">100% chocolate nobre</strong> e ingredientes selecionados para transformar suas festas e momentos especiais em pura celebração.
            </p>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-brand-gold tracking-wider block">Retirada</span>
                <p className="text-white/90 text-xs truncate" title={pickupAddress}>{pickupAddress || "Av. Padre Jose Stefanello, 340"}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Clock className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-gold tracking-wider block">Horário</span>
                <p className="text-white/90 text-xs">{businessHours || "Ter a Dom • 10h às 18h"}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">WhatsApp Direto</span>
                <a 
                  href={`https://wa.me/${contactPhone}?text=Olá! Gostaria de tirar uma dúvida sobre os doces.`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/90 text-xs hover:text-emerald-300 hover:underline block"
                >
                  Tirar Dúvidas
                </a>
              </div>
            </div>
          </div>

          {/* Quality Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-medium text-brand-cream/80 border-t border-white/10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              Chocolate 100% Nobre
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/90">
              <Award className="w-3.5 h-3.5 text-brand-gold" />
              Feito à Mão Fresquinho
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/90">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Amor em Cada Detalhe
            </span>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
