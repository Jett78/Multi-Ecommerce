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

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity }],
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
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        }));
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null, deliveryCharge: 0, deliveryProvider: null, estimatedDeliveryDays: null });
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
      name: "cart-store",
    }
  )
);
