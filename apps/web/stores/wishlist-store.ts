"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WishlistItem, WishlistStore } from "@/types/wishlist";

export type { WishlistItem };

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      toggleItem: (item) => {
        const exists = get().items.some((i) => i.variantId === item.variantId);
        if (exists) {
          get().removeItem(item.variantId);
        } else {
          get().addItem(item);
        }
      },

      addItem: (item) => {
        const exists = get().items.some((i) => i.variantId === item.variantId);
        if (exists) return;
        set((state) => ({
          items: [...state.items, item],
        }));
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },

      hasItem: (variantId) => {
        return get().items.some((i) => i.variantId === variantId);
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      itemCount: () => {
        return get().items.length;
      },
    }),
    {
      name: "wishlist-store",
    }
  )
);
