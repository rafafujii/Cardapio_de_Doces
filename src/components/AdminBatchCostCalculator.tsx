import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Trash2, Check, DollarSign, TrendingUp, Sparkles, Scale, Package, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { BatchPanIngredient } from '../types';

interface AdminBatchCostCalculatorProps {
  ingredients: any[];
  catalog: any[];
  onApplyProductCost?: (productName: string, calculatedCost: number) => void;
}

export function AdminBatchCostCalculator({
  ingredients = [],
  catalog = [],
  onApplyProductCost
}: AdminBatchCostCalculatorProps) {
  // Batch State
  const [recipeName, setRecipeName] = useState('Panela Brigadeiro Tradicional Belga');
  const [items, setItems] = useState<BatchPanIngredient[]>([
    { id: '1', name: 'Leite Condensado (Moça)', quantity: 2, unit: 'lata (395g)', costPerUnit: 7.50, totalCost: 15.00 },
    { id: '2', name: 'Creme de Leite 30%', quantity: 1, unit: 'caixa (200g)', costPerUnit: 4.20, totalCost: 4.20 },
    { id: '3', name: 'Chocolate em Pó 50% / Belga', quantity: 80, unit: 'gramas', costPerUnit: 0.08, totalCost: 6.40 },
    { id: '4', name: 'Manteiga Extra', quantity: 20, unit: 'gramas', costPerUnit: 0.05, totalCost: 1.00 }
  ]);

  // Yield settings
  const [yieldMode, setYieldMode] = useState<'units' | 'weight'>('units');
  const [directUnits, setDirectUnits] = useState<number>(45);
  const [batchWeightGrams, setBatchWeightGrams] = useState<number>(850);
  const [sweetUnitWeightGrams, setSweetUnitWeightGrams] = useState<number>(18);

  // Extra Costs
  const [packagingCostPerSweet, setPackagingCostPerSweet] = useState<number>(0.25); // forminha acetato + tapetinho + fita
  const [operationalOverheadPercent, setOperationalOverheadPercent] = useState<number>(15); // gás, luz, mão de obra (15%)
  const [currentSalePrice, setCurrentSalePrice] = useState<number>(3.50); // Preço cobrado por unidade
  const [targetFixedCosts, setTargetFixedCosts] = useState<number>(1500); // Custos fixos mensais para ponto de equilíbrio
  const [selectedProductToUpdate, setSelectedProductToUpdate] = useState<string>('');
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Calculated Yield
  const totalUnitsYielded = useMemo(() => {
    if (yieldMode === 'units') {
      return Math.max(1, directUnits || 1);
    }
    const units = Math.floor(batchWeightGrams / Math.max(1, sweetUnitWeightGrams));
    return Math.max(1, units);
  }, [yieldMode, directUnits, batchWeightGrams, sweetUnitWeightGrams]);

  // Raw Pan Cost
  const rawPanIngredientsCost = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.totalCost || (item.quantity * item.costPerUnit)), 0);
  }, [items]);

  // Operational Cost calculation
  const operationalPanCost = useMemo(() => {
    return rawPanIngredientsCost * (operationalOverheadPercent / 100);
  }, [rawPanIngredientsCost, operationalOverheadPercent]);

  // Total Pan Cost (Ingredients + Operational)
  const totalPanCost = useMemo(() => {
    return rawPanIngredientsCost + operationalPanCost;
  }, [rawPanIngredientsCost, operationalPanCost]);

  // Cost per sweet unit
  const ingredientCostPerSweet = useMemo(() => {
    return rawPanIngredientsCost / totalUnitsYielded;
  }, [rawPanIngredientsCost, totalUnitsYielded]);

  const totalCostPerSweet = useMemo(() => {
    return (totalPanCost / totalUnitsYielded) + packagingCostPerSweet;
  }, [totalPanCost, totalUnitsYielded, packagingCostPerSweet]);

  // Profit Metrics
  const unitProfit = useMemo(() => {
    return currentSalePrice - totalCostPerSweet;
  }, [currentSalePrice, totalCostPerSweet]);

  const profitMarginPercent = useMemo(() => {
    if (currentSalePrice <= 0) return 0;
    return (unitProfit / currentSalePrice) * 100;
  }, [unitProfit, currentSalePrice]);

  const markupMultiplier = useMemo(() => {
    if (totalCostPerSweet <= 0) return 0;
    return currentSalePrice / totalCostPerSweet;
  }, [currentSalePrice, totalCostPerSweet]);

  const totalBatchRevenue = useMemo(() => {
    return currentSalePrice * totalUnitsYielded;
  }, [currentSalePrice, totalUnitsYielded]);

  const totalBatchProfit = useMemo(() => {
    return unitProfit * totalUnitsYielded;
  }, [unitProfit, totalUnitsYielded]);

  const breakEvenUnitsNeeded = useMemo(() => {
    if (unitProfit <= 0) return 0;
    return Math.ceil(targetFixedCosts / unitProfit);
  }, [targetFixedCosts, unitProfit]);

  // Product List for linking
  const allProducts = useMemo(() => {
    const list: string[] = [];
    catalog.forEach(cat => cat.items?.forEach((item: any) => list.push(item.name)));
    return list.sort();
  }, [catalog]);

  // Add Item to Pan
  const handleAddCustomIngredient = () => {
    const newItem: BatchPanIngredient = {
      id: `item-${Date.now()}`,
      name: 'Novo Ingrediente',
      quantity: 1,
      unit: 'un',
      costPerUnit: 5.00,
      totalCost: 5.00
    };
    setItems([...items, newItem]);
  };

  const handleSelectFromStock = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ingId = e.target.value;
    if (!ingId) return;
    const ing = ingredients.find(i => i.id === ingId);
    if (!ing) return;

    const newItem: BatchPanIngredient = {
      id: `ing-${Date.now()}`,
      name: ing.name,
      quantity: 1,
      unit: ing.unit || 'un',
      costPerUnit: ing.costPerUnit || 0,
      totalCost: ing.costPerUnit || 0
    };
    setItems([...items, newItem]);
    e.target.value = '';
  };

  const updateItem = (index: number, field: keyof BatchPanIngredient, val: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'costPerUnit') {
      current.totalCost = (current.quantity || 0) * (current.costPerUnit || 0);
    }
    updated[index] = current;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleApplyCostToStock = () => {
    if (!selectedProductToUpdate) {
      alert('Por favor, selecione qual produto do catálogo receberá este custo unitário.');
      return;
    }
    if (onApplyProductCost) {
      onApplyProductCost(selectedProductToUpdate, Number(totalCostPerSweet.toFixed(2)));
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-neutral-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-serif text-brand-wine italic font-bold">
              Calculadora Reversa de Preço & Lucro Real por Panela
            </h3>
            <span className="px-2.5 py-0.5 bg-brand-gold/20 text-brand-wine font-black text-[9px] rounded-full uppercase">
              Engenharia de Cardápio
            </span>
          </div>
          <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
            Descubra o custo exato de cada brigadeiro enrolado, simule margens de lucro saudáveis e saiba exatamente quanto dinheiro sobra no bolso a cada panela produzida.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-serif italic text-brand-wine font-bold">Nome da Massa:</span>
          <input
            type="text"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-brand-wine outline-none focus:border-brand-wine"
          />
        </div>
      </div>

      {appliedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          Custo de {formatCurrency(totalCostPerSweet)} aplicado com sucesso ao produto "{selectedProductToUpdate}"!
        </div>
      )}

      {/* Main Grid: Inputs vs Real-Time Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Pan Ingredients & Yield Setup (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Ingredients Table */}
          <div className="bg-white p-6 sm:p-7 rounded-[32px] border border-neutral-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h4 className="font-serif italic font-bold text-neutral-800 text-base">
                  1. Ingredientes Usados na Panela
                </h4>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Matéria-prima direta da receita
                </p>
              </div>

              {/* Add from Stock Dropdown */}
              {ingredients.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    onChange={handleSelectFromStock}
                    defaultValue=""
                    className="text-[10px] font-bold text-brand-wine bg-brand-wine/5 border border-brand-wine/20 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="" disabled>+ Puxar do Estoque...</option>
                    {ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({formatCurrency(ing.costPerUnit)}/{ing.unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 bg-neutral-50/70 border border-neutral-100 rounded-2xl flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs"
                >
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    placeholder="Nome do Ingrediente"
                    className="flex-grow min-w-[140px] px-2.5 py-1.5 bg-white border border-neutral-200 rounded-xl font-medium focus:border-brand-wine outline-none"
                  />

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Qtd"
                      className="w-16 px-2 py-1.5 bg-white border border-neutral-200 rounded-xl text-center font-bold outline-none"
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                      placeholder="Unidade (g, un)"
                      className="w-20 px-2 py-1.5 bg-white border border-neutral-200 rounded-xl text-center text-[10px] text-neutral-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-neutral-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={item.costPerUnit}
                      onChange={(e) => updateItem(idx, 'costPerUnit', parseFloat(e.target.value) || 0)}
                      placeholder="Custo Un"
                      className="w-20 px-2 py-1.5 bg-white border border-neutral-200 rounded-xl text-right font-bold text-neutral-800 outline-none"
                    />
                  </div>

                  <div className="w-20 text-right font-black text-brand-wine text-xs px-1">
                    {formatCurrency(item.totalCost || (item.quantity * item.costPerUnit))}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-neutral-300 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleAddCustomIngredient}
                className="px-3 py-1.5 border border-dashed border-brand-wine/30 text-brand-wine hover:bg-brand-wine/5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Ingrediente Avulso
              </button>

              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-neutral-400 mr-2">Custo Ingredientes:</span>
                <span className="text-base font-black text-brand-wine">{formatCurrency(rawPanIngredientsCost)}</span>
              </div>
            </div>
          </div>

          {/* Yield & Extra Packaging Setup */}
          <div className="bg-white p-6 sm:p-7 rounded-[32px] border border-neutral-100 shadow-sm space-y-5">
            <div className="border-b border-neutral-100 pb-3">
              <h4 className="font-serif italic font-bold text-neutral-800 text-base">
                2. Rendimento & Custos Adicionais
              </h4>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                Forminhas, tapetinhos e energia da panela
              </p>
            </div>

            {/* Rendimento Mode Toggle */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Modo de Rendimento:
                </label>
                <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setYieldMode('units')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                      yieldMode === 'units' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400"
                    )}
                  >
                    Quantidade Direta de Doces
                  </button>
                  <button
                    type="button"
                    onClick={() => setYieldMode('weight')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                      yieldMode === 'weight' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400"
                    )}
                  >
                    Por Peso em Gramas (Balança)
                  </button>
                </div>
              </div>

              {yieldMode === 'units' ? (
                <div className="p-4 bg-brand-gold/10 rounded-2xl border border-brand-gold/30 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-brand-wine text-xs">Quantos doces enrolados renderam nesta panela?</p>
                    <p className="text-[10px] text-neutral-500">Ex: 45 unidades padrão de festa</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={directUnits}
                      onChange={(e) => setDirectUnits(parseInt(e.target.value) || 1)}
                      className="w-24 px-3 py-2 bg-white border border-brand-gold rounded-xl font-black text-center text-brand-wine text-base outline-none shadow-sm"
                    />
                    <span className="text-xs font-black text-brand-wine uppercase">Doces</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-brand-gold/10 rounded-2xl border border-brand-gold/30 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-brand-wine block mb-1">
                      Peso Total da Massa Pronta (g):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={batchWeightGrams}
                        onChange={(e) => setBatchWeightGrams(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-brand-gold rounded-xl font-black text-brand-wine outline-none text-sm"
                      />
                      <span className="text-xs font-bold text-neutral-500">gramas</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-brand-wine block mb-1">
                      Peso de Cada Doce Enrolado (g):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={sweetUnitWeightGrams}
                        onChange={(e) => setSweetUnitWeightGrams(parseFloat(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-white border border-brand-gold rounded-xl font-black text-brand-wine outline-none text-sm"
                      />
                      <span className="text-xs font-bold text-neutral-500">g/un</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Packaging & Overhead */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Embalagem por Doce (Forminha / Tapete)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={packagingCostPerSweet}
                    onChange={(e) => setPackagingCostPerSweet(parseFloat(e.target.value) || 0)}
                    placeholder="0.25"
                    className="w-full pl-8 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-brand-wine"
                  />
                </div>
                <p className="text-[9px] text-neutral-400">Forminha 4 pétalas, acetato ou caixinha proporcional</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Taxa Operacional (Gás / Energia / Mão de Obra)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={operationalOverheadPercent}
                    onChange={(e) => setOperationalOverheadPercent(parseFloat(e.target.value) || 0)}
                    placeholder="15"
                    className="w-full px-4 pr-8 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-brand-wine"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">%</span>
                </div>
                <p className="text-[9px] text-neutral-400">Adicional de segurança sobre o custo dos insumos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Results, Pricing & Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Profit Card */}
          <div className="bg-gradient-to-br from-brand-wine to-neutral-950 text-white p-7 rounded-[32px] shadow-xl space-y-6 border border-brand-gold/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-gold/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-brand-gold">
                  Resultado Financeiro Real
                </span>
                <h4 className="font-serif italic text-lg font-bold text-white">
                  {recipeName}
                </h4>
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-xl text-xs font-bold text-brand-gold">
                {totalUnitsYielded} doces
              </div>
            </div>

            {/* Big Unit Cost & Sale Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-wider text-white/60">Custo Total por Doce</p>
                <p className="text-2xl font-black text-brand-gold mt-1">
                  {formatCurrency(totalCostPerSweet)}
                </p>
                <p className="text-[9px] text-white/50 mt-0.5">
                  ({formatCurrency(ingredientCostPerSweet)} insumos + {formatCurrency(packagingCostPerSweet)} emb.)
                </p>
              </div>

              <div className="p-3.5 bg-white/10 rounded-2xl border border-brand-gold/40">
                <p className="text-[9px] font-black uppercase tracking-wider text-brand-gold">Seu Preço de Venda</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-white/70">R$</span>
                  <input
                    type="number"
                    step="0.10"
                    value={currentSalePrice}
                    onChange={(e) => setCurrentSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-0.5 bg-white/20 border border-brand-gold/60 rounded-lg text-lg font-black text-white outline-none focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
                <p className="text-[9px] text-brand-gold/80 mt-0.5">
                  Cento: {formatCurrency(currentSalePrice * 100)}
                </p>
              </div>
            </div>

            {/* Profit Metrics */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl">
                <p className="text-[9px] font-black uppercase tracking-wider text-emerald-300">Lucro Líquido / Doce</p>
                <p className="text-xl font-black text-emerald-400 mt-1">
                  +{formatCurrency(unitProfit)}
                </p>
                <p className="text-[9px] text-emerald-300/80 font-bold mt-0.5">
                  Margem: {profitMarginPercent.toFixed(1)}% ({markupMultiplier.toFixed(2)}x)
                </p>
              </div>

              <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl">
                <p className="text-[9px] font-black uppercase tracking-wider text-emerald-300">Lucro da Panela Cheia</p>
                <p className="text-xl font-black text-emerald-400 mt-1">
                  +{formatCurrency(totalBatchProfit)}
                </p>
                <p className="text-[9px] text-emerald-300/80 mt-0.5">
                  Faturamento: {formatCurrency(totalBatchRevenue)}
                </p>
              </div>
            </div>

            {/* Apply Cost to Stock Action */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/70 block">
                Vincular este Custo ao Catálogo do Estoque:
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedProductToUpdate}
                  onChange={(e) => setSelectedProductToUpdate(e.target.value)}
                  className="flex-grow px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white outline-none"
                >
                  <option value="" className="text-neutral-900">Selecione o doce...</option>
                  {allProducts.map(p => (
                    <option key={p} value={p} className="text-neutral-900">{p}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleApplyCostToStock}
                  className="px-4 py-2 bg-brand-gold hover:bg-white text-brand-wine font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex-shrink-0"
                >
                  Aplicar Custo
                </button>
              </div>
            </div>
          </div>

          {/* Suggested Pricing Table by Markup Multiplier */}
          <div className="bg-white p-6 rounded-[32px] border border-neutral-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h4 className="font-serif italic font-bold text-neutral-800 text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand-gold" />
                Tabela de Preços Sugeridos por Margem
              </h4>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Margem Básica (100% markup)', mult: 2.0, tag: 'Mínimo' },
                { label: 'Margem Saudável (150% markup)', mult: 2.5, tag: 'Recomendado' },
                { label: 'Margem Gourmet Alta (200% markup)', mult: 3.0, tag: 'Alta Lucratividade' },
                { label: 'Margem Premium (250% markup)', mult: 3.5, tag: 'Super Premium' }
              ].map((tier, i) => {
                const suggestedPrice = totalCostPerSweet * tier.mult;
                const profit = suggestedPrice - totalCostPerSweet;
                const isClosest = Math.abs(currentSalePrice - suggestedPrice) < 0.3;

                return (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-2xl border flex items-center justify-between text-xs transition-all",
                      isClosest ? "bg-brand-gold/10 border-brand-gold font-bold text-brand-wine shadow-sm" : "bg-neutral-50/70 border-neutral-100 text-neutral-700"
                    )}
                  >
                    <div>
                      <p className="font-semibold">{tier.label}</p>
                      <span className="text-[9px] uppercase tracking-wider text-neutral-400">{tier.tag}</span>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-sm text-brand-wine">{formatCurrency(suggestedPrice)}</p>
                      <p className="text-[9px] text-emerald-600 font-bold">Lucro: +{formatCurrency(profit)}/un</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Break Even Simulator */}
          <div className="bg-white p-6 rounded-[32px] border border-neutral-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif italic font-bold text-neutral-800 text-sm flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-brand-wine" />
                Ponto de Equilíbrio (Break-Even)
              </h4>
              <span className="text-[10px] font-black text-neutral-400 uppercase">Metas Mensais</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500 font-medium">Meta de Custos Fixos:</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">R$</span>
                <input
                  type="number"
                  value={targetFixedCosts}
                  onChange={(e) => setTargetFixedCosts(parseFloat(e.target.value) || 0)}
                  className="w-24 pl-7 pr-2 py-1 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs leading-relaxed text-neutral-600">
              Para pagar <span className="font-bold text-brand-wine">{formatCurrency(targetFixedCosts)}</span> de custos fixos, você precisa vender:
              <p className="text-base font-black text-brand-wine mt-1">
                🎯 {breakEvenUnitsNeeded} doces <span className="text-xs font-normal text-neutral-500">(ou {(breakEvenUnitsNeeded / totalUnitsYielded).toFixed(1)} panelas) por mês</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
