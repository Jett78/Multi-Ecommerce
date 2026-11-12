"use server";

import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { FlashSale, ActiveFlashSaleProduct } from "@/types/flash-sale";

export async function getActiveFlashSales(): Promise<FlashSale[]> {
  try {
    const response = await apiClient<{ success: boolean; data: FlashSale[] }>(
      API_ROUTES.FLASH_SALE_ACTIVE,
      { next: { revalidate: 60 } }
    );
    return response.data || [];
  } catch (error) {
    console.error("Error fetching active flash sales:", error);
    return [];
  }
}

export async function getActiveFlashSaleProducts(): Promise<ActiveFlashSaleProduct[]> {
  try {
    const response = await apiClient<{ success: boolean; data: ActiveFlashSaleProduct[] }>(
      API_ROUTES.FLASH_SALE_ACTIVE_PRODUCTS,
      { next: { revalidate: 60 } }
    );
    return response.data || [];
  } catch (error) {
    console.error("Error fetching active flash sale products:", error);
    return [];
  }
}

export async function getFlashSaleById(id: string): Promise<FlashSale | null> {
  try {
    const response = await apiClient<{ success: boolean; data: FlashSale }>(
      `${API_ROUTES.FLASH_SALE}/${id}`
    );
    return response.data || null;
  } catch (error) {
    console.error("Error fetching flash sale:", error);
    return null;
  }
}

export async function getFlashSaleBySlug(slug: string): Promise<FlashSale | null> {
  try {
    const response = await apiClient<{ success: boolean; data: FlashSale }>(
      `${API_ROUTES.FLASH_SALE}/slug/${slug}`
    );
    return response.data || null;
  } catch (error) {
    console.error("Error fetching flash sale by slug:", error);
    return null;
  }
}
