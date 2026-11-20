"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartStore } from "@/types/cart";
import type { AppliedCoupon } from "@/types/coupon";

export type { CartItem, AppliedCoupon };

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      deliveryCharge: 0,
      deliveryProvider: null,
      estimatedDeliveryDays: null,
      selectedVariantIds: [],

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            const updatedItems = state.items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: Math.min(i.quantity + quantity, item.stockQuantity) }
                : i
            );
            return {
              items: updatedItems,
              selectedVariantIds: updatedItems.map((i) => i.variantId),
            };
          }
          const updatedItems = [...state.items, { ...item, quantity: Math.min(quantity, item.stockQuantity) }];
          return {
            items: updatedItems,
            selectedVariantIds: updatedItems.map((i) => i.variantId),
          };
        });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.min(quantity, i.stockQuantity) }
              : i
          ),
        }));
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },

      clearCart: () => {
        set({
          items: [],
          appliedCoupon: null,
          deliveryCharge: 0,
          deliveryProvider: null,
          estimatedDeliveryDays: null,
          selectedVariantIds: [],
        });
      },

      setSelectedVariantIds: (ids) => set({ selectedVariantIds: ids }),

      toggleSelectedVariant: (variantId) => set((state) => {
        const exists = state.selectedVariantIds.includes(variantId);
        return {
          selectedVariantIds: exists
            ? state.selectedVariantIds.filter((id) => id !== variantId)
            : [...state.selectedVariantIds, variantId],
        };
      }),

      selectAllVariants: () => set((state) => ({
        selectedVariantIds: state.items.map((i) => i.variantId),
      })),

      deselectAllVariants: () => set({ selectedVariantIds: [] }),

      getSelectedItems: () => {
        const state = get();
        return state.items.filter((i) => state.selectedVariantIds.includes(i.variantId));
      },

      itemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      subtotal: () => {
        return get().items.reduce((sum, i) => sum + i.priceAtAdd * i.quantity, 0);
      },

      setCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
      },

      removeCoupon: () => {
        set({ appliedCoupon: null });
      },

      setDeliveryCharge: (charge, provider = null, days = null) => {
        set({ deliveryCharge: charge, deliveryProvider: provider, estimatedDeliveryDays: days });
      },

      discountedTotal: () => {
        const subtotal = get().subtotal();
        const coupon = get().appliedCoupon;
        if (!coupon) return subtotal;
        return Math.max(0, subtotal - coupon.discountAmount);
      },

      totalWithDelivery: () => {
        const discounted = get().discountedTotal();
        const delivery = get().deliveryCharge;
        return discounted + delivery;
      },
    }),
    {
      name: "pos.cart.v2",
    }
  )
);

if (typeof window !== "undefined") {
  window.localStorage.removeItem("cart-store");
}
