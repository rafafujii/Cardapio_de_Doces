import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Settings, 
  Trash2, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Search, 
  X, 
  Sparkles, 
  DollarSign, 
  Percent, 
  Layers, 
  ChefHat, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { cn, formatCurrency, calculateProductCost, getProductUnitPrice, removeAcentos } from '../lib/utils';
import type { CategoryGroup, Product } from '../types';

interface AdminInventoryTabProps {
  orders: any[];
  productCosts: Record<string, number>;
  onUpdateCost: (name: string, cost: number) => void;
  ingredients: any[];
  onUpdateIngredient: (id: string | null, data: any) => void;
  onDeleteIngredient: (id: string) => void;
  recipes: Record<string, any[]>;
  onUpdateRecipe: (productName: string, items: any[]) => void;
  catalog: CategoryGroup[];
  globalMinStockAlert?: number;
}

export function AdminInventoryTab({
  orders,
  productCosts,
  onUpdateCost,
  ingredients,
  onUpdateIngredient,
  onDeleteIngredient,
  recipes,
  onUpdateRecipe,
  catalog,
  globalMinStockAlert = 2
}: AdminInventoryTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'ingredients'>('products');
  const [bulkVal, setBulkVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [marginFilter, setMarginFilter] = useState<'all' | 'with-recipe' | 'no-recipe' | 'high-margin' | 'low-margin'>('all');
  const [ingredientFilter, setIngredientFilter] = useState<'all' | 'low-stock'>('all');

  // Ingredient Editor State
  const [editingIngredient, setEditingIngredient] = useState<any | null>(null);

  // Recipe Editor State
  const [editingRecipe, setEditingRecipe] = useState<string | null>(null);

  // Map of all catalog products by lowercase trimmed name
  const catalogProductMap = useMemo(() => {
    const map = new Map<string, Product>();
    catalog.forEach(cat => {
      cat.items.forEach(prod => {
        map.set(prod.name.trim().toLowerCase(), prod);
      });
    });
    return map;
  }, [catalog]);

  // List of unique categories from catalog
  const categoriesList = useMemo(() => {
    return Array.from(new Set(catalog.map(c => c.category))).filter(Boolean);
  }, [catalog]);

  // Collect all products from catalog and historical orders
  const inventoryProducts = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach(cat => cat.items.forEach(item => set.add(item.name)));
    orders.forEach(o => o.items.forEach((i: any) => set.add(i.name)));
    return Array.from(set).sort();
  }, [orders, catalog]);

  // Detailed products list with calculated financial metrics
  const productsWithMetrics = useMemo(() => {
    return inventoryProducts.map(name => {
      const normalizedName = name.trim().toLowerCase();
      const catalogProd = catalogProductMap.get(normalizedName);
      const hasRecipe = recipes[name] && recipes[name].length > 0;
      const calculatedCost = calculateProductCost(name, productCosts, ingredients, recipes);
      
      const sellingPrice = catalogProd ? getProductUnitPrice(catalogProd) : (productCosts[name] ? productCosts[name] * 2.5 : 0);
      const unitProfit = Math.max(0, sellingPrice - calculatedCost);
      const marginPercent = sellingPrice > 0 
        ? Math.round(((sellingPrice - calculatedCost) / sellingPrice) * 100) 
        : 0;

      return {
        name,
        catalogProd,
        hasRecipe,
        calculatedCost,
        sellingPrice,
        unitProfit,
        marginPercent,
        category: catalogProd?.category || 'Gourmet'
      };
    });
  }, [inventoryProducts, catalogProductMap, recipes, productCosts, ingredients]);

  // Filtered products according to Search, Category & Margin Filter (Item 5)
  const filteredProducts = useMemo(() => {
    const cleanSearch = removeAcentos(searchQuery.toLowerCase().trim());

    return productsWithMetrics.filter(item => {
      // 1. Search Query Filter
      if (cleanSearch) {
        const cleanName = removeAcentos(item.name.toLowerCase());
        const cleanCat = removeAcentos((item.category || '').toLowerCase());
        if (!cleanName.includes(cleanSearch) && !cleanCat.includes(cleanSearch)) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // 3. Margin / Recipe Filter
      if (marginFilter === 'with-recipe' && !item.hasRecipe) return false;
      if (marginFilter === 'no-recipe' && item.hasRecipe) return false;
      if (marginFilter === 'high-margin' && item.marginPercent < 60) return false;
      if (marginFilter === 'low-margin' && (item.marginPercent >= 45 || item.calculatedCost === 0)) return false;

      return true;
    });
  }, [productsWithMetrics, searchQuery, selectedCategory, marginFilter]);

  // Overall catalog averages
  const overallAverages = useMemo(() => {
    if (productsWithMetrics.length === 0) return { avgSelling: 0, avgCost: 0, avgMargin: 0, withRecipeCount: 0 };
    
    let totalSelling = 0;
    let totalCost = 0;
    let withRecipeCount = 0;

    productsWithMetrics.forEach(p => {
      totalSelling += p.sellingPrice;
      totalCost += p.calculatedCost;
      if (p.hasRecipe) withRecipeCount++;
    });

    const avgSelling = totalSelling / productsWithMetrics.length;
    const avgCost = totalCost / productsWithMetrics.length;
    const avgMargin = avgSelling > 0 ? Math.round(((avgSelling - avgCost) / avgSelling) * 100) : 0;

    return { avgSelling, avgCost, avgMargin, withRecipeCount };
  }, [productsWithMetrics]);

  const applyBulk = () => {
    const val = parseFloat(bulkVal);
    if (isNaN(val)) return;
    if (!window.confirm(`Aplicar custo fixo de R$${val.toFixed(2)} para todos os ${inventoryProducts.length} doces?`)) return;
    inventoryProducts.forEach(name => onUpdateCost(name, val));
    setBulkVal('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Sub-Tabs: Doces x Ingredientes */}
      <div className="flex gap-2 p-1 bg-neutral-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveSubTab('products')}
          className={cn(
            "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            activeSubTab === 'products' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-700"
          )}
        >
          <Package className="w-3.5 h-3.5" />
          Doces & Margens de Lucro
        </button>
        <button 
          onClick={() => setActiveSubTab('ingredients')}
          className={cn(
            "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            activeSubTab === 'ingredients' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-700"
          )}
        >
          <ChefHat className="w-3.5 h-3.5" />
          Ingredientes Base ({ingredients.length})
        </button>
      </div>

      {activeSubTab === 'products' ? (
        <div className="space-y-6">
          {/* Top KPI Header: Store Financial Metrics (Item 1) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-100 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-brand-wine" /> Preço Médio de Venda
              </span>
              <p className="text-2xl sm:text-3xl font-black text-brand-wine">
                {formatCurrency(overallAverages.avgSelling)}
              </p>
              <span className="text-[10px] text-neutral-500 block">Média por doce avulso</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-100 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-500" /> Custo Médio Unitário
              </span>
              <p className="text-2xl sm:text-3xl font-black text-neutral-800">
                {formatCurrency(overallAverages.avgCost)}
              </p>
              <span className="text-[10px] text-neutral-500 block">Matéria-prima por doce</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-100 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Percent className="w-3 h-3 text-emerald-500" /> Margem Média da Loja
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                {overallAverages.avgMargin}%
              </p>
              <span className="text-[10px] text-neutral-500 block">Retorno bruto sobre venda</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-100 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <ChefHat className="w-3 h-3 text-brand-gold" /> Fichas Técnicas
              </span>
              <p className="text-2xl sm:text-3xl font-black text-brand-wine">
                {overallAverages.withRecipeCount} <span className="text-sm font-medium text-neutral-400">/ {productsWithMetrics.length}</span>
              </p>
              <span className="text-[10px] text-neutral-500 block">Doces com receita detalhada</span>
            </div>
          </div>

          {/* Main Table Container */}
          <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden">
            {/* Header & Controls */}
            <div className="p-6 sm:p-8 border-b border-neutral-100 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-serif text-brand-wine italic font-bold">
                    Controle de Custos & Lucratividade
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Ajuste custos de produção, visualize o lucro por doce e monte receitas detalhadas.
                  </p>
                </div>

                {/* Bulk Set Action */}
                <div className="flex items-center gap-2 bg-neutral-50 p-2 rounded-2xl border border-neutral-200/80 shrink-0">
                  <span className="text-[10px] font-black text-neutral-500 uppercase px-2">Definir Custo Fixo Geral:</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-bold">R$</span>
                    <input 
                      type="number" 
                      step="0.05"
                      placeholder="0,90"
                      className="w-24 pl-8 pr-2 py-1.5 text-xs border border-neutral-200 rounded-xl outline-none focus:border-brand-wine font-bold text-brand-wine"
                      value={bulkVal}
                      onChange={(e) => setBulkVal(e.target.value)}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={applyBulk}
                    className="px-4 py-2 bg-brand-wine text-brand-gold text-xs font-black rounded-xl hover:bg-black transition-all shadow-sm"
                  >
                    APLICAR
                  </button>
                </div>
              </div>

              {/* Search Bar & Category Filters (Item 5) */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Search Input */}
                  <div className="relative w-full sm:flex-1">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar doce por nome ou categoria..."
                      className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs outline-none focus:border-brand-wine focus:bg-white transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status / Margin Quick Filter */}
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    <button
                      type="button"
                      onClick={() => setMarginFilter('all')}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap",
                        marginFilter === 'all' ? "bg-brand-wine text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      Todos ({productsWithMetrics.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarginFilter('with-recipe')}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap",
                        marginFilter === 'with-recipe' ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      Com Receita ({overallAverages.withRecipeCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarginFilter('no-recipe')}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap",
                        marginFilter === 'no-recipe' ? "bg-amber-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      Sem Receita ({productsWithMetrics.length - overallAverages.withRecipeCount})
                    </button>
                  </div>
                </div>

                {/* Category Chips (Item 5) */}
                {categoriesList.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
                    <span className="text-[10px] font-black uppercase text-neutral-400 shrink-0">Categorias:</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={cn(
                        "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shrink-0",
                        selectedCategory === 'all' 
                          ? "bg-brand-gold text-brand-wine border border-brand-gold font-black" 
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      Todas
                    </button>
                    {categoriesList.map(catName => (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => setSelectedCategory(catName)}
                        className={cn(
                          "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shrink-0",
                          selectedCategory === catName 
                            ? "bg-brand-gold text-brand-wine border border-brand-gold font-black" 
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        )}
                      >
                        {catName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* List of Products with Real Photos (Item 2) and Live Profit (Item 1) */}
            <div className="divide-y divide-neutral-100">
              {filteredProducts.length === 0 ? (
                <div className="p-16 text-center text-neutral-400 space-y-2">
                  <Package className="w-10 h-10 text-neutral-300 mx-auto" />
                  <p className="font-serif italic text-neutral-600">Nenhum doce encontrado com os filtros atuais.</p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setMarginFilter('all'); }}
                    className="text-xs text-brand-wine font-bold underline"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                filteredProducts.map(item => {
                  const { name, catalogProd, hasRecipe, calculatedCost, sellingPrice, unitProfit, marginPercent, category } = item;
                  
                  return (
                    <div key={name} className="p-5 sm:p-6 hover:bg-neutral-50/70 transition-colors space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Sweet Identity (Item 2: Real Photo Thumbnail) */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {catalogProd?.imageUrl ? (
                            <img 
                              src={catalogProd.imageUrl} 
                              alt={name} 
                              className="w-14 h-14 rounded-2xl object-cover border border-neutral-200 shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-brand-wine/5 border border-brand-wine/10 rounded-2xl flex items-center justify-center text-brand-wine shrink-0">
                              <Sparkles className="w-6 h-6 opacity-40" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-serif font-bold text-base sm:text-lg text-neutral-900 italic truncate">
                                {name}
                              </p>
                              <span className="text-[9px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-brand-cream text-brand-wine border border-brand-wine/10 shrink-0">
                                {category}
                              </span>
                              <span className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0",
                                hasRecipe ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                              )}>
                                {hasRecipe ? 'Ficha Ativa' : 'Custo Fixo'}
                              </span>
                            </div>

                            {/* Item 1: Financial Quick Badges */}
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
                              <span className="text-neutral-500">
                                Venda: <strong className="text-neutral-800">{formatCurrency(sellingPrice)}</strong>
                              </span>
                              <span className="text-neutral-300">•</span>
                              <span className="text-neutral-500">
                                Custo: <strong className="text-brand-wine">{formatCurrency(calculatedCost)}</strong>
                              </span>
                              <span className="text-neutral-300">•</span>
                              <span className="text-emerald-700 font-bold">
                                Lucro: +{formatCurrency(unitProfit)}/un
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Live Profit Margin Pill & Actions (Item 1) */}
                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                          {/* Margem % Pill */}
                          <div className={cn(
                            "px-3.5 py-1.5 rounded-2xl border text-right flex flex-col items-end min-w-[90px]",
                            marginPercent >= 55 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                              : marginPercent >= 35 
                                ? "bg-amber-50 border-amber-200 text-amber-800"
                                : "bg-red-50 border-red-200 text-red-800"
                          )}>
                            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                              {marginPercent >= 50 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3" />}
                              {marginPercent}%
                            </span>
                            <span className="text-[9px] font-medium text-neutral-500">Margem</span>
                          </div>

                          {/* Quick Manual Cost Input (when no recipe is attached) */}
                          {!hasRecipe && (
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-bold">R$</span>
                              <input 
                                type="number" 
                                step="0.05"
                                placeholder="Fixo"
                                className="w-24 pl-8 pr-3 py-2 border border-neutral-200 rounded-xl text-xs font-bold text-brand-wine focus:border-brand-wine outline-none"
                                value={productCosts[name] || ''}
                                onChange={(e) => onUpdateCost(name, parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          )}

                          {/* Recipe Toggle */}
                          <button 
                            type="button"
                            onClick={() => setEditingRecipe(editingRecipe === name ? null : name)}
                            className={cn(
                              "px-3.5 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider flex items-center gap-1.5 shadow-sm",
                              editingRecipe === name
                                ? "bg-brand-wine text-white"
                                : hasRecipe
                                  ? "bg-neutral-100 hover:bg-brand-wine hover:text-white text-neutral-700"
                                  : "bg-brand-cream/80 hover:bg-brand-wine hover:text-white text-brand-wine border border-brand-wine/20"
                            )}
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            {hasRecipe ? 'Editar Receita' : 'Criar Receita'}
                          </button>
                        </div>
                      </div>

                      {/* Recipe Editor Accordion */}
                      {editingRecipe === name && (
                        <RecipeEditor 
                          productName={name}
                          recipeItems={recipes[name] || []}
                          ingredients={ingredients}
                          onSave={(items) => {
                            onUpdateRecipe(name, items);
                            setEditingRecipe(null);
                          }}
                          onCancel={() => setEditingRecipe(null)}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* INGREDIENTS BASE TAB (Item 6: Alerta de Estoque Mínimo Global) */
        <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden space-y-0">
          <div className="p-6 sm:p-8 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-serif text-brand-wine italic font-bold">Ingredientes Base</h3>
                {globalMinStockAlert > 0 && (
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    Alerta Global: ≤ {globalMinStockAlert} un/kg
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                Cadastre leite condensado, chocolates, manteiga e custos de matéria-prima para cálculo automático.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter: All vs Low Stock */}
              <div className="flex bg-neutral-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIngredientFilter('all')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                    ingredientFilter === 'all'
                      ? "bg-white text-brand-wine shadow-xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  )}
                >
                  Todos ({ingredients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setIngredientFilter('low-stock')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
                    ingredientFilter === 'low-stock'
                      ? "bg-red-600 text-white shadow-xs"
                      : (ingredients.some(i => {
                          const thresh = (i.lowStockThreshold && i.lowStockThreshold > 0) ? i.lowStockThreshold : (globalMinStockAlert || 0);
                          return thresh > 0 && (i.quantity || 0) <= thresh;
                        }) ? "text-red-700 font-black bg-red-100/60" : "text-neutral-500 hover:text-neutral-800")
                  )}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Estoque Baixo ({ingredients.filter(i => {
                    const thresh = (i.lowStockThreshold && i.lowStockThreshold > 0) ? i.lowStockThreshold : (globalMinStockAlert || 0);
                    return thresh > 0 && (i.quantity || 0) <= thresh;
                  }).length})
                </button>
              </div>

              <button 
                type="button"
                onClick={() => setEditingIngredient({ name: '', unit: 'kg', costPerUnit: 0, quantity: 0, lowStockThreshold: 0 })}
                className="px-4 py-2.5 bg-brand-wine text-brand-gold text-xs font-black rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                NOVO INGREDIENTE
              </button>
            </div>
          </div>

          {/* Low stock alert banner */}
          {ingredients.some(i => {
            const thresh = (i.lowStockThreshold && i.lowStockThreshold > 0) ? i.lowStockThreshold : (globalMinStockAlert || 0);
            return thresh > 0 && (i.quantity || 0) <= thresh;
          }) && (
            <div className="p-4 bg-red-50 border-b border-red-100 flex items-center justify-between gap-3 text-red-900 text-xs">
              <div className="flex items-center gap-2.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 animate-bounce" />
                <span>
                  Atenção: Há {ingredients.filter(i => {
                    const thresh = (i.lowStockThreshold && i.lowStockThreshold > 0) ? i.lowStockThreshold : (globalMinStockAlert || 0);
                    return thresh > 0 && (i.quantity || 0) <= thresh;
                  }).length} ingrediente(s) com estoque baixo ou zerado!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIngredientFilter(prev => prev === 'low-stock' ? 'all' : 'low-stock')}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] uppercase shrink-0 transition-colors"
              >
                {ingredientFilter === 'low-stock' ? 'Ver Todos' : 'Filtrar Críticos'}
              </button>
            </div>
          )}

          <div className="divide-y divide-neutral-100">
            {editingIngredient && (
              <div className="p-6 sm:p-8 bg-brand-cream/30 space-y-6">
                <h4 className="text-xs font-black uppercase text-brand-wine tracking-widest">
                  {editingIngredient.id ? 'Editar Ingrediente' : 'Novo Ingrediente'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Nome do Ingrediente</label>
                    <input 
                      type="text"
                      placeholder="Ex: Leite Condensado Nestlé"
                      className="w-full p-2.5 border border-neutral-200 rounded-xl text-xs outline-none focus:border-brand-wine bg-white"
                      value={editingIngredient.name}
                      onChange={(e) => setEditingIngredient({ ...editingIngredient, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Unidade de Medida</label>
                    <select 
                      className="w-full p-2.5 border border-neutral-200 rounded-xl text-xs outline-none focus:border-brand-wine bg-white font-medium"
                      value={editingIngredient.unit}
                      onChange={(e) => setEditingIngredient({ ...editingIngredient, unit: e.target.value })}
                    >
                      <option value="kg">Quilogramas (kg)</option>
                      <option value="g">Gramas (g)</option>
                      <option value="L">Litros (L)</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="un">Unidade (un)</option>
                      <option value="cx">Caixa (cx)</option>
                      <option value="lata">Lata</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Custo por Unidade (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-bold">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-8 p-2.5 border border-neutral-200 rounded-xl text-xs outline-none focus:border-brand-wine bg-white font-bold text-brand-wine"
                        value={editingIngredient.costPerUnit || ''}
                        onChange={(e) => setEditingIngredient({ ...editingIngredient, costPerUnit: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Estoque Atual</label>
                    <input 
                      type="number"
                      step="0.001"
                      className="w-full p-2.5 border border-neutral-200 rounded-xl text-xs outline-none focus:border-brand-wine bg-white font-mono"
                      value={editingIngredient.quantity ?? 0}
                      onChange={(e) => setEditingIngredient({ ...editingIngredient, quantity: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Alerta Mínimo Individual</label>
                    <input 
                      type="number"
                      step="0.001"
                      placeholder={`Padrão: ${globalMinStockAlert || 2}`}
                      className="w-full p-2.5 border border-neutral-200 rounded-xl text-xs outline-none focus:border-brand-wine bg-white font-mono text-brand-wine"
                      value={editingIngredient.lowStockThreshold ?? 0}
                      onChange={(e) => setEditingIngredient({ ...editingIngredient, lowStockThreshold: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setEditingIngredient(null)}
                    className="px-4 py-2 text-xs font-bold text-neutral-500 uppercase hover:text-neutral-700"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!editingIngredient.name) {
                        alert("Por favor, preencha o nome do ingrediente.");
                        return;
                      }
                      onUpdateIngredient(editingIngredient.id || null, editingIngredient);
                      setEditingIngredient(null);
                    }}
                    className="px-6 py-2.5 bg-brand-wine text-white text-xs font-black rounded-xl hover:bg-black transition-all shadow-sm"
                  >
                    SALVAR INGREDIENTE
                  </button>
                </div>
              </div>
            )}

            {ingredients.length === 0 && !editingIngredient && (
              <div className="p-16 text-center text-neutral-400 italic">Nenhum ingrediente cadastrado no momento.</div>
            )}

            {ingredients
              .filter(ing => {
                if (ingredientFilter === 'low-stock') {
                  const threshold = (ing.lowStockThreshold && ing.lowStockThreshold > 0)
                    ? ing.lowStockThreshold
                    : (globalMinStockAlert || 0);
                  return threshold > 0 && (ing.quantity || 0) <= threshold;
                }
                return true;
              })
              .map(ing => {
                const threshold = (ing.lowStockThreshold && ing.lowStockThreshold > 0)
                  ? ing.lowStockThreshold
                  : (globalMinStockAlert || 0);
                const isLow = threshold > 0 && (ing.quantity || 0) <= threshold;
                
                return (
                  <div key={ing.id} className={cn(
                    "p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors group",
                    isLow ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-neutral-50/60"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0",
                        isLow ? "bg-red-100 text-red-600 animate-pulse" : "bg-neutral-100 text-neutral-600"
                      )}>
                        {isLow ? <AlertTriangle className="w-5 h-5" /> : <ChefHat className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-serif font-bold text-base text-neutral-900 italic">{ing.name}</p>
                          {isLow && (
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-red-600 text-white rounded-full">
                              Estoque Crítico (≤ {threshold} {ing.unit})
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-neutral-500">
                          <span>Preço: <strong className="text-neutral-800">{formatCurrency(ing.costPerUnit)}/{ing.unit}</strong></span>
                          <span>•</span>
                          <span className={isLow ? "text-red-700 font-bold" : "text-neutral-700 font-medium"}>
                            Estoque Atual: {ing.quantity || 0} {ing.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Quick stock adjustment buttons */}
                      <div className="flex items-center bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs mr-1">
                        <button
                          type="button"
                          onClick={() => {
                            const newQty = Math.max(0, (ing.quantity || 0) - 1);
                            onUpdateIngredient(ing.id, { ...ing, quantity: newQty });
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 border-r border-neutral-200 transition-colors"
                          title="Subtrair 1"
                        >
                          -1
                        </button>
                        <span className="px-2.5 text-xs font-mono font-bold text-neutral-800">
                          {ing.quantity || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newQty = (ing.quantity || 0) + 1;
                            onUpdateIngredient(ing.id, { ...ing, quantity: newQty });
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 border-l border-neutral-200 transition-colors"
                          title="Adicionar 1"
                        >
                          +1
                        </button>
                      </div>

                      <button 
                        type="button"
                        onClick={() => setEditingIngredient(ing)}
                        className="p-2.5 text-neutral-500 hover:text-brand-wine hover:bg-white rounded-xl transition-all border border-transparent hover:border-neutral-200 shadow-2xs"
                        title="Editar ingrediente"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => onDeleteIngredient(ing.id)}
                        className="p-2.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir ingrediente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function RecipeEditor({ 
  productName, 
  recipeItems, 
  ingredients, 
  onSave, 
  onCancel 
}: { 
  productName: string;
  recipeItems: any[];
  ingredients: any[];
  onSave: (items: any[]) => void;
  onCancel: () => void;
}) {
  const [items, setItems] = useState<any[]>(() => {
    if (recipeItems.length > 0) return recipeItems;
    if (ingredients.length > 0) return [{ ingredientId: ingredients[0].id, quantity: 0.05 }];
    return [];
  });
  
  const addItem = () => {
    if (ingredients.length === 0) {
      alert("Cadastre primeiro alguns ingredientes base na aba 'Ingredientes Base'.");
      return;
    }
    setItems([...items, { ingredientId: ingredients[0].id, quantity: 0.01 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCost = useMemo(() => {
    return items.reduce((total, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      return total + ((ing?.costPerUnit || 0) * (item.quantity || 0));
    }, 0);
  }, [items, ingredients]);

  return (
    <div className="mt-3 p-5 sm:p-6 bg-gradient-to-br from-brand-cream/40 to-neutral-50 rounded-2xl border border-brand-wine/15 space-y-4 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="text-xs font-black text-brand-wine uppercase tracking-widest flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5" /> Ficha Técnica / Receita: {productName}
          </h4>
          <p className="text-[11px] text-neutral-500">Adicione a quantidade de cada ingrediente usado por unidade de doce.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-neutral-500 uppercase block">Custo Calculado por Doce:</span>
          <span className="text-base font-black text-emerald-700">{formatCurrency(totalCost)}</span>
        </div>
      </div>

      {ingredients.length === 0 ? (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
          Você ainda não possui ingredientes cadastrados. Acesse a aba <strong>Ingredientes Base</strong> acima para adicionar leite condensado, manteiga, etc.
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, idx) => {
            const currentIng = ingredients.find(i => i.id === item.ingredientId);
            const lineCost = (currentIng?.costPerUnit || 0) * (item.quantity || 0);

            return (
              <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-neutral-200">
                <select 
                  className="flex-grow p-2 border border-neutral-200 rounded-lg text-xs outline-none focus:border-brand-wine font-medium"
                  value={item.ingredientId}
                  onChange={(e) => updateItem(idx, 'ingredientId', e.target.value)}
                >
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({formatCurrency(ing.costPerUnit)}/{ing.unit})</option>
                  ))}
                </select>
                <div className="flex items-center gap-1 shrink-0">
                  <input 
                    type="number"
                    step="0.001"
                    placeholder="Qtd"
                    className="w-20 p-2 border border-neutral-200 rounded-lg text-xs outline-none focus:border-brand-wine text-center font-bold"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-xs font-bold text-neutral-500 min-w-[24px]">{currentIng?.unit || 'un'}</span>
                </div>
                <span className="text-xs font-bold text-neutral-600 min-w-[70px] text-right">
                  {formatCurrency(lineCost)}
                </span>
                <button 
                  type="button"
                  onClick={() => removeItem(idx)} 
                  className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                  title="Remover linha"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button 
          type="button"
          onClick={addItem}
          className="w-full sm:w-auto px-4 py-2 border border-dashed border-brand-wine/40 text-brand-wine text-xs font-bold rounded-xl hover:bg-brand-wine/5 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Ingrediente
        </button>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button 
            type="button"
            onClick={onCancel} 
            className="px-4 py-2 text-xs font-bold text-neutral-500 uppercase hover:text-neutral-700"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={() => onSave(items)}
            className="px-6 py-2 bg-brand-wine text-brand-gold text-xs font-black rounded-xl hover:bg-black transition-all shadow-sm"
          >
            SALVAR RECEITA
          </button>
        </div>
      </div>
    </div>
  );
}
