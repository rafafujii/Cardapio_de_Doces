import React, { useState } from 'react';
import { Tag, Copy, Check, X, Sparkles } from 'lucide-react';
import type { Coupon } from '../types';

interface CouponBannerProps {
  coupons: Coupon[];
  couponsEnabled: boolean;
  onApplyCoupon?: (code: string) => void;
}

export const CouponBanner: React.FC<CouponBannerProps> = ({
  coupons,
  couponsEnabled,
  onApplyCoupon
}) => {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!couponsEnabled || dismissed) return null;

  // Find first active coupon with showBanner = true
  const today = new Date().toISOString().split('T')[0];
  const bannerCoupon = coupons.find(c => 
    c.active && 
    c.showBanner && 
    (!c.expirationDate || c.expirationDate >= today) &&
    (!c.usageLimit || (c.usageCount || 0) < c.usageLimit)
  );

  if (!bannerCoupon) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(bannerCoupon.code);
    setCopied(true);
    if (onApplyCoupon) {
      onApplyCoupon(bannerCoupon.code);
    }
    setTimeout(() => setCopied(false), 3000);
  };

  const bannerMessage = bannerCoupon.bannerText || (
    bannerCoupon.discountType === 'percent'
      ? `Aproveite ${bannerCoupon.discountValue}% OFF no seu pedido com o cupom:`
      : `Ganhe R$ ${bannerCoupon.discountValue.toFixed(2).replace('.', ',')} de desconto com o cupom:`
  );

  return (
    <div className="bg-gradient-to-r from-brand-wine via-[#990026] to-brand-wine text-brand-gold py-2 px-4 shadow-inner relative border-b border-brand-gold/20 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <span className="p-1 bg-brand-gold/20 rounded-full flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
          </span>
          <p className="text-white text-[11px] sm:text-xs">
            <strong className="text-brand-gold font-serif mr-1">PROMOÇÃO:</strong>
            {bannerMessage}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-brand-gold text-brand-wine hover:bg-white font-black text-[11px] rounded-full transition-all shadow-sm active:scale-95 uppercase tracking-wider"
            title="Copiar cupom"
          >
            <Tag className="w-3 h-3" />
            <span>{bannerCoupon.code}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 opacity-70" />}
          </button>
          
          {copied && (
            <span className="text-[10px] text-brand-gold font-bold animate-in fade-in">
              Copiado!
            </span>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10 ml-1"
            title="Fechar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
