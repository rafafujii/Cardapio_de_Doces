import React from 'react';
import { Search, X, Sparkles, Flame, Heart } from 'lucide-react';
import { cn } from '../lib/utils';

interface QuickSearchChipsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectChip: (chip: string) => void;
  favoritesCount?: number;
  showWishlist?: boolean;
  isWishlistOnly?: boolean;
  onToggleWishlistFilter?: () => void;
}

const POPULAR_CHIPS = [
  { label: '🔥 Mais Vendidos', value: 'Mais Vendidos', isSpecial: true },
  { label: 'Brigadeiro', value: 'Brigadeiro' },
  { label: 'Ninho com Nutella', value: 'Ninho' },
  { label: 'Surpresa de Uva', value: 'Uva' },
  { label: 'Beijinho', value: 'Beijinho' },
  { label: 'Bombons', value: 'Bombom' },
  { label: 'Copos da Felicidade', value: 'Copo da Felicidade' },
  { label: 'Cone Trufado', value: 'Cone' }
];

export const QuickSearchChips: React.FC<QuickSearchChipsProps> = ({
  searchTerm,
  onSearchChange,
  onSelectChip,
  favoritesCount = 0,
  showWishlist = true,
  isWishlistOnly = false,
  onToggleWishlistFilter
}) => {
  return (
    <div className="space-y-3 mb-6">
      {/* Search Input */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-brand-wine transition-colors" />
        <input 
          type="text" 
          placeholder="O que deseja saborear hoje? (ex: Brigadeiro, Uva, Bombom...)"
          className="w-full pl-12 pr-10 py-3.5 bg-white border border-neutral-200 rounded-2xl focus:outline-none focus:border-brand-wine focus:ring-4 focus:ring-brand-wine/5 transition-all text-sm md:text-base shadow-sm text-neutral-800 placeholder:text-neutral-400"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all"
            title="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestion & Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] uppercase font-bold text-neutral-400 whitespace-nowrap pl-1">
          Filtros:
        </span>

        {/* Favorite items filter button */}
        {showWishlist && onToggleWishlistFilter && (
          <button
            type="button"
            onClick={onToggleWishlistFilter}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all border shrink-0 active:scale-95 flex items-center gap-1.5",
              isWishlistOnly
                ? "bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-200"
                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", isWishlistOnly ? "fill-white text-white" : "fill-rose-500 text-rose-500")} />
            <span>Favoritos</span>
            {favoritesCount > 0 && (
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                isWishlistOnly ? "bg-white text-rose-600" : "bg-rose-200 text-rose-800"
              )}>
                {favoritesCount}
              </span>
            )}
          </button>
        )}

        {POPULAR_CHIPS.map((chip) => {
          const isActive = !isWishlistOnly && searchTerm.toLowerCase() === chip.value.toLowerCase();
          return (
            <button
              key={chip.value}
              onClick={() => {
                if (isActive) {
                  onSearchChange('');
                } else {
                  onSelectChip(chip.value);
                }
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 active:scale-95",
                isActive
                  ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                  : chip.isSpecial
                  ? "bg-gradient-to-r from-red-50 to-amber-50 text-red-700 border-red-200 hover:border-red-300"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-brand-wine/30 hover:bg-neutral-50"
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

