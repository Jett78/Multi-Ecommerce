"use client";

import * as React from "react";
import Link from "next/link";
import { X, Plus, Minus, Truck, Check } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import type { CartItem } from "@/types/cart";
import { cn } from "@/lib/utils";

function CartItemRow({
  item,
  selected,
  onToggle,
}: {
  item: CartItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  return (
    <div className="flex items-start gap-3 py-4">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          "mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center border transition-colors",
          selected
            ? "border-primarymain bg-primarymain text-white"
            : "border-gray-300 hover:border-gray-500"
        )}
      >
        {selected && <Check className="h-2.5 w-2.5" />}
      </button>

      {/* Image */}
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-300">
            IMG
          </div>
        )}
      </div>

      {/* Info + quantity */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 leading-tight line-clamp-1">
          {item.productName}
        </h3>
        {item.attributes && item.attributes.length > 0 ? (
          <p className="mt-0.5 text-[11px] text-gray-400">
            {item.attributes.map((a) => `${a.attributeName}: ${a.attributeValue}`).join(", ")}
          </p>
        ) : item.variantSku ? (
          <p className="mt-0.5 text-[11px] text-gray-400">
            {item.variantSku}
          </p>
        ) : null}
        <div className="mt-2 inline-flex items-center border border-gray-200">
          <button
            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="px-2 py-1 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-7 text-center text-xs font-semibold text-gray-900">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
            disabled={item.quantity >= item.stockQuantity}
            className="px-2 py-1 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Price + remove */}
      <div className="flex flex-col items-end gap-1">
        <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
          Rs {(item.priceAtAdd * item.quantity).toLocaleString()}
        </p>
        <button
          onClick={() => useCartStore.getState().removeItem(item.variantId)}
          className="text-[11px] text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function CartSidebar({ open, onClose }: CartSidebarProps) {
  const items = useCartStore((s) => s.items);
  const selectedVariantIds = useCartStore((s) => s.selectedVariantIds);
  const setSelectedVariantIds = useCartStore((s) => s.setSelectedVariantIds);
  const toggleSelectedVariant = useCartStore((s) => s.toggleSelectedVariant);
  const selectAllVariants = useCartStore((s) => s.selectAllVariants);
  const deselectAllVariants = useCartStore((s) => s.deselectAllVariants);

  React.useEffect(() => {
    if (open && items.length > 0 && selectedVariantIds.length === 0) {
      setSelectedVariantIds(items.map((i) => i.variantId));
    }
  }, [open]);

  const selectedItems = items.filter((i) => selectedVariantIds.includes(i.variantId));
  const total = selectedItems.reduce((sum, i) => sum + i.priceAtAdd * i.quantity, 0);
  const totalQty = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const allSelected = items.length > 0 && selectedVariantIds.length === items.length;

  const handleSelectAll = () => {
    if (allSelected) {
      deselectAllVariants();
    } else {
      selectAllVariants();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/30 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ease-out flex flex-col border-l border-gray-100",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Truck className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-900">Your Cart</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Select All */}
        {items.length > 0 && (
          <div className="px-5 py-3 border-b border-gray-50">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center border transition-colors",
                  allSelected
                    ? "border-primarymain bg-primarymain text-white"
                    : "border-gray-300"
                )}
              >
                {allSelected && <Check className="h-2.5 w-2.5" />}
              </span>
              Select all ({items.length})
            </button>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-gray-900">Your cart is empty</p>
              <p className="mt-1 text-xs text-gray-400">Add items to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map((item) => (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  selected={selectedVariantIds.includes(item.variantId)}
                  onToggle={() => toggleSelectedVariant(item.variantId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-500">Total</span>
              <span className="font-bold text-gray-900">Rs {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            {selectedVariantIds.length > 0 ? (
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex w-full items-center justify-center bg-primarymain py-3.5 text-sm font-bold text-white transition-colors hover:bg-primarymain/90"
              >
                CHECKOUT ({totalQty})
              </Link>
            ) : (
              <button
                disabled
                className="flex w-full items-center justify-center bg-gray-200 py-3.5 text-sm font-bold text-gray-400 cursor-not-allowed"
              >
                SELECT ITEMS TO CHECKOUT
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
