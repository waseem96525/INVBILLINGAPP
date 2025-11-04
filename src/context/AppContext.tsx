import React, { createContext, useState, useContext, ReactNode } from "react";
import { Product, SaleRecord, CartItem } from "@/types";

// Initial product data for a clothing and jewelry shop
const initialProducts: Product[] = [
  { id: "1", name: "Blue Denim Jeans", price: 1200.00, image: "/placeholder.svg", stock: 30, category: "Apparel", description: "Classic fit, 100% cotton denim." },
  { id: "2", name: "Gold Plated Necklace", price: 2500.00, image: "/placeholder.svg", stock: 15, category: "Jewelry", description: "Elegant design with cubic zirconia." },
  { id: "3", name: "Cotton T-Shirt (White)", price: 450.00, image: "/placeholder.svg", stock: 100, category: "Apparel", description: "Soft and breathable, perfect for everyday wear." },
  { id: "4", name: "Silver Hoop Earrings", price: 800.00, image: "/placeholder.svg", stock: 25, category: "Jewelry", description: "Sterling silver, lightweight and stylish." },
  { id: "5", name: "Leather Belt (Brown)", price: 700.00, image: "/placeholder.svg", stock: 40, category: "Accessories", description: "Genuine leather, durable and versatile." },
  { id: "6", name: "Floral Summer Dress", price: 1800.00, image: "/placeholder.svg", stock: 20, category: "Apparel", description: "Lightweight fabric, ideal for warm weather." },
  { id: "7", name: "Diamond Studs (Pair)", price: 15000.00, image: "/placeholder.svg", stock: 5, category: "Jewelry", description: "Small, elegant diamond studs." },
  { id: "8", name: "Wool Scarf (Grey)", price: 950.00, image: "/placeholder.svg", stock: 35, category: "Accessories", description: "Warm and soft, 100% merino wool." },
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

export const AppContextProvider = ({ children }: { ReactNode }) => {
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