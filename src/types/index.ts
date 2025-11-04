export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  category: string; // New field for product category
  description?: string; // New optional field for product description
};

export type CartItem = Product & {
  quantity: number;
};

export type SaleRecord = {
  id: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  discount: number; // Added discount to sale record
  total: number;
  paymentMethod: string;
  customerName?: string;
};