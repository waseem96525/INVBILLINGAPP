import React, { useState } from "react";
import ProductCard from "@/components/ProductCard";
import Cart from "@/components/Cart";
import { Product, CartItem } from "@/types";
import { showSuccess } from "@/utils/toast";

// Dummy product data
const products: Product[] = [
  { id: "1", name: "Espresso", price: 3.50, image: "/placeholder.svg" },
  { id: "2", name: "Latte", price: 4.50, image: "/placeholder.svg" },
  { id: "3", name: "Cappuccino", price: 4.00, image: "/placeholder.svg" },
  { id: "4", name: "Croissant", price: 2.75, image: "/placeholder.svg" },
  { id: "5", name: "Muffin", price: 3.00, image: "/placeholder.svg" },
  { id: "6", name: "Orange Juice", price: 3.25, image: "/placeholder.svg" },
  { id: "7", name: "Sandwich", price: 7.00, image: "/placeholder.svg" },
  { id: "8", name: "Salad", price: 8.50, image: "/placeholder.svg" },
];

const POSPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handleAddToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
    showSuccess(`${product.name} added to cart!`);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setCartItems((prevItems) => {
      if (quantity <= 0) {
        return prevItems.filter((item) => item.id !== itemId);
      }
      return prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: quantity } : item
      );
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    showSuccess("Item removed from cart.");
  };

  const handleCheckout = () => {
    // In a real application, this would involve payment processing,
    // sending data to a backend, clearing the cart, etc.
    showSuccess("Checkout successful! Thank you for your purchase.");
    setCartItems([]); // Clear the cart after checkout
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 dark:bg-gray-900">
      {/* Product List */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Products</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="w-full lg:w-1/3 p-6 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
        <Cart
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  );
};

export default POSPage;