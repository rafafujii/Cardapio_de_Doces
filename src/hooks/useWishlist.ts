import { useState, useEffect, useCallback } from 'react';

const WISHLIST_STORAGE_KEY = 'se_doces_wishlist_ids';

export function useWishlist() {
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading wishlist from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch (e) {
      console.warn('Error saving wishlist to localStorage:', e);
    }
  }, [favoriteIds]);

  const isFavorite = useCallback((productId: number) => {
    return favoriteIds.includes(productId);
  }, [favoriteIds]);

  const toggleFavorite = useCallback((productId: number) => {
    setFavoriteIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  }, []);

  const clearWishlist = useCallback(() => {
    setFavoriteIds([]);
  }, []);

  return {
    favoriteIds,
    wishlistIds: favoriteIds,
    isFavorite,
    isWishlisted: isFavorite,
    toggleFavorite,
    toggleWishlist: toggleFavorite,
    clearWishlist,
    favoritesCount: favoriteIds.length,
    wishlistCount: favoriteIds.length
  };
}
