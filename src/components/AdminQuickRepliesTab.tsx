import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Edit3, RotateCcw, Check, Sparkles, Send, Copy } from 'lucide-react';
import { QuickReplyPhrase } from '../types';
import { DEFAULT_QUICK_REPLIES, formatQuickReply, openWhatsAppWithMessage } from '../lib/quickRepliesHelper';

interface AdminQuickRepliesTabProps {
  settings: any;
  onSaveSettings: (newSettings: any) => void;
}

export function AdminQuickRepliesTab({ settings, onSaveSettings }: AdminQuickRepliesTabProps) {
  const currentPhrases: QuickReplyPhrase[] = settings?.quickReplyPhrases?.length
    ? settings.quickReplyPhrases
    : DEFAULT_QUICK_REPLIES;

  const [phrases, setPhrases] = useState<QuickReplyPhrase[]>(currentPhrases);
  const [editingPhrase, setEditingPhrase] = useState<QuickReplyPhrase | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<QuickReplyPhrase['category']>('geral');
  const [newTemplate, setNewTemplate] = useState('');
  const [testPhone, setTestPhone] = useState(settings?.contactPhone || '5544998542446');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSavePhrase = () => {
    if (!newTitle.trim() || !newTemplate.trim()) {
      alert('Por favor, preencha o título e o texto da mensagem.');
      return;
    }

    let updatedList: QuickReplyPhrase[];
    if (editingPhrase) {
      updatedList = phrases.map(p => p.id === editingPhrase.id ? {
        ...p,
        title: newTitle.trim(),
        category: newCategory,
        template: newTemplate.trim()
      } : p);
    } else {
      const newPhrase: QuickReplyPhrase = {
        id: `qr-custom-${Date.now()}`,
        title: newTitle.trim(),
        category: newCategory,
        template: newTemplate.trim(),
        isDefault: false
      };
      updatedList = [...phrases, newPhrase];
    }

    setPhrases(updatedList);
    onSaveSettings({
      ...settings,
      quickReplyPhrases: updatedList
    });

    setIsCreating(false);
    setEditingPhrase(null);
    setNewTitle('');
    setNewTemplate('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDeletePhrase = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta resposta rápida?')) return;
    const updatedList = phrases.filter(p => p.id !== id);
    setPhrases(updatedList);
    onSaveSettings({
      ...settings,
      quickReplyPhrases: updatedList
    });
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Deseja restaurar todas as respostas rápidas para o padrão de fábrica?')) return;
    setPhrases(DEFAULT_QUICK_REPLIES);
    onSaveSettings({
      ...settings,
      quickReplyPhrases: DEFAULT_QUICK_REPLIES
    });
  };

  const startEdit = (phrase: QuickReplyPhrase) => {
    setEditingPhrase(phrase);
    setNewTitle(phrase.title);
    setNewCategory(phrase.category);
    setNewTemplate(phrase.template);
    setIsCreating(true);
  };

  const startNew = () => {
    setEditingPhrase(null);
    setNewTitle('');
    setNewCategory('geral');
    setNewTemplate('Olá {nome}! Tudo bem? ✨\n\n');
    setIsCreating(true);
  };

  const insertVariable = (tag: string) => {
    setNewTemplate(prev => prev + tag);
  };

  const handleCopyExample = (phrase: QuickReplyPhrase) => {
    const formatted = formatQuickReply(phrase.template, {
      customerName: 'Mariana Silva',
      orderNumber: 'A89F2',
      itemsSummary: '20x Ninho com Nutella, 20x Pistache',
      totalAmount: 'R$ 145,00',
      pickupDate: '15/10/2026',
      pickupTime: '14:30',
      pickupAddress: settings?.pickupAddress || 'Avenida Padre Jose Stefanello, n°340',
      pixKey: settings?.pixKey || '03972289960'
    });
    navigator.clipboard.writeText(formatted);
    setCopiedId(phrase.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestWhatsApp = (phrase: QuickReplyPhrase) => {
    const formatted = formatQuickReply(phrase.template, {
      customerName: 'Cliente Teste',
      orderNumber: 'TESTE01',
      itemsSummary: '10x Brigadeiro Belga, 10x Ninho com Nutella',
      totalAmount: 'R$ 75,00',
      pickupDate: 'Hoje',
      pickupTime: '17:00',
      pickupAddress: settings?.pickupAddress || 'Avenida Padre Jose Stefanello, n°340',
      pixKey: settings?.pixKey || '03972289960'
    });
    openWhatsAppWithMessage(testPhone, formatted);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header Info */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-neutral-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-serif text-brand-wine italic font-bold">
              Central de Respostas Rápidas (WhatsApp)
            </h3>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[9px] rounded-full uppercase">
              1-Click Send
            </span>
          </div>
          <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
            Economize tempo de atendimento criando modelos de mensagens pré-formatadas para enviar aos clientes diretamente pelo WhatsApp ou copiar com um clique nos pedidos e no CRM.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-brand-wine hover:bg-neutral-50 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
            title="Restaurar modelos padrões de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Padrão
          </button>

          <button
            type="button"
            onClick={startNew}
            className="px-4 py-2 bg-brand-wine hover:bg-black text-brand-gold rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Criar Nova Frase
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          Respostas rápidas salvas e atualizadas com sucesso!
        </div>
      )}

      {/* Editor / Creation Modal or Box */}
      {isCreating && (
        <div className="bg-brand-cream/40 p-6 sm:p-8 rounded-[32px] border-2 border-brand-gold/40 shadow-lg space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-brand-wine/10 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-gold" />
              <h4 className="font-serif italic font-bold text-lg text-brand-wine">
                {editingPhrase ? 'Editar Resposta Rápida' : 'Criar Nova Resposta Rápida'}
              </h4>
            </div>
            <button
              onClick={() => { setIsCreating(false); setEditingPhrase(null); }}
              className="text-xs text-neutral-400 hover:text-neutral-700 font-bold uppercase tracking-wider"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Título do Botão / Identificação
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: 8. Mensagem de Boas-Vindas ou Cupom de Aniversário"
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine outline-none shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Categoria
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:border-brand-wine outline-none shadow-sm"
              >
                <option value="confirmacao">Confirmação & Pix</option>
                <option value="lembrete">Lembrete de Produção</option>
                <option value="pronto">Pronto para Retirada</option>
                <option value="entrega">Saiu para Entrega</option>
                <option value="pos_venda">Pós-Venda & Avaliação</option>
                <option value="cobranca">Cobrança</option>
                <option value="geral">Geral / Promoções</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Texto do Modelo (Use as tags dinâmicas abaixo para preenchimento automático):
              </label>
            </div>

            {/* Quick Variable Insertion Tags */}
            <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-neutral-200">
              <span className="text-[9px] font-black text-neutral-400 uppercase self-center px-1">Inserir Tag:</span>
              {[
                { tag: '{nome}', label: 'Nome do Cliente' },
                { tag: '{numero_pedido}', label: '# Pedido' },
                { tag: '{total}', label: 'Valor Total' },
                { tag: '{itens}', label: 'Resumo dos Itens' },
                { tag: '{data}', label: 'Data de Retirada' },
                { tag: '{horario}', label: 'Horário' },
                { tag: '{endereco}', label: 'Endereço Retirada' },
                { tag: '{endereco_entrega}', label: 'Endereço Entrega' },
                { tag: '{chave_pix}', label: 'Chave Pix' },
                { tag: '{link_catalogo}', label: 'Link do Catálogo' }
              ].map(v => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVariable(v.tag)}
                  className="px-2 py-1 bg-brand-wine/5 hover:bg-brand-wine text-brand-wine hover:text-white rounded-lg text-[10px] font-bold transition-colors border border-brand-wine/10"
                >
                  {v.label} ({v.tag})
                </button>
              ))}
            </div>

            <textarea
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
              rows={6}
              className="w-full p-4 bg-white border border-neutral-200 rounded-2xl text-xs text-neutral-800 leading-relaxed font-sans focus:border-brand-wine outline-none shadow-sm resize-none"
              placeholder="Digite o texto da mensagem aqui..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setIsCreating(false); setEditingPhrase(null); }}
              className="px-4 py-2 rounded-xl text-neutral-400 hover:text-neutral-700 text-xs font-black uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSavePhrase}
              className="px-6 py-2.5 bg-brand-wine hover:bg-black text-brand-gold rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
            >
              <Check className="w-4 h-4" />
              Salvar Resposta Rápida
            </button>
          </div>
        </div>
      )}

      {/* Phrases List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {phrases.map((phrase, idx) => (
          <div
            key={phrase.id}
            className="bg-white rounded-[28px] border border-neutral-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all group space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-brand-gold/10 text-brand-wine font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-serif italic font-bold text-neutral-800 text-sm">
                      {phrase.title}
                    </h4>
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold">
                      {phrase.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(phrase)}
                    className="p-2 text-neutral-400 hover:text-brand-wine hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Editar frase"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePhrase(phrase.id)}
                    className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir frase"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Template Preview */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs text-neutral-600 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto font-sans">
                {phrase.template}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
              <button
                type="button"
                onClick={() => handleCopyExample(phrase)}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-500 hover:text-brand-wine bg-neutral-100 hover:bg-neutral-200 rounded-xl flex items-center gap-1 transition-all"
              >
                {copiedId === phrase.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copiar Exemplo
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTestWhatsApp(phrase)}
                className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Send className="w-3 h-3 text-emerald-600" />
                Testar Envio
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
