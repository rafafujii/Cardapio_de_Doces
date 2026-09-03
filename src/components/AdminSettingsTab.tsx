import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Clock, 
  Store, 
  Calendar, 
  DollarSign, 
  MapPin, 
  MessageCircle, 
  RotateCcw, 
  AlertTriangle, 
  LayoutGrid, 
  CheckCircle2, 
  Plus, 
  X, 
  Volume2, 
  Truck, 
  Percent, 
  Instagram,
  ShieldCheck,
  History,
  User,
  ArrowRight,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Heart,
  Smartphone,
  CalendarDays,
  ShoppingCart,
  Palette,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Moon,
  Sun,
  Bell,
  Globe,
  Laptop,
  Filter,
  Tag,
  Database,
  Download,
  HardDrive,
  Loader2,
  FileJson
} from 'lucide-react';
import { cn } from '../lib/utils';
import { DEFAULT_WHATSAPP_TEMPLATE } from '../lib/whatsappHelper';
import { DEFAULT_48H_REMINDER_TEMPLATE } from '../lib/reminderHelper';
import { playNewOrderNotification } from '../lib/audioNotifier';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendPwaTestNotification,
  type NotificationPermissionState
} from '../lib/pwaNotificationHelper';
import { 
  generateFullFirestoreBackup, 
  downloadBackupJsonFile, 
  FIRESTORE_COLLECTIONS,
  type FullFirestoreBackup 
} from '../lib/firestoreBackupHelper';
import { SEASONAL_THEME_LIST } from '../lib/seasonalThemes';
import { FormField } from './FormField';
import { auth } from '../firebase';
import type { AuditLog } from '../types';

interface AdminSettingsTabProps {
  settings: any;
  onSave: (data: any) => void;
  auditLogs?: AuditLog[];
  onDeleteLog?: (id: string) => void;
  onClearLogs?: () => void;
  adminDarkMode?: boolean;
  onToggleAdminDarkMode?: () => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ 
  settings, 
  onSave,
  auditLogs = [],
  onDeleteLog,
  onClearLogs,
  adminDarkMode = false,
  onToggleAdminDarkMode
}) => {
  const [formData, setFormData] = useState({
    contactPhone: "5544998542446",
    googleSheetId: "1LnFf7VKaV4CLedmpiLsWtgt_Z9bZJKuyLrPfevybQc0",
    pixKey: "03972289960",
    pickupAddress: "Avenida Padre Jose Stefanello, n°340",
    businessHours: "Ter a Dom • 10h às 18h",
    storeStatusText: "Aceitando Encomendas & Pronta Entrega",
    storeStatusMode: "open" as 'open' | 'limited' | 'paused',
    announcementBanner: "",
    instagramUrl: "https://instagram.com/s.e_docesgourmet",
    minNoticeHours: 48,
    blockedDates: [] as string[],
    // Item 2: Entrega vs Retirada
    deliveryMode: "delivery_and_pickup" as 'pickup_only' | 'delivery_and_pickup',
    deliveryFeeType: "fixed" as 'fixed' | 'to_consult',
    deliveryFixedFee: 10,
    freeDeliveryThreshold: 0,
    // Item 3: Descontos Automáticos por Volume
    enableVolumeDiscount: true,
    volumeDiscountMinItems: 200,
    volumeDiscountPercent: 5,
    volumeDiscountMessage: "🎉 Parabéns! Desconto de 5% aplicado para pedidos acima de 200 doces.",
    // Item 4: Notificação Sonora
    enableOrderSoundNotification: true,
    // Item 5: Template de WhatsApp
    customWhatsAppTemplate: DEFAULT_WHATSAPP_TEMPLATE,
    // Item 6: Alerta de Estoque Mínimo Global
    globalMinStockAlert: 2,
    // Novos Módulos Opcionais Ativáveis / Desativáveis (Solicitação do Usuário)
    enableWishlist: true,
    enablePwaInstallPrompt: true,
    enableProductionCalendar: true,
    enablePredictiveStockAlerts: true,
    enableConsolidatedReports: true,
    seasonalTheme: 'default' as 'default' | 'easter' | 'mothers_day' | 'christmas' | 'halloween',
    seasonalThemeBanner: '',
    // Lembretes Automáticos para Pedidos Pendentes > 48h
    autoReminder48hEnabled: false,
    autoReminder48hTime: '10:00',
    autoReminder48hTemplate: DEFAULT_48H_REMINDER_TEMPLATE,
    ...settings
  });

  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});
  const [pushPermission, setPushPermission] = useState<NotificationPermissionState>('default');
  const [isTestingPush, setIsTestingPush] = useState(false);

  // Firestore Backup State
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState<{ current: string; step: number; total: number; count: number } | null>(null);
  const [lastBackupSummary, setLastBackupSummary] = useState<FullFirestoreBackup | null>(null);

  useEffect(() => {
    setPushPermission(getNotificationPermission());
  }, []);

  const handleExportBackup = async () => {
    setIsExportingBackup(true);
    setBackupProgress({ current: 'Iniciando conexão...', step: 0, total: FIRESTORE_COLLECTIONS.length, count: 0 });
    try {
      const currentEmail = auth.currentUser?.email || 'rafaelhirofujii17@gmail.com';
      const backup = await generateFullFirestoreBackup(
        currentEmail,
        (colName, step, total, countSoFar) => {
          setBackupProgress({ current: colName, step, total, count: countSoFar });
        }
      );
      downloadBackupJsonFile(backup);
      setLastBackupSummary(backup);
    } catch (err) {
      console.error("Erro ao exportar backup:", err);
      alert("Ocorreu um erro ao gerar o backup do Firestore. Verifique a conexão.");
    } finally {
      setIsExportingBackup(false);
      setBackupProgress(null);
    }
  };

  const handleTestPushAlert = async () => {
    setIsTestingPush(true);
    try {
      await sendPwaTestNotification();
      setPushPermission(getNotificationPermission());
    } catch (e) {
      console.warn("Could not trigger test push:", e);
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleRequestPushPermission = async () => {
    const res = await requestNotificationPermission();
    setPushPermission(res);
    if (res === 'granted') {
      await sendPwaTestNotification();
    }
  };

  const toggleExpandLog = (id: string) => {
    setExpandedLogIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Category Filter
      if (logCategoryFilter !== 'all') {
        const hasCategoryInLog = log.category === logCategoryFilter;
        const hasCategoryInFields = (log.changedFields || []).some(f => f.category === logCategoryFilter);
        if (!hasCategoryInLog && !hasCategoryInFields) return false;
      }

      // Text Search Filter
      if (!logSearchTerm.trim()) return true;
      const q = logSearchTerm.toLowerCase();
      const matchUser = (log.userEmail || '').toLowerCase().includes(q) || (log.userName || '').toLowerCase().includes(q);
      const matchIp = (log.userIp || '').toLowerCase().includes(q);
      const matchDevice = (log.deviceInfo || '').toLowerCase().includes(q);
      const matchSummary = (log.summary || '').toLowerCase().includes(q);
      const matchDetail = (log.detailedDescription || '').toLowerCase().includes(q);
      const matchCategory = (log.category || '').toLowerCase().includes(q);
      const matchFields = (log.changedFields || []).some(f => 
        (f.fieldLabel || '').toLowerCase().includes(q) || 
        (f.category || '').toLowerCase().includes(q) || 
        (f.description || '').toLowerCase().includes(q) ||
        String(f.newValue || '').toLowerCase().includes(q) ||
        String(f.oldValue || '').toLowerCase().includes(q)
      );
      return matchUser || matchIp || matchDevice || matchSummary || matchDetail || matchCategory || matchFields;
    });
  }, [auditLogs, logSearchTerm, logCategoryFilter]);

  const formatLogDate = (ts: any) => {
    if (!ts) return 'Agora';
    if (typeof ts.toDate === 'function') {
      return ts.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }
    const d = new Date(ts);
    return !isNaN(d.getTime()) ? d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Data recente';
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...settings,
      blockedDates: Array.isArray(settings?.blockedDates) ? settings.blockedDates : []
    }));
  }, [settings]);

  const handleAddBlockedDate = () => {
    if (!newBlockedDate) return;
    const current = Array.isArray(formData.blockedDates) ? formData.blockedDates : [];
    if (current.includes(newBlockedDate)) {
      alert("Esta data já está bloqueada!");
      return;
    }
    const updated = [...current, newBlockedDate].sort();
    setFormData({ ...formData, blockedDates: updated });
    setNewBlockedDate('');
  };

  const handleRemoveBlockedDate = (dateToRemove: string) => {
    const current = Array.isArray(formData.blockedDates) ? formData.blockedDates : [];
    const updated = current.filter(d => d !== dateToRemove);
    setFormData({ ...formData, blockedDates: updated });
  };

  const insertTagIntoTemplate = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      customWhatsAppTemplate: (prev.customWhatsAppTemplate || '') + tag
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-2 pb-16">
      <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div>
            <h3 className="text-xl sm:text-2xl font-serif text-brand-wine italic flex items-center gap-2">
              <Settings className="w-6 h-6 text-brand-gold" />
              Painel de Configurações
            </h3>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
              Personalize regras de entrega, descontos, alertas sonoros, mensagens e estoque
            </p>
          </div>

          {/* Live Status Badge Preview */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-xs font-semibold self-start sm:self-auto">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full",
              formData.storeStatusMode === 'open' ? "bg-emerald-500" : formData.storeStatusMode === 'limited' ? "bg-amber-500" : "bg-rose-500"
            )} />
            <span className="text-neutral-700">{formData.storeStatusText || "Status da Loja"}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 mt-6">
          {/* Seção 1: Horários & Status de Atendimento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
              <Clock className="w-4 h-4 text-brand-gold" />
              <span>1. Horários & Status da Loja</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Horário de Atendimento (Exibido no Banner)" icon={<Clock className="w-4 h-4" />}>
                <input 
                  type="text" 
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-medium"
                  value={formData.businessHours}
                  onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
                  placeholder="Ex: Ter a Dom • 10h às 18h"
                />
              </FormField>

              <FormField label="Texto do Status da Loja" icon={<Store className="w-4 h-4" />}>
                <input 
                  type="text" 
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-medium"
                  value={formData.storeStatusText}
                  onChange={(e) => setFormData({ ...formData, storeStatusText: e.target.value })}
                  placeholder="Ex: Aceitando Encomendas & Pronta Entrega"
                />
              </FormField>
            </div>

            {/* Modo do Status da Loja */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-600 block">
                Indicador Visual do Status (Cor da Luzinha):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, storeStatusMode: 'open' })}
                  className={cn(
                    "p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer",
                    formData.storeStatusMode === 'open' 
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm" 
                      : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  )}
                >
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold">Aberto / Normal</p>
                    <p className="text-[10px] font-normal text-emerald-700">Aceitando encomendas</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, storeStatusMode: 'limited' })}
                  className={cn(
                    "p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer",
                    formData.storeStatusMode === 'limited' 
                      ? "bg-amber-50 border-amber-300 text-amber-800 shadow-sm" 
                      : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  )}
                >
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold">Vagas Limitadas</p>
                    <p className="text-[10px] font-normal text-amber-700">Poucas datas disponíveis</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, storeStatusMode: 'paused' })}
                  className={cn(
                    "p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer",
                    formData.storeStatusMode === 'paused' 
                      ? "bg-rose-50 border-rose-300 text-rose-800 shadow-sm" 
                      : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  )}
                >
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold">Agenda Fechada</p>
                    <p className="text-[10px] font-normal text-rose-700">Temporariamente fechado</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Banner de Aviso Global */}
            <FormField label="Faixa de Aviso Especial no Topo (Opcional - deixe vazio para ocultar)" icon={<Store className="w-4 h-4" />}>
              <input 
                type="text" 
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm"
                value={formData.announcementBanner || ''}
                onChange={(e) => setFormData({ ...formData, announcementBanner: e.target.value })}
                placeholder="Ex: 🐰 Encomendas de Páscoa abertas! Faça seu pedido com antecedência."
              />
            </FormField>
          </div>

          {/* Seção 2: Opções de Entrega & Taxa de Frete */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <Truck className="w-4 h-4 text-brand-gold" />
                <span>2. Opções de Entrega & Taxa de Frete</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-wine">Item 2</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 block">Modo de Atendimento:</label>
                <select
                  value={formData.deliveryMode}
                  onChange={(e) => setFormData({ ...formData, deliveryMode: e.target.value as any })}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-medium"
                >
                  <option value="delivery_and_pickup">Oferecer Entrega e Retirada no Local</option>
                  <option value="pickup_only">Apenas Retirada no Local</option>
                </select>
              </div>

              {formData.deliveryMode === 'delivery_and_pickup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-600 block">Cálculo da Taxa de Entrega:</label>
                  <select
                    value={formData.deliveryFeeType}
                    onChange={(e) => setFormData({ ...formData, deliveryFeeType: e.target.value as any })}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-medium"
                  >
                    <option value="fixed">Taxa Fixa Padrão (Ex: R$ 10,00)</option>
                    <option value="to_consult">Taxa a Combinar / Sob Consulta no WhatsApp</option>
                  </select>
                </div>
              )}
            </div>

            {formData.deliveryMode === 'delivery_and_pickup' && formData.deliveryFeeType === 'fixed' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <FormField label="Valor da Taxa Fixa de Entrega (R$)" icon={<DollarSign className="w-4 h-4 text-brand-wine" />}>
                  <input 
                    type="number" 
                    min="0"
                    step="0.50"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-bold text-brand-wine"
                    value={formData.deliveryFixedFee}
                    onChange={(e) => setFormData({ ...formData, deliveryFixedFee: parseFloat(e.target.value) || 0 })}
                    placeholder="10.00"
                  />
                </FormField>

                <FormField label="Frete Grátis acima de (R$ - 0 para desativar)" icon={<Truck className="w-4 h-4 text-emerald-600" />}>
                  <input 
                    type="number" 
                    min="0"
                    step="10"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-bold text-emerald-700"
                    value={formData.freeDeliveryThreshold || 0}
                    onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 250 (Grátis para pedidos acima de R$ 250)"
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* Seção 3: Descontos Automáticos por Volume */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <Percent className="w-4 h-4 text-brand-gold" />
                <span>3. Descontos Automáticos por Volume</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-wine">Item 3</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div>
                <p className="text-xs font-bold text-brand-wine">Ativar Desconto Progressivo por Volume</p>
                <p className="text-[11px] text-neutral-500">Aplica desconto automático no checkout quando o pedido atinge quantidade mínima de doces.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, enableVolumeDiscount: !formData.enableVolumeDiscount })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0",
                  formData.enableVolumeDiscount ? "bg-emerald-500" : "bg-neutral-300"
                )}
              >
                <span className={cn(
                  "block w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                  formData.enableVolumeDiscount ? "translate-x-6" : "translate-x-0"
                )} />
              </button>
            </div>

            {formData.enableVolumeDiscount && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <FormField label="Quantidade Mínima de Doces para Ganhar Desconto" icon={<Percent className="w-4 h-4" />}>
                  <input 
                    type="number" 
                    min="50"
                    step="25"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-bold text-brand-wine"
                    value={formData.volumeDiscountMinItems}
                    onChange={(e) => setFormData({ ...formData, volumeDiscountMinItems: parseInt(e.target.value) || 0 })}
                    placeholder="200"
                  />
                </FormField>

                <FormField label="Porcentagem de Desconto (%)" icon={<Percent className="w-4 h-4 text-emerald-600" />}>
                  <input 
                    type="number" 
                    min="1"
                    max="50"
                    step="1"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-bold text-emerald-700"
                    value={formData.volumeDiscountPercent}
                    onChange={(e) => setFormData({ ...formData, volumeDiscountPercent: parseFloat(e.target.value) || 0 })}
                    placeholder="5"
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* Seção 4: Notificação Sonora & Push Notifications em Segundo Plano (PWA) */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-brand-gold" />
                <span>4. Notificações Push & Alertas em Segundo Plano (PWA & Som)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-wine">Item 4 & Push</span>
            </div>

            {/* Alerta Sonoro */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div>
                <p className="text-xs font-bold text-brand-wine">Tocar Campainha Sonora ao Receber Pedido</p>
                <p className="text-[11px] text-neutral-500">Toca um acorde musical suave harmônico instantaneamente no navegador ao entrar um novo pedido.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => playNewOrderNotification()}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Testar como soa o alerta de novo pedido"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Testar Som 🔔
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enableOrderSoundNotification: !formData.enableOrderSoundNotification })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer",
                    formData.enableOrderSoundNotification ? "bg-emerald-500" : "bg-neutral-300"
                  )}
                >
                  <span className={cn(
                    "block w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                    formData.enableOrderSoundNotification ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>

            {/* PWA Push Notification Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-neutral-50 to-neutral-50 border border-amber-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-brand-wine flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-brand-gold" />
                      Push Notifications do PWA no Celular & Segundo Plano
                    </span>
                    {pushPermission === 'granted' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Push Ativo
                      </span>
                    ) : pushPermission === 'denied' ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider border border-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Bloqueado no Navegador
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Permissão Pendente
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                    Permite que o administrador receba alertas sonoros, vibração tátil e banners visuais na tela de bloqueio do smartphone mesmo com o aplicativo minimizado ou em segundo plano via <strong>Service Worker Push API</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  {pushPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestPushPermission}
                      className="px-3.5 py-2 bg-brand-wine text-brand-gold rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5 text-brand-gold" />
                      Ativar no Dispositivo
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isTestingPush}
                    onClick={handleTestPushAlert}
                    className="px-3.5 py-2 bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-brand-gold" />
                    {isTestingPush ? 'Enviando Teste...' : 'Testar Alerta Push & Vibração 📲'}
                  </button>
                </div>
              </div>

              {pushPermission === 'denied' && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    As notificações estão bloqueadas nas configurações do seu navegador ou celular. Para ativar, toque no ícone de cadeado/permissões ao lado do endereço do site e permita as <strong>Notificações</strong>.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seção 5: Mensagem Padrão de WhatsApp Pré-formatada */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <MessageCircle className="w-4 h-4 text-brand-gold" />
                <span>5. Mensagem Padrão de WhatsApp Pré-formatada</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, customWhatsAppTemplate: DEFAULT_WHATSAPP_TEMPLATE })}
                  className="text-[10px] font-bold text-neutral-500 hover:text-brand-wine underline flex items-center gap-1 cursor-pointer"
                  title="Restaurar formato original"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restaurar Padrão
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-wine">Item 5</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-600 block">
                Template da Mensagem Enviada pelo Cliente no WhatsApp:
              </label>
              <textarea 
                rows={9}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all font-mono text-xs text-neutral-700 leading-relaxed"
                value={formData.customWhatsAppTemplate || DEFAULT_WHATSAPP_TEMPLATE}
                onChange={(e) => setFormData({ ...formData, customWhatsAppTemplate: e.target.value })}
              />

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Tags dinâmicas disponíveis (clique para inserir):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '{saudacao}',
                    '{nome_cliente}',
                    '{bloco_itens}',
                    '{bloco_entrega}',
                    '{bloco_desconto}',
                    '{valor_total}',
                    '{data_formatada}',
                    '{horario}',
                    '{forma_pagamento}',
                    '{bloco_troco}',
                    '{bloco_pix}',
                    '{bloco_obs}'
                  ].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertTagIntoTemplate(tag)}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-[10px] font-mono font-bold transition-all border border-neutral-200 cursor-pointer"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Seção 6: Alerta de Estoque Mínimo Global */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>6. Alerta de Estoque Mínimo Global</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-wine">Item 6</span>
            </div>

            <FormField label="Quantidade Mínima de Segurança Padrão (Unidades ou Kg)" icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  className="w-32 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all font-bold text-amber-800 text-base"
                  value={formData.globalMinStockAlert ?? 2}
                  onChange={(e) => setFormData({ ...formData, globalMinStockAlert: parseFloat(e.target.value) || 0 })}
                  placeholder="2"
                />
                <span className="text-xs text-neutral-500 font-medium leading-tight">
                  Quando o estoque de qualquer ingrediente/insumo estiver abaixo desse valor, o painel de estoque exibirá alertas visuais em vermelho e filtragem prioritária.
                </span>
              </div>
            </FormField>
          </div>

          {/* Seção 7: Contato, Endereço, PIX & Redes */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-brand-gold" />
              <span>7. Localização, Contato & Chave PIX</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="WhatsApp para Pedidos (com DDI e DDD)" icon={<MessageCircle className="w-4 h-4" />}>
                <input 
                  type="text" 
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-mono"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="Ex: 5544998542446"
                />
              </FormField>

              <FormField label="Chave PIX Oficial" icon={<DollarSign className="w-4 h-4" />}>
                <input 
                  type="text" 
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-medium"
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  placeholder="Ex: 03972289960 ou seu e-mail"
                />
              </FormField>

              <FormField label="Endereço Completo de Retirada" icon={<MapPin className="w-4 h-4" />}>
                <input 
                  type="text" 
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-medium"
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  placeholder="Ex: Avenida Padre Jose Stefanello, n°340"
                />
              </FormField>

              <FormField label="Link do Instagram Oficial" icon={<Instagram className="w-4 h-4" />}>
                <input 
                  type="text" 
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm"
                  value={formData.instagramUrl || ''}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  placeholder="Ex: https://instagram.com/s.e_docesgourmet"
                />
              </FormField>
            </div>
          </div>

          {/* Seção 8: Regras de Encomenda & Calendário */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-brand-gold" />
              <span>8. Regras de Encomenda & Bloqueio de Datas</span>
            </div>

            <FormField label="Antecedência Mínima para Encomendas (em Horas)" icon={<Clock className="w-4 h-4" />}>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min={0}
                  step={1}
                  className="w-32 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all font-bold text-brand-wine text-base"
                  value={formData.minNoticeHours ?? 48}
                  onChange={(e) => setFormData({ ...formData, minNoticeHours: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 48"
                />
                <span className="text-xs text-neutral-500 font-medium">
                  {formData.minNoticeHours ? `(${Math.round(formData.minNoticeHours / 24 * 10) / 10} dias de antecedência no calendário do cliente)` : 'Sem antecedência mínima'}
                </span>
              </div>
            </FormField>

            <FormField label="Bloquear Datas no Calendário (Feriados / Dias Fechados / Lotados)" icon={<Calendar className="w-4 h-4" />}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-xs flex-grow"
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddBlockedDate}
                    className="px-4 py-2 bg-brand-wine text-brand-gold font-bold text-xs rounded-xl hover:bg-brand-wine/90 transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Bloquear Data
                  </button>
                </div>

                {/* Blocked Dates List */}
                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 min-h-[60px] flex flex-wrap gap-2 items-center">
                  {(formData.blockedDates || []).length === 0 ? (
                    <span className="text-xs text-neutral-400 italic">Nenhuma data bloqueada no momento. Os clientes podem encomendar em qualquer data válida.</span>
                  ) : (
                    formData.blockedDates.map((dateStr: string) => (
                      <span
                        key={dateStr}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold shadow-2xs"
                      >
                        <Calendar className="w-3 h-3 text-red-500" />
                        {dateStr.split('-').reverse().join('/')}
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockedDate(dateStr)}
                          className="p-0.5 hover:bg-red-200/60 rounded-full transition-colors ml-1 text-red-500 hover:text-red-800 cursor-pointer"
                          title="Desbloquear esta data"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </FormField>
          </div>

          {/* Seção 9: Planilha do Cardápio */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
              <LayoutGrid className="w-4 h-4 text-brand-gold" />
              <span>9. Integrações de Dados (Google Sheets)</span>
            </div>

            <FormField label="ID da Planilha do Google Sheets (Cardápio / Produtos)" icon={<LayoutGrid className="w-4 h-4" />}>
              <input 
                type="text" 
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all font-mono text-xs text-neutral-700"
                value={formData.googleSheetId}
                onChange={(e) => setFormData({ ...formData, googleSheetId: e.target.value })}
                placeholder="ID da sua planilha pública do Google Sheets"
              />
            </FormField>
          </div>

          {/* Seção 10: Controle de Módulos & Recursos Opcionais (Ativar / Desativar) */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                <span>10. Módulos & Recursos Opcionais (Ativar / Desativar)</span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-wine">
                Personalização do Sistema
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Controle quais recursos avançados ficam visíveis para seus clientes no catálogo e para sua equipe no painel de administração.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Toggle: Admin Night / Dark Mode */}
              <div className={cn(
                "p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 md:col-span-2",
                adminDarkMode ? "bg-amber-500/10 border-amber-500/30" : "bg-neutral-50 border-neutral-200"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {adminDarkMode ? (
                      <Moon className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-indigo-500" />
                    )}
                    <span className="text-xs font-bold text-neutral-800">
                      Modo Noturno do Painel Administrativo (Conforto Visual)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-800 border border-amber-400/30">
                      {adminDarkMode ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Reduz o brilho da tela e o cansaço visual da confeiteira/vendedor ao gerenciar pedidos à noite. A preferência é salva automaticamente neste navegador.
                  </p>
                </div>
                {onToggleAdminDarkMode && (
                  <button
                    type="button"
                    onClick={onToggleAdminDarkMode}
                    className={cn(
                      "p-1 rounded-full transition-colors shrink-0",
                      adminDarkMode ? "text-amber-500" : "text-neutral-300"
                    )}
                    title={adminDarkMode ? "Desativar Modo Noturno" : "Ativar Modo Noturno"}
                  >
                    {adminDarkMode ? (
                      <ToggleRight className="w-8 h-8 text-amber-500 fill-amber-500/20" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-neutral-400" />
                    )}
                  </button>
                )}
              </div>

              {/* Toggle 1: Wishlist */}
              <div className={cn(
                "p-4 rounded-2xl border transition-all flex items-start justify-between gap-3",
                formData.enableWishlist ? "bg-amber-50/40 border-amber-200/70" : "bg-neutral-50 border-neutral-200"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Heart className={cn("w-4 h-4", formData.enableWishlist ? "text-rose-500 fill-rose-500" : "text-neutral-400")} />
                    <span className="text-xs font-bold text-neutral-800">1.6 Lista de Favoritos (Wishlist)</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Permite aos clientes salvar doces com o coração e filtrar a vitrine para ver apenas seus favoritos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enableWishlist: !formData.enableWishlist })}
                  className={cn(
                    "p-1 rounded-full transition-colors shrink-0",
                    formData.enableWishlist ? "text-brand-wine" : "text-neutral-300"
                  )}
                  title={formData.enableWishlist ? "Desativar Favoritos" : "Ativar Favoritos"}
                >
                  {formData.enableWishlist ? (
                    <ToggleRight className="w-8 h-8 text-brand-wine fill-brand-wine/20" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-neutral-400" />
                  )}
                </button>
              </div>

              {/* Toggle 2: PWA Install Prompt */}
              <div className={cn(
                "p-4 rounded-2xl border transition-all flex items-start justify-between gap-3",
                formData.enablePwaInstallPrompt ? "bg-amber-50/40 border-amber-200/70" : "bg-neutral-50 border-neutral-200"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className={cn("w-4 h-4", formData.enablePwaInstallPrompt ? "text-emerald-600" : "text-neutral-400")} />
                    <span className="text-xs font-bold text-neutral-800">1.7 Botão de Instalar App (PWA)</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Exibe o botão de instalação rápida no topo do catálogo para iPhone, Android e Desktop.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enablePwaInstallPrompt: !formData.enablePwaInstallPrompt })}
                  className={cn(
                    "p-1 rounded-full transition-colors shrink-0",
                    formData.enablePwaInstallPrompt ? "text-brand-wine" : "text-neutral-300"
                  )}
                  title={formData.enablePwaInstallPrompt ? "Desativar PWA" : "Ativar PWA"}
                >
                  {formData.enablePwaInstallPrompt ? (
                    <ToggleRight className="w-8 h-8 text-brand-wine fill-brand-wine/20" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-neutral-400" />
                  )}
                </button>
              </div>

              {/* Toggle 3: Production Calendar */}
              <div className={cn(
                "p-4 rounded-2xl border transition-all flex items-start justify-between gap-3",
                formData.enableProductionCalendar ? "bg-amber-50/40 border-amber-200/70" : "bg-neutral-50 border-neutral-200"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CalendarDays className={cn("w-4 h-4", formData.enableProductionCalendar ? "text-blue-600" : "text-neutral-400")} />
                    <span className="text-xs font-bold text-neutral-800">3.3 Planejador Semanal de Produção</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Habilita o calendário visual de 7 dias com distribuição de encomendas, capacidade diária e comandas na aba Cozinha.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enableProductionCalendar: !formData.enableProductionCalendar })}
                  className={cn(
                    "p-1 rounded-full transition-colors shrink-0",
                    formData.enableProductionCalendar ? "text-brand-wine" : "text-neutral-300"
                  )}
                  title={formData.enableProductionCalendar ? "Desativar Planejador" : "Ativar Planejador"}
                >
                  {formData.enableProductionCalendar ? (
                    <ToggleRight className="w-8 h-8 text-brand-wine fill-brand-wine/20" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-neutral-400" />
                  )}
                </button>
              </div>

              {/* Toggle 4: Predictive Stock Alerts */}
              <div className={cn(
                "p-4 rounded-2xl border transition-all flex items-start justify-between gap-3",
                formData.enablePredictiveStockAlerts ? "bg-amber-50/40 border-amber-200/70" : "bg-neutral-50 border-neutral-200"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className={cn("w-4 h-4", formData.enablePredictiveStockAlerts ? "text-amber-600" : "text-neutral-400")} />
                    <span className="text-xs font-bold text-neutral-800">3.4 Alerta Preditivo & Reposição</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Calcula insumos necessários para encomendas futuras e gera lista de compras automática em PDF/WhatsApp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enablePredictiveStockAlerts: !formData.enablePredictiveStockAlerts })}
                  className={cn(
                    "p-1 rounded-full transition-colors shrink-0",
                    formData.enablePredictiveStockAlerts ? "text-brand-wine" : "text-neutral-300"
                  )}
                  title={formData.enablePredictiveStockAlerts ? "Desativar Alerta Preditivo" : "Ativar Alerta Preditivo"}
                >
                  {formData.enablePredictiveStockAlerts ? (
                    <ToggleRight className="w-8 h-8 text-brand-wine fill-brand-wine/20" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-neutral-400" />
                  )}
                </button>
              </div>

              {/* Toggle 5: Consolidated Reports & DRE */}
              <div className={cn(
                "p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 md:col-span-2",
                formData.enableConsolidatedReports ? "bg-amber-50/40 border-amber-200/70" : "bg-neutral-50 border-neutral-200"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className={cn("w-4 h-4", formData.enableConsolidatedReports ? "text-purple-600" : "text-neutral-400")} />
                    <span className="text-xs font-bold text-neutral-800">4.3 Módulo de Relatórios & Fechamento DRE em PDF</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Habilita na aba Pedidos/Financeiro o gerador de DRE Operacional Consolidado com faturamento, custo de ingredientes e lucro líquido por período.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enableConsolidatedReports: !formData.enableConsolidatedReports })}
                  className={cn(
                    "p-1 rounded-full transition-colors shrink-0",
                    formData.enableConsolidatedReports ? "text-brand-wine" : "text-neutral-300"
                  )}
                  title={formData.enableConsolidatedReports ? "Desativar Relatórios" : "Ativar Relatórios"}
                >
                  {formData.enableConsolidatedReports ? (
                    <ToggleRight className="w-8 h-8 text-brand-wine fill-brand-wine/20" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-neutral-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Seção 11: Temas Sazonais & Datas Especiais (Grupo 5 - Item 2) */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <Palette className="w-4 h-4 text-brand-gold" />
                <span>11. 5.2 Temas Visuais Sazonais (Páscoa, Mães, Natal, Halloween)</span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-wine">
                Atmosfera & Identidade
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Selecione um tema comemorativo para transformar visualmente a loja, badges e banners promocionais conforme a data comemorativa.
            </p>

            {/* Theme Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SEASONAL_THEME_LIST.map((theme) => {
                const isSelected = (formData.seasonalTheme || 'classic') === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => setFormData({ 
                      ...formData, 
                      seasonalTheme: theme.id as any,
                      seasonalThemeBanner: theme.bannerText 
                    })}
                    className={cn(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 text-left relative group",
                      isSelected 
                        ? "border-brand-wine bg-brand-cream/30 shadow-md ring-2 ring-brand-wine/20" 
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{theme.iconEmoji}</span>
                        <div className="flex items-center gap-1">
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" 
                            style={{ backgroundColor: theme.primaryColor }}
                            title="Cor Primária"
                          />
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" 
                            style={{ backgroundColor: theme.accentColor }}
                            title="Cor de Destaque"
                          />
                        </div>
                      </div>
                      <h4 className="font-bold text-xs text-neutral-900">{theme.name}</h4>
                      <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">
                        {theme.tagline}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                      <span className={isSelected ? "text-brand-wine font-bold" : "text-neutral-400"}>
                        {isSelected ? "Tema Ativo" : "Selecionar"}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-wine" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Seasonal Banner Input */}
            <FormField label="Frase do Banner do Tema Sazonal (Opcional)" icon={<Sparkles className="w-4 h-4 text-brand-gold" />}>
              <input 
                type="text" 
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-xs text-neutral-800"
                value={formData.seasonalThemeBanner || ''}
                onChange={(e) => setFormData({ ...formData, seasonalThemeBanner: e.target.value })}
                placeholder="Ex: 🐰 Edição Especial de Páscoa: Garanta seus ovos recheados e brigadeiros temáticos!"
              />
            </FormField>
          </div>

          {/* Seção 12: Automação de Lembretes para Pedidos Pendentes (> 48h) */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <Clock className="w-4 h-4 text-brand-gold" />
                <span>12. Lembretes Automáticos para Pedidos Pendentes (&gt; 48h)</span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                Recuperação de Vendas
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Configure a rotina de lembretes automáticos e mensagens personalizadas para clientes com pedidos pendentes sem resposta há mais de 48 horas.
            </p>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-800 block">Ativar Rotina Automática de Lembretes 48h</span>
                  <span className="text-[11px] text-neutral-500">O sistema alerta e prepara os disparos para encomendas pendentes há mais de 2 dias</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, autoReminder48hEnabled: !formData.autoReminder48hEnabled })}
                  className={cn(
                    "p-1 rounded-full transition-colors shrink-0",
                    formData.autoReminder48hEnabled ? "text-brand-wine" : "text-neutral-300"
                  )}
                >
                  {formData.autoReminder48hEnabled ? (
                    <ToggleRight className="w-8 h-8 text-brand-wine fill-brand-wine/20" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-neutral-400" />
                  )}
                </button>
              </div>

              {formData.autoReminder48hEnabled && (
                <div className="pt-3 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Horário Preferencial de Execução Diária" icon={<Clock className="w-4 h-4" />}>
                    <input 
                      type="time"
                      className="w-full p-3 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-800"
                      value={formData.autoReminder48hTime || '10:00'}
                      onChange={(e) => setFormData({ ...formData, autoReminder48hTime: e.target.value })}
                    />
                  </FormField>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700 block">
                    Modelo da Mensagem do Lembrete:
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, autoReminder48hTemplate: DEFAULT_48H_REMINDER_TEMPLATE })}
                    className="text-[10px] font-bold text-brand-wine hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restaurar Padrão
                  </button>
                </div>

                <textarea
                  rows={8}
                  className="w-full p-3 bg-white border border-neutral-200 rounded-xl font-mono text-xs text-neutral-700 leading-relaxed"
                  value={formData.autoReminder48hTemplate || DEFAULT_48H_REMINDER_TEMPLATE}
                  onChange={(e) => setFormData({ ...formData, autoReminder48hTemplate: e.target.value })}
                />

                <div className="flex flex-wrap gap-1 text-[10px] text-neutral-500 pt-1">
                  <span className="font-bold">Tags disponíveis:</span>
                  {['{nome}', '{numero_pedido}', '{tempo_espera}', '{itens}', '{total}', '{data}', '{horario}', '{chave_pix}', '{endereco}'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, autoReminder48hTemplate: (prev.autoReminder48hTemplate || DEFAULT_48H_REMINDER_TEMPLATE) + tag }))}
                      className="px-1.5 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded font-mono text-neutral-800 cursor-pointer"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-brand-wine text-brand-gold font-black rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-wine/25 text-sm tracking-wide cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-brand-gold" />
            SALVAR TODAS AS CONFIGURAÇÕES
          </button>
        </form>
      </div>

      {/* Seção 10: Exportação de Backup Completo do Banco de Dados (Firestore JSON) */}
      <div className="bg-white rounded-[32px] border border-neutral-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black uppercase tracking-wider border border-emerald-200">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              Recuperação de Emergência & Segurança
            </div>
            <h3 className="text-xl sm:text-2xl font-serif text-brand-wine italic flex items-center gap-2">
              <Database className="w-6 h-6 text-brand-gold" />
              Backup Completo do Banco de Dados (Firestore JSON)
            </h3>
            <p className="text-xs text-neutral-500 max-w-2xl">
              Exporte instantaneamente uma cópia estruturada de todas as <strong>10 coleções do Firestore</strong> (pedidos, clientes CRM, estoque, insumos, receitas, avaliações, cupons, pronta entrega, configurações e logs) em um arquivo <code>.json</code> para arquivamento ou recuperação rápida.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              disabled={isExportingBackup}
              onClick={handleExportBackup}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExportingBackup ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Gerando Backup...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>Exportar Backup (.json)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        {isExportingBackup && backupProgress && (
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                Exportando coleção: <strong>{backupProgress.current}</strong>
              </span>
              <span>{backupProgress.step} de {backupProgress.total} coleções ({backupProgress.count} docs lidos)</span>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(backupProgress.step / backupProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Last Backup Summary Card */}
        {lastBackupSummary && (
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/90 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-neutral-800">
                  Último Backup Baixado com Sucesso!
                </span>
                <span className="text-[10px] text-neutral-500 bg-white px-2 py-0.5 rounded border border-neutral-200">
                  {new Date(lastBackupSummary.metadata.exportedAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-emerald-300">
                {lastBackupSummary.metadata.totalDocuments} documentos em {lastBackupSummary.metadata.totalCollections} coleções
              </span>
            </div>

            {/* Collection Breakdown Chips */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              {FIRESTORE_COLLECTIONS.map(col => {
                const count = lastBackupSummary.metadata.collectionCounts[col.id] || 0;
                return (
                  <span 
                    key={col.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-700 font-medium"
                  >
                    <span>{col.icon}</span>
                    <span>{col.label}:</span>
                    <strong className="text-neutral-900 font-bold">{count}</strong>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Collections Overview Grid */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Coleções incluídas no arquivo de backup JSON:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {FIRESTORE_COLLECTIONS.map(col => (
              <div 
                key={col.id}
                className="p-3 bg-neutral-50/70 rounded-xl border border-neutral-200/70 flex items-center gap-2 text-xs"
              >
                <span className="text-base">{col.icon}</span>
                <div className="overflow-hidden">
                  <p className="font-bold text-neutral-800 truncate text-[11px]">{col.label}</p>
                  <p className="text-[9px] font-mono text-neutral-400 truncate">/{col.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Dica de Segurança:</strong> Recomenda-se realizar o download do backup periodicamente ou antes de fazer grandes atualizações no cardápio, estoques ou preços. O arquivo baixado é compatível com qualquer ferramenta de restauração JSON padrão.
          </span>
        </div>
      </div>

      {/* Seção 11: Log de Auditoria & Histórico de Modificações */}
      <div className="bg-white rounded-[32px] border border-neutral-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-wine/10 text-brand-wine text-[11px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
              Auditoria, IP & Rastreabilidade
            </div>
            <h3 className="text-xl sm:text-2xl font-serif text-brand-wine italic flex items-center gap-2">
              <History className="w-6 h-6 text-brand-gold" />
              Histórico Profundo de Alterações
            </h3>
            <p className="text-xs text-neutral-500 max-w-xl">
              Registro cronológico completo com <strong>IP de origem</strong>, <strong>dispositivo/navegador</strong>, <strong>categoria da modificação</strong> e descrição detalhada de cada parâmetro alterado.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-bold border border-neutral-200">
              {filteredLogs.length} de {auditLogs.length} {auditLogs.length === 1 ? 'registro' : 'registros'}
            </span>
            {auditLogs.length > 0 && onClearLogs && (
              <button
                type="button"
                onClick={onClearLogs}
                className="px-3 py-1 text-xs font-bold text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Limpar histórico de auditoria"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Filter bar */}
        {auditLogs.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por usuário, IP, dispositivo, campo alterado, categoria ou valor..."
                value={logSearchTerm}
                onChange={(e) => setLogSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-gold/30 outline-none"
              />
              {logSearchTerm && (
                <button
                  type="button"
                  onClick={() => setLogSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1 shrink-0 mr-1">
                <Filter className="w-3 h-3 text-brand-gold" />
                Filtrar:
              </span>
              {[
                { id: 'all', label: 'Todas as Categorias' },
                { id: 'Atendimento & Horários', label: '⏰ Atendimento & Horários' },
                { id: 'Financeiro & Pagamentos', label: '💳 Financeiro & PIX' },
                { id: 'Frete & Entrega', label: '🚚 Frete & Entrega' },
                { id: 'Descontos & Promoções', label: '🏷️ Descontos & Cupons' },
                { id: 'Notificações & Sistema', label: '🔔 Notificações & PWA' },
                { id: 'Estoque & Produção', label: '📦 Estoque & Insumos' },
                { id: 'Design & Sazonal', label: '🎨 Design & Sazonal' }
              ].map(cat => {
                const isSelected = logCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setLogCategoryFilter(cat.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border",
                      isSelected
                        ? "bg-brand-wine text-brand-gold border-brand-wine shadow-xs"
                        : "bg-neutral-100/80 text-neutral-600 border-neutral-200/80 hover:bg-neutral-200/70"
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Logs list */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="py-12 bg-neutral-50/70 rounded-2xl border-2 border-dashed border-neutral-200 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white text-neutral-400 flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-6 h-6 text-brand-gold" />
              </div>
              <p className="text-sm font-bold text-neutral-700">
                {auditLogs.length === 0 
                  ? 'Nenhuma alteração registrada ainda' 
                  : 'Nenhum registro encontrado para esse filtro de busca'}
              </p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {auditLogs.length === 0
                  ? 'Sempre que você alterar e salvar qualquer configuração global acima, o log de auditoria registrará o IP, dispositivo, data e o antes/depois detalhado.'
                  : 'Tente limpar o termo de busca ou selecionar "Todas as Categorias".'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogIds[log.id] !== false; // Default expanded for visibility
              const changesCount = log.changedFields?.length || 0;

              return (
                <div 
                  key={log.id} 
                  className="bg-neutral-50/90 rounded-2xl border border-neutral-200/90 p-4 sm:p-5 transition-all space-y-3.5 hover:border-brand-gold/40 shadow-xs"
                >
                  {/* Log Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-wine text-brand-gold flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        {log.userName ? log.userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-neutral-900">
                            {log.userName || log.userEmail?.split('@')[0] || 'Administrador'}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500 bg-white px-2 py-0.5 rounded-md border border-neutral-200">
                            {log.userEmail || 'rafaelhirofujii17@gmail.com'}
                          </span>
                          {log.category && (
                            <span className="text-[10px] font-bold text-brand-wine bg-brand-cream/60 px-2 py-0.5 rounded-md border border-brand-wine/20">
                              {log.category}
                            </span>
                          )}
                        </div>

                        {/* Metadados: Data/Hora, IP e Dispositivo */}
                        <div className="flex items-center gap-3 flex-wrap mt-1 text-[10px] text-neutral-500">
                          <span className="font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            {formatLogDate(log.timestamp)}
                          </span>

                          {log.userIp && (
                            <span className="font-mono flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-600">
                              <Globe className="w-3 h-3 text-indigo-500" />
                              IP: {log.userIp}
                            </span>
                          )}

                          {log.deviceInfo && (
                            <span className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-600">
                              <Laptop className="w-3 h-3 text-emerald-600" />
                              {log.deviceInfo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {changesCount} {changesCount === 1 ? 'campo alterado' : 'campos alterados'}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleExpandLog(log.id)}
                        className="p-1.5 hover:bg-neutral-200/60 rounded-lg text-neutral-500 transition-all cursor-pointer"
                        title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {onDeleteLog && (
                        <button
                          type="button"
                          onClick={() => onDeleteLog(log.id)}
                          className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                          title="Excluir este registro de log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Detailed Description Preview */}
                  {log.detailedDescription && (
                    <div className="p-3 bg-white rounded-xl border border-neutral-200/80 text-xs text-neutral-700 leading-relaxed font-sans space-y-1">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3 text-brand-gold" />
                        Resumo Narrativo das Alterações:
                      </span>
                      <p className="whitespace-pre-line text-neutral-800 text-[11px]">
                        {log.detailedDescription}
                      </p>
                    </div>
                  )}

                  {/* Changed Fields Diff List */}
                  {isExpanded && log.changedFields && log.changedFields.length > 0 && (
                    <div className="pt-2 border-t border-neutral-200/70 space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        {log.changedFields.map((change, idx) => (
                          <div 
                            key={idx}
                            className="bg-white p-3.5 rounded-xl border border-neutral-200/80 text-xs space-y-2 shadow-2xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                                  {change.fieldLabel || change.field}
                                </span>
                                {change.category && (
                                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                                    {change.category}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Old Value */}
                                <div className="flex items-center gap-1 bg-rose-50 border border-rose-200/80 text-rose-800 px-2.5 py-1 rounded-lg text-[11px] font-medium max-w-full overflow-hidden text-ellipsis">
                                  <span className="text-[9px] uppercase font-bold text-rose-500">De:</span>
                                  <span className="line-through opacity-80 break-all">{String(change.oldValue || '(vazio)')}</span>
                                </div>

                                <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />

                                {/* New Value */}
                                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 text-emerald-900 px-2.5 py-1 rounded-lg text-[11px] font-bold max-w-full overflow-hidden text-ellipsis shadow-xs">
                                  <span className="text-[9px] uppercase font-bold text-emerald-600">Para:</span>
                                  <span className="break-all">{String(change.newValue || '(vazio)')}</span>
                                </div>
                              </div>
                            </div>

                            {/* Deep impact description per field */}
                            {change.description && (
                              <p className="text-[10px] text-neutral-500 bg-neutral-50 p-2 rounded-lg border border-neutral-100 leading-normal">
                                💡 <strong>Impacto:</strong> {change.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
