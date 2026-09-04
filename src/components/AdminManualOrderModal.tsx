import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  Check, 
  Send, 
  Download, 
  Sparkles, 
  Store, 
  Bike, 
  ClipboardPen, 
  ShoppingBag, 
  Tag, 
  AlertCircle,
  FileText,
  MessageCircle,
  PackagePlus,
  Layers
} from 'lucide-react';
import { Product, CategoryGroup, ReadyBox } from '../types';
import { formatCurrency, getProductUnitPrice, cn } from '../lib/utils';
import { generateOrderPdf } from '../lib/pdfGenerator';
import { openWhatsAppWithMessage } from '../lib/quickRepliesHelper';

export interface ManualOrderItem {
  id?: string | number;
  name: string;
  quantity: number;
  price: number;
  isUnitItem: boolean;
  isCustom?: boolean;
  notes?: string;
  category?: string;
}

export interface AdminManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CategoryGroup[];
  readyBoxes?: ReadyBox[];
  pastOrders?: any[];
  globalSettings?: any;
  onSubmitManualOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    date: string;
    time: string;
    items: ManualOrderItem[];
    subtotal: number;
    discountAmount: number;
    deliveryFee: number;
    deliveryType: 'pickup' | 'delivery';
    deliveryAddress: string;
    total: number;
    paymentMethod: 'Pix' | 'Dinheiro' | 'Cartão Débito' | 'Cartão Crédito' | 'A Combinar';
    paymentStatus: 'pending' | 'paid';
    changeAmount: string;
    notes: string;
    status: 'pending' | 'preparing' | 'ready' | 'delivered';
    origin: 'WhatsApp' | 'Balcão' | 'Instagram' | 'Telefone' | 'Outro';
  }) => Promise<string | null>; // returns created order ID
}

export function AdminManualOrderModal({
  isOpen,
  onClose,
  catalog,
  readyBoxes = [],
  pastOrders = [],
  globalSettings,
  onSubmitManualOrder
}: AdminManualOrderModalProps) {
  // Client Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [origin, setOrigin] = useState<'WhatsApp' | 'Balcão' | 'Instagram' | 'Telefone' | 'Outro'>('WhatsApp');
  
  // Quick CRM search
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // Delivery & Schedule
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('14:00');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Items
  const [orderItems, setOrderItems] = useState<ManualOrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Custom Item Form
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemNotes, setCustomItemNotes] = useState('');

  // Payment & Status
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Dinheiro' | 'Cartão Débito' | 'Cartão Crédito' | 'A Combinar'>('Pix');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [changeAmount, setChangeAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [orderStatus, setOrderStatus] = useState<'pending' | 'preparing' | 'ready' | 'delivered'>('pending');
  const [notes, setNotes] = useState('');

  // Loading / Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract distinct past clients from past orders for quick autocomplete
  const existingClients = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; address?: string }>();
    pastOrders.forEach(o => {
      const name = (o.customerName || '').trim();
      const phone = (o.customerPhone || o.phone || '').trim();
      if (!name) return;
      const key = phone ? phone.replace(/\D/g, '') : name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name,
          phone,
          address: o.deliveryAddress || ''
        });
      }
    });
    return Array.from(map.values());
  }, [pastOrders]);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return [];
    const query = clientSearch.toLowerCase();
    return existingClients.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
    ).slice(0, 5);
  }, [existingClients, clientSearch]);

  // Flattened catalog items for fast search & category browsing
  const allCatalogProducts = useMemo(() => {
    const list: { product: Product; categoryName: string }[] = [];
    catalog.forEach(cat => {
      cat.items.forEach(prod => {
        list.push({ product: prod, categoryName: cat.category });
      });
    });
    return list;
  }, [catalog]);

  const categories = useMemo(() => {
    return Array.from(new Set(catalog.map(c => c.category))).filter(Boolean);
  }, [catalog]);

  const filteredProducts = useMemo(() => {
    return allCatalogProducts.filter(({ product, categoryName }) => {
      if (selectedCategory !== 'all' && categoryName !== selectedCategory) {
        return false;
      }
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        return product.name.toLowerCase().includes(q) || categoryName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allCatalogProducts, selectedCategory, productSearch]);

  // Calculations
  const subtotal = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [orderItems]);

  const finalTotal = useMemo(() => {
    const base = subtotal + (deliveryType === 'delivery' ? (deliveryFee || 0) : 0);
    return Math.max(0, base - (discountAmount || 0));
  }, [subtotal, deliveryType, deliveryFee, discountAmount]);

  // Item Handlers
  const handleAddCatalogProduct = (product: Product, isUnit: boolean) => {
    const price = isUnit 
      ? getProductUnitPrice(product)
      : (product.priceCento ? product.priceCento : getProductUnitPrice(product) * 100);
    
    const itemKey = `${product.name}__${isUnit ? 'unit' : 'cento'}`;
    const displayName = isUnit 
      ? product.name 
      : `${product.name} (Cento - 100 un)`;

    setOrderItems(prev => {
      const existingIdx = prev.findIndex(i => (i.id === itemKey || i.name === displayName));
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [...prev, {
          id: itemKey,
          name: displayName,
          quantity: 1,
          price,
          isUnitItem: isUnit,
          category: product.category
        }];
      }
    });
  };

  const handleAddReadyBox = (box: ReadyBox) => {
    const itemKey = `box_${box.id}`;
    const displayName = `🎁 ${box.title} (${box.itemsCount} doces)`;

    setOrderItems(prev => {
      const existingIdx = prev.findIndex(i => i.id === itemKey);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [...prev, {
          id: itemKey,
          name: displayName,
          quantity: 1,
          price: box.price,
          isUnitItem: true,
          notes: 'Pronta Entrega / Doces de Hoje'
        }];
      }
    });
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) {
      alert('Informe o nome do item avulso ou especial.');
      return;
    }
    const priceNum = parseFloat(customItemPrice.replace(',', '.')) || 0;
    if (priceNum <= 0) {
      alert('Informe um valor válido para o item.');
      return;
    }

    setOrderItems(prev => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        name: customItemName.trim(),
        quantity: Math.max(1, customItemQty),
        price: priceNum,
        isUnitItem: true,
        isCustom: true,
        notes: customItemNotes.trim()
      }
    ]);

    setCustomItemName('');
    setCustomItemQty(1);
    setCustomItemPrice('');
    setCustomItemNotes('');
    setShowCustomItemForm(false);
  };

  const handleUpdateItemQuantity = (index: number, delta: number) => {
    setOrderItems(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    setOrderItems(prev => {
      const updated = [...prev];
      updated[index].price = Math.max(0, newPrice);
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  // Client Autocomplete Selection
  const handleSelectClient = (client: { name: string; phone: string; address?: string }) => {
    setCustomerName(client.name);
    setCustomerPhone(client.phone);
    if (client.address && deliveryType === 'delivery' && !deliveryAddress) {
      setDeliveryAddress(client.address);
    }
    setShowClientSuggestions(false);
    setClientSearch('');
  };

  // Build WhatsApp receipt text
  const buildManualOrderWhatsAppMessage = (orderId: string) => {
    const formattedDate = date ? date.split('-').reverse().join('/') : '';
    const shortOrder = orderId ? orderId.slice(-6).toUpperCase() : 'NOVO';
    
    let itemsText = '';
    orderItems.forEach(i => {
      itemsText += `• ${i.quantity}x ${i.name} — ${formatCurrency(i.price * i.quantity)}\n`;
    });

    const isDelivery = deliveryType === 'delivery';

    return `✨ *PEDIDO CONFIRMADO - S.E DOCES GOURMET* ✨

Olá, *${customerName.trim()}*! Tudo bem? 🧁
Registramos com carinho o seu pedido *#${shortOrder}* em nosso sistema!

📋 *ITENS DO PEDIDO:*
${itemsText}
💵 *Subtotal:* ${formatCurrency(subtotal)}
${isDelivery && deliveryFee > 0 ? `🛵 *Taxa de Entrega:* ${formatCurrency(deliveryFee)}\n` : ''}${discountAmount > 0 ? `🏷️ *Desconto Especial:* -${formatCurrency(discountAmount)}\n` : ''}💰 *VALOR TOTAL: ${formatCurrency(finalTotal)}*

📅 *Data:* ${formattedDate}
⏰ *Horário:* ${time}
📍 *Modalidade:* ${isDelivery ? `Entrega em: ${deliveryAddress}` : `Retirada no local (${globalSettings?.pickupAddress || 'Avenida Padre Jose Stefanello, n°340'})`}
💳 *Forma de Pagamento:* ${paymentMethod} (${paymentStatus === 'paid' ? 'PAGO ✅' : 'A PAGAR ⏳'})${changeAmount && paymentMethod === 'Dinheiro' ? `\n💵 *Troco para:* ${changeAmount}` : ''}${notes ? `\n📝 *Observações:* ${notes}` : ''}

🔑 *Chave PIX:* \`${globalSettings?.pixKey || '03972289960'}\`
(Favorecido: S.E Doces Gourmet)

Muito obrigado pela preferência e confiança! Qualquer dúvida estamos à disposição por aqui! ❤️🍫`;
  };

  // Submission handler
  const handleSubmit = async (actionType: 'save_only' | 'save_and_whatsapp' | 'save_and_pdf') => {
    if (!customerName.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    if (orderItems.length === 0) {
      alert('Adicione pelo menos um doce ou item ao pedido.');
      return;
    }
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      alert('Por favor, informe o endereço de entrega do cliente.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        date,
        time,
        items: orderItems,
        subtotal,
        discountAmount: discountAmount || 0,
        deliveryFee: deliveryType === 'delivery' ? (deliveryFee || 0) : 0,
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress.trim() : '',
        total: finalTotal,
        paymentMethod,
        paymentStatus,
        changeAmount: paymentMethod === 'Dinheiro' ? changeAmount : '',
        notes: notes.trim(),
        status: orderStatus,
        origin
      };

      const createdOrderId = await onSubmitManualOrder(orderData);
      const safeOrderId = createdOrderId || `MAN-${Date.now()}`;

      if (actionType === 'save_and_whatsapp') {
        const msg = buildManualOrderWhatsAppMessage(safeOrderId);
        if (customerPhone.trim()) {
          openWhatsAppWithMessage(customerPhone, msg);
        } else {
          alert('Pedido salvo! Para enviar pelo WhatsApp, lembre-se de preencher o número de telefone do cliente.');
        }
      } else if (actionType === 'save_and_pdf') {
        generateOrderPdf({
          orderDetails: {
            name: customerName.trim(),
            date,
            time,
            paymentMethod: paymentMethod === 'Pix' || paymentMethod === 'Dinheiro' ? paymentMethod : 'Pix',
            changeAmount,
            notes,
            deliveryType,
            deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : undefined,
            deliveryFee: deliveryType === 'delivery' ? deliveryFee : undefined,
            discountAmount
          },
          items: orderItems.map(item => ({
            id: typeof item.id === 'number' ? item.id : 9999,
            category: item.category || 'Manual',
            name: item.name,
            priceCento: item.isUnitItem ? null : item.price,
            unitPrice: item.isUnitItem ? item.price : null,
            imageUrl: '',
            badge: null,
            quantity: item.quantity,
            isUnitItem: item.isUnitItem
          })),
          total: finalTotal,
          pixKey: globalSettings?.pixKey || '03972289960',
          pickupAddress: globalSettings?.pickupAddress || 'Avenida Padre Jose Stefanello, n°340',
          contactPhone: globalSettings?.contactPhone || '5544998542446',
          orderNumber: safeOrderId.slice(-6).toUpperCase(),
          isFormalProposal: false
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Failed to create manual order:', err);
      alert(`Erro ao lançar pedido manual: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-neutral-50 dark:bg-neutral-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden my-auto max-h-[94vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-brand-wine via-[#6a001a] to-brand-wine text-white flex items-center justify-between gap-4 shrink-0 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 sm:p-3 bg-brand-gold/20 text-brand-gold rounded-2xl border border-brand-gold/30 shrink-0">
                <ClipboardPen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-serif italic font-bold text-white">
                    Lançar Pedido Manual
                  </h3>
                  <span className="px-2.5 py-0.5 bg-brand-gold text-brand-wine text-[10px] font-black uppercase rounded-full tracking-wider shadow-2xs">
                    Balcão / WhatsApp / Direto
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5 line-clamp-1">
                  Cadastre pedidos de clientes recebidos por WhatsApp, telefone ou balcão sem passar pelo cardápio.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body with 2-Column Responsive Layout */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (Cols 1-7): Client Info, Delivery, & Item Selection */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Section 1: Dados do Cliente */}
                <div className="p-4 sm:p-5 bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/90 dark:border-neutral-700/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-brand-wine/10 dark:bg-brand-gold/15 text-brand-wine dark:text-brand-gold">
                        <User className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                        1. Dados do Cliente & Origem
                      </h4>
                    </div>
                    
                    {/* Origem */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">Origem:</span>
                      <select
                        value={origin}
                        onChange={(e: any) => setOrigin(e.target.value)}
                        className="text-xs font-bold bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-800 dark:text-neutral-200 outline-hidden transition-colors cursor-pointer"
                      >
                        <option value="WhatsApp">📱 WhatsApp</option>
                        <option value="Balcão">🏪 Balcão / Cozinha</option>
                        <option value="Instagram">📸 Instagram Direct</option>
                        <option value="Telefone">📞 Telefone</option>
                        <option value="Outro">✨ Outro</option>
                      </select>
                    </div>
                  </div>

                  {/* Autocomplete / Search existing customer */}
                  {existingClients.length > 0 && (
                    <div className="relative">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={(e) => {
                            setClientSearch(e.target.value);
                            setShowClientSuggestions(true);
                          }}
                          onFocus={() => setShowClientSuggestions(true)}
                          placeholder="Buscar cliente frequente cadastrado no CRM..."
                          className="w-full pl-8 pr-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-hidden focus:border-brand-wine dark:focus:border-brand-gold transition-colors"
                        />
                      </div>

                      {showClientSuggestions && filteredClients.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                          {filteredClients.map((client, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectClient(client)}
                              className="w-full text-left px-3 py-2 hover:bg-brand-wine/5 dark:hover:bg-brand-wine/20 flex items-center justify-between text-xs transition-colors cursor-pointer"
                            >
                              <div>
                                <span className="font-bold text-neutral-900 dark:text-white">{client.name}</span>
                                {client.address && (
                                  <span className="block text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-xs">{client.address}</span>
                                )}
                              </div>
                              {client.phone && (
                                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                  {client.phone}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Nome do Cliente *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ex: Maria Eduarda Silva"
                        required
                        className="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-hidden focus:ring-2 focus:ring-brand-wine/10 focus:border-brand-wine dark:focus:border-brand-gold transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        WhatsApp / Telefone
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ex: (44) 99854-2446"
                        className="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-hidden focus:ring-2 focus:ring-brand-wine/10 focus:border-brand-wine dark:focus:border-brand-gold transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Agendamento & Entrega */}
                <div className="p-4 sm:p-5 bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/90 dark:border-neutral-700/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-brand-wine/10 dark:bg-brand-gold/15 text-brand-wine dark:text-brand-gold">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                      2. Data, Horário & Retirada/Entrega
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          Data do Pedido
                        </label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setDate(todayStr)}
                            className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 hover:bg-brand-wine hover:text-white dark:bg-neutral-800 dark:hover:bg-brand-wine text-neutral-700 dark:text-neutral-300 rounded-md transition-colors cursor-pointer border border-neutral-200/60 dark:border-neutral-700"
                          >
                            Hoje
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 1);
                              setDate(d.toISOString().split('T')[0]);
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 hover:bg-brand-wine hover:text-white dark:bg-neutral-800 dark:hover:bg-brand-wine text-neutral-700 dark:text-neutral-300 rounded-md transition-colors cursor-pointer border border-neutral-200/60 dark:border-neutral-700"
                          >
                            Amanhã
                          </button>
                        </div>
                      </div>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-hidden focus:ring-2 focus:ring-brand-wine/10 focus:border-brand-wine transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Horário Previsto
                      </label>
                      <input
                        type="text"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        placeholder="Ex: 14:30 ou A Combinar"
                        className="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-hidden focus:ring-2 focus:ring-brand-wine/10 focus:border-brand-wine transition-all"
                      />
                    </div>
                  </div>

                  {/* Modalidade de Entrega */}
                  <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={cn(
                          "py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer",
                          deliveryType === 'pickup'
                            ? "bg-brand-wine text-white border-brand-wine shadow-xs"
                            : "bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
                        )}
                      >
                        <Store className="w-4 h-4" />
                        Retirada no Local
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryType('delivery')}
                        className={cn(
                          "py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer",
                          deliveryType === 'delivery'
                            ? "bg-brand-wine text-white border-brand-wine shadow-xs"
                            : "bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
                        )}
                      >
                        <Bike className="w-4 h-4" />
                        Entrega / Delivery
                      </button>
                    </div>

                    {deliveryType === 'delivery' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 animate-in fade-in">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                            Endereço de Entrega *
                          </label>
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Rua, número, bairro, complemento..."
                            className="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-hidden focus:ring-2 focus:ring-brand-wine/10 focus:border-brand-wine transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                            Taxa de Entrega (R$)
                          </label>
                          <input
                            type="number"
                            step="0.50"
                            min="0"
                            value={deliveryFee || ''}
                            onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                            placeholder="0,00"
                            className="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-hidden focus:ring-2 focus:ring-brand-wine/10 focus:border-brand-wine transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Adicionar Produtos do Cardápio & Itens Especiais */}
                <div className="p-4 sm:p-5 bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/90 dark:border-neutral-700/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-brand-wine/10 dark:bg-brand-gold/15 text-brand-wine dark:text-brand-gold">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                        3. Escolher Doces & Itens do Pedido
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCustomItemForm(prev => !prev)}
                      className="px-2.5 py-1.5 bg-brand-wine/10 hover:bg-brand-wine text-brand-wine hover:text-white dark:bg-brand-gold/15 dark:text-brand-gold dark:hover:bg-brand-gold dark:hover:text-brand-wine border border-brand-wine/20 dark:border-brand-gold/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>{showCustomItemForm ? 'Fechar Item Avulso' : '+ Item Avulso / Especial'}</span>
                    </button>
                  </div>

                  {/* Form for Custom / Special Item */}
                  {showCustomItemForm && (
                    <form onSubmit={handleAddCustomItem} className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          Item Fora do Cardápio (Ex: Bolo de Aniversário, Vela, Embalagem Especial)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={customItemName}
                            onChange={(e) => setCustomItemName(e.target.value)}
                            placeholder="Nome do doce ou produto avulso..."
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-amber-200/90 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-hidden focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="1"
                            value={customItemQty}
                            onChange={(e) => setCustomItemQty(parseInt(e.target.value) || 1)}
                            placeholder="Qtd"
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-amber-200/90 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-hidden focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={customItemPrice}
                            onChange={(e) => setCustomItemPrice(e.target.value)}
                            placeholder="Preço un (R$)"
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-amber-200/90 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-hidden focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customItemNotes}
                          onChange={(e) => setCustomItemNotes(e.target.value)}
                          placeholder="Observações do item (opcional)..."
                          className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-amber-200/90 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-hidden focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-brand-wine hover:bg-[#600018] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                        >
                          Adicionar Item
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Search & Category Filter */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Buscar doce pelo nome (ex: brigadeiro, ninho, pistache)..."
                        className="w-full pl-8 pr-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-hidden focus:ring-2 focus:ring-brand-wine/10 focus:border-brand-wine transition-all"
                      />
                    </div>

                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-hidden transition-all cursor-pointer"
                    >
                      <option value="all">Todas Categorias</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ready boxes quick pills if available */}
                  {readyBoxes.filter(b => b.active && b.quantityAvailable > 0).length > 0 && (
                    <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-800/40 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Doces de Hoje / Pronta Entrega:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {readyBoxes.filter(b => b.active && b.quantityAvailable > 0).map(box => (
                          <button
                            key={box.id}
                            type="button"
                            onClick={() => handleAddReadyBox(box)}
                            className="px-2.5 py-1.5 bg-white dark:bg-neutral-800 hover:border-amber-400 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>{box.title}</span>
                            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(box.price)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products Grid (Fast Click-to-Add) */}
                  <div className="max-h-56 overflow-y-auto pr-1 space-y-1 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {filteredProducts.slice(0, 30).map(({ product, categoryName }) => {
                      const unitPrice = getProductUnitPrice(product);
                      const centoPrice = product.priceCento || (unitPrice * 100);

                      return (
                        <div
                          key={product.id}
                          className="p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-neutral-900 dark:text-white block truncate">
                              {product.name}
                            </span>
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              {categoryName} • Un: {formatCurrency(unitPrice)}{product.priceCento ? ` • Cento: ${formatCurrency(centoPrice)}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Adicionar Unidade */}
                            <button
                              type="button"
                              onClick={() => handleAddCatalogProduct(product, true)}
                              className="px-2.5 py-1.5 bg-neutral-100 hover:bg-brand-wine hover:text-white dark:bg-neutral-800 dark:hover:bg-brand-wine text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Adicionar 1 Unidade"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+1 un</span>
                            </button>

                            {/* Adicionar Cento se existir */}
                            {Boolean(product.priceCento) && (
                              <button
                                type="button"
                                onClick={() => handleAddCatalogProduct(product, false)}
                                className="px-2.5 py-1.5 bg-brand-wine/10 hover:bg-brand-wine text-brand-wine hover:text-white dark:bg-brand-gold/15 dark:text-brand-gold dark:hover:bg-brand-gold dark:hover:text-brand-wine rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                title="Adicionar Cento (100 unidades)"
                              >
                                +Cento
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column (Cols 8-12): Order Summary, Items List, Payment & Actions */}
              <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
                
                {/* Items in Cart / Summary */}
                <div className="p-4 sm:p-5 bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/90 dark:border-neutral-700/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-700">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-brand-wine/10 dark:bg-brand-gold/15 text-brand-wine dark:text-brand-gold">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                        Itens do Pedido ({orderItems.reduce((s, i) => s + i.quantity, 0)})
                      </h4>
                    </div>
                    {orderItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setOrderItems([])}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        Limpar Itens
                      </button>
                    )}
                  </div>

                  {orderItems.length === 0 ? (
                    <div className="py-8 text-center text-neutral-400 space-y-1">
                      <ShoppingBag className="w-8 h-8 mx-auto stroke-[1.2] text-neutral-300 dark:text-neutral-600" />
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">Nenhum item adicionado ainda.</p>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Clique nos doces ao lado ou em '+ Item Avulso'.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 divide-y divide-neutral-100 dark:divide-neutral-800">
                      {orderItems.map((item, index) => (
                        <div key={index} className="pt-2.5 first:pt-0 flex items-start justify-between gap-2.5">
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-neutral-900 dark:text-white text-xs block truncate">
                              {item.name}
                            </span>
                            {item.notes && (
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 italic block">{item.notes}</span>
                            )}
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">Un: R$</span>
                              <input
                                type="number"
                                step="0.10"
                                min="0"
                                value={item.price}
                                onChange={(e) => handleUpdateItemPrice(index, parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-0.5 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 rounded-md text-xs font-mono font-bold text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 text-center outline-hidden"
                                title="Preço unitário editável"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(index, -1)}
                                className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-black font-mono text-neutral-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(index, 1)}
                                className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="text-xs font-black font-mono text-neutral-900 dark:text-white w-16 text-right">
                              {formatCurrency(item.price * item.quantity)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1"
                              title="Remover"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Desconto Manual */}
                  <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between gap-3 p-2 bg-neutral-50/60 dark:bg-neutral-800/30 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-brand-gold" />
                      Desconto Especial (R$):
                    </span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={discountAmount || ''}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="w-24 px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono font-bold text-neutral-900 dark:text-white text-right outline-hidden focus:border-brand-wine"
                    />
                  </div>

                  {/* Financial Totals Breakdown */}
                  <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/70 dark:from-neutral-800 dark:to-neutral-850 p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400 font-medium">
                      <span>Subtotal Itens:</span>
                      <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{formatCurrency(subtotal)}</span>
                    </div>
                    {deliveryType === 'delivery' && (
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400 font-medium">
                        <span>Taxa de Entrega:</span>
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{formatCurrency(deliveryFee)}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                        <span>Desconto Aplicado:</span>
                        <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">VALOR TOTAL:</span>
                      <span className="font-mono text-lg font-black text-brand-wine dark:text-brand-gold">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Pagamento, Status & Observações */}
                <div className="p-4 sm:p-5 bg-white dark:bg-neutral-850 rounded-2xl border border-neutral-200/90 dark:border-neutral-700/80 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-brand-wine/10 dark:bg-brand-gold/15 text-brand-wine dark:text-brand-gold">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                      4. Pagamento & Status
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                        Forma de Pagamento
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e: any) => setPaymentMethod(e.target.value)}
                        className="w-full px-2.5 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-white outline-hidden transition-all cursor-pointer"
                      >
                        <option value="Pix">Pix</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão Débito">Cartão Débito</option>
                        <option value="Cartão Crédito">Cartão Crédito</option>
                        <option value="A Combinar">A Combinar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                        Status do Pagamento
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e: any) => setPaymentStatus(e.target.value)}
                        className={cn(
                          "w-full px-2.5 py-2 border rounded-xl text-xs font-bold outline-hidden transition-all cursor-pointer",
                          paymentStatus === 'paid' 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" 
                            : "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                        )}
                      >
                        <option value="pending">⏳ A Pagar (Pendente)</option>
                        <option value="paid">✅ Já Pago (Confirmado)</option>
                      </select>
                    </div>
                  </div>

                  {paymentMethod === 'Dinheiro' && (
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                        Troco para quanto?
                      </label>
                      <input
                        type="text"
                        value={changeAmount}
                        onChange={(e) => setChangeAmount(e.target.value)}
                        placeholder="Ex: R$ 50,00 ou Não precisa"
                        className="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-hidden focus:border-brand-wine transition-all"
                      />
                    </div>
                  )}

                  {/* Initial Order Status */}
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                      Status Inicial do Pedido na Esteira
                    </label>
                    <select
                      value={orderStatus}
                      onChange={(e: any) => setOrderStatus(e.target.value)}
                      className="w-full px-2.5 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-white outline-hidden transition-all cursor-pointer"
                    >
                      <option value="pending">🟡 Pendente (Aguardando)</option>
                      <option value="preparing">🔵 Em Produção (Cozinha)</option>
                      <option value="ready">🟢 Pronto para Retirada</option>
                      <option value="delivered">🏁 Entregue / Concluído</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                      Observações / Detalhes Especiais
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Ex: Sem amendoim, colocar fita vermelha, cliente vai retirar às 15h..."
                      className="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-hidden focus:border-brand-wine transition-all"
                    />
                  </div>
                </div>

                {/* Final Submission Buttons */}
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Salvar e Enviar WhatsApp */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSubmit('save_and_whatsapp')}
                      className="w-full py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                      title="Salvar no banco e abrir WhatsApp com recibo pronto"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Salvar + WhatsApp</span>
                    </button>

                    {/* Salvar e Gerar PDF */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSubmit('save_and_pdf')}
                      className="w-full py-3 px-3 bg-brand-wine hover:bg-[#600018] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-brand-wine/20 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                      title="Salvar no banco e baixar comprovante PDF"
                    >
                      <Download className="w-4 h-4 text-brand-gold-light" />
                      <span>Salvar + PDF</span>
                    </button>
                  </div>

                  {/* Apenas Salvar Pedido */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmit('save_only')}
                    className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Apenas Salvar no Sistema</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
