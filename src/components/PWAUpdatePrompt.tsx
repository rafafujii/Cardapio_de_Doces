import React, { useState } from 'react';
import { RefreshCw, Sparkles, X, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { usePWAUpdate } from '../hooks/usePWAUpdate';
import { cn } from '../lib/utils';

export const PWAUpdatePrompt: React.FC = () => {
  const { needRefresh, isChecking, updateApp, dismissUpdate } = usePWAUpdate();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!needRefresh) {
    return null;
  }

  const handleUpdate = async () => {
    setIsUpdating(true);
    await updateApp();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-[999] max-w-md w-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="p-4 bg-gradient-to-r from-brand-wine via-[#3E0911] to-[#250308] text-white rounded-2xl shadow-2xl border-2 border-brand-gold/40 flex flex-col gap-3 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/20 border border-brand-gold/50 flex items-center justify-center shrink-0 text-brand-gold mt-0.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-gold flex items-center gap-1.5">
                <span>Nova versão disponível!</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.2 bg-brand-gold/20 text-brand-gold rounded-full border border-brand-gold/30">
                  Atualização
                </span>
              </h4>
              <p className="text-xs text-neutral-200 mt-1 leading-relaxed">
                Novas alterações, recursos e correções foram publicados. Atualize o aplicativo agora para carregar a versão mais recente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissUpdate}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Lembrar mais tarde"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={dismissUpdate}
            className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white font-medium transition-colors cursor-pointer"
          >
            Depois
          </button>
          
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isUpdating || isChecking}
            className="px-4 py-2 bg-brand-gold hover:bg-amber-400 text-brand-wine font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isUpdating ? "animate-spin" : "")} />
            <span>{isUpdating ? 'Atualizando...' : 'Atualizar Agora'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface PWAStatusManagerProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAStatusManager: React.FC<PWAStatusManagerProps> = ({ className = '', variant = 'full' }) => {
  const { isChecking, lastChecked, checkForUpdate, forceHardReset, needRefresh, updateApp } = usePWAUpdate();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleCheck = async () => {
    setFeedbackMessage(null);
    const hasUpdate = await checkForUpdate();
    if (hasUpdate) {
      setFeedbackMessage('Nova versão encontrada! O aplicativo está pronto para atualizar.');
    } else {
      setFeedbackMessage('O aplicativo já está na versão mais recente!');
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  const handleHardReset = async () => {
    if (window.confirm('Isso irá limpar todo o cache local e forçar o recarregamento dos arquivos mais recentes do servidor. Deseja continuar?')) {
      setIsResetting(true);
      await forceHardReset();
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2 text-xs", className)}>
        <button
          type="button"
          onClick={handleCheck}
          disabled={isChecking}
          className="text-neutral-500 hover:text-brand-wine flex items-center gap-1 font-medium transition-colors cursor-pointer"
          title="Verificar se há atualizações do app"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isChecking ? "animate-spin text-brand-wine" : "")} />
          <span>Verificar Atualizações</span>
        </button>
        {feedbackMessage && (
          <span className="text-[11px] text-emerald-600 font-bold animate-in fade-in">
            {feedbackMessage}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-wine/10 text-brand-wine rounded-xl">
            <RefreshCw className={cn("w-4 h-4", isChecking ? "animate-spin" : "")} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-neutral-800 dark:text-neutral-100">
              Sincronização & Atualizações do App (PWA)
            </h5>
            <p className="text-[11px] text-neutral-500">
              {lastChecked 
                ? `Última verificação: ${lastChecked.toLocaleDateString('pt-BR')} às ${lastChecked.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Verificação automática ativa ao abrir o app'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {needRefresh ? (
            <button
              type="button"
              onClick={updateApp}
              className="px-3.5 py-2 bg-brand-gold text-brand-wine font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instalar Atualização</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCheck}
              disabled={isChecking}
              className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isChecking ? "animate-spin" : "")} />
              <span>{isChecking ? 'Verificando...' : 'Buscar Atualizações'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleHardReset}
            disabled={isResetting}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Limpar todos os caches antigos do navegador e forçar o download dos novos arquivos"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>{isResetting ? 'Limpando...' : 'Limpar Cache & Forçar'}</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedbackMessage}</span>
        </div>
      )}
    </div>
  );
};
