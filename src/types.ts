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
}
