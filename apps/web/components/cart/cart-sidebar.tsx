"use client";

import * as React from "react";
import Link from "next/link";
import { X, Plus, Minus, ArrowRight, Truck, Check } from "lucide-react";
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
          "mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
          selected
            ? "border-primarymain bg-primarymain text-white"
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </button>

      {/* Image */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
            IMG
          </div>
        )}
      </div>

      {/* Info + quantity */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 leading-tight">
          {item.productName}
        </h3>
        {item.attributes && item.attributes.length > 0 ? (
          <p className="mt-0.5 text-xs text-gray-500">
            {item.attributes.map((a) => `${a.attributeName}: ${a.attributeValue}`).join(", ")}
          </p>
        ) : item.variantSku ? (
          <p className="mt-0.5 text-xs text-gray-500">
            {item.variantSku}
          </p>
        ) : null}
        <div className="mt-2 inline-flex items-center rounded-lg border border-gray-200">
          <button
            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="px-2.5 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-sm font-bold text-primarymain">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
            className="px-2.5 py-1 text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Price + remove */}
      <div className="flex flex-col items-end gap-1">
        <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
          Rs {(item.priceAtAdd * item.quantity).toLocaleString()}
        </p>
        <button
          onClick={() => useCartStore.getState().removeItem(item.variantId)}
          className="text-xs text-gray-400 hover:text-red-500"
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
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (open) {
      setSelectedIds(new Set(items.map((i) => i.variantId)));
    }
  }, [open]);

  const handleToggleItem = (variantId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.add(variantId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.variantId)));
    }
  };

  const selectedItems = items.filter((i) => selectedIds.has(i.variantId));
  const total = selectedItems.reduce((sum, i) => sum + i.priceAtAdd * i.quantity, 0);
  const totalQty = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const allSelected = items.length > 0 && selectedIds.size === items.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header icon */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex-1" />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primarymain/10">
            <Truck className="h-6 w-6 text-primarymain" />
          </div>
          <button
            onClick={onClose}
            className="flex-1 flex justify-end"
          >
            <ArrowRight className="h-6 w-6 text-primarymain" />
          </button>
        </div>

        {/* Select All */}
        <div className="px-5 pb-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900"
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                allSelected
                  ? "border-primarymain bg-primarymain text-white"
                  : "border-gray-300"
              )}
            >
              {allSelected && <Check className="h-3 w-3" />}
            </span>
            Select All ({items.length}/{items.length})
          </button>
        </div>

        <div className="mx-5 border-t border-gray-100" />

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-semibold text-gray-900">Your cart is empty</p>
              <p className="mt-1 text-xs text-gray-500">Add items to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  selected={selectedIds.has(item.variantId)}
                  onToggle={() => handleToggleItem(item.variantId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">Rs {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Shipping</span>
              <span>Cost will appear on checkout</span>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-xl bg-primarymain py-3.5 text-sm font-bold text-white transition-colors hover:bg-primarymain/90"
            >
              CHECKOUT ({totalQty})
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
