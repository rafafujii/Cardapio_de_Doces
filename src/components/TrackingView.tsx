import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronRight, 
  Clock, 
  Package, 
  ChefHat, 
  Sparkles, 
  CheckCircle2, 
  BellRing, 
  ChevronDown, 
  MapPin, 
  Store, 
  Bike, 
  MessageSquare,
  ShoppingBag,
  Star
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { OrderRatingCard } from './OrderRatingCard';

interface TrackingViewProps {
  orders: any[];
  onBack: () => void;
  globalSettings?: any;
  onRatingSubmitted?: (orderId: string, rating: number, comment: string) => void;
  highlightOrderId?: string;
}

export const TrackingView: React.FC<TrackingViewProps> = ({ 
  orders, 
  onBack, 
  globalSettings,
  onRatingSubmitted,
  highlightOrderId
}) => {
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending':
        return 20;
      case 'confirmed':
        return 40;
      case 'preparing':
        return 60;
      case 'ready':
        return 85;
      case 'completed':
      case 'delivered':
        return 100;
      default:
        return 20;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Aguardando Confirmação',
          className: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'confirmed':
        return {
          label: 'Confirmado pela Confeitaria',
          className: 'bg-blue-50 text-blue-800 border-blue-200'
        };
      case 'preparing':
        return {
          label: 'Em Preparo na Cozinha',
          className: 'bg-indigo-50 text-indigo-800 border-indigo-200'
        };
      case 'ready':
        return {
          label: 'Pronto para Retirada!',
          className: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black animate-pulse'
        };
      case 'completed':
      case 'delivered':
        return {
          label: 'Pedido Entregue',
          className: 'bg-neutral-100 text-neutral-600 border-neutral-200'
        };
      default:
        return {
          label: status,
          className: 'bg-neutral-100 text-neutral-700 border-neutral-200'
        };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif text-brand-wine italic font-bold">Meus Pedidos</h2>
          <p className="text-neutral-500 text-xs mt-0.5">
            Acompanhe o status de preparo, notificações da confeitaria e retirada em tempo real.
          </p>
        </div>
        <button 
          type="button"
          onClick={onBack}
          className="text-xs font-black text-brand-wine hover:text-brand-gold transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> VOLTAR AO CARDÁPIO
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {orders.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-neutral-200 rounded-[32px] bg-white">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-400 font-serif italic mb-4">Você ainda não fez nenhum pedido neste dispositivo.</p>
            <button 
              type="button"
              onClick={onBack} 
              className="px-6 py-2.5 bg-brand-wine text-brand-gold rounded-full text-xs font-black hover:bg-brand-wine/90 transition-all shadow-md cursor-pointer"
            >
              FAZER MEU PRIMEIRO PEDIDO
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const isExpanded = expandedOrders[order.id] ?? true;
            const progress = getStatusProgress(order.status);
            const badge = getStatusBadge(order.status);
            const isReady = order.status === 'ready';
            const isCompleted = order.status === 'completed' || order.status === 'delivered';
            const isDelivery = order.deliveryType === 'delivery';

            return (
              <div 
                key={order.id} 
                className={cn(
                  "bg-white rounded-[28px] border transition-all overflow-hidden relative shadow-sm",
                  isReady 
                    ? "border-emerald-300 ring-2 ring-emerald-500/20 shadow-emerald-100 shadow-md" 
                    : "border-neutral-200/80"
                )}
              >
                {/* Card Top / Header */}
                <div className="p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest font-mono">
                          PEDIDO #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                          badge.className
                        )}>
                          {badge.label}
                        </span>
                        {isDelivery ? (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Bike className="w-3 h-3" /> Entrega
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Store className="w-3 h-3" /> Retirada
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-serif font-bold text-neutral-900 italic">
                        {order.customerName}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {(order.items || []).length} {order.items?.length === 1 ? 'item' : 'itens'} • {formatCurrency(order.total)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <p className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">Data / Horário</p>
                      <p className="text-sm font-black text-brand-wine">
                        {order.date ? order.date.split('-').reverse().join('/') : 'A combinar'}
                        {order.time && <span className="text-neutral-500 font-normal ml-1">às {order.time}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Visual Progress Line */}
                  <div className="space-y-2 mb-5">
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${progress}%`,
                          backgroundColor: isCompleted ? '#800020' : isReady ? '#059669' : '#D4AF37'
                        }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                      />
                    </div>

                    {/* Progress checkpoints */}
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-neutral-400">
                      <span className={cn(progress >= 20 && "text-brand-wine font-black")}>
                        1. Recebido
                      </span>
                      <span className={cn(progress >= 60 && "text-brand-wine font-black")}>
                        2. Preparando
                      </span>
                      <span className={cn(progress >= 85 && "text-emerald-700 font-black scale-105")}>
                        3. Pronto
                      </span>
                      <span className={cn(progress >= 100 && "text-brand-wine font-black")}>
                        4. Entregue
                      </span>
                    </div>
                  </div>

                  {/* FEATURE: Custom Status Notification Message from Admin */}
                  {(order.customNotificationMessage || isReady) && (
                    <div className={cn(
                      "p-4 rounded-2xl border flex items-start gap-3 transition-all",
                      isReady 
                        ? "bg-emerald-50/90 border-emerald-200/90 shadow-2xs" 
                        : "bg-amber-50/80 border-amber-200/80"
                    )}>
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner mt-0.5",
                        isReady ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                      )}>
                        <BellRing className="w-4 h-4 animate-bounce" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={cn(
                            "text-xs font-black uppercase tracking-wider",
                            isReady ? "text-emerald-950" : "text-amber-950"
                          )}>
                            Notificação da Confeitaria
                          </span>
                          {order.statusNotificationAt && (
                            <span className="text-[10px] text-emerald-700 font-mono bg-emerald-100/70 px-2 py-0.5 rounded-md">
                              Recebido às {order.statusNotificationAt}
                            </span>
                          )}
                        </div>

                        <p className={cn(
                          "text-xs leading-relaxed font-medium",
                          isReady ? "text-emerald-900" : "text-amber-900"
                        )}>
                          "{order.customNotificationMessage || (isDelivery 
                            ? "Seus doces gourmet estão prontos e nosso entregador já está a caminho!" 
                            : "Seus doces gourmet estão fresquinhos e prontos para retirada na confeitaria! 🛍️✨")}"
                        </p>

                        <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
                          {isDelivery ? (
                            <span>🛵 Endereço: {order.deliveryAddress || 'Endereço cadastrado no pedido'}</span>
                          ) : (
                            <span>📍 Retirada: {globalSettings?.pickupAddress || 'Avenida Padre Jose Stefanello, n°340'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FEATURE: Rating & Feedback Component for Delivered Order */}
                  {isCompleted && (
                    <OrderRatingCard
                      order={order}
                      globalSettings={globalSettings}
                      isNewlyDelivered={highlightOrderId === order.id}
                      onRatingSubmitted={(orderId, rating, comment) => {
                        if (onRatingSubmitted) {
                          onRatingSubmitted(orderId, rating, comment);
                        }
                      }}
                    />
                  )}

                  {/* Toggle Items Expand */}
                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleExpand(order.id)}
                      className="text-xs font-black text-brand-wine hover:text-brand-gold transition-colors flex items-center gap-1.5 cursor-pointer py-1"
                    >
                      <Package className="w-3.5 h-3.5" />
                      {isExpanded ? 'Ocultar Detalhes do Pedido' : 'Ver Itens do Pedido'}
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                    </button>

                    {/* Contact Store WhatsApp */}
                    {globalSettings?.contactPhone && (
                      <a
                        href={`https://wa.me/${globalSettings.contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre o meu pedido #${order.id.slice(-6).toUpperCase()} (${order.customerName}).`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" /> Falar com a Confeitaria
                      </a>
                    )}
                  </div>

                  {/* Expanded Items Accordion */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3 animate-in fade-in duration-300">
                      <p className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                        Itens Solicitados
                      </p>
                      <div className="space-y-2">
                        {(order.items || []).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-neutral-50 last:border-0">
                            <span className="text-neutral-700 font-medium">
                              <span className="text-brand-wine font-black mr-2">{item.quantity}x</span>
                              {item.name}
                            </span>
                            <span className="text-neutral-400 font-mono">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className="p-2.5 bg-neutral-50 rounded-xl text-xs text-neutral-600 italic">
                          <span className="font-bold text-brand-wine not-italic mr-1">Observações:</span>
                          {order.notes}
                        </div>
                      )}

                      <div className="pt-2 flex justify-between items-center text-xs font-black text-neutral-800">
                        <span>Total Final</span>
                        <span className="text-brand-wine text-sm font-black">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
