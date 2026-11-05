"use client";

import { Package, TrendingUp } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";

interface TopProduct {
  productId: string | null;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export function TopProducts() {
  const { getAll } = useCrud<TopProduct[]>({
    endpoint: `${API_ROUTES.DASHBOARD_TOP_PRODUCTS}?limit=5`,
    queryKey: "dashboard-top-products",
    isAuthenticated: true,
  });

  const { data, isLoading } = getAll();
  const topProducts = (data as TopProduct[]) || [];

  return (
    <div className="bg-white p-6 rounded-md border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="size-5 text-primary" />
        <h3 className="font-bold text-sm text-slate-900">Top Selling Products</h3>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : topProducts.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <Package className="size-12 mx-auto mb-2 text-slate-300" />
          No sales data available yet
        </div>
      ) : (
        <div className="space-y-4">
          {topProducts.map((product, index) => (
            <div
              key={product.productId || index}
              className="flex items-start justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                    {index + 1}
                  </span>
                  <p className="font-medium text-sm text-slate-900 line-clamp-1">
                    {product.productName}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                  <span>
                    <span className="font-semibold text-slate-900">{product.totalQuantity}</span> sold
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-emerald-600">
                    Rs. {product.totalRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
