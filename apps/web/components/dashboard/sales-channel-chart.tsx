"use client";

import { useState } from "react";
import { Monitor, Store } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface SalesChannelData {
  source: string;
  revenue: number;
  orders: number;
}

const COLORS = {
  web: "#3b82f6",
  pos: "#8b5cf6",
  unknown: "#94a3b8",
};

export function SalesChannelChart() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  const { getAll } = useCrud<SalesChannelData[]>({
    endpoint: `${API_ROUTES.DASHBOARD_SALES_CHANNEL}?period=${period}`,
    queryKey: "dashboard-sales-channel",
    isAuthenticated: true,
  });

  const { data, isLoading } = getAll();
  const channelData = (data as SalesChannelData[]) || [];

  const chartData = channelData.map((item) => ({
    name: item.source === "web" ? "Website" : item.source === "pos" ? "POS/Offline" : "Unknown",
    value: item.revenue,
    orders: item.orders,
    color: COLORS[item.source as keyof typeof COLORS] || COLORS.unknown,
  }));

  const totalRevenue = chartData.reduce((sum, d) => sum + d.value, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="bg-white p-6 rounded-md border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Monitor className="size-5 text-primary" />
          <h3 className="font-bold text-sm text-slate-900">Sales by Channel</h3>
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
      ) : chartData.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-slate-500">
          No sales data available for this period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => `Rs. ${Number(value).toLocaleString()}`}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    Rs. {item.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
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
          </div>
        </>
      )}
    </div>
  );
}
