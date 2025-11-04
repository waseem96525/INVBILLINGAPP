import React, { createContext, useState, useContext, ReactNode } from "react";
import { Product, SaleRecord, CartItem } from "@/types";

// Dummy product data with stock
const initialProducts: Product[] = [
  { id: "1", name: "Espresso", price: 3.50, image: "/placeholder.svg", stock: 50 },
  { id: "2", name: "Latte", price: 4.50, image: "/placeholder.svg", stock: 40 },
  { id: "3", name: "Cappuccino", price: 4.00, image: "/placeholder.svg", stock: 35 },
  { id: "4", name: "Croissant", price: 2.75, image: "/placeholder.svg", stock: 60 },
  { id: "5", name: "Muffin", price: 3.00, image: "/placeholder.svg", stock: 45 },
  { id: "6", name: "Orange Juice", price: 3.25, image: "/placeholder.svg", stock: 70 },
  { id: "7", name: "Sandwich", price: 7.00, image: "/placeholder.svg", stock: 25 },
  { id: "8", name: "Salad", price: 8.50, image: "/placeholder.svg", stock: 30 },
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