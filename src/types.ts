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
  couponCode?: string;
  couponDiscount?: number;
  finalTotal?: number;
  phone?: string;
  isReadyBoxOrder?: boolean;
}

export interface Coupon {
  id?: string;
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  expirationDate?: string;
  active: boolean;
  showBanner?: boolean;
  bannerText?: string;
  createdAt?: any;
  updatedAt?: any;
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

export interface Review {
  id: string;
  productName: string;
  userName: string;
  userPhone?: string | null;
  userEmail?: string | null;
  orderId?: string | null;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  adminReply?: string;
  adminReplyAt?: any;
  createdAt: any;
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

export interface AuditLogChange {
  field: string;
  fieldLabel: string;
  category?: string;
  oldValue: any;
  newValue: any;
  description?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userEmail: string;
  userName: string;
  userIp?: string;
  deviceInfo?: string;
  category?: string;
  changedFields: AuditLogChange[];
  summary: string;
  detailedDescription?: string;
  timestamp: any;
}

export interface GlobalSettingsState {
  contactPhone: string;
  googleSheetId: string;
  pixKey: string;
  pickupAddress: string;
  businessHours: string;
  storeStatusText: string;
  storeStatusMode: 'open' | 'limited' | 'paused';
  announcementBanner: string;
  instagramUrl: string;
  minNoticeHours: number;
  blockedDates: string[];
  deliveryMode: 'pickup_only' | 'delivery_and_pickup';
  deliveryFeeType: 'fixed' | 'to_consult';
  deliveryFixedFee: number;
  freeDeliveryThreshold: number;
  enableVolumeDiscount: boolean;
  volumeDiscountMinItems: number;
  volumeDiscountPercent: number;
  volumeDiscountMessage: string;
  enableOrderSoundNotification: boolean;
  customWhatsAppTemplate: string;
  globalMinStockAlert: number;
  enableCoupons: boolean;
  enableReviewRewardCoupon: boolean;
  reviewRewardCouponCode: string;
  reviewRewardCouponDiscount: string;
  enablePostSaleFeedback: boolean;
  postSaleReviewTemplate?: string;
  // Grupo 1: #6 Wishlist / Favoritos
  enableWishlist?: boolean;
  // Grupo 1: #7 PWA & Instalação
  enablePwaInstallPrompt?: boolean;
  // Grupo 3: #3 Planejador Semanal de Produção
  enableProductionCalendar?: boolean;
  // Grupo 3: #4 Alerta de Estoque Crítico Preditivo
  enablePredictiveStockAlerts?: boolean;
  // Grupo 4: #3 Exportação de Relatórios & DRE Consolidado
  enableConsolidatedReports?: boolean;
  // Grupo 5: #2 Temas Sazonais
  seasonalTheme?: 'classic' | 'easter' | 'mothers_day' | 'christmas' | 'halloween';
  seasonalThemeBanner?: string;
}

