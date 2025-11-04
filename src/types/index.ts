export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  category?: string; // e.g., "Clothing", "Jewelry", "Accessories"
  size?: string;    // e.g., "S", "M", "L", "XL", "One Size"
  color?: string;   // e.g., "Red", "Blue", "Gold"
  material?: string; // e.g., "Cotton", "Silver", "Leather"
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