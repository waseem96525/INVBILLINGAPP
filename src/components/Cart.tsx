import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "@/types";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: (discount: number) => void; // Modified to pass discount
  children?: React.ReactNode;
  discount: number; // New prop for discount percentage
  onDiscountChange: (discount: number) => void; // New prop for discount change handler
}

const Cart: React.FC<CartProps> = ({ cartItems, onUpdateQuantity, onRemoveItem, onCheckout, children, discount, onDiscountChange }) => {
  const subtotalBeforeDiscount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = subtotalBeforeDiscount * (discount / 100);
  const subtotal = subtotalBeforeDiscount - discountAmount;
  const taxRate = 0.18; // Example Indian GST rate (18%)
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <Card className="w-full max-w-md h-full flex flex-col rounded-lg">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-2xl font-bold">Your Cart</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        {cartItems.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">Cart is empty.</p>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)] p-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center space-x-3">
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">₹{item.price.toFixed(2)} x {item.quantity}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="h-8 w-8"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onRemoveItem(item.id)}
                    className="ml-2 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>
        )}
      </CardContent>
      {children}
      <div className="space-y-4 p-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <Label htmlFor="discount">Discount (%)</Label>
          <Input
            id="discount"
            type="number"
            min="0"
            max="100"
            placeholder="0"
            value={discount}
            onChange={(e) => onDiscountChange(Number(e.target.value))}
            className="mt-1"
          />
        </div>
      </div>
      <CardFooter className="flex flex-col p-4 border-t">
        <div className="w-full flex justify-between text-lg font-medium mb-2">
          <span>Subtotal:</span>
          <span>₹{subtotalBeforeDiscount.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="w-full flex justify-between text-lg font-medium text-red-500 mb-2">
            <span>Discount ({discount}%):</span>
            <span>-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="w-full flex justify-between text-lg font-medium mb-2">
          <span>Subtotal (after discount):</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="w-full flex justify-between text-lg font-medium mb-4">
          <span>Tax ({(taxRate * 100).toFixed(0)}%):</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        <Separator className="my-4" />
        <div className="w-full flex justify-between text-2xl font-bold mb-4">
          <span>Total:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
        <Button onClick={() => onCheckout(discount)} className="w-full py-3 text-lg" disabled={cartItems.length === 0}>
          Checkout
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Cart;