"use client";

import * as React from "react";
import Link from "next/link";
import { X, Heart, Trash2 } from "lucide-react";
import { useWishlistStore } from "@/stores/wishlist-store";
import type { WishlistItem } from "@/types/wishlist";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

function WishlistItemRow({ item }: { item: WishlistItem }) {
  const removeItem = useWishlistStore((s) => s.removeItem);

  return (
    <div className="flex items-start gap-3 py-4">
      {/* Image */}
      <Link
        href={`/products/${item.productSlug}`}
        className="h-16 w-16 flex-shrink-0 overflow-hidden bg-gray-50 border border-gray-100"
      >
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
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.productSlug}`}
          className="text-sm font-medium text-gray-900 leading-tight line-clamp-1 hover:underline"
        >
          {item.productName}
        </Link>
        {item.attributes && item.attributes.length > 0 ? (
          <p className="mt-0.5 text-[11px] text-gray-400">
            {item.attributes.map((a) => `${a.attributeName}: ${a.attributeValue}`).join(", ")}
          </p>
        ) : null}
        <p className="mt-1 text-sm font-semibold text-gray-900">
          {formatPrice(item.price)}
        </p>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeItem(item.variantId)}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Remove from wishlist"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

interface WishlistSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function WishlistSidebar({ open, onClose }: WishlistSidebarProps) {
  const items = useWishlistStore((s) => s.items);

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
            <Heart className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-900">Wishlist</span>
            {items.length > 0 && (
              <span className="text-[11px] text-gray-400">({items.length})</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Heart className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-900">Your wishlist is empty</p>
              <p className="mt-1 text-xs text-gray-400">
                Save your favorite items here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map((item) => (
                <WishlistItemRow key={item.variantId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4">
            <Link
              href="/products"
              onClick={onClose}
              className="flex w-full items-center justify-center bg-primarymain py-3.5 text-sm font-bold text-white transition-colors hover:bg-primarymain/90"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
