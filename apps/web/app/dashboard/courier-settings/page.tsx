import DashboardHeading from "@/components/dashboard/dashboard-heading";
import Link from "next/link";
import { Truck, Settings, MapPin } from "lucide-react";

export const metadata = {
  title: "Courier Settings | Dashboard",
};

const providers = [
  {
    name: "Pathao Courier",
    slug: "pathao",
    description: "Configure Pathao Courier API credentials and settings",
    icon: <Truck className="h-5 w-5" />,
    color: "blue",
  },
];

export default function CourierSettingsPage() {
  return (
    <div className="space-y-6">
      <DashboardHeading
        title="Courier Settings"
        description="Manage courier provider credentials and delivery configuration"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {providers.map((provider) => (
          <Link
            key={provider.slug}
            href={`/dashboard/courier-settings/${provider.slug}`}
            className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-md hover:border-slate-300"
          >
            <div className={`p-3 rounded-xl ${
              provider.color === "blue" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
            }`}>
              {provider.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {provider.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{provider.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/dashboard/district-mappings"
        className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-md hover:border-slate-300"
      >
        <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            District Mappings
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Map Nepal districts to courier cities, zones, and branches
          </p>
        </div>
      </Link>
    </div>
  );
}
