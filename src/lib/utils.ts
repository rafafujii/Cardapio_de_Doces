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

/**
 * Strips out any `undefined` values and ensures Firestore write compatibility
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !('_methodName' in value)) {
        cleanObj[key] = cleanFirestoreData(value);
      } else {
        cleanObj[key] = value;
      }
    }
  }
  return cleanObj;
}
