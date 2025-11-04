import React, { createContext, useState, useContext, ReactNode } from "react";
import { Product, SaleRecord, CartItem } from "@/types";

// Dummy product data for a clothing and jewelry shop
const initialProducts: Product[] = [
  { id: "1", name: "Men's T-Shirt", price: 799.00, image: "/placeholder.svg", stock: 50, size: "M", color: "Blue" },
  { id: "2", name: "Women's Jeans", price: 1999.00, image: "/placeholder.svg", stock: 40, size: "28", color: "Dark Wash" },
  { id: "3", name: "Silver Necklace", price: 2500.00, image: "/placeholder.svg", stock: 35, color: "Silver" },
  { id: "4", name: "Leather Belt", price: 850.00, image: "/placeholder.svg", stock: 60, size: "L", color: "Brown" },
  { id: "5", name: "Gold Earrings", price: 3200.00, image: "/placeholder.svg", stock: 45, color: "Gold" },
  { id: "6", name: "Summer Dress", price: 1200.00, image: "/placeholder.svg", stock: 70, size: "S", color: "Floral Print" },
  { id: "7", name: "Men's Watch", price: 4500.00, image: "/placeholder.svg", stock: 25, color: "Black" },
  { id: "8", name: "Scarf", price: 499.00, image: "/placeholder.svg", stock: 30, color: "Red" },
];

interface AppContextType {
  products: Product[];
  salesRecords: SaleRecord[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (productId: string, updatedFields: Partial<Product>) => void;
  recordSale: (sale: Omit<SaleRecord, "id" | "timestamp">) => void;
  updateProductStock: (itemId: string, quantitySold: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);

  const addProduct = (product: Omit<Product, "id">) => {
    const newProduct: Product = { ...product, id: String(products.length + 1) };
    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (productId: string, updatedFields: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updatedFields } : p))
    );
  };

  const recordSale = (sale: Omit<SaleRecord, "id" | "timestamp">) => {
    const newSale: SaleRecord = {
      ...sale,
      id: String(salesRecords.length + 1),
      timestamp: new Date().toISOString(),
    };
    setSalesRecords((prev) => [...prev, newSale]);

    // Update product stock
    sale.items.forEach(item => {
      updateProductStock(item.id, item.quantity);
    });
  };

  const updateProductStock = (itemId: string, quantitySold: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === itemId ? { ...p, stock: Math.max(0, p.stock - quantitySold) } : p
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        products,
        salesRecords,
        addProduct,
        updateProduct,
        recordSale,
        updateProductStock,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};