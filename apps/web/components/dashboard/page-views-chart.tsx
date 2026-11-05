"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PageViewsData {
  date: string;
  views: number;
  uniqueVisitors: number;
}

export function PageViewsChart() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  const { getAll } = useCrud<PageViewsData[]>({
    endpoint: `${API_ROUTES.PAGE_VIEWS_ANALYTICS}?period=${period}`,
    queryKey: "page-views-analytics",
    isAuthenticated: true,
  });

  const { data, isLoading } = getAll();
  const pageViewsData = (data as PageViewsData[]) || [];

  const formattedData = pageViewsData.map((item) => ({
    name: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    views: item.views,
    visitors: item.uniqueVisitors,
  }));

  const totalViews = formattedData.reduce((sum, d) => sum + d.views, 0);
  const totalVisitors = formattedData.reduce((sum, d) => sum + d.visitors, 0);

  return (
    <div className="bg-white p-6 rounded-md border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Eye className="size-5 text-primary" />
          <h3 className="font-bold text-sm text-slate-900">Page Views Analytics</h3>
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
          No page view data available for this period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
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
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
                name="Total Views"
              />
              <Line
                type="monotone"
                dataKey="visitors"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
                activeDot={{ r: 6 }}
                name="Unique Visitors"
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200">
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium">Total Page Views</p>
              <p className="text-lg font-bold text-primary mt-1">
                {totalViews.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium">Unique Visitors</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">
                {totalVisitors.toLocaleString()}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
