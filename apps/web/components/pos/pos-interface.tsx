"use client";

import { useState } from "react";
import { ProductSelector } from "./product-selector";
import { POSCart } from "./pos-cart";
import { POSCheckout } from "./pos-checkout";

export function POSInterface() {
  const [checkoutMode, setCheckoutMode] = useState(false);

  return (
    <div className="h-full flex">
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <ProductSelector />
      </div>

      <div className="w-[420px] border-l border-slate-200 bg-white flex flex-col">
        {checkoutMode ? (
          <POSCheckout onBack={() => setCheckoutMode(false)} />
        ) : (
          <POSCart onCheckout={() => setCheckoutMode(true)} />
        )}
      </div>
    </div>
  );
}
