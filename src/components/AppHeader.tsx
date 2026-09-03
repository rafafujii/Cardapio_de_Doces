import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, History, LayoutGrid, Instagram, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { PWAInstallButton } from './PWAInstallButton';

interface AppHeaderProps {
  view: 'catalog' | 'admin' | 'tracking';
  setView: (view: 'catalog' | 'admin' | 'tracking') => void;
  isAdmin: boolean;
  instagramUrl?: string;
  cartCount: number;
  onOpenCart: () => void;
  enablePwaInstallPrompt?: boolean;
  adminDarkMode?: boolean;
  onToggleAdminDarkMode?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  view,
  setView,
  isAdmin,
  instagramUrl = "https://instagram.com/s.e_docesgourmet",
  cartCount,
  onOpenCart,
  enablePwaInstallPrompt = true,
  adminDarkMode = false,
  onToggleAdminDarkMode,
}) => {
  const isDark = view === 'admin' && adminDarkMode;

  return (
    <header className={cn(
      "sticky top-0 z-40 transition-colors duration-300 border-b shadow-sm backdrop-blur-md",
      isDark 
        ? "bg-[#181517]/90 border-neutral-800/80 text-neutral-100 shadow-black/30" 
        : "glass border-brand-wine/10 bg-white/85"
    )}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          onClick={() => setView('catalog')}
          className="flex flex-col cursor-pointer select-none group"
        >
          <h1 className={cn(
            "text-lg md:text-2xl font-black tracking-tighter leading-none group-hover:opacity-95 transition-opacity",
            isDark ? "text-amber-200" : "text-brand-wine"
          )}>
            S.E DOCES<span className="text-brand-gold">GOURMET</span>
          </h1>
          <p className={cn(
            "text-[10px] md:text-xs uppercase tracking-widest font-medium",
            isDark ? "text-neutral-400" : "text-neutral-500"
          )}>
            {view === 'admin' ? 'Painel do Vendedor' : 'Catálogo Exclusivo'}
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Admin Dark Mode Night Toggle Button */}
          {isAdmin && view === 'admin' && onToggleAdminDarkMode && (
            <button
              type="button"
              onClick={onToggleAdminDarkMode}
              className={cn(
                "p-2 rounded-full transition-all flex items-center gap-1.5 px-2.5 sm:px-3 text-xs font-bold border",
                adminDarkMode 
                  ? "bg-amber-400/15 text-amber-300 border-amber-400/30 hover:bg-amber-400/25 shadow-sm" 
                  : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
              )}
              title={adminDarkMode ? "Alternar para Modo Diurno / Claro" : "Ativar Modo Noturno (Reduz cansaço visual)"}
              aria-label="Alternar tema escuro do painel administrativo"
            >
              {adminDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span className="hidden sm:inline text-[11px] uppercase tracking-wider font-extrabold text-amber-300">Modo Noite</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline text-[11px] uppercase tracking-wider font-extrabold text-neutral-600">Modo Noite</span>
                </>
              )}
            </button>
          )}

          {/* PWA In-App Install Button */}
          {enablePwaInstallPrompt && <PWAInstallButton variant="header" />}

          <button 
            type="button"
            onClick={() => setView('tracking')}
            className={cn(
              "p-2 rounded-full transition-all flex items-center gap-1.5 px-3 text-xs font-bold",
              view === 'tracking' 
                ? "bg-brand-wine text-white shadow-sm" 
                : (isDark ? "text-neutral-300 hover:bg-neutral-800" : "text-brand-wine hover:bg-brand-wine/5")
            )}
            title="Meus Pedidos"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden md:inline">MEUS PEDIDOS</span>
          </button>

          {isAdmin && (
            <button 
              type="button"
              onClick={() => setView(view === 'catalog' ? 'admin' : 'catalog')}
              className={cn(
                "p-2 rounded-full transition-all",
                isDark ? "text-amber-200 hover:bg-neutral-800" : "text-brand-wine hover:bg-brand-wine/5"
              )}
              title={view === 'catalog' ? "Painel Administrativo" : "Ver Catálogo"}
            >
              {view === 'catalog' ? <History className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
          )}

          <a 
            href={instagramUrl} 
            target="_blank" 
            rel="noreferrer"
            className={cn(
              "p-2 transition-colors",
              isDark ? "text-neutral-400 hover:text-brand-gold" : "text-brand-wine hover:text-brand-gold"
            )}
            title="Instagram Oficial"
          >
            <Instagram className="w-5 h-5" />
          </a>
          
          <button 
            type="button"
            onClick={onOpenCart}
            className={cn(
              "relative p-2 rounded-full transition-all group",
              isDark ? "text-amber-200 hover:bg-neutral-800" : "text-brand-wine hover:bg-brand-wine/5"
            )}
            title="Ver Carrinho"
          >
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-brand-gold text-brand-wine text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
