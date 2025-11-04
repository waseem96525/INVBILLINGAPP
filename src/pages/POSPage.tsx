import React, { useState } from "react";
import ProductCard from "@/components/ProductCard";
import Cart from "@/components/Cart";
import ReceiptDialog from "@/components/ReceiptDialog";
import { Product, CartItem, SaleRecord } from "@/types";
import { showSuccess } from "@/utils/toast";
import { useAppContext } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const POSPage: React.FC = () => {
  const { products, recordSale, updateProductStock } = useAppContext();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [customerName, setCustomerName] = useState("");
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null);

  const handleAddToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity + 1 > product.stock) {
          showSuccess(`Cannot add more than ${product.stock} of ${product.name} (out of stock).`);
          return prevItems;
        }
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        if (product.stock === 0) {
          showSuccess(`${product.name} is out of stock.`);
          return prevItems;
        }
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
    showSuccess(`${product.name} added to cart!`);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setCartItems((prevItems) => {
      const productInCart = prevItems.find((item) => item.id === itemId);
      const originalProduct = products.find((p) => p.id === itemId);

      if (!productInCart || !originalProduct) return prevItems;

      if (quantity <= 0) {
        return prevItems.filter((item) => item.id !== itemId);
      }
      if (quantity > originalProduct.stock) {
        showSuccess(`Cannot add more than ${originalProduct.stock} of ${originalProduct.name} (out of stock).`);
        return prevItems;
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
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxRate = 0.18; // Example Indian GST rate (18%)
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const newSale: Omit<SaleRecord, "id" | "timestamp"> = {
      items: cartItems,
      subtotal,
      tax,
      total,
      paymentMethod,
      customerName: customerName || undefined,
    };

    recordSale(newSale); // This also updates product stock
    setLastSale({ ...newSale, id: String(Date.now()), timestamp: new Date().toISOString() }); // Mock ID for immediate display
    setIsReceiptOpen(true);
    setCartItems([]); // Clear the cart after checkout
    setCustomerName("");
    setPaymentMethod("Cash");
    showSuccess("Checkout successful!");
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Product List */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Products</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </div>

      {/* Cart and Billing */}
      <div className="w-full lg:w-1/3 p-6 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
        <Cart
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
        >
          <div className="space-y-4 p-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <Label htmlFor="customerName">Customer Name (Optional)</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod" className="w-full mt-1">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Cart>
      </div>
      <ReceiptDialog isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} sale={lastSale} />
    </div>
  );
};

export default POSPage;