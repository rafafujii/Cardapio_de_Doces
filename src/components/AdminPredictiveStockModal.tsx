import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShoppingCart, 
  Download, 
  Copy, 
  Check, 
  ChefHat, 
  Calendar, 
  Sparkles, 
  DollarSign, 
  X,
  Layers
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { exportShoppingListPdf } from '../lib/exportReports';

interface AdminPredictiveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  ingredients: any[];
  recipes: Record<string, any[]>;
}

export function AdminPredictiveStockModal({
  isOpen,
  onClose,
  orders,
  ingredients,
  recipes
}: AdminPredictiveStockModalProps) {
  const [daysHorizon, setDaysHorizon] = useState<number>(7);
  const [copied, setCopied] = useState(false);

  // Compute date scope
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const horizonDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + daysHorizon);
    return d.toISOString().slice(0, 10);
  }, [daysHorizon]);

  // Upcoming orders in the chosen horizon
  const upcomingOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'deleted' || o.status === 'completed') return false;
      if (!o.date) return false;
      return o.date >= todayStr && o.date <= horizonDateStr;
    });
  }, [orders, todayStr, horizonDateStr]);

  // Aggregate sweets demanded in this period
  const sweetsDemandMap = useMemo(() => {
    const map: Record<string, number> = {};
    upcomingOrders.forEach(order => {
      (order.items || []).forEach((item: any) => {
        const name = item.name || 'Doce';
        const qty = Number(item.quantity || 1);
        map[name] = (map[name] || 0) + qty;
      });
    });
    return map;
  }, [upcomingOrders]);

  const totalSweetsDemand = useMemo(() => {
    return (Object.values(sweetsDemandMap) as number[]).reduce((a: number, b: number) => a + b, 0);
  }, [sweetsDemandMap]);

  // Calculate required ingredients based on active recipes
  const predictiveAnalysis = useMemo(() => {
    const ingredientDemandMap: Record<string, number> = {};

    Object.entries(sweetsDemandMap).forEach(([sweetName, sweetQty]) => {
      const sweetRecipe = recipes[sweetName];
      if (Array.isArray(sweetRecipe) && sweetRecipe.length > 0) {
        sweetRecipe.forEach((item: any) => {
          if (item.ingredientId && item.quantity) {
            const ingId = String(item.ingredientId);
            const neededForSweet = Number(item.quantity || 0) * Number(sweetQty || 0);
            ingredientDemandMap[ingId] = (ingredientDemandMap[ingId] || 0) + neededForSweet;
          }
        });
      }
    });

    const items = ingredients.map(ing => {
      const neededQty = ingredientDemandMap[ing.id] || 0;
      const currentStock = Number(ing.quantity || 0);
      const missingQty = Math.max(0, neededQty - currentStock);
      const estimatedCost = missingQty * Number(ing.costPerUnit || 0);
      const isCritical = missingQty > 0;

      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit || 'un',
        costPerUnit: Number(ing.costPerUnit || 0),
        currentStock,
        neededQuantity: neededQty,
        missingQuantity: missingQty,
        estimatedCost,
        isCritical
      };
    });

    const missingItems = items.filter(i => i.isCritical);
    const totalEstimatedCost = missingItems.reduce((acc, i) => acc + i.estimatedCost, 0);

    return {
      allItems: items,
      missingItems,
      totalEstimatedCost,
      hasShortages: missingItems.length > 0
    };
  }, [sweetsDemandMap, recipes, ingredients]);

  const handleCopyWhatsApp = () => {
    if (predictiveAnalysis.missingItems.length === 0) {
      alert("Nenhum insumo está em falta para as encomendas deste período! Estoque 100% abastecido.");
      return;
    }

    let text = `🛒 *LISTA DE COMPRAS & REPOSIÇÃO DE INSUMOS*\n`;
    text += `📅 Período: Próximos ${daysHorizon} dias (${upcomingOrders.length} encomendas, ${totalSweetsDemand} doces)\n`;
    text += `💰 Custo Estimado: ${formatCurrency(predictiveAnalysis.totalEstimatedCost)}\n\n`;
    text += `*Itens a Comprar:*\n`;

    predictiveAnalysis.missingItems.forEach(item => {
      text += `⬜ *${item.name}*: Comprar ${item.missingQuantity.toFixed(2)} ${item.unit} (Estoque: ${item.currentStock} ${item.unit} | Demanda: ${item.neededQuantity.toFixed(2)} ${item.unit}) ~ ${formatCurrency(item.estimatedCost)}\n`;
    });

    text += `\n_Gerado automaticamente pelo Sistema S.E Doces Gourmet_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadPdf = () => {
    if (predictiveAnalysis.missingItems.length === 0) {
      alert("Estoque 100% abastecido para as encomendas deste período!");
      return;
    }

    exportShoppingListPdf({
      shoppingItems: predictiveAnalysis.missingItems,
      totalEstimatedCost: predictiveAnalysis.totalEstimatedCost,
      periodDays: daysHorizon
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-brand-wine to-[#5a0016] text-white flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-brand-gold" />
              <h3 className="font-serif font-bold text-xl text-white">
                Alerta Preditivo & Reposição de Estoque
              </h3>
            </div>
            <p className="text-xs text-brand-cream/80">
              Cruzamos as fichas técnicas com as encomendas dos próximos dias para calcular compras exatas.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="p-4 sm:p-5 bg-neutral-50 border-b border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-600">Horizonte de Encomendas:</span>
            <div className="flex bg-white p-1 rounded-xl border border-neutral-200">
              {[
                { label: '3 dias', val: 3 },
                { label: '7 dias (1 sem)', val: 7 },
                { label: '14 dias (2 sem)', val: 14 },
                { label: '30 dias', val: 30 }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDaysHorizon(opt.val)}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                    daysHorizon === opt.val
                      ? "bg-brand-wine text-white shadow-2xs"
                      : "text-neutral-600 hover:text-neutral-900"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Copiar Lista formatada para WhatsApp"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 bg-brand-wine hover:bg-black text-brand-gold font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Baixar Lista de Compras em PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Summary Banner */}
          {predictiveAnalysis.hasShortages ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-red-900 text-sm">
                    Atenção: {predictiveAnalysis.missingItems.length} insumo(s) insuficientes para atender a demanda!
                  </h4>
                  <p className="text-xs text-red-700">
                    Para produzir os <strong>{totalSweetsDemand} doces</strong> agendados nas <strong>{upcomingOrders.length} encomendas</strong> dos próximos {daysHorizon} dias.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-red-600 uppercase block">Orçamento Estimado:</span>
                <span className="font-black text-lg text-red-900">{formatCurrency(predictiveAnalysis.totalEstimatedCost)}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">
                  Estoque 100% Abastecido!
                </h4>
                <p className="text-xs text-emerald-700">
                  Você possui todos os ingredientes necessários para produzir os <strong>{totalSweetsDemand} doces</strong> dos próximos {daysHorizon} dias.
                </p>
              </div>
            </div>
          )}

          {/* Missing Ingredients Table */}
          {predictiveAnalysis.missingItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-brand-wine tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4" /> Itens que precisam de reposição imediata
              </h4>

              <div className="rounded-2xl border border-red-100 overflow-hidden divide-y divide-red-100">
                {predictiveAnalysis.missingItems.map(item => (
                  <div key={item.id} className="p-4 bg-red-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-base text-neutral-900">{item.name}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-600 text-white rounded-full">
                          Falta {item.missingQuantity.toFixed(2)} {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                        <span>Estoque Atual: <strong>{item.currentStock} {item.unit}</strong></span>
                        <span>•</span>
                        <span>Necessário nos Pedidos: <strong className="text-neutral-800">{item.neededQuantity.toFixed(2)} {item.unit}</strong></span>
                      </div>
                    </div>

                    <div className="text-right self-end sm:self-center">
                      <span className="text-[10px] text-neutral-400 block">Custo Estimado</span>
                      <span className="font-black text-sm text-red-900">{formatCurrency(item.estimatedCost)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All ingredients overview */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Balanço Geral de Todos os Insumos ({predictiveAnalysis.allItems.length})
            </h4>

            <div className="rounded-2xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
              {predictiveAnalysis.allItems.map(item => (
                <div key={item.id} className="p-3.5 bg-white flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    {item.isCritical ? (
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <span className="font-medium text-neutral-800">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-4 text-neutral-600">
                    <span>Estoque: <strong>{item.currentStock} {item.unit}</strong></span>
                    <span>Demanda: <strong>{item.neededQuantity.toFixed(2)} {item.unit}</strong></span>
                    <span className={cn("font-bold px-2 py-0.5 rounded-full text-[10px]", item.isCritical ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
                      {item.isCritical ? `Falta ${item.missingQuantity.toFixed(2)}` : 'Suficiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-xs uppercase"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
