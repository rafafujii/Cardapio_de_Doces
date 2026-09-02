import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div 
      id="offline-status-banner"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-[150] flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-3 text-xs font-semibold text-white shadow-2xl border border-amber-400/40 animate-in slide-in-from-bottom-4"
    >
      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <WifiOff className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="font-bold">Modo Offline Ativo</p>
        <p className="text-[11px] text-amber-100">Você está navegando pelo cardápio salvo no seu dispositivo.</p>
      </div>
    </div>
  );
};
