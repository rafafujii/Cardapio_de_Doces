import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { formatCurrency, calculateProductCost } from '../lib/utils';
import type { OrderDetails } from '../types';

interface AdminChartsProps {
  orders: any[];
  productCosts: Record<string, number>;
  ingredients: any[];
  recipes: Record<string, any[]>;
}

export function AdminCharts({ orders, productCosts, ingredients, recipes }: AdminChartsProps) {
  const [chartMode, setChartMode] = useState<'revenue' | 'products'>('revenue');

  // Filter valid completed/active orders
  const validOrders = orders.filter(o => o.status !== 'deleted');

  // Group by date for revenue chart (last 14 days with activity)
  const revenueData = React.useMemo(() => {
    const map: Record<string, { date: string; displayDate: string; revenue: number; profit: number; count: number }> = {};
    
    validOrders.forEach(order => {
      const d = order.date || 'Hoje';
      if (!map[d]) {
        const parts = d.split('-');
        const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
        map[d] = { date: d, displayDate, revenue: 0, profit: 0, count: 0 };
      }
      
      const orderTotal = Number(order.total) || 0;
      map[d].revenue += orderTotal;
      map[d].count += 1;

      // Calculate approximate order cost
      let orderCost = 0;
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const unitCost = calculateProductCost(item.name, productCosts, ingredients, recipes);
          orderCost += unitCost * (item.quantity || 1);
        });
      }
      map[d].profit += Math.max(0, orderTotal - orderCost);
    });

    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  }, [validOrders, productCosts, ingredients, recipes]);

  // Top products sold
  const topProductsData = React.useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};

    validOrders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const name = item.name || 'Outro';
          if (!map[name]) {
            map[name] = { name, quantity: 0, revenue: 0 };
          }
          map[name].quantity += item.quantity || 0;
          map[name].revenue += (item.price || 0) * (item.quantity || 0);
        });
      }
    });

    return Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [validOrders]);

  if (validOrders.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div className="space-y-1">
          <h3 className="text-xl font-serif text-brand-wine italic flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-gold" />
            Análise Gráfica de Desempenho
          </h3>
          <p className="text-xs text-neutral-400">
            Acompanhe o faturamento, volume de vendas e produtos mais pedidos.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartMode('revenue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              chartMode === 'revenue' 
                ? 'bg-white text-brand-wine shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Faturamento & Lucro
          </button>
          <button
            type="button"
            onClick={() => setChartMode('products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              chartMode === 'products' 
                ? 'bg-white text-brand-wine shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Mais Vendidos
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        {chartMode === 'revenue' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#800020" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#800020" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="displayDate" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  formatCurrency(Number(value)),
                  name === 'revenue' ? 'Faturamento' : 'Lucro Estimado'
                ]}
                labelFormatter={(label) => `Data: ${label}`}
                contentStyle={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#800020" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="revenue" />
              <Area type="monotone" dataKey="profit" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" name="profit" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProductsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} width={110} />
              <Tooltip 
                formatter={(value: any) => [`${value} unidades`, 'Total Vendido']}
                contentStyle={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="quantity" fill="#800020" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-neutral-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-brand-wine">
            <span className="w-3 h-3 rounded-full bg-brand-wine inline-block" /> Faturamento
          </span>
          <span className="flex items-center gap-1.5 font-medium text-amber-700">
            <span className="w-3 h-3 rounded-full bg-brand-gold inline-block" /> Lucro Estimado
          </span>
        </div>
        <span className="text-[11px] italic">Atualizado em tempo real com base nos pedidos salvos</span>
      </div>
    </div>
  );
}
