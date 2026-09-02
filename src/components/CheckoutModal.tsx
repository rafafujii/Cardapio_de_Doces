import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  CreditCard, 
  DollarSign, 
  Info, 
  MessageCircle, 
  Copy, 
  Check, 
  MapPin, 
  AlertCircle,
  Sparkles,
  ShieldCheck,
  FileText,
  Download,
  Bike,
  Store,
  Tag,
  Gift
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn, formatCurrency, getProductUnitPrice } from '../lib/utils';
import { generateOrderPdf } from '../lib/pdfGenerator';
import type { CartItem, OrderDetails } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Record<number, CartItem>;
  cartTotal: number;
  contactPhone: string;
  pixKey: string;
  pickupAddress: string;
  minNoticeHours?: number;
  blockedDates?: string[];
  deliveryMode?: 'pickup_only' | 'delivery_and_pickup';
  deliveryFeeType?: 'fixed' | 'to_consult';
  deliveryFixedFee?: number;
  freeDeliveryThreshold?: number;
  enableVolumeDiscount?: boolean;
  volumeDiscountMinItems?: number;
  volumeDiscountPercent?: number;
  volumeDiscountMessage?: string;
  customWhatsAppTemplate?: string;
  onOrderCompleted: (orderDetails: OrderDetails) => void;
}

const POPULAR_TIME_SLOTS = ["10:00", "11:30", "13:30", "15:00", "16:30", "18:00"];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  cartTotal,
  contactPhone,
  pixKey,
  pickupAddress,
  minNoticeHours = 48,
  blockedDates = [],
  deliveryMode = 'pickup_only',
  deliveryFeeType = 'fixed',
  deliveryFixedFee = 10,
  freeDeliveryThreshold = 0,
  enableVolumeDiscount = false,
  volumeDiscountMinItems = 100,
  volumeDiscountPercent = 5,
  volumeDiscountMessage = '',
  customWhatsAppTemplate,
  onOrderCompleted
}) => {
  // Calculate earliest available date based on admin minNoticeHours
  const minAllowedDate = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() + (minNoticeHours || 48));
    return d.toISOString().split('T')[0];
  }, [minNoticeHours]);

  const [details, setDetails] = useState<OrderDetails>({
    name: localStorage.getItem('docesGourmetName') || '',
    date: minAllowedDate,
    time: '14:00',
    paymentMethod: 'Pix',
    changeAmount: '',
    notes: '',
    deliveryType: 'pickup',
    deliveryAddress: localStorage.getItem('docesGourmetAddress') || '',
    deliveryFee: 0,
    discountAmount: 0
  });

  const [errors, setErrors] = useState<{ name?: string; date?: string; time?: string; deliveryAddress?: string }>({});
  const [copiedPix, setCopiedPix] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Total quantity of items for volume discount calculation
  const totalQuantity = useMemo(() => {
    return (Object.values(cart) as CartItem[]).reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Volume discount calculation (Item 3)
  const isVolumeDiscountApplicable = useMemo(() => {
    return Boolean(
      enableVolumeDiscount && 
      totalQuantity >= (volumeDiscountMinItems || 100) && 
      (volumeDiscountPercent || 0) > 0
    );
  }, [enableVolumeDiscount, totalQuantity, volumeDiscountMinItems, volumeDiscountPercent]);

  const discountAmount = useMemo(() => {
    if (!isVolumeDiscountApplicable) return 0;
    return (cartTotal * (volumeDiscountPercent || 0)) / 100;
  }, [isVolumeDiscountApplicable, cartTotal, volumeDiscountPercent]);

  // Delivery fee calculation (Item 2)
  const isFreeDelivery = useMemo(() => {
    if (details.deliveryType !== 'delivery') return false;
    return freeDeliveryThreshold > 0 && (cartTotal - discountAmount) >= freeDeliveryThreshold;
  }, [details.deliveryType, freeDeliveryThreshold, cartTotal, discountAmount]);

  const currentDeliveryFee = useMemo(() => {
    if (details.deliveryType !== 'delivery' || deliveryMode === 'pickup_only') return 0;
    if (isFreeDelivery) return 0;
    if (deliveryFeeType === 'fixed') return Number(deliveryFixedFee) || 0;
    return 0; // 'to_consult'
  }, [details.deliveryType, deliveryMode, isFreeDelivery, deliveryFeeType, deliveryFixedFee]);

  const finalTotal = useMemo(() => {
    return Math.max(0, cartTotal - discountAmount + currentDeliveryFee);
  }, [cartTotal, discountAmount, currentDeliveryFee]);

  if (!isOpen) return null;

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey || "03972289960");
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleDownloadPdf = () => {
    const itemsList = Object.values(cart) as CartItem[];
    generateOrderPdf({
      orderDetails: {
        ...details,
        deliveryFee: currentDeliveryFee,
        discountAmount
      },
      items: itemsList,
      total: finalTotal,
      pixKey,
      pickupAddress,
      contactPhone,
      isFormalProposal: true
    });
  };

  const handleValidationAndSend = () => {
    const newErrors: { name?: string; date?: string; time?: string; deliveryAddress?: string } = {};

    if (!details.name.trim()) {
      newErrors.name = 'Por favor, informe seu nome completo.';
    }

    if (details.deliveryType === 'delivery' && deliveryMode === 'delivery_and_pickup') {
      if (!details.deliveryAddress?.trim()) {
        newErrors.deliveryAddress = 'Por favor, informe o endereço completo para entrega com número e bairro.';
      }
    }

    if (!details.date) {
      newErrors.date = 'Selecione o dia do pedido.';
    } else {
      // Validate min notice hours
      const selectedTime = new Date(`${details.date}T${details.time || '12:00'}:00`);
      const now = new Date();
      const diffHours = (selectedTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < (minNoticeHours || 48)) {
        newErrors.date = `Necessário no mínimo ${minNoticeHours}h de antecedência para preparo artesanal fresco.`;
      } else if (blockedDates.includes(details.date)) {
        newErrors.date = 'Esta data não está disponível para encomendas (agenda esgotada ou recesso).';
      }
    }

    if (!details.time) {
      newErrors.time = 'Escolha o horário desejado.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    // Save for convenience
    localStorage.setItem('docesGourmetName', details.name);
    if (details.deliveryAddress) {
      localStorage.setItem('docesGourmetAddress', details.deliveryAddress);
    }

    // Fire Confetti
    confetti({
      particleCount: 160,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#800020', '#D4AF37', '#ffffff', '#F3E5AB']
    });

    onOrderCompleted({
      ...details,
      deliveryFee: currentDeliveryFee,
      discountAmount
    });
    setIsSubmitting(false);
  };

  const itemsList = Object.values(cart) as CartItem[];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 border border-neutral-100"
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-neutral-100">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold block">
              Finalização do Pedido
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold italic text-brand-wine">
              Agendamento & Envio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 rounded-full transition-colors shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          
          {/* Volume Discount Alert Banner (Item 3) */}
          {isVolumeDiscountApplicable && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border border-amber-400/40 rounded-2xl flex items-center gap-3 text-amber-900 shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Tag className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Desconto por Volume Aplicado ({volumeDiscountPercent}%)!
                </p>
                <p className="text-[11px] text-amber-800">
                  {volumeDiscountMessage || `Você atingiu ${totalQuantity} unidades e ganhou ${formatCurrency(discountAmount)} de desconto especial!`}
                </p>
              </div>
            </motion.div>
          )}

          {/* Delivery Mode Toggle (Item 2: Somente Retirada vs Retirada & Entrega) */}
          {deliveryMode === 'delivery_and_pickup' ? (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                <Bike className="w-3.5 h-3.5 text-brand-wine" />
                Como deseja receber seu pedido? *
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDetails((prev) => ({ ...prev, deliveryType: 'pickup' }))}
                  className={cn(
                    "p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-all text-center",
                    details.deliveryType === 'pickup'
                      ? "bg-brand-wine text-brand-gold border-brand-wine shadow-md"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                  )}
                >
                  <Store className="w-5 h-5" />
                  <span>Retirada no Local</span>
                  <span className="text-[10px] font-normal opacity-90">Grátis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetails((prev) => ({ ...prev, deliveryType: 'delivery' }))}
                  className={cn(
                    "p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-all text-center",
                    details.deliveryType === 'delivery'
                      ? "bg-brand-wine text-brand-gold border-brand-wine shadow-md"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                  )}
                >
                  <Bike className="w-5 h-5" />
                  <span>Entrega / Delivery</span>
                  <span className="text-[10px] font-normal opacity-90">
                    {isFreeDelivery 
                      ? "Frete Grátis 🎉" 
                      : deliveryFeeType === 'fixed' 
                        ? `+ ${formatCurrency(deliveryFixedFee)}` 
                        : "Taxa a combinar"}
                  </span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Pickup Address Alert OR Delivery Address Input */}
          {details.deliveryType === 'pickup' || deliveryMode === 'pickup_only' ? (
            <div className="p-4 bg-brand-cream/80 border-l-4 border-brand-wine rounded-r-2xl space-y-1 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-brand-wine font-bold">
                <MapPin className="w-4 h-4 text-brand-wine shrink-0" />
                <span>LOCAL DE RETIRADA</span>
              </div>
              <p className="text-neutral-700 font-medium">
                {pickupAddress || "Avenida Padre Jose Stefanello, n°340"}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                <MapPin className="w-3.5 h-3.5 text-brand-wine" />
                Endereço de Entrega (Rua, Número, Bairro, Complemento) *
              </label>
              <input
                type="text"
                placeholder="Ex: Rua das Flores, 123, Apto 402 - Jardim Central"
                className={cn(
                  "w-full p-3.5 bg-neutral-50 border rounded-2xl focus:outline-none transition-all text-sm",
                  errors.deliveryAddress
                    ? "border-red-500 ring-2 ring-red-100"
                    : "border-neutral-200 focus:border-brand-wine focus:ring-2 focus:ring-brand-wine/10"
                )}
                value={details.deliveryAddress || ''}
                onChange={(e) => {
                  setDetails((prev) => ({ ...prev, deliveryAddress: e.target.value }));
                  if (errors.deliveryAddress) setErrors((prev) => ({ ...prev, deliveryAddress: undefined }));
                }}
              />
              {errors.deliveryAddress && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium pl-1">
                  <AlertCircle className="w-3 h-3" /> {errors.deliveryAddress}
                </p>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Customer Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                <User className="w-3.5 h-3.5 text-brand-wine" />
                Seu Nome Completo *
              </label>
              <input
                type="text"
                placeholder="Ex: Maria Eduarda Silva"
                className={cn(
                  "w-full p-3.5 bg-neutral-50 border rounded-2xl focus:outline-none transition-all text-sm",
                  errors.name
                    ? "border-red-500 ring-2 ring-red-100"
                    : "border-neutral-200 focus:border-brand-wine focus:ring-2 focus:ring-brand-wine/10"
                )}
                value={details.name}
                onChange={(e) => {
                  setDetails((prev) => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
              />
              {errors.name && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium pl-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <Calendar className="w-3.5 h-3.5 text-brand-wine" />
                  Data da {details.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'} *
                </label>
                <span className="text-[10px] font-bold text-brand-wine bg-brand-wine/10 px-2 py-0.5 rounded-full">
                  Min. {minNoticeHours}h antecedência
                </span>
              </div>
              <input
                type="date"
                min={minAllowedDate}
                className={cn(
                  "w-full p-3.5 bg-neutral-50 border rounded-2xl focus:outline-none transition-all text-sm",
                  errors.date
                    ? "border-red-500 ring-2 ring-red-100"
                    : "border-neutral-200 focus:border-brand-wine focus:ring-2 focus:ring-brand-wine/10"
                )}
                value={details.date}
                onChange={(e) => {
                  setDetails((prev) => ({ ...prev, date: e.target.value }));
                  if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                }}
              />
              {errors.date ? (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium pl-1">
                  <AlertCircle className="w-3 h-3" /> {errors.date}
                </p>
              ) : (
                <p className="text-[11px] text-neutral-400 pl-1">
                  💡 Pedidos preparados artesanalmente sob encomenda (mínimo de {minNoticeHours}h de antecedência).
                </p>
              )}
            </div>

            {/* Time Picker & Quick Slots */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                <Clock className="w-3.5 h-3.5 text-brand-wine" />
                Horário da {details.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'} *
              </label>

              {/* Quick Slots */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {POPULAR_TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setDetails((prev) => ({ ...prev, time: slot }));
                      if (errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border",
                      details.time === slot
                        ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                        : "bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200"
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              <input
                type="time"
                className={cn(
                  "w-full p-3.5 bg-neutral-50 border rounded-2xl focus:outline-none transition-all text-sm",
                  errors.time
                    ? "border-red-500 ring-2 ring-red-100"
                    : "border-neutral-200 focus:border-brand-wine focus:ring-2 focus:ring-brand-wine/10"
                )}
                value={details.time}
                onChange={(e) => {
                  setDetails((prev) => ({ ...prev, time: e.target.value }));
                  if (errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
                }}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                <CreditCard className="w-3.5 h-3.5 text-brand-wine" />
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDetails((prev) => ({ ...prev, paymentMethod: 'Pix' }))}
                  className={cn(
                    "p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all",
                    details.paymentMethod === 'Pix'
                      ? "bg-brand-wine text-brand-gold border-brand-wine shadow-md"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  PIX (Instantâneo)
                </button>

                <button
                  type="button"
                  onClick={() => setDetails((prev) => ({ ...prev, paymentMethod: 'Dinheiro' }))}
                  className={cn(
                    "p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all",
                    details.paymentMethod === 'Dinheiro'
                      ? "bg-brand-wine text-brand-gold border-brand-wine shadow-md"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                  )}
                >
                  <DollarSign className="w-4 h-4" />
                  Dinheiro
                </button>
              </div>
            </div>

            {/* Pix Instructions Card */}
            {details.paymentMethod === 'Pix' && (
              <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Chave PIX (CPF)
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Chave Oficial
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs sm:text-sm font-bold text-neutral-800 truncate">
                    {pixKey || "039.722.899-60"}
                  </span>
                  <button
                    type="button"
                    onClick={copyPixKey}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                      copiedPix
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    )}
                  >
                    {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPix ? "COPIADO!" : "COPIAR"}
                  </button>
                </div>

                <p className="text-[11px] text-emerald-700 leading-tight">
                  📸 <strong>Dica:</strong> Após enviar o pedido no WhatsApp, envie o comprovante Pix na mesma conversa para confirmar a reserva.
                </p>
              </div>
            )}

            {/* Cash change option */}
            {details.paymentMethod === 'Dinheiro' && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <DollarSign className="w-3.5 h-3.5 text-brand-wine" />
                  Troco para quanto? (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 50, 100 (ou deixe em branco se não precisar)"
                  className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-brand-wine focus:outline-none text-sm"
                  value={details.changeAmount}
                  onChange={(e) => setDetails((prev) => ({ ...prev, changeAmount: e.target.value }))}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                <Info className="w-3.5 h-3.5 text-brand-wine" />
                Observações ou Preferências (Opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Embalagem para presente, sem granulado, etc..."
                className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:border-brand-wine focus:outline-none text-sm resize-none"
                value={details.notes}
                onChange={(e) => setDetails((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          {/* Items Summary & Financial Breakdown */}
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
              Resumo do Pedido ({itemsList.length} {itemsList.length === 1 ? 'item' : 'itens'})
            </span>
            <div className="max-h-28 overflow-y-auto space-y-1 text-xs text-neutral-600">
              {itemsList.map((item) => {
                const price = getProductUnitPrice(item);
                return (
                  <div key={item.id} className="flex justify-between py-0.5">
                    <span className="truncate max-w-[70%]">
                      • {item.quantity} un - {item.name}
                    </span>
                    <span className="font-semibold text-neutral-800">
                      {formatCurrency(price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-neutral-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal dos Produtos</span>
                <span className="font-medium text-neutral-800">{formatCurrency(cartTotal)}</span>
              </div>

              {isVolumeDiscountApplicable && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-emerald-600" />
                    Desconto por Volume ({volumeDiscountPercent}%)
                  </span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}

              {details.deliveryType === 'delivery' && (
                <div className="flex justify-between text-neutral-600">
                  <span>Taxa de Entrega</span>
                  <span className={isFreeDelivery ? "font-bold text-emerald-700" : "font-medium text-neutral-800"}>
                    {isFreeDelivery 
                      ? "Grátis 🎉" 
                      : deliveryFeeType === 'fixed' 
                        ? formatCurrency(currentDeliveryFee) 
                        : "A combinar no WhatsApp"}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-sm font-black text-brand-wine">
                <span>TOTAL A PAGAR</span>
                <span className="text-base">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Submit & PDF Buttons */}
        <div className="p-5 bg-neutral-50 border-t border-neutral-200 space-y-2.5">
          <button
            onClick={handleValidationAndSend}
            disabled={isSubmitting}
            className="w-full py-4 bg-brand-wine hover:bg-[#68001a] text-brand-gold font-black rounded-2xl flex items-center justify-center gap-2.5 text-sm shadow-xl shadow-brand-wine/25 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <MessageCircle className="w-5 h-5" />
            ENVIAR PEDIDO VIA WHATSAPP ({formatCurrency(finalTotal)})
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-full py-3 bg-white hover:bg-neutral-100 text-brand-wine font-bold border border-brand-wine/20 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all"
          >
            <Download className="w-4 h-4 text-brand-gold" />
            BAIXAR ORÇAMENTO FORMAL EM PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
};
