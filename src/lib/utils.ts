import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function removeAcentos(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function getProductUnitPrice(product: { unitPrice?: number | null; priceCento?: number | null }): number {
  if (product.unitPrice && product.unitPrice > 0) return product.unitPrice;
  if (product.priceCento && product.priceCento > 0) return product.priceCento / 100;
  return 0;
}

export function calculateProductCost(
  productName: string, 
  productCosts: Record<string, number>, 
  ingredients: any[], 
  recipes: Record<string, any[]>
): number {
  const recipe = recipes[productName];
  if (recipe && recipe.length > 0) {
    const cost = recipe.reduce((total, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (!ing) return total;
      return total + (ing.costPerUnit * item.quantity);
    }, 0);
    return cost;
  }
  return productCosts[productName] || 0;
}
