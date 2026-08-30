"use server";

import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { Banner } from "@/types/banner";

interface BannersApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Banner[];
}

export async function getBanners(): Promise<Banner[]> {
  try {
    const response = await apiClient<BannersApiResponse>(
      `${API_ROUTES.BANNER}?sortBy=sortOrder&sortOrder=asc&isActive=true&take=10`,
      { next: { tags: ["banners"] } }
    );

    if (!response || !response.success || !response.data) return [];
    return response.data || [];
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
}

export async function getBannerById(id: string): Promise<Banner | null> {
  try {
    const response = await apiClient<{ data: Banner }>(
      `${API_ROUTES.BANNER}/${id}`,
      { next: { tags: [`banner-${id}`] } }
    );

    if (!response || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching banner:", error);
    return null;
  }
}
