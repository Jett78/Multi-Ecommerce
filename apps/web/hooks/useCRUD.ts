"use client";

import { apiClient } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CrudOptions } from "@/types/hooks";

interface GetAllOptions {
  timeout?: number;
}

export function useCrud<T>({
  endpoint,
  queryKey,
  isAuthenticated,
}: CrudOptions<T>) {
  const queryClient = useQueryClient();

  const getAll = (params?: Record<string, string | number | boolean>, options?: GetAllOptions) => {
    const queryString = params
      ? "?" +
        Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== "")
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join("&")
      : "";

    return useQuery({
      queryKey: [queryKey, params],
      queryFn: async () => {
        const response = await apiClient<any>(`${endpoint}${queryString}`, { isAuthenticated, timeout: options?.timeout });
        // Handle paginated response format: { data: { data: [...], total, skip, take, hasMore } }
        if (response?.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        // Handle direct array response
        if (Array.isArray(response?.data)) {
          return response.data;
        }
        return [];
      },
    });
  };

  const getAllPaginated = (params?: Record<string, string | number | boolean>, options?: GetAllOptions) => {
    const queryString = params
      ? "?" +
        Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== "")
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join("&")
      : "";

    return useQuery({
      queryKey: [queryKey, "paginated", params],
      queryFn: async () => {
        const response = await apiClient<any>(`${endpoint}${queryString}`, { isAuthenticated, timeout: options?.timeout });
        // Nested paginated format: { data: { data: [...], total, skip, take, hasMore } }
        const nested = !!(response?.data?.data && Array.isArray(response.data.data));
        const items = nested
          ? response.data.data
          : Array.isArray(response?.data)
            ? response.data
            : [];
        return {
          items,
          // Flat format: { data: [...], total, skip, take, hasMore }
          total: response?.total ?? (nested ? response.data.total : undefined) ?? items.length,
          skip: response?.skip ?? (nested ? response.data.skip : undefined) ?? 0,
          take: response?.take ?? (nested ? response.data.take : undefined) ?? items.length,
          hasMore: response?.hasMore ?? (nested ? response.data.hasMore : undefined) ?? false,
        };
      },
    });
  };

  const getOne = (id: string | number) =>
    useQuery({
      queryKey: [queryKey, id],
      queryFn: async () => {
        const response = await apiClient<any>(`${endpoint}/${id}`);
        // Handle response format: { data: {...} }
        if (response?.data) {
          return response.data;
        }
        return response;
      },
      enabled: !!id,
    });

  const create = useMutation({
    mutationFn: (data: T) =>
      apiClient(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
        isAuthenticated: isAuthenticated,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: T }) =>
      apiClient(`${endpoint}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        isAuthenticated: isAuthenticated,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const put = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: T }) =>
      apiClient(`${endpoint}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        isAuthenticated: isAuthenticated,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string | number) =>
      apiClient(`${endpoint}/${id}`, {
        method: "DELETE",
        isAuthenticated: isAuthenticated,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  return {
    getAll,
    getAllPaginated,
    getOne,
    create,
    update,
    remove,
    put,
  };
}
