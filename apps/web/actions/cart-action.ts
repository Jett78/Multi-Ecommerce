"use server";

import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { CartState, CartCountState } from "@/types/cart";

export async function getCart(sessionId?: string): Promise<CartState | null> {
  try {
    const searchParams = new URLSearchParams();
    if (sessionId) searchParams.set("sessionId", sessionId);

    const query = searchParams.toString();
    const url = query ? `${API_ROUTES.CART}?${query}` : API_ROUTES.CART;

    const response = await apiClient<{ success: boolean; data: CartState }>(url);

    if (!response || !response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching cart:", error);
    return null;
  }
}

export async function getCartCount(sessionId?: string): Promise<CartCountState | null> {
  try {
    const searchParams = new URLSearchParams();
    if (sessionId) searchParams.set("sessionId", sessionId);

    const query = searchParams.toString();
    const url = query ? `${API_ROUTES.CART_COUNT}?${query}` : API_ROUTES.CART_COUNT;

    const response = await apiClient<{ success: boolean; data: CartCountState }>(url);

    if (!response || !response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching cart count:", error);
    return null;
  }
}

export async function addToCart(
  variantId: string,
  quantity: number,
  sessionId?: string
): Promise<CartState | null> {
  try {
    const searchParams = new URLSearchParams();
    if (sessionId) searchParams.set("sessionId", sessionId);

    const query = searchParams.toString();
    const url = query ? `${API_ROUTES.CART}/items?${query}` : `${API_ROUTES.CART}/items`;

    const response = await apiClient<{ success: boolean; data: CartState }>(url, {
      method: "POST",
      body: JSON.stringify({ variantId, quantity }),
    });

    if (!response || !response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
}

export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<CartState | null> {
  try {
    const response = await apiClient<{ success: boolean; data: CartState }>(
      `${API_ROUTES.CART}/items/${itemId}`,
      {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      }
    );

    if (!response || !response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw error;
  }
}

export async function removeFromCart(itemId: string): Promise<void> {
  try {
    await apiClient<{ success: boolean }>(`${API_ROUTES.CART}/items/${itemId}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
}

export async function clearCart(cartId: string): Promise<void> {
  try {
    await apiClient<{ success: boolean }>(`${API_ROUTES.CART}/${cartId}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
}
