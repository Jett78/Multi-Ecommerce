"use server";

import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { Product } from "@/types/product";

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const response = await apiClient<{ data: Product }>(
      `${API_ROUTES.PRODUCT}/${id}`,
      { next: { tags: [`product-${id}`] } }
    );

    if (!response || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const response = await apiClient<{ data: Product }>(
      `${API_ROUTES.PRODUCT}/slug/${slug}`,
      { next: { tags: [`product-${slug}`] } }
    );

    if (!response || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}

export async function getAllActiveProductSlugs(): Promise<string[]> {
  try {
    const response = await apiClient<{ data: { items: { slug: string }[] } }>(
      `${API_ROUTES.PRODUCT}?take=100&status=active`
    );

    return response.data?.items?.map((p) => p.slug) ?? [];
  } catch (error) {
    console.error("Error fetching product slugs:", error);
    return [];
  }
}

export async function getRelatedProducts(
  productId: string,
  limit: number = 8
): Promise<Product[]> {
  try {
    const response = await apiClient<{ data: Product[] }>(
      `${API_ROUTES.PRODUCT}/${productId}/related?limit=${limit}`,
      { next: { tags: [`product-${productId}`] } }
    );

    if (!response || !response.data) return [];
    return response.data;
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}
