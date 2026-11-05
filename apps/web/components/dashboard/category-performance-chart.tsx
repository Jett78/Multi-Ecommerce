"use client";

import { TrendingUp } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CategoryPerformanceData {
  categoryId: string | null;
  categoryName: string;
  revenue: number;
  orders: number;
  productsSold: number;
}

export function CategoryPerformanceChart() {
  const { getAll } = useCrud<CategoryPerformanceData[]>({
    endpoint: `${API_ROUTES.DASHBOARD_CATEGORY_PERFORMANCE}?limit=10`,
    queryKey: "dashboard-category-performance",
    isAuthenticated: true,
  });

  const { data, isLoading } = getAll();
  const categoryData = (data as CategoryPerformanceData[]) || [];

  const chartData = categoryData.map((item) => ({
    name: item.categoryName.length > 15 ? item.categoryName.substring(0, 15) + '...' : item.categoryName,
    revenue: item.revenue,
    orders: item.orders,
    productsSold: item.productsSold,
  }));

  return (
    <div className="bg-white p-6 rounded-md border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="size-5 text-primary" />
        <h3 className="font-bold text-sm text-slate-900">Top Categories by Revenue</h3>
      </div>

      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-slate-500">
          No category data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickFormatter={(value) => `Rs. ${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#64748b", fontSize: 12 }}
                width={120}
              />
              <Tooltip
                formatter={(value: any, name: any) => {
                  if (name === "revenue") {
                    return [`Rs. ${Number(value).toLocaleString()}`, "Revenue"];
                  }
                  return [value, name === "orders" ? "Orders" : "Products Sold"];
                }}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Revenue</p>
                <p className="text-lg font-bold text-primary mt-1">
                  Rs. {chartData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Orders</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">
                  {chartData.reduce((sum, d) => sum + d.orders, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Products Sold</p>
                <p className="text-lg font-bold text-amber-600 mt-1">
                  {chartData.reduce((sum, d) => sum + d.productsSold, 0)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
