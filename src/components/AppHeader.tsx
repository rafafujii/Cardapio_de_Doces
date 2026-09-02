import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, History, LayoutGrid, Instagram } from 'lucide-react';
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
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  view,
  setView,
  isAdmin,
  instagramUrl = "https://instagram.com/s.e_docesgourmet",
  cartCount,
  onOpenCart,
  enablePwaInstallPrompt = true,
}) => {
  return (
    <header className="sticky top-0 z-40 glass border-b border-brand-wine/10 shadow-sm bg-white/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          onClick={() => setView('catalog')}
          className="flex flex-col cursor-pointer select-none group"
        >
          <h1 className="text-lg md:text-2xl font-black text-brand-wine tracking-tighter leading-none group-hover:opacity-95 transition-opacity">
            S.E DOCES<span className="text-brand-gold">GOURMET</span>
          </h1>
          <p className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest font-medium">Catálogo Exclusivo</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA In-App Install Button */}
          {enablePwaInstallPrompt && <PWAInstallButton variant="header" />}

          <button 
            type="button"
            onClick={() => setView('tracking')}
            className={cn(
              "p-2 rounded-full transition-all flex items-center gap-1.5 px-3 text-xs font-bold",
              view === 'tracking' ? "bg-brand-wine text-white shadow-sm" : "text-brand-wine hover:bg-brand-wine/5"
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
              className="p-2 text-brand-wine hover:bg-brand-wine/5 rounded-full transition-all"
              title={view === 'catalog' ? "Painel Administrativo" : "Ver Catálogo"}
            >
              {view === 'catalog' ? <History className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
          )}

          <a 
            href={instagramUrl} 
            target="_blank" 
            rel="noreferrer"
            className="p-2 text-brand-wine hover:text-brand-gold transition-colors"
            title="Instagram Oficial"
          >
            <Instagram className="w-5 h-5" />
          </a>
          
          <button 
            type="button"
            onClick={onOpenCart}
            className="relative p-2 text-brand-wine hover:bg-brand-wine/5 rounded-full transition-all group"
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
