"use server";

import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";

export async function getCategories(): Promise<Category[]> {
  try {
    const response = await apiClient<{ data: Category[] }>(
      `${API_ROUTES.CATEGORY}?isActive=true&take=20`,
      { next: { revalidate: 300, tags: ["categories"] } }
    );
    return response?.data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const response = await apiClient<{ data: Product[] }>(
      `${API_ROUTES.PRODUCT}?isFeatured=true&status=active&take=10`,
      { next: { revalidate: 60, tags: ["products"] } }
    );
    return response?.data || [];
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

export async function getBestSellers(limit: number = 10): Promise<Product[]> {
  try {
    const response = await apiClient<{ data: Product[] }>(
      `${API_ROUTES.PRODUCT}/best-sellers?limit=${limit}`,
      { next: { revalidate: 60, tags: ["products"] } }
    );
    return response?.data || [];
  } catch (error) {
    console.error("Error fetching best sellers:", error);
    return [];
  }
}

export async function getNewArrivals(limit: number = 10): Promise<Product[]> {
  try {
    const response = await apiClient<{ data: Product[] }>(
      `${API_ROUTES.PRODUCT}?status=active&take=${limit}`,
      { next: { revalidate: 60, tags: ["products"] } }
    );
    return response?.data || [];
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    return [];
  }
}

export async function getYouMayAlsoLike(limit: number = 10): Promise<Product[]> {
  try {
    const response = await apiClient<{ data: Product[] }>(
      `${API_ROUTES.PRODUCT}?status=active&minRating=40&take=${limit}`,
      { next: { revalidate: 60, tags: ["products"] } }
    );
    return response?.data || [];
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    return [];
  }
}
