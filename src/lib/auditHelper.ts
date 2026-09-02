import type { AuditLogChange } from '../types';

export const SETTINGS_FIELD_LABELS: Record<string, { label: string; format?: (val: any) => string }> = {
  contactPhone: { 
    label: "WhatsApp para Pedidos" 
  },
  pixKey: { 
    label: "Chave PIX Oficial" 
  },
  pickupAddress: { 
    label: "Endereço de Retirada" 
  },
  businessHours: { 
    label: "Horário de Atendimento" 
  },
  storeStatusText: { 
    label: "Texto do Status da Loja" 
  },
  storeStatusMode: { 
    label: "Status de Funcionamento",
    format: (val) => val === 'open' ? 'Aberto / Normal 🟢' : val === 'limited' ? 'Vagas Limitadas 🟡' : 'Agenda Fechada 🔴'
  },
  announcementBanner: { 
    label: "Faixa de Aviso Global",
    format: (val) => val ? `"${val}"` : '(Vazio / Oculto)'
  },
  instagramUrl: { 
    label: "Link do Instagram" 
  },
  minNoticeHours: { 
    label: "Antecedência Mínima para Encomendas",
    format: (val) => `${val || 0} horas (${Math.round((val || 0) / 24 * 10) / 10} dias)`
  },
  blockedDates: { 
    label: "Datas Bloqueadas no Calendário",
    format: (val) => {
      if (!Array.isArray(val) || val.length === 0) return 'Nenhuma data bloqueada';
      return val.map(d => String(d).split('-').reverse().join('/')).join(', ');
    }
  },
  deliveryMode: { 
    label: "Modo de Atendimento",
    format: (val) => val === 'pickup_only' ? 'Apenas Retirada' : 'Entrega e Retirada'
  },
  deliveryFeeType: { 
    label: "Cálculo da Taxa de Frete",
    format: (val) => val === 'fixed' ? 'Taxa Fixa' : 'A Combinar / Sob Consulta'
  },
  deliveryFixedFee: { 
    label: "Valor da Taxa Fixa de Entrega",
    format: (val) => `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`
  },
  freeDeliveryThreshold: { 
    label: "Teto de Frete Grátis",
    format: (val) => Number(val) > 0 ? `Acima de R$ ${Number(val).toFixed(2).replace('.', ',')}` : 'Desativado (sem frete grátis)'
  },
  enableVolumeDiscount: { 
    label: "Desconto Progressivo por Volume",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  volumeDiscountMinItems: { 
    label: "Qtd. Mínima para Desconto por Volume",
    format: (val) => `${val || 0} doces`
  },
  volumeDiscountPercent: { 
    label: "% de Desconto por Volume",
    format: (val) => `${val || 0}%`
  },
  volumeDiscountMessage: { 
    label: "Mensagem de Desconto por Volume" 
  },
  enableOrderSoundNotification: { 
    label: "Alerta Sonoro de Novo Pedido",
    format: (val) => val ? 'Ativado 🔔' : 'Desativado 🔕'
  },
  customWhatsAppTemplate: { 
    label: "Template de WhatsApp",
    format: (val) => val ? `${val.slice(0, 40)}...` : '(Padrão)'
  },
  globalMinStockAlert: { 
    label: "Alerta de Estoque Mínimo Global",
    format: (val) => `${val ?? 2} unidades/kg`
  },
  googleSheetId: { 
    label: "ID da Planilha do Google Sheets" 
  },
  enableCoupons: {
    label: "Módulo de Cupons de Desconto",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  enableReviewRewardCoupon: {
    label: "Recompensa de Cupom por Avaliação",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  reviewRewardCouponCode: {
    label: "Código do Cupom de Recompensa"
  },
  reviewRewardCouponDiscount: {
    label: "Desconto do Cupom de Recompensa"
  },
  enableWishlist: {
    label: "Lista de Favoritos (Wishlist)",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  enablePwaInstallPrompt: {
    label: "Prompt de Instalação PWA",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  enableProductionCalendar: {
    label: "Planejador Semanal de Produção",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  enablePredictiveStockAlerts: {
    label: "Alerta Preditivo de Estoque & Insumos",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  enableConsolidatedReports: {
    label: "Módulo de Relatórios & Fechamento DRE",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  seasonalTheme: {
    label: "Tema Visual Sazonal",
    format: (val) => {
      const names: Record<string, string> = {
        classic: 'Gourmet Clássico 👑',
        easter: 'Páscoa Encantada 🍫',
        mothers_day: 'Mães & Namorados 💖',
        christmas: 'Natal Doce 🎄',
        halloween: 'Halloween Mágico 🎃'
      };
      return names[val] || val || 'Gourmet Clássico 👑';
    }
  },
  seasonalThemeBanner: {
    label: "Frase do Tema Sazonal"
  }
};

/**
 * Compares two settings objects and returns structured changes list.
 */
export function calculateSettingsDiff(oldSettings: Record<string, any>, newSettings: Record<string, any>): AuditLogChange[] {
  const changes: AuditLogChange[] = [];

  const allKeys = new Set([...Object.keys(oldSettings || {}), ...Object.keys(newSettings || {})]);

  // Keys to ignore from audit diff (internal timestamps, etc.)
  const ignoredKeys = new Set(['updatedAt', 'createdAt']);

  allKeys.forEach((key) => {
    if (ignoredKeys.has(key)) return;

    const oldVal = oldSettings?.[key];
    const newVal = newSettings?.[key];

    // Check array equality
    if (Array.isArray(oldVal) || Array.isArray(newVal)) {
      const oldArrStr = JSON.stringify((oldVal || []).slice().sort());
      const newArrStr = JSON.stringify((newVal || []).slice().sort());
      if (oldArrStr !== newArrStr) {
        const meta = SETTINGS_FIELD_LABELS[key] || { label: key };
        changes.push({
          field: key,
          fieldLabel: meta.label,
          oldValue: meta.format ? meta.format(oldVal) : (oldVal ?? '(vazio)'),
          newValue: meta.format ? meta.format(newVal) : (newVal ?? '(vazio)')
        });
      }
      return;
    }

    // Primitive values comparison
    if (oldVal !== newVal) {
      // Don't flag if both are effectively empty strings/undefined
      if ((oldVal === undefined || oldVal === '' || oldVal === null) && 
          (newVal === undefined || newVal === '' || newVal === null)) {
        return;
      }

      const meta = SETTINGS_FIELD_LABELS[key] || { label: key };
      changes.push({
        field: key,
        fieldLabel: meta.label,
        oldValue: meta.format ? meta.format(oldVal) : (oldVal !== undefined && oldVal !== null && oldVal !== '' ? String(oldVal) : '(não definido)'),
        newValue: meta.format ? meta.format(newVal) : (newVal !== undefined && newVal !== null && newVal !== '' ? String(newVal) : '(não definido)')
      });
    }
  });

  return changes;
}
