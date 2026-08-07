"use server";

import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { Brand } from "@/types/brand";

interface BrandsApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Brand[];
}

export async function getBrands(): Promise<Brand[]> {
  try {
    const response = await apiClient<BrandsApiResponse>(
      `${API_ROUTES.BRAND}?sortBy=sortOrder&sortOrder=asc&isActive=true`,
      { next: { tags: ["brands"] } }
    );

    if (!response || !response.success || !response.data) return [];
    return response.data || [];
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
}

export async function getBrandById(id: string): Promise<Brand | null> {
  try {
    const response = await apiClient<{ data: Brand }>(
      `${API_ROUTES.BRAND}/${id}`,
      { next: { tags: [`brand-${id}`] } }
    );

    if (!response || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching brand:", error);
    return null;
  }
}
