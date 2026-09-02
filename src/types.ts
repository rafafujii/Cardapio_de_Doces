export interface Product {
  id: number;
  category: string;
  name: string;
  priceCento: number | null;
  unitPrice: number | null;
  imageUrl: string;
  badge: string | null;
}

export interface CartItem extends Product {
  quantity: number;
  isUnitItem: boolean;
}

export interface CategoryGroup {
  category: string;
  items: Product[];
}

export interface OrderDetails {
  name: string;
  date: string;
  time: string;
  paymentMethod: "Pix" | "Dinheiro";
  changeAmount: string;
  notes: string;
  deliveryType?: "pickup" | "delivery";
  deliveryAddress?: string;
  deliveryFee?: number;
  discountAmount?: number;
  finalTotal?: number;
  phone?: string;
  isReadyBoxOrder?: boolean;
}

export interface QuickReplyPhrase {
  id: string;
  title: string;
  category: 'confirmacao' | 'lembrete' | 'pronto' | 'entrega' | 'pos_venda' | 'cobranca' | 'geral';
  template: string;
  isDefault?: boolean;
}

export interface ReadyBox {
  id: string;
  title: string;
  description: string;
  itemsCount: number;
  price: number;
  originalPrice?: number;
  quantityAvailable: number;
  imageUrl?: string;
  pickupUntilTime?: string;
  badgeText?: string;
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface CustomerNoteData {
  id?: string;
  customerPhone?: string;
  customerName: string;
  birthday?: string;
  notes: string;
  tags?: string[];
  favoriteFlavors?: string[];
  updatedAt?: any;
}

export interface CustomerCRMProfile {
  customerName: string;
  normalizedPhone: string;
  displayPhone: string;
  orderCount: number;
  totalSpent: number;
  averageTicket: number;
  firstOrderDate: string;
  lastOrderDate: string;
  lastOrderTime?: string;
  favoriteFlavors: { name: string; count: number }[];
  recentOrders: any[];
  notes?: CustomerNoteData;
  vipTier: 'gold' | 'frequent' | 'new';
}

export interface BatchPanIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

export interface BatchPanCalculation {
  id?: string;
  name: string;
  ingredients: BatchPanIngredient[];
  panCost: number;
  batchTotalWeightGrams?: number;
  sweetUnitWeightGrams?: number;
  calculatedYieldUnits: number;
  extraPackagingCostPerUnit: number;
  operationalCostPercent: number; // ex: 15%
  finalUnitCost: number;
  currentSalePrice: number;
  profitPerUnit: number;
  profitMarginPercent: number;
  totalBatchRevenue: number;
  totalBatchProfit: number;
  fixedMonthlyCostTarget?: number;
  breakEvenUnits?: number;
}
