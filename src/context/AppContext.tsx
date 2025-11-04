import React, { createContext, useState, useContext, ReactNode } from "react";
import { Product, SaleRecord, CartItem } from "@/types";

// Dummy product data for a clothing and jewelry shop
const initialProducts: Product[] = [
  { id: "1", name: "Blue Denim Jeans", price: 1200.00, image: "/placeholder.svg", stock: 30, category: "Clothing", size: "M", color: "Blue", material: "Denim" },
  { id: "2", name: "Cotton T-Shirt", price: 450.00, image: "/placeholder.svg", stock: 50, category: "Clothing", size: "L", color: "White", material: "Cotton" },
  { id: "3", name: "Silver Hoop Earrings", price: 800.00, image: "/placeholder.svg", stock: 20, category: "Jewelry", size: "One Size", color: "Silver", material: "Sterling Silver" },
  { id: "4", name: "Leather Belt", price: 600.00, image: "/placeholder.svg", stock: 40, category: "Accessories", size: "L", color: "Brown", material: "Leather" },
  { id: "5", name: "Floral Summer Dress", price: 1800.00, image: "/placeholder.svg", stock: 25, category: "Clothing", size: "S", color: "Multi-color", material: "Rayon" },
  { id: "6", name: "Gold Plated Necklace", price: 1500.00, image: "/placeholder.svg", stock: 15, category: "Jewelry", size: "One Size", color: "Gold", material: "Brass" },
  { id: "7", name: "Wool Scarf", price: 750.00, image: "/placeholder.svg", stock: 35, category: "Accessories", size: "One Size", color: "Grey", material: "Wool" },
  { id: "8", name: "Men's Formal Shirt", price: 950.00, image: "/placeholder.svg", stock: 28, category: "Clothing", size: "XL", color: "Light Blue", material: "Cotton Blend" },
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