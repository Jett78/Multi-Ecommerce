"use server";

import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { Coupon } from "@/types/coupon";

export async function getCouponById(id: string): Promise<Coupon | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await apiClient<{ data: Coupon }>(
      `${API_ROUTES.DISCOUNT}/${id}`,
      cookieHeader ? { headers: { Cookie: cookieHeader } } : {}
    );

    if (!response || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return null;
  }
}
