import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SaleRecord } from "@/types";

interface ReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleRecord | null;
}

const ReceiptDialog: React.FC<ReceiptDialogProps> = ({ isOpen, onClose, sale }) => {
  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Receipt</DialogTitle>
          <DialogDescription className="text-center">Thank you for your purchase!</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">Order ID: {sale.id}</p>
          <p className="text-sm text-muted-foreground mb-4">Date: {new Date(sale.timestamp).toLocaleString()}</p>

          {sale.customerName && (
            <p className="text-sm text-muted-foreground mb-4">Customer: {sale.customerName}</p>
          )}

          <Separator className="my-4" />

          <div className="space-y-2">
            {sale.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.name} x {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex justify-between font-medium">
              <span>Subtotal:</span>
              <span>₹{sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Tax:</span>
              <span>₹{sale.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold mt-2">
              <span>Total:</span>
              <span>₹{sale.total.toFixed(2)}</span>
            </div>
          </div>

          <Separator className="my-4" />

          <p className="text-center text-sm text-muted-foreground">Payment Method: {sale.paymentMethod}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptDialog;