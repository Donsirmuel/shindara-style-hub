export interface PriceTier {
  minQty: number;
  price: number;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  gender: 'men' | 'women' | 'unisex';
  sizes: string[];
  colors: string[];
  inStock: boolean;
  featured?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  latestCollection?: boolean;
  hotDeal?: boolean;
  rating?: number;
  reviewCount?: number;
  /** Bulk tiers from the API (min quantity → unit price). Absent in static demo. */
  tiers?: PriceTier[];
  /** Stock rollups from the API (sum / lowest variant). Absent in static demo. */
  stockTotal?: number;
  minStock?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  gender: 'men' | 'women' | 'all';
  image?: string;
}

export interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}
