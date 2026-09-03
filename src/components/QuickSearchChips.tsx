import React from 'react';
import { Search, X, Heart } from 'lucide-react';
import { cn } from '../lib/utils';

export interface FilterChipItem {
  id?: string;
  label: string;
  value: string;
  isSpecial?: boolean;
}

interface QuickSearchChipsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectChip: (chip: string) => void;
  favoritesCount?: number;
  showWishlist?: boolean;
  isWishlistOnly?: boolean;
  onToggleWishlistFilter?: () => void;
  additionalChips?: FilterChipItem[];
}

export const QuickSearchChips: React.FC<QuickSearchChipsProps> = ({
  searchTerm,
  onSearchChange,
  onSelectChip,
  favoritesCount = 0,
  showWishlist = true,
  isWishlistOnly = false,
  onToggleWishlistFilter,
  additionalChips = []
}) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const isMaisVendidosActive = !isWishlistOnly && (
    normalizedSearch === 'mais vendidos' || 
    normalizedSearch === 'mais vendido' || 
    normalizedSearch === 'destaques' ||
    normalizedSearch === 'destaque'
  );

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
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer"
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

        {/* 1. Mais Vendidos Chip */}
        <button
          type="button"
          onClick={() => {
            if (isMaisVendidosActive) {
              onSearchChange('');
            } else {
              onSelectChip('Mais Vendidos');
            }
          }}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 active:scale-95 flex items-center gap-1.5 cursor-pointer",
            isMaisVendidosActive
              ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm ring-2 ring-brand-gold/30 font-black"
              : "bg-gradient-to-r from-red-50 to-amber-50 text-red-700 border-red-200 hover:border-red-300 hover:shadow-xs"
          )}
          title={isMaisVendidosActive ? "Limpar filtro Mais Vendidos" : "Filtrar por mais vendidos"}
        >
          <span>🔥 Mais Vendidos</span>
        </button>

        {/* 2. Meus Favoritos Filter Button */}
        {showWishlist && onToggleWishlistFilter && (
          <button
            type="button"
            onClick={onToggleWishlistFilter}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 active:scale-95 flex items-center gap-1.5 cursor-pointer",
              isWishlistOnly
                ? "bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300 font-black"
                : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50 hover:border-rose-300 shadow-xs"
            )}
            title={isWishlistOnly ? "Ver catálogo completo" : "Filtrar e mostrar somente os doces que você favoritou"}
          >
            <Heart className={cn("w-3.5 h-3.5 transition-transform", isWishlistOnly ? "fill-white text-white scale-110" : "fill-rose-500 text-rose-500")} />
            <span>Meus Favoritos</span>
            {favoritesCount > 0 && (
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-black leading-none",
                isWishlistOnly ? "bg-white text-rose-600" : "bg-rose-100 text-rose-800"
              )}>
                {favoritesCount}
              </span>
            )}
          </button>
        )}

        {/* 3. Any additional / future custom chips */}
        {additionalChips.map((chip) => {
          const isActive = !isWishlistOnly && searchTerm.toLowerCase() === chip.value.toLowerCase();
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => {
                if (isActive) {
                  onSearchChange('');
                } else {
                  onSelectChip(chip.value);
                }
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 active:scale-95 cursor-pointer",
                isActive
                  ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm ring-2 ring-brand-gold/30 font-bold"
                  : chip.isSpecial
                  ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border-amber-200 hover:border-amber-300"
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


