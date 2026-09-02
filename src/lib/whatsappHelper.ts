import { formatCurrency } from './utils';
import type { CartItem, OrderDetails } from '../types';

export const DEFAULT_WHATSAPP_TEMPLATE = `✨ *NOVO PEDIDO - S.E DOCES GOURMET* ✨

{saudacao}, Eduarda! Aqui é *{cliente}* e gostaria de confirmar o seguinte pedido:

📋 *ITENS DO PEDIDO:*
{itens}
🧁 *Forminha:* Acetato (Padrão)

💵 *Subtotal:* {subtotal}
{bloco_desconto}{bloco_entrega}💰 *VALOR TOTAL: {total}*

{bloco_endereco}
📅 *Data:* {data}
⏰ *Horário:* {horario}
💳 *Forma de Pagamento:* {forma_pagamento}{bloco_troco}{bloco_observacoes}

_Pedido gerado pelo catálogo digital gourmet._`;

export interface WhatsAppMessageParams {
  orderDetails: OrderDetails;
  items: CartItem[];
  cartSubtotal: number;
  finalTotal: number;
  discountAmount?: number;
  couponCode?: string;
  couponDiscount?: number;
  deliveryFee?: number;
  pickupAddress: string;
  pixKey: string;
  template?: string;
}

export function buildWhatsAppMessage({
  orderDetails,
  items,
  cartSubtotal,
  finalTotal,
  discountAmount = 0,
  couponCode,
  couponDiscount = 0,
  deliveryFee = 0,
  pickupAddress,
  pixKey,
  template
}: WhatsAppMessageParams): string {
  const hour = new Date().getHours();
  const saudacao = hour >= 5 && hour < 12 ? "Bom dia" : hour >= 12 && hour < 18 ? "Boa tarde" : "Boa noite";
  const formattedDate = orderDetails.date ? orderDetails.date.split('-').reverse().join('/') : '';

  let itemsText = '';
  items.forEach(item => {
    const unitPrice = item.unitPrice || (item.priceCento ? item.priceCento / 100 : 0);
    itemsText += `• ${item.quantity} un - *${item.name}* (${formatCurrency(unitPrice * item.quantity)})\n`;
  });

  const isDelivery = orderDetails.deliveryType === 'delivery';
  
  let blocoDesconto = '';
  if (discountAmount > 0) {
    blocoDesconto += `🎁 *Desconto por Volume:* -${formatCurrency(discountAmount)}\n`;
  }
  if (couponDiscount > 0 && (couponCode || orderDetails.couponCode)) {
    const code = couponCode || orderDetails.couponCode;
    blocoDesconto += `🎟️ *Cupom (${code}):* -${formatCurrency(couponDiscount)}\n`;
  }

  let blocoEntrega = '';
  if (isDelivery) {
    if (deliveryFee > 0) {
      blocoEntrega = `🛵 *Taxa de Entrega:* ${formatCurrency(deliveryFee)}\n`;
    } else {
      blocoEntrega = `🛵 *Taxa de Entrega:* Grátis / A combinar\n`;
    }
  }

  let blocoEndereco = '';
  if (isDelivery) {
    blocoEndereco = `🛵 *Tipo:* Entrega / Delivery\n📍 *Endereço de Entrega:* ${orderDetails.deliveryAddress || 'A informar'}`;
  } else {
    blocoEndereco = `🛍️ *Tipo:* Retirada no Local\n📍 *Endereço de Retirada:* ${pickupAddress || 'Avenida Padre Jose Stefanello, n°340'}`;
  }

  let blocoTroco = '';
  if (orderDetails.paymentMethod === 'Dinheiro' && orderDetails.changeAmount) {
    blocoTroco = `\n💵 *Troco para:* R$ ${orderDetails.changeAmount}`;
  }

  let blocoObservacoes = '';
  if (orderDetails.notes) {
    blocoObservacoes = `\n📝 *Observações:* ${orderDetails.notes}`;
  }

  const tmpl = (template && template.trim().length > 0) ? template : DEFAULT_WHATSAPP_TEMPLATE;

  let msg = tmpl
    .replace(/{saudacao}/g, saudacao)
    .replace(/{cliente}/g, orderDetails.name)
    .replace(/{itens}/g, itemsText.trimEnd())
    .replace(/{subtotal}/g, formatCurrency(cartSubtotal))
    .replace(/{total}/g, formatCurrency(finalTotal))
    .replace(/{bloco_desconto}/g, blocoDesconto)
    .replace(/{bloco_entrega}/g, blocoEntrega)
    .replace(/{bloco_endereco}/g, blocoEndereco)
    .replace(/{data}/g, formattedDate)
    .replace(/{horario}/g, orderDetails.time)
    .replace(/{forma_pagamento}/g, orderDetails.paymentMethod)
    .replace(/{bloco_troco}/g, blocoTroco)
    .replace(/{bloco_observacoes}/g, blocoObservacoes)
    .replace(/{pix}/g, pixKey || '03972289960')
    .replace(/{endereco_retirada}/g, pickupAddress || 'Avenida Padre Jose Stefanello, n°340')
    .replace(/{endereco_entrega}/g, orderDetails.deliveryAddress || '')
    .replace(/{tipo_entrega}/g, isDelivery ? 'Entrega / Delivery' : 'Retirada no Local')
    .replace(/{desconto}/g, discountAmount > 0 ? formatCurrency(discountAmount) : 'R$ 0,00')
    .replace(/{frete}/g, deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis');

  return msg;
}
