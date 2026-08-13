"use server";

import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { Category } from "@/types/category";

export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const response = await apiClient<{ data: Category }>(
      `${API_ROUTES.CATEGORY}/${id}`,
      { next: { tags: [`category-${id}`] } }
    );

    if (!response || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}
