export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number; // Added stock to product type
};

export type CartItem = Product & {
  quantity: number;
};

export type SaleRecord = {
  id: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
};