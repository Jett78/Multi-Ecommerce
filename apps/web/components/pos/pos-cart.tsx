"use client";

import { ShoppingCart, Plus, Minus, X } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface POSCartProps {
  onCheckout: () => void;
}

export function POSCart({ onCheckout }: POSCartProps) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.subtotal());

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-5 text-slate-600" />
          <h2 className="font-bold text-lg">Current Sale</h2>
          <span className="text-sm text-slate-500">({itemCount} items)</span>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <ShoppingCart className="size-16 mb-3" />
            <p>Cart is empty</p>
            <p className="text-sm">Add products to start a sale</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.variantId}
              className="bg-slate-50 rounded-lg p-3 space-y-2"
            >
              <div className="flex gap-3">
                {item.imageUrl && (
                  <div className="size-16 bg-white rounded flex-shrink-0 relative overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-slate-900 line-clamp-2">
                    {item.productName}
                  </h4>
                  {item.variantName && (
                    <p className="text-xs text-slate-500">{item.variantName}</p>
                  )}
                  <p className="text-sm font-bold text-primary mt-1">
                    Rs. {item.priceAtAdd.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200">
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="p-2 hover:bg-slate-50 rounded-l-lg"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="px-3 font-medium min-w-[3ch] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    disabled={item.quantity >= item.stockQuantity}
                    className="p-2 hover:bg-slate-50 rounded-r-lg disabled:opacity-50"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <p className="font-bold text-slate-900">
                  Rs. {(item.priceAtAdd * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-200 p-4 space-y-3 bg-white">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium">Rs. {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">Rs. {subtotal.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full bg-primarymain text-white py-3 rounded-lg font-bold text-lg hover:bg-primarymain/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
