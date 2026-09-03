import type { AuditLogChange } from '../types';

export interface FieldMetadata {
  label: string;
  category: 'Atendimento & Horários' | 'Financeiro & Pagamentos' | 'Frete & Entrega' | 'Descontos & Promoções' | 'Notificações & Sistema' | 'Estoque & Produção' | 'Design & Sazonal';
  impactDescription?: string;
  format?: (val: any) => string;
}

export const SETTINGS_FIELD_LABELS: Record<string, FieldMetadata> = {
  contactPhone: { 
    label: "WhatsApp para Pedidos",
    category: "Atendimento & Horários",
    impactDescription: "Número de telefone para onde são direcionadas as mensagens de encomendas dos clientes via WhatsApp.",
    format: (val) => val ? String(val).replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4') : '(Não configurado)'
  },
  pixKey: { 
    label: "Chave PIX Oficial",
    category: "Financeiro & Pagamentos",
    impactDescription: "Chave PIX exibida na finalização de compra e enviada nas confirmações de pedido para pagamento.",
    format: (val) => val ? String(val) : '(Vazio)'
  },
  pickupAddress: { 
    label: "Endereço de Retirada",
    category: "Atendimento & Horários",
    impactDescription: "Local físico informado aos clientes que optarem por retirar seus doces pessoalmente.",
    format: (val) => val ? String(val) : '(Não definido)'
  },
  businessHours: { 
    label: "Horário de Atendimento",
    category: "Atendimento & Horários",
    impactDescription: "Horário exibido no cabeçalho e rodapé da loja para orientação do cliente.",
    format: (val) => val ? String(val) : '(Não definido)'
  },
  storeStatusText: { 
    label: "Texto do Status da Loja",
    category: "Atendimento & Horários",
    impactDescription: "Mensagem personalizada sobre o expediente ou disponibilidade da confeitaria exibida no catálogo.",
    format: (val) => val ? `"${val}"` : '(Padrão)'
  },
  storeStatusMode: { 
    label: "Status de Funcionamento",
    category: "Atendimento & Horários",
    impactDescription: "Controla o recebimento de pedidos: Aberto (normal), Vagas Limitadas ou Agenda Pausada.",
    format: (val) => val === 'open' ? 'Aberto / Normal 🟢' : val === 'limited' ? 'Vagas Limitadas 🟡' : 'Agenda Fechada 🔴'
  },
  announcementBanner: { 
    label: "Faixa de Aviso Global",
    category: "Design & Sazonal",
    impactDescription: "Aviso destacado no topo do catálogo público para todos os visitantes.",
    format: (val) => val ? `"${val}"` : '(Vazio / Oculto)'
  },
  instagramUrl: { 
    label: "Link do Instagram",
    category: "Atendimento & Horários",
    impactDescription: "Link oficial do perfil social da confeitaria.",
    format: (val) => val ? String(val) : '(Não configurado)'
  },
  minNoticeHours: { 
    label: "Antecedência Mínima para Encomendas",
    category: "Atendimento & Horários",
    impactDescription: "Janela mínima de horas que o cliente deve aguardar antes da data de entrega/retirada no calendário.",
    format: (val) => `${val || 0} horas (${Math.round((val || 0) / 24 * 10) / 10} dias)`
  },
  blockedDates: { 
    label: "Datas Bloqueadas no Calendário",
    category: "Atendimento & Horários",
    impactDescription: "Datas específicas (feriados, folgas) desativadas para encomendas.",
    format: (val) => {
      if (!Array.isArray(val) || val.length === 0) return 'Nenhuma data bloqueada';
      return val.map(d => String(d).split('-').reverse().join('/')).join(', ');
    }
  },
  deliveryMode: { 
    label: "Modo de Atendimento",
    category: "Frete & Entrega",
    impactDescription: "Define se a confeitaria atende apenas por Retirada ou também faz Entregas.",
    format: (val) => val === 'pickup_only' ? 'Apenas Retirada' : 'Entrega e Retirada'
  },
  deliveryFeeType: { 
    label: "Cálculo da Taxa de Frete",
    category: "Frete & Entrega",
    impactDescription: "Regra de precificação da taxa de entrega (Taxa Fixa ou Sob Consulta).",
    format: (val) => val === 'fixed' ? 'Taxa Fixa' : 'A Combinar / Sob Consulta'
  },
  deliveryFixedFee: { 
    label: "Valor da Taxa Fixa de Entrega",
    category: "Frete & Entrega",
    impactDescription: "Valor cobrado por cada entrega quando a modalidade taxa fixa está selecionada.",
    format: (val) => `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`
  },
  freeDeliveryThreshold: { 
    label: "Teto de Frete Grátis",
    category: "Frete & Entrega",
    impactDescription: "Valor mínimo do pedido para isentar a taxa de entrega automaticamente.",
    format: (val) => Number(val) > 0 ? `Acima de R$ ${Number(val).toFixed(2).replace('.', ',')}` : 'Desativado (sem frete grátis)'
  },
  enableVolumeDiscount: { 
    label: "Desconto Progressivo por Volume",
    category: "Descontos & Promoções",
    impactDescription: "Ativa ou desativa a concessão de desconto automático para compras de grande volume.",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  volumeDiscountMinItems: { 
    label: "Qtd. Mínima para Desconto por Volume",
    category: "Descontos & Promoções",
    impactDescription: "Quantidade de doces necessária para desbloquear o desconto percentual por atacado.",
    format: (val) => `${val || 0} doces`
  },
  volumeDiscountPercent: { 
    label: "% de Desconto por Volume",
    category: "Descontos & Promoções",
    impactDescription: "Porcentagem de abatimento concedida no carrinho de compras.",
    format: (val) => `${val || 0}%`
  },
  volumeDiscountMessage: { 
    label: "Mensagem de Desconto por Volume",
    category: "Descontos & Promoções",
    impactDescription: "Texto exibido no carrinho ao atingir a quantidade mínima para desconto.",
    format: (val) => val ? `"${val}"` : '(Padrão)'
  },
  enableOrderSoundNotification: { 
    label: "Alerta Sonoro de Novo Pedido",
    category: "Notificações & Sistema",
    impactDescription: "Toca um acorde musical suave ao vivo no painel sempre que um novo pedido for recebido.",
    format: (val) => val ? 'Ativado 🔔' : 'Desativado 🔕'
  },
  customWhatsAppTemplate: { 
    label: "Template de Mensagem de WhatsApp",
    category: "Notificações & Sistema",
    impactDescription: "Estrutura do texto gerado automaticamente para o cliente enviar a encomenda via WhatsApp.",
    format: (val) => val ? `${String(val).slice(0, 45)}...` : '(Padrão)'
  },
  globalMinStockAlert: { 
    label: "Alerta de Estoque Mínimo Global",
    category: "Estoque & Produção",
    impactDescription: "Ponto de corte de unidades/kg para sinalizar estoque baixo no módulo de insumos.",
    format: (val) => `${val ?? 2} unidades/kg`
  },
  googleSheetId: { 
    label: "ID da Planilha do Google Sheets",
    category: "Financeiro & Pagamentos",
    impactDescription: "Identificador da planilha de sincronização do cardápio e preços.",
    format: (val) => val ? String(val) : '(Padrão)'
  },
  enableCoupons: {
    label: "Módulo de Cupons de Desconto",
    category: "Descontos & Promoções",
    impactDescription: "Habilita ou oculta o campo de inserção de cupom promocional no carrinho do cliente.",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  enableReviewRewardCoupon: {
    label: "Recompensa de Cupom por Avaliação",
    category: "Descontos & Promoções",
    impactDescription: "Concede um cupom automático aos clientes que deixarem uma avaliação de doces.",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  reviewRewardCouponCode: {
    label: "Código do Cupom de Recompensa",
    category: "Descontos & Promoções",
    impactDescription: "Código que será liberado ao cliente após enviar uma avaliação.",
    format: (val) => val ? String(val) : '(Vazio)'
  },
  reviewRewardCouponDiscount: {
    label: "Desconto do Cupom de Recompensa",
    category: "Descontos & Promoções",
    impactDescription: "Descrição do benefício (ex: 5% de desconto).",
    format: (val) => val ? String(val) : '(Vazio)'
  },
  enableWishlist: {
    label: "Lista de Favoritos (Wishlist)",
    category: "Notificações & Sistema",
    impactDescription: "Permite que os clientes salvem seus doces preferidos com coração no catálogo.",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  enablePwaInstallPrompt: {
    label: "Prompt de Instalação PWA",
    category: "Notificações & Sistema",
    impactDescription: "Exibe botão e banner para instalar o aplicativo no celular do cliente.",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  enableProductionCalendar: {
    label: "Planejador Semanal de Produção",
    category: "Estoque & Produção",
    impactDescription: "Habilita a visualização do calendário com volume diário de brigadeiros a enrolar.",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  enablePredictiveStockAlerts: {
    label: "Alerta Preditivo de Estoque & Insumos",
    category: "Estoque & Produção",
    impactDescription: "Calcula automaticamente se os insumos são suficientes para atender as encomendas futuras.",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  enableConsolidatedReports: {
    label: "Módulo de Relatórios & Fechamento DRE",
    category: "Estoque & Produção",
    impactDescription: "Permite exportar balanço financeiro, faturamento e demonstrativo de resultados.",
    format: (val) => val ? 'Ativado ✅' : 'Desativado ❌'
  },
  seasonalTheme: {
    label: "Tema Visual Sazonal",
    category: "Design & Sazonal",
    impactDescription: "Muda o estilo visual, cores e atmosfera do catálogo para datas comemorativas.",
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
    label: "Frase do Tema Sazonal",
    category: "Design & Sazonal",
    impactDescription: "Frase especial exibida na faixa temática do catálogo.",
    format: (val) => val ? `"${val}"` : '(Vazio)'
  }
};

/**
 * Captures the client public IP address and browser/device information
 */
export async function getClientIpAndDeviceInfo(): Promise<{ ip: string; deviceInfo: string; browser: string }> {
  let ip = 'IP protegido';
  let device = 'Navegador Web';
  let browser = 'Navegador';

  if (typeof window !== 'undefined') {
    const ua = navigator.userAgent || '';
    
    // Detect OS / Device
    if (/android/i.test(ua)) {
      device = 'Celular Android';
    } else if (/iphone/i.test(ua)) {
      device = 'iPhone (iOS)';
    } else if (/ipad/i.test(ua)) {
      device = 'iPad (iPadOS)';
    } else if (/windows/i.test(ua)) {
      device = 'PC Windows';
    } else if (/macintosh|mac os x/i.test(ua)) {
      device = 'Computador Mac';
    } else if (/linux/i.test(ua)) {
      device = 'Linux';
    }

    // Detect Browser
    if (/edg/i.test(ua)) {
      browser = 'Microsoft Edge';
    } else if (/opr|opera/i.test(ua)) {
      browser = 'Opera';
    } else if (/chrome|crios/i.test(ua)) {
      browser = 'Chrome';
    } else if (/firefox|fxios/i.test(ua)) {
      browser = 'Firefox';
    } else if (/safari/i.test(ua)) {
      browser = 'Safari';
    }

    // Try to get public IP with strict timeout
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json && json.ip) {
          ip = json.ip;
        }
      }
    } catch {
      // Fallback
      ip = 'IP local / Navegador';
    }
  }

  return {
    ip,
    deviceInfo: `${device} • ${browser}`,
    browser
  };
}

/**
 * Compares two settings objects and returns structured changes list with deep descriptions.
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
        const meta = SETTINGS_FIELD_LABELS[key] || { 
          label: key, 
          category: 'Atendimento & Horários' 
        };
        const formattedOld = meta.format ? meta.format(oldVal) : (oldVal ?? '(vazio)');
        const formattedNew = meta.format ? meta.format(newVal) : (newVal ?? '(vazio)');

        changes.push({
          field: key,
          fieldLabel: meta.label,
          category: meta.category,
          oldValue: formattedOld,
          newValue: formattedNew,
          description: `Atualizou ${meta.label} de "${formattedOld}" para "${formattedNew}". ${meta.impactDescription || ''}`
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

      const meta = SETTINGS_FIELD_LABELS[key] || { 
        label: key, 
        category: 'Atendimento & Horários' 
      };
      const formattedOld = meta.format ? meta.format(oldVal) : (oldVal !== undefined && oldVal !== null && oldVal !== '' ? String(oldVal) : '(não definido)');
      const formattedNew = meta.format ? meta.format(newVal) : (newVal !== undefined && newVal !== null && newVal !== '' ? String(newVal) : '(não definido)');

      changes.push({
        field: key,
        fieldLabel: meta.label,
        category: meta.category,
        oldValue: formattedOld,
        newValue: formattedNew,
        description: `Modificou ${meta.label}: antes era "${formattedOld}" e agora é "${formattedNew}". ${meta.impactDescription || ''}`
      });
    }
  });

  return changes;
}

/**
 * Builds a comprehensive narrative description of all changes in the audit log
 */
export function buildAuditDetailedDescription(changes: AuditLogChange[]): string {
  if (!changes || changes.length === 0) return 'Nenhuma modificação detectada.';
  return changes.map((c, i) => `${i + 1}. [${c.category || 'Geral'}] ${c.fieldLabel}: de "${c.oldValue}" para "${c.newValue}".`).join('\n');
}
