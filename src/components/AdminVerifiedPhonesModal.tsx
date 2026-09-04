import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  X, 
  Search, 
  Plus, 
  Trash2, 
  Phone, 
  User, 
  Calendar, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Check
} from 'lucide-react';
import { db } from '../firebase';
import { VerifiedPhoneRecord } from '../types';
import { 
  fetchAllVerifiedPhones, 
  removeVerifiedPhone, 
  savePhoneVerifiedFirestore,
  cleanPhoneDigits, 
  formatBrazilianPhone,
  isValidBrazilianMobilePhone 
} from '../lib/phoneVerificationHelper';
import { cn } from '../lib/utils';

interface AdminVerifiedPhonesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminVerifiedPhonesModal: React.FC<AdminVerifiedPhonesModalProps> = ({
  isOpen,
  onClose
}) => {
  const [phones, setPhones] = useState<VerifiedPhoneRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ msg: string; isError: boolean } | null>(null);

  // Manual addition form
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadPhones = async () => {
    setLoading(true);
    try {
      const list = await fetchAllVerifiedPhones(db);
      setPhones(list);
    } catch (err) {
      console.error("Error loading verified phones:", err);
      setFeedback({ msg: 'Erro ao carregar lista de telefones do Firestore.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPhones();
    }
  }, [isOpen]);

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanPhoneDigits(newPhone);
    if (!clean || clean.length < 10) {
      setFeedback({ msg: 'Informe um telefone válido com DDD (ex: 11 99999-9999).', isError: true });
      return;
    }

    setIsSaving(true);
    try {
      await savePhoneVerifiedFirestore(db, clean, newName.trim() || 'Cliente Cadastrado Manualmente', 'admin_manual');
      setFeedback({ msg: `Telefone ${formatBrazilianPhone(clean)} verificado com sucesso!`, isError: false });
      setNewPhone('');
      setNewName('');
      setIsAddingNew(false);
      await loadPhones();
    } catch (err) {
      console.error("Error adding verified phone:", err);
      setFeedback({ msg: 'Erro ao salvar telefone verificado.', isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (phone: string, customerName?: string) => {
    if (!window.confirm(`Deseja revogar a verificação do número ${formatBrazilianPhone(phone)} (${customerName || 'Cliente'})? O cliente precisará validar novamente na próxima compra.`)) {
      return;
    }

    try {
      await removeVerifiedPhone(db, phone);
      setPhones((prev) => prev.filter((p) => p.phone !== cleanPhoneDigits(phone)));
      setFeedback({ msg: `Verificação de ${formatBrazilianPhone(phone)} revogada.`, isError: false });
    } catch (err) {
      console.error("Error removing verified phone:", err);
      setFeedback({ msg: 'Erro ao revogar verificação.', isError: true });
    }
  };

  const filteredPhones = useMemo(() => {
    if (!searchTerm.trim()) return phones;
    const q = searchTerm.toLowerCase().replace(/\D/g, '');
    const qText = searchTerm.toLowerCase();

    return phones.filter((p) => {
      const matchDigits = p.phone.includes(q);
      const matchName = (p.customerName || '').toLowerCase().includes(qText);
      return matchDigits || matchName;
    });
  }, [phones, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-neutral-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-neutral-100 bg-gradient-to-r from-brand-cream/60 via-white to-brand-cream/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700 block">
                Segurança & Anti-Fraude
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold italic text-brand-wine">
                Telefones de WhatsApp Verificados
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 rounded-full transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 sm:p-6 pb-3 border-b border-neutral-100 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome ou número..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-brand-wine transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadPhones}
                disabled={loading}
                className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Atualizar lista"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>

              <button
                type="button"
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="px-3 py-2 bg-brand-wine hover:bg-black text-brand-gold rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingNew ? 'Cancelar' : '+ Validar Manual'}</span>
              </button>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className={cn(
              "p-2.5 rounded-xl text-xs flex items-center justify-between gap-2",
              feedback.isError ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            )}>
              <span className="flex items-center gap-1.5 font-medium">
                {feedback.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                {feedback.msg}
              </span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-[10px] font-bold underline cursor-pointer"
              >
                Dispensar
              </button>
            </div>
          )}

          {/* Form to manually add verified number */}
          {isAddingNew && (
            <form onSubmit={handleAddManual} className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pré-Aprovar e Validar Telefone de Cliente</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome do cliente (ex: Ana Maria)"
                  className="p-2.5 bg-white border border-neutral-300 rounded-xl text-xs focus:outline-none focus:border-brand-wine"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Telefone / WhatsApp com DDD"
                  className="p-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-mono focus:outline-none focus:border-brand-wine"
                  value={newPhone}
                  onChange={(e) => setNewPhone(formatBrazilianPhone(e.target.value))}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Salvar como Verificado</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Phone List */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {loading ? (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-wine" />
              <p className="text-xs">Carregando lista de telefones protegidos...</p>
            </div>
          ) : filteredPhones.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-neutral-200 rounded-3xl space-y-2 bg-neutral-50/50">
              <ShieldCheck className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-xs font-bold text-neutral-600">Nenhum telefone encontrado</p>
              <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
                Assim que clientes verificarem seus números pelo cardápio ou você adicionar manualmente, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            filteredPhones.map((record) => {
              const formatted = formatBrazilianPhone(record.phone);
              return (
                <div
                  key={record.phone}
                  className="p-3.5 bg-white border border-neutral-200 hover:border-emerald-300 rounded-2xl flex items-center justify-between gap-3 transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs sm:text-sm font-bold text-neutral-900">
                          {formatted}
                        </span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                          {record.verifiedBy === 'admin_manual' ? 'Manual' : 'Código WhatsApp'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-neutral-400" />
                          {record.customerName || 'Cliente'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[10px]">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          {record.verifiedAt?.toDate 
                            ? record.verifiedAt.toDate().toLocaleDateString('pt-BR') 
                            : 'Recente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`https://wa.me/55${record.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-colors cursor-pointer"
                      title="Conversar no WhatsApp"
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDelete(record.phone, record.customerName)}
                      className="p-2 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                      title="Revogar verificação deste número"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
          <span>Total: <strong>{filteredPhones.length}</strong> número(s) verificado(s)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
