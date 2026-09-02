import type { Coupon } from '../types';

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message: string;
}

/**
 * Validates a coupon code and calculates the discount for a given subtotal
 */
export function validateCoupon(
  code: string,
  subtotal: number,
  coupons: Coupon[],
  couponsEnabled: boolean = true
): CouponValidationResult {
  if (!couponsEnabled) {
    return {
      valid: false,
      discountAmount: 0,
      message: 'O sistema de cupons está temporariamente desativado.'
    };
  }

  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return {
      valid: false,
      discountAmount: 0,
      message: 'Por favor, digite o código do cupom.'
    };
  }

  const found = coupons.find(c => c.code.trim().toUpperCase() === cleanCode);
  if (!found) {
    return {
      valid: false,
      discountAmount: 0,
      message: 'Cupom inválido ou não encontrado.'
    };
  }

  if (!found.active) {
    return {
      valid: false,
      discountAmount: 0,
      message: 'Este cupom não está mais ativo.'
    };
  }

  // Check expiration
  if (found.expirationDate) {
    const today = new Date().toISOString().split('T')[0];
    if (today > found.expirationDate) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Este cupom já expirou.'
      };
    }
  }

  // Check usage limit
  if (found.usageLimit && found.usageLimit > 0) {
    if ((found.usageCount || 0) >= found.usageLimit) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Este cupom atingiu o limite máximo de utilizações.'
      };
    }
  }

  // Check minimum order value
  if (found.minOrderValue && found.minOrderValue > 0) {
    if (subtotal < found.minOrderValue) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Pedido mínimo para este cupom é de R$ ${found.minOrderValue.toFixed(2).replace('.', ',')}.`
      };
    }
  }

  // Calculate discount
  let discount = 0;
  if (found.discountType === 'percent') {
    discount = (subtotal * (found.discountValue || 0)) / 100;
    if (found.maxDiscountAmount && found.maxDiscountAmount > 0) {
      discount = Math.min(discount, found.maxDiscountAmount);
    }
  } else {
    discount = Math.min(found.discountValue || 0, subtotal);
  }

  // Ensure discount is positive and capped at subtotal
  discount = Math.max(0, Math.min(discount, subtotal));

  return {
    valid: true,
    coupon: found,
    discountAmount: Number(discount.toFixed(2)),
    message: found.discountType === 'percent' 
      ? `Cupom aplicado! ${found.discountValue}% de desconto.` 
      : `Cupom aplicado! R$ ${found.discountValue.toFixed(2).replace('.', ',')} de desconto.`
  };
}

export const DEFAULT_POST_SALE_REVIEW_TEMPLATE = `✨ *S.E DOCES GOURMET - Sua opinião é muito especial!* ✨

Olá, *{nome}*! Tudo bem? Esperamos que tenha amado seus doces do pedido *#{pedido}*! 🥰

Sua avaliação nos ajuda muito a continuar adoçando momentos com todo carinho. Poderia nos avaliar com 5 estrelinhas no link abaixo? Leva menos de 1 minuto:
👉 {link_avaliacao}

{cupom_presente}

Muito obrigada pela preferência e confiança! 💖
*S.E Doces Gourmet*`;

/**
 * Builds the post-sale evaluation WhatsApp message with dynamic variables
 */
export function buildPostSaleReviewMessage({
  customerName,
  orderId,
  template,
  globalSettings,
  reviewUrl
}: {
  customerName: string;
  orderId?: string;
  template?: string;
  globalSettings?: any;
  reviewUrl?: string;
}): string {
  const tmpl = template && template.trim().length > 0 ? template : DEFAULT_POST_SALE_REVIEW_TEMPLATE;
  
  const shortOrderId = orderId ? orderId.slice(-6).toUpperCase() : 'DOCES';
  const siteUrl = window?.location?.origin || 'https://cardapio-de-doces.vercel.app';
  const finalReviewUrl = reviewUrl || `${siteUrl}/?avaliar=true&pedido=${shortOrderId}&cliente=${encodeURIComponent(customerName)}`;

  let cupomText = '';
  if (globalSettings?.enableReviewRewardCoupon && globalSettings?.reviewRewardCouponCode) {
    cupomText = `🎁 *Presentinho:* Ao concluir sua avaliação, você ganha o cupom *${globalSettings.reviewRewardCouponCode}* para seu próximo pedido!`;
  }

  return tmpl
    .replace(/{nome}/g, customerName || 'Cliente')
    .replace(/{pedido}/g, shortOrderId)
    .replace(/{link_avaliacao}/g, finalReviewUrl)
    .replace(/{loja}/g, 'S.E Doces Gourmet')
    .replace(/{cupom_presente}/g, cupomText)
    .trim();
}
