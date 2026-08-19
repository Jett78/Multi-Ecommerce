"use server";

import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type {
  Order,
  OrderListResponse,
  OrderStats,
  CreateOrderPayload,
  CreateBuyNowOrderPayload,
} from "@/types/order";

export async function createOrderFromCart(
  payload: CreateOrderPayload
): Promise<Order | null> {
  try {
    const response = await apiClient<{ success: boolean; data: Order }>(
      API_ROUTES.ORDERS + "/checkout",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    if (!response || !response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

export async function createOrderFromBuyNow(
  payload: CreateBuyNowOrderPayload
): Promise<Order | null> {
  try {
    const response = await apiClient<{ success: boolean; data: Order }>(
      API_ROUTES.ORDERS + "/buy-now",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    if (!response || !response.success || !response.data) return null;
    return response.data;
  } catch (error) {
    console.error("Error creating buy now order:", error);
    throw error;
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
