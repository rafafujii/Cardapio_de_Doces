import React, { useState, useMemo } from 'react';
import { 
  Star, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  MessageCircle, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  Filter, 
  Send, 
  Copy, 
  CheckCheck,
  Heart,
  User,
  Clock,
  Package,
  Share2,
  Gift
} from 'lucide-react';
import { Timestamp } from '../firebase';
import { cn } from '../lib/utils';
import type { Review } from '../types';

interface AdminReviewsTabProps {
  reviews: Review[];
  onModerate: (id: string, status: 'approved' | 'rejected') => void;
  onDelete: (id: string) => void;
  onReply?: (id: string, replyText: string) => Promise<void>;
  globalSettings?: any;
}

export const AdminReviewsTab: React.FC<AdminReviewsTabProps> = ({ 
  reviews = [], 
  onModerate, 
  onDelete,
  onReply,
  globalSettings 
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [starFilter, setStarFilter] = useState<'all' | '5' | '4' | '3_less'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [orderIdInput, setOrderIdInput] = useState('');

  // Stats calculation
  const pendingReviews = useMemo(() => reviews.filter(r => r.status === 'pending'), [reviews]);
  const approvedReviews = useMemo(() => reviews.filter(r => r.status === 'approved'), [reviews]);
  const rejectedReviews = useMemo(() => reviews.filter(r => r.status === 'rejected'), [reviews]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 5.0;
    const total = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const fiveStarCount = useMemo(() => reviews.filter(r => (r.rating || 5) === 5).length, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      // Status filter
      if (filterStatus !== 'all' && r.status !== filterStatus) {
        return false;
      }

      // Star filter
      if (starFilter === '5' && r.rating !== 5) return false;
      if (starFilter === '4' && r.rating !== 4) return false;
      if (starFilter === '3_less' && r.rating > 3) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = (r.userName || '').toLowerCase().includes(query);
        const matchesComment = (r.comment || '').toLowerCase().includes(query);
        const matchesProduct = (r.productName || '').toLowerCase().includes(query);
        const matchesOrder = (r.orderId || '').toLowerCase().includes(query);
        return matchesName || matchesComment || matchesProduct || matchesOrder;
      }

      return true;
    });
  }, [reviews, filterStatus, starFilter, searchTerm]);

  // Reply handler
  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim() || !onReply) return;
    setSubmittingReply(true);
    try {
      await onReply(reviewId, replyText.trim());
      setReplyingId(null);
      setReplyText('');
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar resposta. Tente novamente.");
    } finally {
      setSubmittingReply(false);
    }
  };

  // Quick review link generator
  const currentBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const generatedReviewLink = `${currentBaseUrl}?avaliar=true${orderIdInput ? `&pedido=${encodeURIComponent(orderIdInput.trim())}` : ''}${customerNameInput ? `&cliente=${encodeURIComponent(customerNameInput.trim())}` : ''}`;

  const handleCopyReviewLink = () => {
    navigator.clipboard.writeText(generatedReviewLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsAppReviewRequest = () => {
    const rewardText = globalSettings?.enableReviewRewardCoupon && globalSettings?.reviewRewardCouponCode
      ? ` e ganhe um cupom de ${globalSettings.reviewRewardCouponDiscount || 'desconto'} para o seu próximo pedido! 🎁`
      : '!';
    
    const message = `Olá${customerNameInput ? ` ${customerNameInput}` : ''}! Tudo bem? ✨\n\nEsperamos que tenha amado seus docinhos da S.E Doces Gourmet! 🍫❤️\n\nSua opinião é muito especial para nós. Poderia deixar uma rápida avaliação sobre sua experiência?${rewardText}\n\n👉 Avalie em 1 minuto pelo link:\n${generatedReviewLink}\n\nMuito obrigado pelo carinho! 🥰`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      {/* Moderation Guarantee & Info Banner */}
      <div className="bg-gradient-to-br from-brand-wine via-[#3b0a1a] to-neutral-900 rounded-[32px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-brand-gold/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-[11px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
              Moderação 100% Privada e Segura
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-brand-gold">
              Controle de Avaliações & Depoimentos
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
              <strong>Você está no controle total:</strong> Qualquer avaliação enviada por clientes entra com o status 
              <span className="text-amber-300 font-bold"> "Pendente"</span> e <strong>NUNCA</strong> aparece no cardápio público até que você clique em 
              <span className="text-emerald-400 font-bold"> "Publicar no Cardápio"</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={cn(
                "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95",
                filterStatus === 'pending'
                  ? "bg-brand-gold text-brand-wine font-black ring-2 ring-white/50"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <Clock className="w-4 h-4 text-brand-gold" />
              Pendentes ({pendingReviews.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('approved')}
              className={cn(
                "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95",
                filterStatus === 'approved'
                  ? "bg-emerald-500 text-white font-black ring-2 ring-white/50"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <Check className="w-4 h-4" />
              No Cardápio ({approvedReviews.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Pending Card */}
        <div 
          onClick={() => setFilterStatus('pending')}
          className={cn(
            "p-5 sm:p-6 rounded-[28px] border transition-all cursor-pointer",
            filterStatus === 'pending'
              ? "bg-amber-50/90 border-amber-300 shadow-md ring-2 ring-amber-400/40"
              : "bg-white border-neutral-100 hover:border-amber-200 shadow-sm"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-800">
              Aguardando Moderação
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-900">{pendingReviews.length}</span>
            <span className="text-xs text-amber-700 font-semibold">
              {pendingReviews.length === 1 ? 'pendente' : 'pendentes'}
            </span>
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1 font-medium">
            {pendingReviews.length > 0 ? '⚠️ Precisa de sua decisão' : '✅ Nenhuma pendente'}
          </p>
        </div>

        {/* Satisfaction Rating Card */}
        <div className="p-5 sm:p-6 rounded-[28px] bg-white border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-neutral-500">
              Satisfação dos Clientes
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-brand-wine">{averageRating}</span>
            <span className="text-xs text-neutral-400 font-semibold">/ 5.0 ⭐</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {fiveStarCount} avaliações 5 estrelas ({reviews.length} total)
          </p>
        </div>

        {/* Approved / Public on Catalog Card */}
        <div 
          onClick={() => setFilterStatus('approved')}
          className={cn(
            "p-5 sm:p-6 rounded-[28px] border transition-all cursor-pointer",
            filterStatus === 'approved'
              ? "bg-emerald-50/90 border-emerald-300 shadow-md ring-2 ring-emerald-400/40"
              : "bg-white border-neutral-100 hover:border-emerald-200 shadow-sm"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-800">
              Publicadas no Cardápio
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-900">{approvedReviews.length}</span>
            <span className="text-xs text-emerald-700 font-semibold">no ar</span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">
            Visíveis para todos os clientes
          </p>
        </div>

        {/* Rejected / Hidden Card */}
        <div 
          onClick={() => setFilterStatus('rejected')}
          className={cn(
            "p-5 sm:p-6 rounded-[28px] border transition-all cursor-pointer",
            filterStatus === 'rejected'
              ? "bg-rose-50/90 border-rose-300 shadow-md ring-2 ring-rose-400/40"
              : "bg-white border-neutral-100 hover:border-rose-200 shadow-sm"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-800">
              Ocultadas / Rejeitadas
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <EyeOff className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-900">{rejectedReviews.length}</span>
            <span className="text-xs text-rose-700 font-semibold">ocultas</span>
          </div>
          <p className="text-[11px] text-rose-700/80 mt-1 font-medium">
            100% privadas (não aparecem)
          </p>
        </div>
      </div>

      {/* Quick Post-Sale Review Link Generator Tool */}
      <div className="bg-white p-6 rounded-[32px] border border-neutral-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-wine/10 text-brand-wine flex items-center justify-center">
              <Share2 className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-brand-wine">
                Gerador de Pedido de Avaliação Pós-Venda
              </h3>
              <p className="text-xs text-neutral-500">
                Envie o link para clientes recém-atendidos para coletar depoimentos reais
              </p>
            </div>
          </div>

          {globalSettings?.enableReviewRewardCoupon && globalSettings?.reviewRewardCouponCode && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-900">
              <Gift className="w-3.5 h-3.5 text-amber-600" />
              Recompensa ativa: Cupom <strong className="font-mono">{globalSettings.reviewRewardCouponCode}</strong>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Nome do cliente (opcional)..."
              value={customerNameInput}
              onChange={(e) => setCustomerNameInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 outline-none"
            />
          </div>
          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder="Nº do Pedido (opcional)..."
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 outline-none"
            />
          </div>
          <div className="sm:col-span-5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReviewLink}
              className="flex-1 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
            >
              {copiedLink ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Link Copiado!' : 'Copiar Link'}
            </button>
            <button
              type="button"
              onClick={handleShareWhatsAppReviewRequest}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-[28px] border border-neutral-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tab Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border",
              filterStatus === 'pending'
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            Pendentes
            {pendingReviews.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-amber-900 rounded-full text-[10px] font-black">
                {pendingReviews.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border",
              filterStatus === 'approved'
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
            )}
          >
            <Check className="w-3.5 h-3.5" />
            Aprovadas / No Cardápio
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
              {approvedReviews.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('rejected')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border",
              filterStatus === 'rejected'
                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
            )}
          >
            <EyeOff className="w-3.5 h-3.5" />
            Ocultas ({rejectedReviews.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border",
              filterStatus === 'all'
                ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
            )}
          >
            Todas ({reviews.length})
          </button>
        </div>

        {/* Search & Star Rating Filter */}
        <div className="flex items-center gap-2">
          {/* Star filter dropdown */}
          <select
            value={starFilter}
            onChange={(e: any) => setStarFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 outline-none"
          >
            <option value="all">⭐ Todas as Notas</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 Estrelas</option>
            <option value="4">⭐⭐⭐⭐ 4 Estrelas</option>
            <option value="3_less">⭐⭐⭐ 3 ou menos</option>
          </select>

          {/* Search box */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente ou doce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="py-16 bg-white rounded-[32px] border-2 border-dashed border-neutral-200 text-center space-y-3">
            <div className="w-14 h-14 bg-neutral-50 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-serif italic text-brand-wine">Nenhuma avaliação encontrada</h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                {filterStatus === 'pending'
                  ? 'Todas as avaliações já foram moderadas! Quando um cliente avaliar, ela aparecerá aqui para sua aprovação.'
                  : 'Nenhum resultado corresponde aos filtros selecionados.'}
              </p>
            </div>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const isApproved = review.status === 'approved';
            const isPending = review.status === 'pending';
            const isRejected = review.status === 'rejected';

            return (
              <div 
                key={review.id}
                className={cn(
                  "bg-white rounded-[28px] border p-6 sm:p-7 shadow-sm transition-all space-y-5 relative overflow-hidden",
                  isPending 
                    ? "border-amber-300 ring-2 ring-amber-400/20 bg-gradient-to-r from-amber-50/20 to-white" 
                    : isApproved
                    ? "border-emerald-200 hover:border-emerald-300"
                    : "border-neutral-200 opacity-80"
                )}
              >
                {/* Status Bar Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-brand-wine/10 text-brand-wine font-black text-xs flex items-center justify-center border border-brand-wine/20">
                      {review.userName ? review.userName.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-900">{review.userName || 'Cliente Anônimo'}</span>
                        {review.orderId && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-md text-[10px] font-mono font-bold">
                            Pedido #{review.orderId}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {review.createdAt instanceof Timestamp 
                          ? review.createdAt.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                          : 'Data recente'}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator Badge */}
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xs",
                      isPending && "bg-amber-100 text-amber-800 border border-amber-300",
                      isApproved && "bg-emerald-100 text-emerald-800 border border-emerald-300",
                      isRejected && "bg-rose-100 text-rose-800 border border-rose-300"
                    )}>
                      {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                      {isApproved && <Check className="w-3 h-3 text-emerald-600" />}
                      {isRejected && <EyeOff className="w-3 h-3 text-rose-600" />}
                      {isPending && 'Pendente de Moderação (Oculto)'}
                      {isApproved && 'Publicado no Cardápio (Visível)'}
                      {isRejected && 'Ocultado / Rejeitado'}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-cream/80 border border-brand-wine/10 rounded-xl text-xs font-bold text-brand-wine">
                      <Package className="w-3.5 h-3.5 text-brand-gold" />
                      {review.productName || 'Experiência Geral'}
                    </div>

                    {/* Star Display */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-4 h-4",
                            star <= (review.rating || 5)
                              ? "fill-amber-400 text-amber-400"
                              : "text-neutral-200 fill-neutral-100"
                          )}
                        />
                      ))}
                      <span className="text-xs font-black text-neutral-700 ml-1">
                        {review.rating}.0
                      </span>
                    </div>
                  </div>

                  {/* Customer Review Quote */}
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/70 relative">
                    <p className="text-sm text-neutral-700 italic font-serif leading-relaxed">
                      "{review.comment}"
                    </p>
                  </div>

                  {/* Official Confectionery Reply if exists */}
                  {review.adminReply && (
                    <div className="p-3.5 bg-gradient-to-r from-brand-wine/5 via-brand-gold/10 to-transparent border-l-4 border-brand-gold rounded-r-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-brand-wine tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-brand-gold" /> Resposta Oficial da Confeitaria:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingId(review.id);
                            setReplyText(review.adminReply || '');
                          }}
                          className="text-[10px] text-brand-wine hover:underline font-bold"
                        >
                          Editar resposta
                        </button>
                      </div>
                      <p className="text-xs text-neutral-800 font-medium">{review.adminReply}</p>
                    </div>
                  )}

                  {/* Inline Reply Form when active */}
                  {replyingId === review.id && (
                    <div className="p-4 bg-brand-cream/50 rounded-2xl border border-brand-wine/20 space-y-3">
                      <span className="text-xs font-black uppercase tracking-wider text-brand-wine block">
                        Responder à avaliação de {review.userName}:
                      </span>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escreva uma mensagem carinhosa de agradecimento que ficará visível junto ao depoimento..."
                        className="w-full p-3 bg-white border border-neutral-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/40 focus:border-brand-wine outline-none resize-none"
                      />
                      
                      {/* Quick Reply Suggestions */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] text-neutral-400 font-bold self-center mr-1">Sugestões:</span>
                        <button
                          type="button"
                          onClick={() => setReplyText("Muito obrigada pelo carinho e preferência! Ficamos imensamente felizes que tenha amado! ❤️🍫")}
                          className="px-2.5 py-1 bg-white hover:bg-brand-wine hover:text-white rounded-lg text-[10px] font-medium border border-neutral-200 transition-all text-neutral-600"
                        >
                          "Muito obrigada pelo carinho..."
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyText("Que alegria saber disso! Preparamos tudo com os melhores ingredientes e muito amor! ✨🍬")}
                          className="px-2.5 py-1 bg-white hover:bg-brand-wine hover:text-white rounded-lg text-[10px] font-medium border border-neutral-200 transition-all text-neutral-600"
                        >
                          "Que alegria saber disso..."
                        </button>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingId(null);
                            setReplyText('');
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-800"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={submittingReply || !replyText.trim()}
                          onClick={() => handleSendReply(review.id)}
                          className="px-4 py-2 bg-brand-wine hover:bg-black text-brand-gold rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Salvar Resposta
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Footer Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Primary Decision Buttons */}
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => onModerate(review.id, 'approved')}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-900/10 transition-all active:scale-95 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          Aprovar & Publicar no Cardápio
                        </button>
                        <button
                          type="button"
                          onClick={() => onModerate(review.id, 'rejected')}
                          className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <EyeOff className="w-4 h-4 text-neutral-500" />
                          Rejeitar / Não Exibir
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => onModerate(review.id, 'rejected')}
                        className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Retirar do cardápio público"
                      >
                        <EyeOff className="w-4 h-4 text-amber-600" />
                        Ocultar do Cardápio
                      </button>
                    )}

                    {isRejected && (
                      <button
                        type="button"
                        onClick={() => onModerate(review.id, 'approved')}
                        className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                        Restaurar & Publicar no Cardápio
                      </button>
                    )}

                    {/* Reply button */}
                    {onReply && replyingId !== review.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingId(review.id);
                          setReplyText(review.adminReply || '');
                        }}
                        className="px-3.5 py-2.5 bg-brand-wine/5 hover:bg-brand-wine/10 text-brand-wine rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {review.adminReply ? 'Editar Resposta' : 'Responder'}
                      </button>
                    )}

                    {/* Direct WhatsApp button if phone provided */}
                    {review.userPhone && (
                      <button
                        type="button"
                        onClick={() => {
                          const cleanPhone = review.userPhone!.replace(/\D/g, '');
                          const text = `Olá ${review.userName}! Muito obrigado pela avaliação carinhosa sobre nossos doces! Ficamos muito felizes! ❤️🍫`;
                          window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                        title="Enviar mensagem direta de agradecimento no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        WhatsApp
                      </button>
                    )}
                  </div>

                  {/* Permanent Delete */}
                  <button
                    type="button"
                    onClick={() => onDelete(review.id)}
                    className="p-2.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer ml-auto"
                    title="Excluir avaliação permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
