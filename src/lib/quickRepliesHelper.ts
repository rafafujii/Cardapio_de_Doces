import { QuickReplyPhrase } from "../types";

export const DEFAULT_QUICK_REPLIES: QuickReplyPhrase[] = [
  {
    id: "qr-confirm-pix",
    title: "1. Confirmação & Dados Pix",
    category: "confirmacao",
    template: "Olá, {nome}! Tudo bem? ✨\n\nRecebemos o seu pedido #{numero_pedido} com sucesso na *S.E Doces Gourmet*! 🎉\n\n📋 *Itens:* {itens}\n💰 *Total:* {total}\n📅 *Data de Retirada:* {data} às {horario}\n📍 *Endereço:* {endereco}\n\n🔑 *Chave PIX:* `{chave_pix}`\n(Favorecido: S.E Doces Gourmet)\n\nAssim que efetuar o pagamento, por favor nos envie o comprovante por aqui para confirmarmos a sua produção. Muito obrigado! ❤️",
    isDefault: true
  },
  {
    id: "qr-reminder-day-before",
    title: "2. Lembrete de Produção (Véspera)",
    category: "lembrete",
    template: "Oi, {nome}! Tudo bem? 🧁\n\nPassando para avisar que sua encomenda de doces finos artesanais já está na nossa esteira de produção para *amanhã ({data}) às {horario}*! ✨\n\n📍 Local para retirada: {endereco}\n\nQualquer dúvida ou ajuste nos avise por aqui!",
    isDefault: true
  },
  {
    id: "qr-ready-pickup",
    title: "3. Pedido Pronto para Retirada",
    category: "pronto",
    template: "Oba, {nome}! 🥳 Seus doces gourmet estão fresquinhos, embalados com todo carinho e prontinhos para você retirar!\n\n📍 *Endereço:* {endereco}\n⏰ *Horário:* {horario}\n\nEstamos te aguardando!",
    isDefault: true
  },
  {
    id: "qr-out-for-delivery",
    title: "4. Saiu para Entrega (Delivery)",
    category: "entrega",
    template: "Olá, {nome}! 🛵💨\n\nSeus doces gourmet acabaram de sair para entrega a caminho de:\n📍 *{endereco_entrega}*\n\nPor favor, fique atento(a) para receber. Bom apetite!",
    isDefault: true
  },
  {
    id: "qr-post-sale-review",
    title: "5. Pós-Venda & Avaliação",
    category: "pos_venda",
    template: "Oi, {nome}! Passando para saber: o que achou dos nossos doces gourmet? Ficamos muito felizes em adoçar o seu momento! 🥰\n\nSe puder deixar uma rápida avaliação de 5 estrelas no link abaixo, você nos ajuda muito:\n👉 {link_avaliacao}\n\nMuito obrigado pelo carinho e até a próxima! ❤️🍫",
    isDefault: true
  },
  {
    id: "qr-pending-payment",
    title: "6. Cobrança Gentil de Sinal/PIX",
    category: "cobranca",
    template: "Olá, {nome}! Tudo bem? 🍫\n\nVerificamos que o seu pedido #{numero_pedido} está agendado para {data}, mas ainda não identificamos o comprovante do pagamento.\n\nPara garantirmos a sua vaga na produção, solicitamos o envio do comprovante.\n🔑 Chave PIX: `{chave_pix}`\n💰 Total: {total}\n\nQualquer dúvida nos chame aqui!",
    isDefault: true
  },
  {
    id: "qr-fresh-batch-promo",
    title: "7. Pronta Entrega / Fornada Fresca de Hoje",
    category: "geral",
    template: "Oi, {nome}! Tudo bem? 🍓✨\n\nAcabamos de finalizar uma fornada fresca de doces gourmet hoje e temos *caixinhas especiais para pronta entrega imediata*!\n\nSe quiser garantir a sua antes que esgote, é só me avisar aqui que já reservo para você! 🥰",
    isDefault: true
  }
];

export function formatQuickReply(
  template: string,
  data: {
    customerName?: string;
    orderNumber?: string;
    itemsSummary?: string;
    totalAmount?: string;
    pickupDate?: string;
    pickupTime?: string;
    pickupAddress?: string;
    deliveryAddress?: string;
    pixKey?: string;
    catalogUrl?: string;
    reviewUrl?: string;
  }
): string {
  let result = template;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cardapio-de-doces.vercel.app';
  const shortOrder = data.orderNumber || "DOCES";
  const clientName = data.customerName || "Cliente";
  const defaultReviewUrl = data.reviewUrl || `${origin}/?avaliar=true&pedido=${shortOrder}&cliente=${encodeURIComponent(clientName)}`;

  result = result.replace(/{nome}/g, clientName);
  result = result.replace(/{numero_pedido}/g, shortOrder);
  result = result.replace(/{itens}/g, data.itemsSummary || "");
  result = result.replace(/{total}/g, data.totalAmount || "R$ 0,00");
  result = result.replace(/{data}/g, data.pickupDate || "");
  result = result.replace(/{horario}/g, data.pickupTime || "");
  result = result.replace(/{endereco}/g, data.pickupAddress || "Avenida Padre Jose Stefanello, n°340");
  result = result.replace(/{endereco_entrega}/g, data.deliveryAddress || data.pickupAddress || "");
  result = result.replace(/{chave_pix}/g, data.pixKey || "03972289960");
  result = result.replace(/{link_catalogo}/g, data.catalogUrl || origin);
  result = result.replace(/{link_avaliacao}/g, defaultReviewUrl);
  return result;
}

export function openWhatsAppWithMessage(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const targetPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${targetPhone}?text=${encoded}`;
  window.open(url, "_blank");
}
