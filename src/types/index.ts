export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  size?: string; // Added size to product type
  color?: string; // Added color to product type
};

export type CartItem = Product & {
  quantity: number;
};

export type SaleRecord = {
  id: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
};

export type ShopDetails = {
  name: string;
  address: string;
  phone: string;
  email: string;
};