"use client";

import * as React from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

export function CartIcon({ onClick }: { onClick?: () => void }) {
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  return (
    <button
      onClick={onClick}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primarymain text-[10px] font-bold text-white">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}

export function dispatchOpenCart() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("open-cart"));
  }
}
