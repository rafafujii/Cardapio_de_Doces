import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Flame, Clock, Sparkles, Check, Package, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { ReadyBox } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface AdminReadyBoxesTabProps {
  readyBoxes: ReadyBox[];
  onSaveBox: (box: Partial<ReadyBox> & { id?: string }) => Promise<void>;
  onDeleteBox: (id: string) => Promise<void>;
  onUpdateQuantity: (id: string, newQuantity: number) => Promise<void>;
  onToggleActive: (id: string, currentActive: boolean) => Promise<void>;
}

export function AdminReadyBoxesTab({
  readyBoxes = [],
  onSaveBox,
  onDeleteBox,
  onUpdateQuantity,
  onToggleActive
}: AdminReadyBoxesTabProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingBox, setEditingBox] = useState<ReadyBox | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemsCount, setItemsCount] = useState<number>(6);
  const [price, setPrice] = useState<number>(28);
  const [originalPrice, setOriginalPrice] = useState<number>(32);
  const [quantityAvailable, setQuantityAvailable] = useState<number>(3);
  const [pickupUntilTime, setPickupUntilTime] = useState('Retirada hoje até às 19:30');
  const [badgeText, setBadgeText] = useState('🔥 Fornada Fresca de Hoje');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startNew = () => {
    setEditingBox(null);
    setTitle('Caixa Mista Gourmet de Hoje');
    setDescription('2 Ninho c/ Nutella, 2 Pistache, 2 Brigadeiro Belga');
    setItemsCount(6);
    setPrice(28);
    setOriginalPrice(32);
    setQuantityAvailable(3);
    setPickupUntilTime('Retirada hoje até às 19:30');
    setBadgeText('🔥 Fornada Fresca de Hoje');
    setIsCreating(true);
  };

  const startEdit = (box: ReadyBox) => {
    setEditingBox(box);
    setTitle(box.title);
    setDescription(box.description);
    setItemsCount(box.itemsCount);
    setPrice(box.price);
    setOriginalPrice(box.originalPrice || box.price);
    setQuantityAvailable(box.quantityAvailable);
    setPickupUntilTime(box.pickupUntilTime || 'Retirada hoje até às 19:30');
    setBadgeText(box.badgeText || '🔥 Fornada Fresca de Hoje');
    setIsCreating(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Por favor, preencha o título e os sabores da caixinha.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveBox({
        id: editingBox ? editingBox.id : undefined,
        title: title.trim(),
        description: description.trim(),
        itemsCount: Number(itemsCount) || 6,
        price: Number(price) || 0,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        quantityAvailable: Math.max(0, Number(quantityAvailable) || 0),
        pickupUntilTime: pickupUntilTime.trim(),
        badgeText: badgeText.trim(),
        active: true
      });
      setIsCreating(false);
      setEditingBox(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar caixinha de pronta entrega.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-neutral-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-serif text-brand-wine italic font-bold">
              Doces de Hoje / Pronta Entrega
            </h3>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-black text-[9px] rounded-full uppercase flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current text-amber-600" />
              Sobras & Excedentes de Produção
            </span>
          </div>
          <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
            Cadastre caixinhas prontas para venda imediata quando sobrar massa fresca na cozinha. O cliente compra sem a trava de 48h e você transforma excedente em dinheiro vivo no caixa!
          </p>
        </div>

        <button
          type="button"
          onClick={startNew}
          className="px-5 py-2.5 bg-gradient-to-r from-brand-wine to-neutral-900 hover:from-black hover:to-brand-wine text-brand-gold rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Caixa Pronta do Dia
        </button>
      </div>

      {/* Creation / Edit Form Modal or Box */}
      {isCreating && (
        <form onSubmit={handleSave} className="bg-amber-50/50 p-6 sm:p-8 rounded-[32px] border-2 border-amber-300 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-amber-200 pb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-600" />
              <h4 className="font-serif italic font-bold text-lg text-brand-wine">
                {editingBox ? 'Editar Caixa de Pronta Entrega' : 'Cadastrar Caixinha Pronta de Hoje'}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => { setIsCreating(false); setEditingBox(null); }}
              className="text-xs text-neutral-400 hover:text-neutral-700 font-bold uppercase tracking-wider"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Título da Caixinha
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Caixa Especial de Sobra do Dia (6 un)"
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine outline-none shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Selo / Badge Chamativa
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="Ex: 🔥 3 Caixas Disponíveis"
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine outline-none shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Sabores Inclusos na Caixa
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: 2 Ninho com Nutella, 2 Pistache Nobre e 2 Belga Tradicional"
              className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine outline-none shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Qtd de Doces na Caixa
              </label>
              <input
                type="number"
                value={itemsCount}
                onChange={(e) => setItemsCount(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-center outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Preço Promocional (R$)
              </label>
              <input
                type="number"
                step="0.50"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-white border border-brand-gold rounded-xl text-xs font-black text-brand-wine text-center outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Preço Normal De (R$)
              </label>
              <input
                type="number"
                step="0.50"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-medium text-neutral-400 text-center outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Caixinhas em Estoque
              </label>
              <input
                type="number"
                value={quantityAvailable}
                onChange={(e) => setQuantityAvailable(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-black text-emerald-700 text-center outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Horário Limite de Retirada de Hoje
            </label>
            <input
              type="text"
              value={pickupUntilTime}
              onChange={(e) => setPickupUntilTime(e.target.value)}
              placeholder="Ex: Retirada hoje até às 19:30"
              className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine outline-none shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setIsCreating(false); setEditingBox(null); }}
              className="px-4 py-2 rounded-xl text-neutral-400 hover:text-neutral-700 text-xs font-black uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Salvando...' : 'Publicar Pronta Entrega'}
            </button>
          </div>
        </form>
      )}

      {/* Boxes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {readyBoxes.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-[32px] border-2 border-dashed border-neutral-200">
            <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="font-serif italic text-neutral-500">Nenhuma caixinha de pronta entrega cadastrada no momento.</p>
            <p className="text-xs text-neutral-400 mt-1">Clique no botão acima para disponibilizar sobras de produção do dia.</p>
          </div>
        ) : (
          readyBoxes.map((box) => (
            <div
              key={box.id}
              className={cn(
                "bg-white rounded-[28px] border p-6 flex flex-col justify-between shadow-sm transition-all space-y-4",
                box.active && box.quantityAvailable > 0 ? "border-amber-200 hover:shadow-md" : "border-neutral-100 opacity-60 bg-neutral-50/50"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                    box.active && box.quantityAvailable > 0 ? "bg-amber-100 text-amber-800" : "bg-neutral-200 text-neutral-500"
                  )}>
                    {box.active && box.quantityAvailable > 0 ? '🟢 Ativa na Loja' : '⏸️ Pausada / Esgotada'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleActive(box.id, box.active)}
                      className="p-1.5 text-neutral-400 hover:text-brand-wine rounded-lg transition-colors"
                      title={box.active ? "Pausar exibição" : "Ativar exibição"}
                    >
                      {box.active ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-neutral-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(box)}
                      className="p-1.5 text-neutral-400 hover:text-brand-wine rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteBox(box.id)}
                      className="p-1.5 text-neutral-300 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="font-serif italic font-bold text-neutral-800 text-base">{box.title}</h4>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{box.description}</p>
                <p className="text-[10px] text-amber-800 font-bold mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  {box.pickupUntilTime || 'Retirada hoje'}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase font-black text-neutral-400">Preço</p>
                  <p className="text-lg font-black text-brand-wine leading-tight">
                    {formatCurrency(box.price)}
                  </p>
                </div>

                {/* Quick Stock Buttons */}
                <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(box.id, Math.max(0, box.quantityAvailable - 1))}
                    className="w-6 h-6 rounded-lg bg-white text-neutral-700 font-black text-xs hover:bg-neutral-200 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xs font-black px-1 text-neutral-800">
                    {box.quantityAvailable} un
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(box.id, box.quantityAvailable + 1)}
                    className="w-6 h-6 rounded-lg bg-white text-neutral-700 font-black text-xs hover:bg-neutral-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
