import React, { useState } from 'react';
import { 
  Tag, Plus, Edit2, Trash2, Check, X, Sparkles, AlertCircle, 
  Calendar, Percent, DollarSign, Users, Eye, Copy, Share2, ToggleLeft, ToggleRight
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import type { Coupon } from '../types';

interface AdminCouponsTabProps {
  coupons: Coupon[];
  onSaveCoupon: (coupon: Partial<Coupon> & { id?: string }) => Promise<void>;
  onDeleteCoupon: (id: string) => Promise<void>;
  onToggleCouponActive: (id: string, active: boolean) => Promise<void>;
  globalSettings: any;
  onUpdateSettings: (data: any) => void;
}

export const AdminCouponsTab: React.FC<AdminCouponsTabProps> = ({
  coupons,
  onSaveCoupon,
  onDeleteCoupon,
  onToggleCouponActive,
  globalSettings,
  onUpdateSettings
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(0);
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [bannerText, setBannerText] = useState<string>('');

  const couponsEnabled = globalSettings?.enableCoupons ?? true;

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode('');
    setDescription('');
    setDiscountType('percent');
    setDiscountValue(10);
    setMinOrderValue(0);
    setMaxDiscountAmount(0);
    setUsageLimit(0);
    setExpirationDate('');
    setActive(true);
    setShowBanner(false);
    setBannerText('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDescription(coupon.description || '');
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMinOrderValue(coupon.minOrderValue || 0);
    setMaxDiscountAmount(coupon.maxDiscountAmount || 0);
    setUsageLimit(coupon.usageLimit || 0);
    setExpirationDate(coupon.expirationDate || '');
    setActive(coupon.active);
    setShowBanner(coupon.showBanner || false);
    setBannerText(coupon.bannerText || '');
    setIsModalOpen(true);
  };

  const handleQuickPreset = (presetType: '10percent' | '5fixed' | 'vip20') => {
    if (presetType === '10percent') {
      setCode('DOCE10');
      setDescription('10% OFF no seu pedido de doces artesanais');
      setDiscountType('percent');
      setDiscountValue(10);
      setMinOrderValue(50);
      setMaxDiscountAmount(30);
      setShowBanner(true);
      setBannerText('Aproveite 10% de desconto em todo o cardápio!');
    } else if (presetType === '5fixed') {
      setCode('DOCE5');
      setDescription('R$ 5,00 OFF em qualquer encomenda');
      setDiscountType('fixed');
      setDiscountValue(5);
      setMinOrderValue(30);
      setMaxDiscountAmount(0);
      setShowBanner(false);
    } else if (presetType === 'vip20') {
      setCode('CLIENTEVIP');
      setDescription('Desconto exclusivo de 20% para clientes fiéis');
      setDiscountType('percent');
      setDiscountValue(20);
      setMinOrderValue(100);
      setMaxDiscountAmount(50);
      setShowBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      alert("Por favor, insira um código válido para o cupom.");
      return;
    }

    setSaving(true);
    try {
      await onSaveCoupon({
        id: editingCoupon?.id,
        code: cleanCode,
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : 0,
        usageLimit: usageLimit ? Number(usageLimit) : 0,
        usageCount: editingCoupon?.usageCount || 0,
        expirationDate: expirationDate || '',
        active,
        showBanner,
        bannerText: bannerText.trim()
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar cupom. Verifique os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyShare = (coupon: Coupon) => {
    const siteUrl = window?.location?.origin || 'https://cardapio-de-doces.vercel.app';
    const text = `🎉 *Presente Especial S.E Doces Gourmet!* 🍬\n\nUse o cupom *${coupon.code}* e ganhe ${
      coupon.discountType === 'percent' ? `${coupon.discountValue}% OFF` : `R$ ${coupon.discountValue.toFixed(2).replace('.', ',')} de desconto`
    } no seu pedido!\n\n${coupon.minOrderValue ? `*Pedido Mínimo:* ${formatCurrency(coupon.minOrderValue)}\n` : ''}${
      coupon.expirationDate ? `*Válido até:* ${coupon.expirationDate.split('-').reverse().join('/')}\n` : ''
    }\n👉 Acesse o cardápio e aproveite: ${siteUrl}`;

    navigator.clipboard.writeText(text);
    setCopiedId(coupon.id || coupon.code);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const today = new Date().toISOString().split('T')[0];

  const totalUsages = coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0);
  const activeCouponsCount = coupons.filter(c => c.active && (!c.expirationDate || c.expirationDate >= today)).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Master Toggle & Header Stats */}
      <div className="bg-white rounded-[32px] p-6 border border-neutral-100 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-wine text-brand-gold flex items-center justify-center shadow-md">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-brand-wine">Gestão de Cupons & Promoções</h2>
              <p className="text-xs text-neutral-400">Crie cupons de desconto, controle limites de uso e impulsione vendas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-neutral-50 px-4 py-2 rounded-2xl border border-neutral-200">
              <span className="text-xs font-bold text-neutral-700">Sistema de Cupons:</span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ enableCoupons: !couponsEnabled })}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all",
                  couponsEnabled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-red-100 text-red-800 border border-red-300"
                )}
              >
                {couponsEnabled ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" /> ATIVADO
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-red-600" /> DESATIVADO
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-brand-wine hover:bg-black text-brand-gold text-xs font-black rounded-full transition-all shadow-md shadow-brand-wine/20 flex items-center gap-2 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> NOVO CUPOM
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 bg-brand-wine/5 rounded-2xl border border-brand-wine/10">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Cupons Cadastrados</p>
            <p className="text-2xl font-serif font-bold text-brand-wine mt-1">{coupons.length}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cupons Ativos Agora</p>
            <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">{activeCouponsCount}</p>
          </div>
          <div className="p-4 bg-brand-gold/10 rounded-2xl border border-brand-gold/20">
            <p className="text-[10px] font-black text-brand-wine uppercase tracking-widest">Total de Usos em Pedidos</p>
            <p className="text-2xl font-serif font-bold text-brand-wine mt-1">{totalUsages} vezes</p>
          </div>
        </div>
      </div>

      {/* Coupons List */}
      <div className="bg-white rounded-[32px] p-6 border border-neutral-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-brand-wine uppercase tracking-widest flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-gold" /> Lista de Cupons de Desconto
          </h3>
          <span className="text-xs text-neutral-400">{coupons.length} cadastrados</span>
        </div>

        {coupons.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-[28px]">
            <Tag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-base font-serif text-brand-wine">Nenhum cupom criado ainda.</p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
              Crie cupons promocionais para atrair novos clientes, premiar avaliações ou presentear clientes fiéis.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-6 py-2.5 bg-brand-wine text-brand-gold text-xs font-black rounded-full hover:bg-black transition-all shadow-md"
            >
              CRIAR PRIMEIRO CUPOM
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coupons.map((coupon) => {
              const isExpired = coupon.expirationDate && coupon.expirationDate < today;
              const isExhausted = coupon.usageLimit && coupon.usageLimit > 0 && (coupon.usageCount || 0) >= coupon.usageLimit;
              const isLive = coupon.active && !isExpired && !isExhausted;

              return (
                <div
                  key={coupon.id || coupon.code}
                  className={cn(
                    "rounded-[24px] p-5 border transition-all relative overflow-hidden flex flex-col justify-between",
                    isLive 
                      ? "bg-white border-neutral-200 hover:border-brand-gold shadow-sm hover:shadow-md" 
                      : "bg-neutral-50/80 border-neutral-200/60 opacity-80"
                  )}
                >
                  {/* Top Bar with Status and Actions */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1.5 bg-brand-wine text-brand-gold font-mono font-black text-sm rounded-xl border border-brand-gold/30 tracking-wider shadow-sm flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          {coupon.code}
                        </span>

                        {isLive && (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-200">
                            ATIVO
                          </span>
                        )}
                        {!coupon.active && (
                          <span className="px-2.5 py-0.5 bg-neutral-200 text-neutral-600 text-[10px] font-black rounded-full">
                            PAUSADO
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full">
                            EXPIRADO
                          </span>
                        )}
                        {isExhausted && (
                          <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-black rounded-full">
                            ESGOTADO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => coupon.id && onToggleCouponActive(coupon.id, !coupon.active)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            coupon.active ? "text-emerald-600 hover:bg-emerald-50" : "text-neutral-400 hover:bg-neutral-100"
                          )}
                          title={coupon.active ? "Pausar cupom" : "Ativar cupom"}
                        >
                          {coupon.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(coupon)}
                          className="p-1.5 text-neutral-400 hover:text-brand-wine hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Editar cupom"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (coupon.id && confirm(`Excluir permanentemente o cupom ${coupon.code}?`)) {
                              onDeleteCoupon(coupon.id);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir cupom"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Discount Headline */}
                    <div className="mb-3">
                      <div className="text-xl font-serif font-bold text-brand-wine">
                        {coupon.discountType === 'percent' ? (
                          <span>{coupon.discountValue}% OFF</span>
                        ) : (
                          <span>{formatCurrency(coupon.discountValue)} OFF</span>
                        )}
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{coupon.description}</p>
                      )}
                    </div>

                    {/* Meta Details */}
                    <div className="space-y-1.5 text-[11px] text-neutral-500 py-2 border-t border-neutral-100">
                      {coupon.minOrderValue ? (
                        <div className="flex items-center justify-between">
                          <span>Pedido mínimo:</span>
                          <strong className="text-neutral-700">{formatCurrency(coupon.minOrderValue)}</strong>
                        </div>
                      ) : null}

                      {coupon.maxDiscountAmount ? (
                        <div className="flex items-center justify-between">
                          <span>Desconto máximo:</span>
                          <strong className="text-neutral-700">{formatCurrency(coupon.maxDiscountAmount)}</strong>
                        </div>
                      ) : null}

                      {coupon.expirationDate ? (
                        <div className="flex items-center justify-between">
                          <span>Validade:</span>
                          <strong className={isExpired ? "text-amber-600 font-bold" : "text-neutral-700"}>
                            {coupon.expirationDate.split('-').reverse().join('/')}
                          </strong>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span>Validade:</span>
                          <strong className="text-emerald-700">Sem expiração</strong>
                        </div>
                      )}

                      {/* Usage Progress */}
                      <div className="flex items-center justify-between pt-1">
                        <span>Usos no cardápio:</span>
                        <strong className="text-brand-wine font-mono">
                          {coupon.usageCount || 0}
                          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' usos'}
                        </strong>
                      </div>

                      {coupon.showBanner && (
                        <div className="flex items-center gap-1 text-[10px] text-brand-wine font-black pt-1">
                          <Sparkles className="w-3 h-3 text-brand-gold" /> Banner no Topo Ativado
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Share on WhatsApp Button */}
                  <div className="pt-3 mt-2 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => handleCopyShare(coupon)}
                      className="w-full py-2 bg-neutral-100 hover:bg-emerald-600 hover:text-white text-neutral-700 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {copiedId === (coupon.id || coupon.code) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> TEXTO COPIADO P/ WHATSAPP!
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" /> COPIAR DIVULGAÇÃO WHATSAPP
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Create / Edit Coupon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden z-10 border border-brand-gold/20 my-auto">
            <div className="bg-brand-wine p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif text-brand-gold">
                    {editingCoupon ? `Editar Cupom: ${editingCoupon.code}` : 'Criar Novo Cupom'}
                  </h3>
                  <p className="text-xs text-brand-gold/70">Defina regras de desconto e validade</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Presets if creating */}
              {!editingCoupon && (
                <div className="p-3 bg-brand-wine/5 rounded-2xl border border-brand-wine/10 space-y-2">
                  <span className="text-[10px] font-black text-brand-wine uppercase tracking-widest block">
                    ⚡ Modelos Rápidos Prontos:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('10percent')}
                      className="px-3 py-1 bg-white hover:bg-brand-wine hover:text-brand-gold text-brand-wine border border-brand-wine/20 rounded-lg text-xs font-bold transition-all"
                    >
                      10% OFF (DOCE10)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('5fixed')}
                      className="px-3 py-1 bg-white hover:bg-brand-wine hover:text-brand-gold text-brand-wine border border-brand-wine/20 rounded-lg text-xs font-bold transition-all"
                    >
                      R$ 5 OFF (DOCE5)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('vip20')}
                      className="px-3 py-1 bg-white hover:bg-brand-wine hover:text-brand-gold text-brand-wine border border-brand-wine/20 rounded-lg text-xs font-bold transition-all"
                    >
                      20% VIP (CLIENTEVIP)
                    </button>
                  </div>
                </div>
              )}

              {/* Code & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                    Código do Cupom *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    placeholder="Ex: DOCE10"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-black focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-wine outline-none transition-all uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                    Descrição Interna / Campanha
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Desconto de Boas-Vindas"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-wine outline-none transition-all"
                  />
                </div>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                    Tipo de Desconto *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={cn(
                        "py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border",
                        discountType === 'percent'
                          ? "bg-brand-wine text-brand-gold border-brand-wine"
                          : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                      )}
                    >
                      <Percent className="w-3.5 h-3.5" /> Porcentagem (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={cn(
                        "py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border",
                        discountType === 'fixed'
                          ? "bg-brand-wine text-brand-gold border-brand-wine"
                          : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                      )}
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Valor Fixo (R$)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                    Valor do Desconto ({discountType === 'percent' ? '%' : 'R$'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-black focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-wine outline-none transition-all"
                  />
                </div>
              </div>

              {/* Order Rules: Min Order & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                    Pedido Mínimo (R$) (0 = Sem Mínimo)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 50.00"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-wine outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                    Teto Máximo de Desconto (R$) (0 = Sem Teto)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 30.00"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-wine outline-none transition-all"
                  />
                </div>
              </div>

              {/* Limits & Expiration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                    Limite Total de Usos (0 = Ilimitado)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(parseInt(e.target.value, 10) || 0)}
                    placeholder="Ex: 50"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-wine outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                    Data de Validade (Vazio = Vitalício)
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-wine outline-none transition-all"
                  />
                </div>
              </div>

              {/* Top Banner Option */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-gold" /> Exibir Banner Promocional no Topo da Loja
                    </span>
                    <p className="text-[10px] text-neutral-500">Mostra uma barra no topo do site anunciando o cupom</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showBanner}
                    onChange={(e) => setShowBanner(e.target.checked)}
                    className="w-5 h-5 accent-brand-wine rounded cursor-pointer"
                  />
                </div>

                {showBanner && (
                  <div>
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                      Texto do Banner Promocional
                    </label>
                    <input
                      type="text"
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="Ex: Use o cupom DOCE10 e ganhe 10% OFF em seu pedido!"
                      className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                <span className="text-xs font-bold text-neutral-700">Cupom Ativo e Liberado para Uso:</span>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-5 h-5 accent-brand-wine rounded cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full font-black text-xs uppercase tracking-wider transition-all"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-brand-wine hover:bg-black text-brand-gold rounded-full font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-brand-wine/20 flex items-center justify-center gap-2"
                >
                  {saving ? 'SALVANDO...' : editingCoupon ? 'SALVAR ALTERAÇÕES' : 'CRIAR CUPOM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
