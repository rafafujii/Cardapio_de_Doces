import React from 'react';
import { Instagram, LogIn, LogOut } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';

interface AppFooterProps {
  user: FirebaseUser | null;
  onLogin: () => void;
  onLogout: () => void;
  instagramUrl?: string;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  user,
  onLogin,
  onLogout,
  instagramUrl = "https://instagram.com/s.e_docesgourmet"
}) => {
  return (
    <footer className="mt-32 py-20 bg-brand-wine text-white text-center">
      <div className="max-w-xl mx-auto px-4 space-y-8">
        <div className="space-y-4">
          <h3 className="text-3xl font-serif italic text-brand-gold">Acompanhe nosso trabalho!</h3>
          <p className="text-brand-cream/70 font-light">Siga a gente no Instagram para ver encomendas reais, bastidores e novidades diárias.</p>
        </div>
        
        <a 
          href={instagramUrl} 
          target="_blank" 
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-gold text-brand-wine font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-wine/50"
        >
          <Instagram className="w-5 h-5" />
          SEGUIR NO INSTAGRAM
        </a>
        
        <div className="pt-12 border-t border-white/10 flex flex-col items-center gap-4">
          <div className="text-[10px] tracking-widest font-medium text-white/40 uppercase">
            © {new Date().getFullYear()} S.E DOCES GOURMET • TODOS OS DIREITOS RESERVADOS
          </div>
          
          {!user ? (
            <button 
              type="button"
              onClick={onLogin}
              className="text-[10px] text-white/30 hover:text-brand-gold transition-colors flex items-center gap-1 font-semibold"
            >
              <LogIn className="w-3 h-3" />
              ACESSO ADM
            </button>
          ) : (
            <div className="flex items-center gap-4 text-[10px]">
              <span className="text-white/40">{user.email}</span>
              <button 
                type="button"
                onClick={onLogout}
                className="text-white/30 hover:text-red-400 transition-colors flex items-center gap-1 font-semibold"
              >
                <LogOut className="w-3 h-3" />
                SAIR
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
