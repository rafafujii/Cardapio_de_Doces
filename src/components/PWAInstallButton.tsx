import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'modal';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed PWA, do not show
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {variant === 'header' && (
        <button
          id="pwa-install-header-btn"
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 bg-brand-gold/15 text-brand-gold border border-brand-gold/40 hover:bg-brand-gold hover:text-brand-wine shadow-sm active:scale-95 ${className}`}
          title="Instalar App no Celular ou Computador"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-bold">Instalar App</span>
        </button>
      )}

      {variant === 'banner' && (
        <div 
          id="pwa-install-banner"
          className={`p-4 bg-gradient-to-r from-brand-wine via-[#3A070F] to-[#250308] border border-brand-gold/30 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-brand-gold" />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-gold">Instale o App S.E Doces Gourmet</p>
              <p className="text-xs text-neutral-300">Acesse o cardápio com 1 toque, pronta entrega ao vivo e faça pedidos direto da tela inicial.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="w-full sm:w-auto px-5 py-2.5 bg-brand-gold hover:bg-white text-brand-wine font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            {isInstalling ? 'Instalando...' : 'Instalar Agora'}
          </button>
        </div>
      )}

      {/* iOS Safari Guided Install Sheet */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-neutral-100 text-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-wine/10 flex items-center justify-center text-brand-wine">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-brand-wine text-lg">Instalar no iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Para adicionar o aplicativo à sua tela de início sem precisar de App Store:
            </p>

            <div className="space-y-2.5 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-wine text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p>Toque no botão <strong>Compartilhar</strong> (ícone do quadrado com a seta para cima) na barra do Safari.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-wine text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-wine text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p>Toque em <strong>Adicionar</strong> no canto superior direito.</p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 bg-brand-wine text-brand-gold font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-black transition-all"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
