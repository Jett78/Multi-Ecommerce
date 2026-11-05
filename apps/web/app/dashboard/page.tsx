"use client";

import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertCircle,
  TrendingUp,
  Monitor,
  Store,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { TopProducts } from "@/components/dashboard/top-products";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { SalesChannelChart } from "@/components/dashboard/sales-channel-chart";
import { PaymentMethodsChart } from "@/components/dashboard/payment-methods-chart";
import { CategoryPerformanceChart } from "@/components/dashboard/category-performance-chart";
import { PageViewsChart } from "@/components/dashboard/page-views-chart";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  activeProducts: number;
  totalCustomers: number;
  lowStockProducts: number;
  recentOrders: number;
  todayOrders: number;
  todayRevenue: number;
  webRevenue: number;
  posRevenue: number;
  webOrders: number;
  posOrders: number;
  averageOrderValue: number;
}

export default function DashboardPage() {
  const { getAll } = useCrud<DashboardStats>({
    endpoint: API_ROUTES.DASHBOARD_STATS,
    queryKey: "dashboard-stats",
    isAuthenticated: true,
  });

  const { data, isLoading } = getAll();
  const stats = data as DashboardStats | undefined;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1 text-xs">
          Welcome back! Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Total Revenue"
          value={`Rs. ${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          icon={DollarSign}
          isLoading={isLoading}
        />
        <StatsCard
          label="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={ShoppingCart}
          isLoading={isLoading}
        />
        <StatsCard
          label="Average Order Value"
          value={`Rs. ${(stats?.averageOrderValue ?? 0).toLocaleString()}`}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatsCard
          label="Total Customers"
          value={stats?.totalCustomers ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Active Products"
          value={stats?.activeProducts ?? 0}
          icon={Package}
          isLoading={isLoading}
        />
        <StatsCard
          label="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          icon={AlertCircle}
          isLoading={isLoading}
        />
        <StatsCard
          label="Low Stock Alert"
          value={stats?.lowStockProducts ?? 0}
          icon={AlertCircle}
          isLoading={isLoading}
        />
        <div className="bg-white p-6 rounded-md border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="size-6 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Recent Orders (7d)</p>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{stats?.recentOrders ?? 0}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-primary" />
            <h3 className="font-bold text-sm text-slate-900">Today&apos;s Summary</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Orders Today</span>
              <span className="text-lg font-bold text-slate-900">
                {stats?.todayOrders ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Revenue Today</span>
              <span className="text-lg font-bold text-emerald-600">
                Rs. {(stats?.todayRevenue ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="size-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Website Sales</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Orders</span>
              <span className="text-lg font-bold text-slate-900">
                {stats?.webOrders ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Revenue</span>
              <span className="text-lg font-bold text-blue-600">
                Rs. {(stats?.webRevenue ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Store className="size-5 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">POS/Offline Sales</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Orders</span>
              <span className="text-lg font-bold text-slate-900">
                {stats?.posOrders ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Revenue</span>
              <span className="text-lg font-bold text-purple-600">
                Rs. {(stats?.posRevenue ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <AnalyticsChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PageViewsChart />
        <SalesChannelChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PaymentMethodsChart />
        <TopProducts />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <CategoryPerformanceChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentOrders />
      </div>
    </div>
  );
}