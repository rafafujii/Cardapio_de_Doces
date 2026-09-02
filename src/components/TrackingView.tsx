import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

interface TrackingViewProps {
  orders: any[];
  onBack: () => void;
}

export const TrackingView: React.FC<TrackingViewProps> = ({ orders, onBack }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif text-brand-wine italic">Meus Pedidos</h2>
        <button 
          type="button"
          onClick={onBack}
          className="text-xs font-black text-brand-wine hover:text-brand-gold transition-colors flex items-center gap-1"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> VOLTAR AO CARDÁPIO
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {orders.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-neutral-200 rounded-[32px] bg-white">
            <p className="text-neutral-400 font-serif italic mb-4">Você ainda não fez nenhum pedido neste dispositivo.</p>
            <button 
              type="button"
              onClick={onBack} 
              className="px-6 py-2 bg-brand-wine text-brand-gold rounded-full text-xs font-black hover:bg-brand-wine/90 transition-all shadow-md"
            >
              FAZER MEU PRIMEIRO PEDIDO
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[24px] border border-neutral-100 shadow-sm p-6 overflow-hidden relative">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">PEDIDO #{order.id.slice(-6).toUpperCase()}</span>
                    {order.status === 'pending' && <span className="text-[10px] font-black px-3 py-1 bg-brand-gold/10 text-brand-wine rounded-full">AGUARDANDO FINALIZAÇÃO</span>}
                    {order.status === 'ready' && <span className="text-[10px] font-black px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full animate-pulse border border-emerald-200">SEU PEDIDO ESTÁ PRONTO!</span>}
                    {order.status === 'completed' && <span className="text-[10px] font-black px-3 py-1 bg-neutral-100 text-neutral-500 rounded-full">ENTREGUE</span>}
                  </div>
                  <h3 className="text-neutral-800 font-serif italic">{order.items.length} itens • {formatCurrency(order.total)}</h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <p className="text-[10px] text-neutral-400 uppercase font-black">Data de Retirada</p>
                   <p className="text-sm font-black text-brand-wine">{order.date.split('-').reverse().join('/')}</p>
                </div>
              </div>

              <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ 
                    width: order.status === 'pending' ? '33%' : order.status === 'ready' ? '66%' : '100%',
                    backgroundColor: order.status === 'completed' ? '#800020' : '#D4AF37'
                  }}
                  className="h-full"
                />
              </div>
              <div className="flex justify-between text-[8px] font-black text-neutral-400 uppercase tracking-tighter">
                 <span className={cn(order.status === 'pending' && "text-brand-wine")}>Enviado</span>
                 <span className={cn(order.status === 'ready' && "text-emerald-600 scale-110")}>Pronto</span>
                 <span className={cn(order.status === 'completed' && "text-brand-wine")}>Entregue</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
