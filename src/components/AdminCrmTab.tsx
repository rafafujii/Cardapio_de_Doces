import React, { useState, useMemo } from 'react';
import { Users, Search, Crown, Sparkles, Heart, Phone, MessageSquare, Filter, ArrowUpRight, TrendingUp, Calendar, Tag } from 'lucide-react';
import { CustomerCRMProfile, CustomerNoteData } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { CustomerProfileModal } from './CustomerProfileModal';
import { QuickReplyModal } from './QuickReplyModal';

interface AdminCrmTabProps {
  orders: any[];
  customerNotes?: Record<string, CustomerNoteData>;
  onSaveCustomerNotes?: (phoneKey: string, noteData: CustomerNoteData) => Promise<void>;
  globalSettings?: any;
}

export function AdminCrmTab({
  orders = [],
  customerNotes = {},
  onSaveCustomerNotes,
  globalSettings
}: AdminCrmTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'gold' | 'frequent' | 'new'>('all');
  const [selectedProfile, setSelectedProfile] = useState<CustomerCRMProfile | null>(null);
  const [quickReplyCustomer, setQuickReplyCustomer] = useState<CustomerCRMProfile | null>(null);

  // Group orders by customer phone/name to build comprehensive profiles
  const profiles = useMemo(() => {
    const customerMap = new Map<string, {
      name: string;
      phone: string;
      orders: any[];
      totalSpent: number;
      flavorCounts: Record<string, number>;
    }>();

    orders.forEach((order) => {
      if (order.status === 'deleted') return;
      const rawName = (order.customerName || 'Cliente Sem Nome').trim();
      const rawPhone = (order.customerPhone || order.phone || '').trim();
      // Generate a consistent grouping key
      const key = rawPhone ? rawPhone.replace(/\D/g, '') : rawName.toLowerCase();

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name: rawName,
          phone: rawPhone,
          orders: [],
          totalSpent: 0,
          flavorCounts: {}
        });
      }

      const entry = customerMap.get(key)!;
      // Prefer newer name or formatted phone if available
      if (rawPhone && !entry.phone) entry.phone = rawPhone;
      entry.orders.push(order);
      entry.totalSpent += (order.total || 0);

      // Count favorite flavors
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item && item.name) {
            entry.flavorCounts[item.name] = (entry.flavorCounts[item.name] || 0) + (item.quantity || 1);
          }
        });
      }
    });

    const resultList: CustomerCRMProfile[] = [];

    customerMap.forEach((entry, key) => {
      // Sort orders by date descending
      const sortedOrders = [...entry.orders].sort((a, b) => {
        return (b.date || '').localeCompare(a.date || '');
      });

      const firstOrder = sortedOrders[sortedOrders.length - 1];
      const lastOrder = sortedOrders[0];

      // Sort flavors by count descending
      const favoriteFlavors = Object.entries(entry.flavorCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const orderCount = entry.orders.length;
      const totalSpent = entry.totalSpent;
      const averageTicket = orderCount > 0 ? totalSpent / orderCount : 0;

      // Classify VIP Tier
      let vipTier: 'gold' | 'frequent' | 'new' = 'new';
      if (orderCount >= 5 || totalSpent >= 400) {
        vipTier = 'gold';
      } else if (orderCount >= 2 || totalSpent >= 150) {
        vipTier = 'frequent';
      }

      const note = customerNotes[key] || customerNotes[entry.name] || undefined;

      resultList.push({
        customerName: entry.name,
        normalizedPhone: key,
        displayPhone: entry.phone,
        orderCount,
        totalSpent,
        averageTicket,
        firstOrderDate: firstOrder?.date || '',
        lastOrderDate: lastOrder?.date || '',
        lastOrderTime: lastOrder?.time || '',
        favoriteFlavors,
        recentOrders: sortedOrders,
        notes: note,
        vipTier
      });
    });

    // Sort by Total Spent descending by default
    return resultList.sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders, customerNotes]);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch =
        p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.displayPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.favoriteFlavors.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.notes?.tags && p.notes.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchTier = filterTier === 'all' ? true : p.vipTier === filterTier;

      return matchSearch && matchTier;
    });
  }, [profiles, searchQuery, filterTier]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalCustomers = profiles.length;
    const goldCount = profiles.filter(p => p.vipTier === 'gold').length;
    const frequentCount = profiles.filter(p => p.vipTier === 'frequent').length;
    const totalRevenueAll = profiles.reduce((sum, p) => sum + p.totalSpent, 0);
    const avgLtv = totalCustomers > 0 ? totalRevenueAll / totalCustomers : 0;

    return { totalCustomers, goldCount, frequentCount, totalRevenueAll, avgLtv };
  }, [profiles]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header Info */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-neutral-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-serif text-brand-wine italic font-bold">
              CRM de Clientes & Fidelização
            </h3>
            <span className="px-2.5 py-0.5 bg-brand-gold/20 text-brand-wine font-black text-[9px] rounded-full uppercase">
              Histórico & VIPs
            </span>
          </div>
          <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
            Acompanhe o histórico de compras de cada cliente, descubra os sabores preferidos, registre notas de paladar e envie mensagens de fidelização personalizadas no WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-2xl text-center">
            <p className="text-[9px] uppercase font-black text-neutral-400">Total de Clientes</p>
            <p className="text-lg font-black text-brand-wine">{summaryMetrics.totalCustomers}</p>
          </div>
          <div className="px-4 py-2 bg-brand-gold/10 border border-brand-gold/30 rounded-2xl text-center">
            <p className="text-[9px] uppercase font-black text-brand-wine">Clientes VIP Ouro</p>
            <p className="text-lg font-black text-brand-wine">{summaryMetrics.goldCount}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-wine/10 text-brand-wine flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">LTV Médio por Cliente</p>
            <p className="text-xl font-black text-brand-wine">{formatCurrency(summaryMetrics.avgLtv)}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Clientes Recorrentes</p>
            <p className="text-xl font-black text-amber-600">
              {summaryMetrics.goldCount + summaryMetrics.frequentCount} fiéis
            </p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Faturamento Acumulado</p>
            <p className="text-xl font-black text-emerald-700">{formatCurrency(summaryMetrics.totalRevenueAll)}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, telefone, sabor favorito ou tag..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-medium focus:border-brand-wine outline-none"
          />
        </div>

        {/* Tier Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase text-neutral-400 mr-1">Filtrar:</span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'gold', label: '👑 VIP Ouro' },
            { id: 'frequent', label: '💎 Frequentes' },
            { id: 'new', label: '🌟 Novos' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterTier(t.id as any)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                filterTier === t.id
                  ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                  : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Profiles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-[32px] border-2 border-dashed border-neutral-200">
            <Users className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="font-serif italic text-neutral-500">Nenhum cliente encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          filteredProfiles.map((profile, idx) => (
            <div
              key={idx}
              className="bg-white rounded-[28px] border border-neutral-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all group space-y-4"
            >
              <div>
                {/* Header Profile */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 text-brand-wine font-serif italic text-base font-bold flex items-center justify-center">
                      {profile.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-serif italic font-bold text-neutral-900 text-base leading-tight">
                        {profile.customerName}
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {profile.displayPhone || 'Sem telefone'}
                      </p>
                    </div>
                  </div>

                  {profile.vipTier === 'gold' && (
                    <span className="px-2.5 py-1 bg-brand-gold text-neutral-950 font-black text-[9px] rounded-full uppercase flex items-center gap-1 shadow-sm">
                      <Crown className="w-3 h-3 fill-current" />
                      VIP
                    </span>
                  )}
                  {profile.vipTier === 'frequent' && (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-black text-[9px] rounded-full uppercase">
                      💎 Frequente
                    </span>
                  )}
                  {profile.vipTier === 'new' && (
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 font-bold text-[9px] rounded-full uppercase">
                      Novo
                    </span>
                  )}
                </div>

                {/* Numbers */}
                <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div>
                    <span className="text-[9px] uppercase font-black text-neutral-400">Total Gasto</span>
                    <p className="text-sm font-black text-brand-wine mt-0.5">{formatCurrency(profile.totalSpent)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-black text-neutral-400">Pedidos</span>
                    <p className="text-sm font-black text-neutral-800 mt-0.5">{profile.orderCount} compras</p>
                  </div>
                </div>

                {/* Favorite Flavors preview */}
                {profile.favoriteFlavors.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-black text-neutral-400">Sabor Preferido:</span>
                    <p className="text-xs font-serif italic text-neutral-800 font-bold truncate">
                      🌟 {profile.favoriteFlavors[0].name} ({profile.favoriteFlavors[0].count} un)
                    </p>
                  </div>
                )}

                {/* Notes/Tags preview */}
                {profile.notes?.tags && profile.notes.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.notes.tags.slice(0, 3).map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProfile(profile)}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-brand-wine text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  Ver Perfil Completo
                </button>

                <button
                  type="button"
                  onClick={() => setQuickReplyCustomer(profile)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Enviar WhatsApp
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Profile Modal */}
      {selectedProfile && (
        <CustomerProfileModal
          isOpen={Boolean(selectedProfile)}
          onClose={() => setSelectedProfile(null)}
          profile={selectedProfile}
          onSaveCustomerNotes={onSaveCustomerNotes}
          onOpenQuickReply={(prof) => setQuickReplyCustomer(prof)}
        />
      )}

      {/* Quick Reply Modal from CRM */}
      {quickReplyCustomer && (
        <QuickReplyModal
          isOpen={Boolean(quickReplyCustomer)}
          onClose={() => setQuickReplyCustomer(null)}
          customerProfile={quickReplyCustomer}
          customPhrases={globalSettings?.quickReplyPhrases}
          globalSettings={globalSettings}
        />
      )}
    </div>
  );
}
