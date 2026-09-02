import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  ChevronRight, 
  Calendar, 
  Clock, 
  CreditCard, 
  Download, 
  MessageSquare, 
  Trash2, 
  Check,
  Star,
  Sparkles
} from 'lucide-react';
import { Timestamp } from '../firebase';
import { cn, formatCurrency } from '../lib/utils';
import { generateOrderPdf } from '../lib/pdfGenerator';
import { QuickReplyModal } from './QuickReplyModal';
import { buildPostSaleReviewMessage } from '../lib/couponHelper';
import { openWhatsAppWithMessage } from '../lib/quickRepliesHelper';

interface AdminOrderCardProps {
  order: any;
  globalSettings?: any;
  onUpdateStatus: (id: string, status: string) => void;
  onDeletePermanent: (id: string) => void;
}

export const AdminOrderCard: React.FC<AdminOrderCardProps> = ({
  order,
  globalSettings,
  onUpdateStatus,
  onDeletePermanent,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isQuickReplyOpen, setIsQuickReplyOpen] = useState(false);
  const isCompleted = order.status === 'completed';
  const isReady = order.status === 'ready';
  const isDeleted = order.status === 'deleted';

  const handleDownloadPdf = () => {
    generateOrderPdf({
      orderDetails: {
        name: order.customerName,
        date: order.date,
        time: order.time,
        paymentMethod: order.paymentMethod,
        changeAmount: order.changeAmount,
        notes: order.notes
      },
      items: order.items,
      total: order.total,
      pixKey: globalSettings?.pixKey || '03972289960',
      pickupAddress: globalSettings?.pickupAddress || 'Avenida Padre Jose Stefanello, n°340',
      contactPhone: globalSettings?.contactPhone || '5544998542446',
      orderNumber: order.id.slice(-6).toUpperCase(),
      isFormalProposal: false
    });
  };

  const handleSendPostSaleReview = () => {
    let targetPhone = order.phone || '';
    if (!targetPhone) {
      const input = prompt("Informe o WhatsApp do cliente para enviar a solicitação de avaliação pós-venda:", "");
      if (!input) return;
      targetPhone = input;
    }

    const msg = buildPostSaleReviewMessage({
      customerName: order.customerName || 'Cliente',
      orderId: order.id,
      template: globalSettings?.postSaleReviewTemplate,
      globalSettings
    });

    openWhatsAppWithMessage(targetPhone, msg);
  };

  return (
    <div className={cn(
      "bg-white rounded-[24px] overflow-hidden border transition-all duration-300",
      isDeleted ? "border-red-100 bg-red-50/20" : (isCompleted ? "opacity-60 border-neutral-100 grayscale-[0.5]" : "border-neutral-100 shadow-sm hover:shadow-md"),
      isReady && !isDeleted && "ring-2 ring-emerald-500/20 border-emerald-500/30 shadow-emerald-100 shadow-lg"
    )}>
      {/* Summary Section */}
      <div className="p-6 flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-serif text-brand-wine italic">{order.customerName}</h3>
            <div className="flex gap-1">
              {order.status === 'pending' && <span className="text-[10px] font-black px-2 py-0.5 bg-brand-gold/10 text-brand-wine rounded-full border border-brand-gold/20">PENDENTE</span>}
              {order.status === 'ready' && <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">PRONTO!</span>}
              {order.status === 'completed' && <span className="text-[10px] font-black px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full border border-neutral-200">ENTREGUE</span>}
              {order.status === 'deleted' && <span className="text-[10px] font-black px-2 py-0.5 bg-red-100 text-red-600 rounded-full border border-red-200">EXCLUÍDO</span>}
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 font-medium">#{order.id.slice(-6).toUpperCase()} {order.deletedAt && `• Excluído em: ${order.deletedAt.toDate().toLocaleDateString('pt-BR')}`}</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-neutral-400 uppercase font-black mb-1">Total</p>
            <p className="text-xl font-black text-brand-wine leading-none">{formatCurrency(order.total)}</p>
          </div>
          
          <button 
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[10px] font-black text-brand-wine hover:text-brand-gold transition-colors uppercase tracking-widest"
          >
            {isExpanded ? 'Esconder' : 'Ver Detalhes'}
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronRight className="w-4 h-4 ml-1 rotate-90" />
            </motion.div>
          </button>
        </div>
      </div>
      
      {/* Expandable Details Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 bg-brand-cream/30 border-t border-brand-wine/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                {/* Items List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-brand-wine uppercase tracking-widest flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Itens do Pedido
                  </h4>
                  <div className="space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-brand-wine/5 last:border-0">
                        <span className="text-neutral-600 font-medium font-serif">
                          <span className="text-brand-wine font-black mr-2 not-italic">{item.quantity}x</span>
                          {item.name}
                        </span>
                        <span className="text-neutral-400 italic text-xs">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logistics & Payment */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-neutral-400 uppercase font-black">Data/Hora</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-wine" />
                        {order.date.split('-').reverse().join('/')}
                      </p>
                      <div className="flex items-center gap-1 pl-4.5">
                        <Clock className="w-3.5 h-3.5 text-brand-wine" />
                        <span className="text-sm font-medium">{order.time}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-neutral-400 uppercase font-black">Pagamento</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-brand-wine" />
                        {order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="p-3 bg-white/80 rounded-xl border border-brand-wine/10 text-xs italic text-neutral-500">
                      <span className="font-bold text-brand-wine not-italic mr-1">Obs:</span> {order.notes}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 justify-end pt-4">
                    {/* Baixar PDF do Pedido */}
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-brand-wine text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 border border-neutral-200 shadow-sm"
                      title="Baixar Pedido/Orçamento em PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-wine" />
                      BAIXAR PDF
                    </button>

                    {/* Resposta Rápida WhatsApp */}
                    <button
                      type="button"
                      onClick={() => setIsQuickReplyOpen(true)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                      title="Enviar Resposta Rápida no WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WHATSAPP RÁPIDO
                    </button>

                    {/* Pedir Avaliação Pós-Venda (WhatsApp) */}
                    <button
                      type="button"
                      onClick={handleSendPostSaleReview}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                      title="Enviar Convite de Avaliação com Link de Feedback no WhatsApp"
                    >
                      <Star className="w-3.5 h-3.5 fill-white" />
                      PEDIR AVALIAÇÃO
                    </button>

                    {/* Normal Actions */}
                    {!isDeleted && (
                      <>
                        <button 
                         type="button"
                         onClick={() => onUpdateStatus(order.id, 'deleted')}
                         className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                         title="Excluir (Mover para Lixeira)"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>

                        {order.status === 'pending' && (
                          <button 
                            type="button"
                            onClick={() => onUpdateStatus(order.id, 'ready')}
                            className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2"
                          >
                            <Check className="w-3 h-3" /> MARCAR COMO PRONTO
                          </button>
                        )}
                        {(order.status === 'pending' || order.status === 'ready') && (
                          <button 
                            type="button"
                            onClick={() => onUpdateStatus(order.id, 'completed')}
                            className="px-4 py-2 bg-brand-wine text-brand-gold text-[10px] font-black rounded-lg shadow-lg shadow-brand-wine/20 hover:bg-black transition-all"
                          >
                            FINALIZAR ENTREGA
                          </button>
                        )}
                      </>
                    )}

                    {/* Trash Actions */}
                    {isDeleted && (
                      <>
                        <button 
                         type="button"
                         onClick={() => onUpdateStatus(order.id, 'pending')}
                         className="px-4 py-2 bg-brand-wine text-white text-[10px] font-black rounded-lg transition-all"
                        >
                          RESTAURAR PEDIDO
                        </button>
                        <button 
                         type="button"
                         onClick={() => onDeletePermanent(order.id)}
                         className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-lg transition-all"
                        >
                          EXCLUIR PERMANENTE
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-neutral-400 font-mono text-center pb-4">
                REGISTRADO EM: {order.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleString('pt-BR') : 'Agora'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Reply Modal */}
      {isQuickReplyOpen && (
        <QuickReplyModal
          isOpen={isQuickReplyOpen}
          onClose={() => setIsQuickReplyOpen(false)}
          order={order}
          customPhrases={globalSettings?.quickReplyPhrases}
          globalSettings={globalSettings}
        />
      )}
    </div>
  );
};
