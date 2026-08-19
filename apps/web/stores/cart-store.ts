"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  variantId: string;
  quantity: number;
  priceAtAdd: number;
  productName: string;
  productSlug: string;
  variantSku: string | null;
  stockQuantity: number;
  allowBackorder: boolean;
  imageUrl?: string;
  productId: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

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
        set({ items: [] });
      },

      itemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      subtotal: () => {
        return get().items.reduce((sum, i) => sum + i.priceAtAdd * i.quantity, 0);
      },
    }),
    {
      name: "cart-store",
    }
  )
);
