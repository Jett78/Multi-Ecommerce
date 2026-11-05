"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AnalyticsData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

export function AnalyticsChart() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  const { getAll } = useCrud<AnalyticsData[]>({
    endpoint: `${API_ROUTES.DASHBOARD_ANALYTICS}?period=${period}`,
    queryKey: "dashboard-analytics",
    isAuthenticated: true,
  });

  const { data, isLoading } = getAll();
  const analyticsData = (data as AnalyticsData[]) || [];

  const formattedData = analyticsData.map((item) => ({
    name: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: item.revenue,
    orders: item.orders,
    customers: item.customers,
  }));

  const totalRevenue = formattedData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = formattedData.reduce((sum, d) => sum + d.orders, 0);
  const totalCustomers = formattedData.reduce((sum, d) => sum + d.customers, 0);

  return (
    <div className="bg-white p-6 rounded-md border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          <h3 className="font-bold text-sm text-slate-900">Revenue & Orders Analytics</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPeriod("7d")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              period === "7d"
                ? "bg-primary text-primary-foreground"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setPeriod("30d")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              period === "30d"
                ? "bg-primary text-primary-foreground"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setPeriod("90d")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              period === "90d"
                ? "bg-primary text-primary-foreground"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            90 Days
          </button>
          <button
            onClick={() => setPeriod("1y")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              period === "1y"
                ? "bg-primary text-primary-foreground"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            1 Year
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : formattedData.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-slate-500">
          No data available for this period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={{ stroke: "#e2e8f0" }}
                tickFormatter={(value) => `Rs. ${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={{ stroke: "#e2e8f0" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: any, name: any) => {
                  const numValue = Number(value);
                  if (name === "revenue") {
                    return [`Rs. ${numValue.toLocaleString()}`, "Revenue"];
                  }
                  return [numValue, name === "orders" ? "Orders" : "Customers"];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                iconType="circle"
              />
              <Bar
                yAxisId="left"
                dataKey="revenue"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
                name="Revenue"
              />
              <Bar
                yAxisId="right"
                dataKey="orders"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
                name="Orders"
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium">Total Revenue</p>
              <p className="text-lg font-bold text-primary mt-1">
                Rs. {totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium">Total Orders</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">
                {totalOrders}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium">Unique Customers</p>
              <p className="text-lg font-bold text-amber-600 mt-1">
                {totalCustomers}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
