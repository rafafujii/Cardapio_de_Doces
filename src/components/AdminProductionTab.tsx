import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Printer, 
  Download, 
  Sparkles, 
  Phone, 
  ChefHat, 
  Layers, 
  ListFilter,
  Check,
  ChevronDown,
  ChevronUp,
  PackageCheck
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { exportKitchenProductionPdf } from '../lib/exportReports';
import type { CategoryGroup, Product } from '../types';

interface AdminProductionTabProps {
  orders: any[];
  catalog: CategoryGroup[];
  onUpdateStatus?: (id: string, status: string) => void;
}

export function AdminProductionTab({ orders, catalog, onUpdateStatus }: AdminProductionTabProps) {
  const [selectedFilter, setSelectedFilter] = useState<'today' | 'tomorrow' | 'weekend' | 'week' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [productionChecklist, setProductionChecklist] = useState<Record<string, boolean>>({});
  const [activeViewMode, setActiveViewMode] = useState<'consolidated' | 'orders'>('consolidated');
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Map of product images and categories from catalog
  const catalogProductMap = useMemo(() => {
    const map = new Map<string, Product>();
    catalog.forEach(cat => {
      cat.items.forEach(prod => {
        map.set(prod.name.trim().toLowerCase(), prod);
      });
    });
    return map;
  }, [catalog]);

  // Determine current active date filter
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  // Filter orders by chosen date scope
  const filteredOrders = useMemo(() => {
    const active = orders.filter(o => o.status !== 'deleted');
    const now = new Date();

    if (selectedFilter === 'today') {
      return active.filter(o => o.date === todayStr);
    }
    if (selectedFilter === 'tomorrow') {
      return active.filter(o => o.date === tomorrowStr);
    }
    if (selectedFilter === 'weekend') {
      // Current weekend (Friday, Saturday, Sunday)
      const currentDay = now.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
      return active.filter(o => {
        if (!o.date) return false;
        const d = new Date(o.date + 'T12:00:00');
        const day = d.getDay();
        return day === 5 || day === 6 || day === 0;
      });
    }
    if (selectedFilter === 'week') {
      const next7Days = new Date();
      next7Days.setDate(now.getDate() + 7);
      const next7Str = next7Days.toISOString().slice(0, 10);
      return active.filter(o => o.date && o.date >= todayStr && o.date <= next7Str);
    }
    if (selectedFilter === 'custom') {
      return active.filter(o => o.date === customDate);
    }
    return active;
  }, [orders, selectedFilter, todayStr, tomorrowStr, customDate]);

  // Consolidate sweets to roll
  const consolidatedItems = useMemo(() => {
    const countMap: Record<string, { totalQuantity: number; orderCount: number; category?: string; image?: string }> = {};

    filteredOrders.forEach(order => {
      (order.items || []).forEach((item: any) => {
        const name = item.name || 'Doce Sem Nome';
        const qty = item.quantity || 1;
        const normalizedName = name.trim().toLowerCase();
        const catalogProd = catalogProductMap.get(normalizedName);

        if (!countMap[name]) {
          countMap[name] = {
            totalQuantity: 0,
            orderCount: 0,
            category: catalogProd?.category || 'Gourmet',
            image: catalogProd?.imageUrl
          };
        }
        countMap[name].totalQuantity += qty;
        countMap[name].orderCount += 1;
      });
    });

    return Object.entries(countMap)
      .map(([name, data]) => ({
        name,
        ...data
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [filteredOrders, catalogProductMap]);

  // Overall statistics for the selected scope
  const totalUnits = useMemo(() => {
    return consolidatedItems.reduce((acc, item) => acc + item.totalQuantity, 0);
  }, [consolidatedItems]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  }, [filteredOrders]);

  const toggleCheck = (sweetName: string) => {
    setProductionChecklist(prev => ({
      ...prev,
      [sweetName]: !prev[sweetName]
    }));
  };

  const getFilterLabel = () => {
    if (selectedFilter === 'today') return 'Hoje (' + todayStr.split('-').reverse().join('/') + ')';
    if (selectedFilter === 'tomorrow') return 'Amanhã (' + tomorrowStr.split('-').reverse().join('/') + ')';
    if (selectedFilter === 'weekend') return 'Próximo Fim de Semana';
    if (selectedFilter === 'week') return 'Próximos 7 Dias';
    if (selectedFilter === 'custom') return 'Data: ' + customDate.split('-').reverse().join('/');
    return 'Todas as Encomendas';
  };

  const handleDownloadKitchenPdf = () => {
    if (filteredOrders.length === 0) {
      alert('Nenhuma encomenda encontrada para o período selecionado.');
      return;
    }
    exportKitchenProductionPdf({
      selectedDateLabel: getFilterLabel(),
      orders: filteredOrders,
      consolidatedItems,
      totalUnits
    });
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-wine to-[#580015] rounded-[32px] p-6 sm:p-8 text-white shadow-lg border border-brand-gold/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-brand-gold/30 text-brand-gold text-[10px] font-black uppercase tracking-widest">
            <ChefHat className="w-3.5 h-3.5" />
            COMANDAS & PRODUÇÃO DA COZINHA
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif italic text-white leading-tight">
            Folha de Produção & Enrolamento
          </h3>
          <p className="text-xs sm:text-sm text-brand-cream/80 max-w-xl font-light">
            Veja a soma exata de cada sabor de doce para enrolar no dia e acompanhe todos os horários de entrega.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <button
            type="button"
            onClick={handleDownloadKitchenPdf}
            className="px-5 py-3 bg-brand-gold hover:bg-[#c49d28] text-brand-wine font-black text-xs rounded-2xl transition-all shadow-md flex items-center gap-2 uppercase tracking-wider"
          >
            <Download className="w-4 h-4" />
            Baixar Comanda (PDF)
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedFilter('today')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              selectedFilter === 'today'
                ? "bg-brand-wine text-white shadow-sm"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            Hoje
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('tomorrow')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              selectedFilter === 'tomorrow'
                ? "bg-brand-wine text-white shadow-sm"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            Amanhã
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('weekend')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              selectedFilter === 'weekend'
                ? "bg-brand-wine text-white shadow-sm"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            Fim de Semana
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('week')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              selectedFilter === 'week'
                ? "bg-brand-wine text-white shadow-sm"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            7 Dias
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              selectedFilter === 'all'
                ? "bg-brand-wine text-white shadow-sm"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            Todas
          </button>
        </div>

        {/* Custom Date Input */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[11px] font-bold text-neutral-400 uppercase">Ou Data:</span>
          <input
            type="date"
            className={cn(
              "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all outline-none",
              selectedFilter === 'custom' ? "border-brand-wine bg-brand-cream/30 text-brand-wine" : "border-neutral-200 bg-neutral-50 text-neutral-600"
            )}
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setSelectedFilter('custom');
            }}
          />
        </div>
      </div>

      {/* Summary KPI Cards for Selected Date */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-100 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Total de Doces a Fazer</span>
          <p className="text-2xl sm:text-3xl font-black text-brand-wine">{totalUnits} <span className="text-sm font-medium text-neutral-400">un</span></p>
          <span className="text-[10px] text-neutral-500 block">≈ {Math.floor(totalUnits / 100)} cento(s) e {totalUnits % 100} un</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-100 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Pedidos Agendados</span>
          <p className="text-2xl sm:text-3xl font-black text-brand-wine">{filteredOrders.length}</p>
          <span className="text-[10px] text-neutral-500 block">{getFilterLabel()}</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-100 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Sabores Distintos</span>
          <p className="text-2xl sm:text-3xl font-black text-brand-wine">{consolidatedItems.length}</p>
          <span className="text-[10px] text-neutral-500 block">Receitas para preparar</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-100 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Faturamento Previsto</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{formatCurrency(totalRevenue)}</p>
          <span className="text-[10px] text-neutral-500 block">Neste período</span>
        </div>
      </div>

      {/* Sub-view switcher: Consolidated vs By Order */}
      <div className="flex gap-2 p-1 bg-neutral-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveViewMode('consolidated')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
            activeViewMode === 'consolidated' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-700"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          Doces a Enrolar ({consolidatedItems.length} Sabores)
        </button>
        <button
          onClick={() => setActiveViewMode('orders')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
            activeViewMode === 'orders' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-700"
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          Pedidos por Horário ({filteredOrders.length})
        </button>
      </div>

      {/* Main Content Area */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 text-center border border-dashed border-neutral-200 space-y-3">
          <ChefHat className="w-12 h-12 text-neutral-300 mx-auto" />
          <h4 className="font-serif text-lg text-neutral-600 italic">Nenhuma encomenda para {getFilterLabel()}</h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Altere o filtro de data acima para visualizar outras datas ou planejar os próximos fins de semana.
          </p>
        </div>
      ) : activeViewMode === 'consolidated' ? (
        /* CONSOLIDATED FLAVOR ROLLING LIST */
        <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden divide-y divide-neutral-100">
          <div className="p-6 bg-brand-cream/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-serif text-base font-bold text-brand-wine italic">
                Lista Consolidada de Enrolamento
              </h4>
              <p className="text-[11px] text-neutral-500">
                Marque os doces conforme você for enrolando e finalizando na bancada da cozinha.
              </p>
            </div>
            <span className="text-xs font-black text-brand-wine bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-sm">
              {Object.values(productionChecklist).filter(Boolean).length} de {consolidatedItems.length} prontos
            </span>
          </div>

          {consolidatedItems.map((item) => {
            const isDone = productionChecklist[item.name] || false;
            const centos = Math.floor(item.totalQuantity / 100);
            const remaining = item.totalQuantity % 100;

            return (
              <div 
                key={item.name}
                onClick={() => toggleCheck(item.name)}
                className={cn(
                  "p-4 sm:p-5 flex items-center justify-between gap-4 transition-all cursor-pointer hover:bg-neutral-50",
                  isDone ? "bg-emerald-50/40 opacity-75" : ""
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Checkbox button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCheck(item.name);
                    }}
                    className={cn(
                      "w-7 h-7 rounded-xl border flex items-center justify-center transition-all shrink-0",
                      isDone 
                        ? "bg-emerald-600 border-emerald-600 text-white" 
                        : "bg-white border-neutral-300 text-transparent hover:border-brand-wine"
                    )}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* Sweet thumbnail */}
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-12 h-12 rounded-2xl object-cover border border-neutral-200 shrink-0" 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-brand-wine/5 border border-brand-wine/10 flex items-center justify-center text-brand-wine shrink-0">
                      <Sparkles className="w-5 h-5 opacity-40" />
                    </div>
                  )}

                  {/* Flavor Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-serif font-bold text-sm sm:text-base truncate",
                        isDone ? "line-through text-neutral-400" : "text-neutral-900 italic"
                      )}>
                        {item.name}
                      </p>
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 shrink-0">
                        {item.category || 'Gourmet'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Presente em <span className="font-bold text-neutral-700">{item.orderCount}</span> {item.orderCount === 1 ? 'pedido' : 'pedidos'}
                    </p>
                  </div>
                </div>

                {/* Units counter pill */}
                <div className="text-right shrink-0">
                  <div className={cn(
                    "px-3.5 py-1.5 rounded-2xl inline-flex flex-col items-end border",
                    isDone 
                      ? "bg-emerald-100 border-emerald-200 text-emerald-800" 
                      : "bg-brand-cream/60 border-brand-wine/15 text-brand-wine"
                  )}>
                    <span className="text-base sm:text-lg font-black leading-none">
                      {item.totalQuantity} <span className="text-[10px] font-bold">un</span>
                    </span>
                    {centos > 0 && (
                      <span className="text-[9px] font-bold text-neutral-500 mt-0.5">
                        {centos} cento{centos > 1 ? 's' : ''} {remaining > 0 ? `+ ${remaining} un` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ORDERS LIST GROUPED BY TIME */
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const isExpanded = expandedOrders[order.id] ?? true;
            const formattedDate = order.date ? order.date.split('-').reverse().join('/') : '-';
            const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');

            return (
              <div 
                key={order.id}
                className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden"
              >
                <div 
                  onClick={() => toggleOrderExpand(order.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-wine/10 border border-brand-wine/20 flex flex-col items-center justify-center text-brand-wine shrink-0">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-black mt-0.5">{order.time || '--:--'}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-base text-brand-wine italic">
                          {order.customerName || 'Cliente'}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-400">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span className="font-bold text-neutral-800">{formatCurrency(order.total)}</span>
                        <span>•</span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                          order.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                          order.status === 'ready' ? "bg-blue-100 text-blue-700" :
                          order.status === 'confirmed' ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-600"
                        )}>
                          {order.status === 'completed' ? 'Concluído' :
                           order.status === 'ready' ? 'Pronto p/ Retirada' :
                           order.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/55${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors"
                        title="Abrir WhatsApp do cliente"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    <button type="button" className="p-2 text-neutral-400 hover:text-neutral-600">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-neutral-100 bg-neutral-50/50 space-y-4">
                    <div className="pt-3">
                      <p className="text-[10px] font-black uppercase text-neutral-400 tracking-wider mb-2">
                        Itens Solicitados
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(order.items || []).map((item: any, idx: number) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-neutral-200 flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-800">{item.name}</span>
                            <span className="text-xs font-black text-brand-wine bg-brand-cream/50 px-2 py-0.5 rounded-lg">
                              {item.quantity} un
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-900">
                        <span className="font-bold">Observação do Cliente:</span> {order.notes}
                      </div>
                    )}

                    {onUpdateStatus && (
                      <div className="flex flex-wrap gap-2 justify-end pt-2">
                        {order.status !== 'ready' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(order.id, 'ready')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            Marcar como Pronto
                          </button>
                        )}
                        {order.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(order.id, 'completed')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Concluir Pedido
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
