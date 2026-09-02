import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChefHat, 
  Clock, 
  Package, 
  Printer, 
  Sparkles, 
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  X
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { exportKitchenProductionPdf } from '../lib/exportReports';
import type { CategoryGroup, Product } from '../types';

interface AdminWeeklyPlannerProps {
  orders: any[];
  catalog: CategoryGroup[];
  onUpdateStatus?: (id: string, status: string) => void;
}

export function AdminWeeklyPlanner({ orders, catalog, onUpdateStatus }: AdminWeeklyPlannerProps) {
  // Current week offset: 0 = current week, +1 = next week, -1 = last week
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // Map catalog for product metadata
  const catalogProductMap = useMemo(() => {
    const map = new Map<string, Product>();
    catalog.forEach(cat => {
      cat.items.forEach(prod => {
        map.set(prod.name.trim().toLowerCase(), prod);
      });
    });
    return map;
  }, [catalog]);

  // Calculate the 7 days (Monday through Sunday) for the target week
  const weekDays = useMemo(() => {
    const now = new Date();
    // Get Monday of current week
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const days = [];
    const dayNames = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = d.toISOString().slice(0, 10);
      const isToday = isoDate === new Date().toISOString().slice(0, 10);

      days.push({
        date: d,
        isoDate,
        dayName: dayNames[i],
        shortDay: dayNames[i].slice(0, 3),
        formattedDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        isToday
      });
    }

    return days;
  }, [weekOffset]);

  const activeOrders = useMemo(() => orders.filter(o => o.status !== 'deleted'), [orders]);

  // Group orders and production metrics by day
  const weekData = useMemo(() => {
    const result: Record<string, {
      orders: any[];
      totalUnits: number;
      totalRevenue: number;
      sweetCounts: Record<string, number>;
    }> = {};

    weekDays.forEach(day => {
      const dayOrders = activeOrders.filter(o => o.date === day.isoDate);
      let dayUnits = 0;
      let dayRev = 0;
      const counts: Record<string, number> = {};

      dayOrders.forEach(o => {
        dayRev += (o.total || 0);
        (o.items || []).forEach((item: any) => {
          const qty = Number(item.quantity || 1);
          dayUnits += qty;
          counts[item.name] = (counts[item.name] || 0) + qty;
        });
      });

      result[day.isoDate] = {
        orders: dayOrders,
        totalUnits: dayUnits,
        totalRevenue: dayRev,
        sweetCounts: counts
      };
    });

    return result;
  }, [weekDays, activeOrders]);

  // Overall Week Totals
  const weekTotals = useMemo(() => {
    let units = 0;
    let rev = 0;
    let orderCount = 0;

    weekDays.forEach(day => {
      const data = weekData[day.isoDate];
      if (data) {
        units += data.totalUnits;
        rev += data.totalRevenue;
        orderCount += data.orders.length;
      }
    });

    return { units, rev, orderCount };
  }, [weekDays, weekData]);

  // Selected Day Details
  const selectedDayInfo = useMemo(() => {
    if (!selectedDayDate) return null;
    const dayMeta = weekDays.find(d => d.isoDate === selectedDayDate);
    const dayMetrics = weekData[selectedDayDate];
    if (!dayMeta || !dayMetrics) return null;

    // Consolidate sweets for export or list
    const consolidatedList = Object.entries(dayMetrics.sweetCounts).map(([name, qty]) => ({
      name,
      totalQuantity: Number(qty || 0),
      orderCount: dayMetrics.orders.filter(o => o.items?.some((i: any) => i.name === name)).length,
      category: catalogProductMap.get(name.toLowerCase().trim())?.category || 'Gourmet'
    })).sort((a, b) => b.totalQuantity - a.totalQuantity);

    return {
      ...dayMeta,
      ...dayMetrics,
      consolidatedList
    };
  }, [selectedDayDate, weekDays, weekData, catalogProductMap]);

  const handlePrintDayPdf = (isoDate: string) => {
    const dayMeta = weekDays.find(d => d.isoDate === isoDate);
    const dayMetrics = weekData[isoDate];
    if (!dayMeta || !dayMetrics || dayMetrics.orders.length === 0) {
      alert('Nenhum pedido encontrado para esta data.');
      return;
    }

    const consolidated = Object.entries(dayMetrics.sweetCounts).map(([name, qty]) => ({
      name,
      totalQuantity: Number(qty || 0),
      orderCount: dayMetrics.orders.filter(o => o.items?.some((i: any) => i.name === name)).length,
      category: catalogProductMap.get(name.toLowerCase().trim())?.category || 'Gourmet'
    })).sort((a, b) => b.totalQuantity - a.totalQuantity);

    exportKitchenProductionPdf({
      selectedDateLabel: `${dayMeta.dayName} (${dayMeta.formattedDate})`,
      orders: dayMetrics.orders,
      consolidatedItems: consolidated,
      totalUnits: dayMetrics.totalUnits
    });
  };

  return (
    <div className="space-y-6">
      {/* Week Header & Navigation */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-wine/10 text-brand-wine flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-brand-wine">
                Semana: {weekDays[0].formattedDate} a {weekDays[6].formattedDate}
              </h3>
              {weekOffset === 0 && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                  Semana Atual
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              Total da Semana: <strong>{weekTotals.units} doces</strong> em <strong>{weekTotals.orderCount} encomendas</strong> ({formatCurrency(weekTotals.rev)})
            </p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-colors flex items-center gap-1 text-xs font-bold"
            title="Semana Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors"
            >
              Hoje
            </button>
          )}
          <button
            type="button"
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-colors flex items-center gap-1 text-xs font-bold"
            title="Próxima Semana"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-Day Visual Planner Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5">
        {weekDays.map(day => {
          const data = weekData[day.isoDate] || { orders: [], totalUnits: 0, totalRevenue: 0, sweetCounts: {} };
          const hasOrders = data.orders.length > 0;
          const isHighLoad = data.totalUnits >= 300;
          const isMediumLoad = data.totalUnits >= 150 && data.totalUnits < 300;
          const isSelected = selectedDayDate === day.isoDate;

          const topSweets = Object.entries(data.sweetCounts)
            .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
            .slice(0, 3);

          return (
            <div
              key={day.isoDate}
              onClick={() => setSelectedDayDate(day.isoDate)}
              className={cn(
                "rounded-3xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between border text-left relative group",
                isSelected
                  ? "bg-brand-cream/60 border-brand-wine shadow-md ring-2 ring-brand-wine/20"
                  : day.isToday
                    ? "bg-white border-brand-gold/60 shadow-sm"
                    : "bg-white border-neutral-100 hover:border-neutral-300 shadow-2xs hover:shadow-sm"
              )}
            >
              {/* Day Header */}
              <div>
                <div className="flex items-center justify-between gap-1 pb-2 border-b border-neutral-100">
                  <div>
                    <p className={cn(
                      "text-[11px] uppercase font-black tracking-wider",
                      day.isToday ? "text-brand-wine font-extrabold" : "text-neutral-500"
                    )}>
                      {day.shortDay}
                    </p>
                    <p className="font-serif font-bold text-sm text-neutral-900">
                      {day.formattedDate}
                    </p>
                  </div>

                  {day.isToday && (
                    <span className="px-2 py-0.5 bg-brand-gold text-brand-wine font-black text-[9px] rounded-full uppercase">
                      Hoje
                    </span>
                  )}
                </div>

                {/* Day Metrics Badge */}
                <div className="my-3 space-y-1.5">
                  <div className={cn(
                    "px-3 py-1.5 rounded-2xl flex items-center justify-between",
                    isHighLoad
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : isMediumLoad
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : hasOrders
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-neutral-50 text-neutral-400 border border-neutral-100"
                  )}>
                    <div className="flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5" />
                      <span className="font-black text-xs">
                        {data.totalUnits} <span className="text-[10px] font-normal">doces</span>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold">
                      {data.orders.length} ped.
                    </span>
                  </div>

                  {hasOrders && (
                    <p className="text-[11px] font-bold text-neutral-700 px-1">
                      {formatCurrency(data.totalRevenue)}
                    </p>
                  )}
                </div>

                {/* Top sweets list */}
                {topSweets.length > 0 ? (
                  <div className="space-y-1 text-[10px] text-neutral-600 bg-neutral-50/60 p-2 rounded-xl">
                    <p className="font-bold text-neutral-400 text-[9px] uppercase">Sabores Principais:</p>
                    {topSweets.map(([name, qty]) => (
                      <div key={name} className="flex items-center justify-between gap-1 truncate">
                        <span className="truncate">{name}</span>
                        <strong className="text-brand-wine shrink-0">{qty}un</strong>
                      </div>
                    ))}
                    {Object.keys(data.sweetCounts).length > 3 && (
                      <p className="text-[9px] text-neutral-400 text-center pt-0.5">
                        +{Object.keys(data.sweetCounts).length - 3} outros sabores
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center text-neutral-300 text-[11px] italic">
                    Sem encomendas
                  </div>
                )}
              </div>

              {/* Action Bar per Card */}
              {hasOrders && (
                <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] text-brand-wine font-bold group-hover:underline">
                    Ver escala →
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintDayPdf(day.isoDate);
                    }}
                    className="p-1.5 rounded-lg bg-neutral-100 hover:bg-brand-wine hover:text-white text-neutral-600 transition-colors"
                    title="Imprimir Comanda do Dia"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Day Expanded Details Modal/Drawer */}
      {selectedDayInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-brand-wine to-[#5a0016] text-white flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-brand-gold" />
                  <h3 className="font-serif font-bold text-xl text-white">
                    Escala de Produção: {selectedDayInfo.dayName} ({selectedDayInfo.formattedDate})
                  </h3>
                </div>
                <p className="text-xs text-brand-cream/80">
                  Total a Enrolar: <strong>{selectedDayInfo.totalUnits} doces</strong> em <strong>{selectedDayInfo.orders.length} pedidos</strong> • Receita Prevista: {formatCurrency(selectedDayInfo.totalRevenue)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintDayPdf(selectedDayInfo.isoDate)}
                  className="px-3 py-1.5 bg-brand-gold hover:bg-white text-brand-wine font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Exportar PDF da Comanda"
                >
                  <Printer className="w-4 h-4" />
                  <span>PDF Comanda</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDayDate(null)}
                  className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 divide-y divide-neutral-100">
              {/* 1. Consolidated Sweets Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-brand-wine tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4" /> Sabores & Quantidades a Enrolar
                </h4>

                {selectedDayInfo.consolidatedList.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-2">Nenhum doce registrado para este dia.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedDayInfo.consolidatedList.map(item => {
                      const centos = Math.floor(item.totalQuantity / 100);
                      const un = item.totalQuantity % 100;
                      const displayQty = centos > 0 ? (un > 0 ? `${centos}ct + ${un}un` : `${centos} centos`) : `${un} un`;

                      return (
                        <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                          <div>
                            <p className="font-serif font-bold text-sm text-neutral-900">{item.name}</p>
                            <p className="text-[10px] text-neutral-500">Em {item.orderCount} encomenda(s)</p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-base text-brand-wine block">{item.totalQuantity} un</span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{displayQty}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Orders list for the day */}
              <div className="pt-6 space-y-3">
                <h4 className="text-xs font-black uppercase text-brand-wine tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Encomendas & Horários Agendados
                </h4>

                {selectedDayInfo.orders.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-2">Nenhum pedido agendado.</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedDayInfo.orders.map(order => (
                      <div key={order.id} className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-base text-neutral-900">
                              {order.customerName || 'Cliente'}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400">
                              #{order.id ? order.id.slice(-6).toUpperCase() : '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-black text-brand-wine bg-brand-cream px-2.5 py-1 rounded-xl">
                            <Clock className="w-3.5 h-3.5" />
                            {order.time || 'Horário a combinar'}
                          </div>
                        </div>

                        <div className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded-xl">
                          {(order.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join(' • ')}
                        </div>

                        {order.notes && (
                          <p className="text-[11px] text-amber-800 italic bg-amber-50/70 p-2 rounded-lg border border-amber-200/50">
                            Obs: {order.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDayDate(null)}
                className="px-5 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-xs uppercase"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
