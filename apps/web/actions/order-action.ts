"use server";

import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type {
  Order,
  OrderListResponse,
  OrderStats,
  CreateOrderPayload,
} from "@/types/order";

import { ApiError } from "@/types/base-entity";

export async function getOrderByIdServer(id: string): Promise<Order | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await apiClient<{ success: boolean; data: Order }>(
      `${API_ROUTES.ORDERS}/${id}`,
      cookieHeader ? { headers: { Cookie: cookieHeader } } : {}
    );

    if (!response || !response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export async function createOrderFromCart(
  payload: CreateOrderPayload
): Promise<Order> {
  try {
    const response = await apiClient<{ success: boolean; data: Order }>(
      API_ROUTES.ORDERS + "/checkout",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    if (!response || !response.success || !response.data) {
      throw new Error("Failed to place order. Please try again.");
    }
    return response.data;
  } catch (error) {
    console.error("Order creation error:", error);
    if (error && typeof error === "object" && "message" in error) {
      const apiError = error as ApiError;
      if (!apiError.statusCode) {
        throw new Error(
          "We couldn't reach the server to place your order. Please check your connection and try again."
        );
      }
      throw new Error(apiError.message || "Failed to place order. Please try again.");
    }
    throw new Error("Failed to place order. Please try again.");
  }
}

export async function getMyOrders(
  page: number = 1,
  limit: number = 10
): Promise<OrderListResponse | null> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));

    const response = await apiClient<{ success: boolean; data: OrderListResponse }>(
      `${API_ROUTES.MY_ORDERS}?${searchParams.toString()}`
    );

    if (!response || !response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching my orders:", error);
    return null;
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const response = await apiClient<{ success: boolean; data: Order }>(
      `${API_ROUTES.ORDERS}/${id}`
    );

    if (!response || !response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export async function getAllOrders(
  page: number = 1,
  limit: number = 10,
  filters?: {
    status?: string;
    paymentMethod?: string;
    paymentStatus?: string;
  }
): Promise<OrderListResponse | null> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    if (filters?.status) searchParams.set("status", filters.status);
    if (filters?.paymentMethod) searchParams.set("paymentMethod", filters.paymentMethod);
    if (filters?.paymentStatus) searchParams.set("paymentStatus", filters.paymentStatus);

    const response = await apiClient<{ success: boolean; data: OrderListResponse }>(
      `${API_ROUTES.ORDERS}?${searchParams.toString()}`
    );

    if (!response || !response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return null;
  }
}

export async function updateOrderStatus(
  id: string,
  status: string
): Promise<Order | null> {
  try {
    const response = await apiClient<{ success: boolean; data: Order }>(
      `${API_ROUTES.ORDERS}/${id}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    );

    if (!response || !response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

export async function getOrderStats(): Promise<OrderStats | null> {
  try {
    const response = await apiClient<{ success: boolean; data: OrderStats }>(
      API_ROUTES.ORDER_STATS
    );

    if (!response || !response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return null;
  }
}
