"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardHeading from "@/components/dashboard/dashboard-heading";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import { showSuccess, showError } from "@/lib/toast-helper";
import { Save, Search, Check, X, RefreshCw } from "lucide-react";
import { provinces } from "@/data/nepal-geography";

interface Tier {
  weightKg: number;
  price: number;
}

interface MappingRow {
  district: string;
  provinceId: number;
  provider: string;
  courierCityId: number | null;
  courierCityName: string | null;
  courierAreaId: number | null;
  courierAreaName: string | null;
  courierBranch: string | null;
  deliveryChargeOverrides: Tier[];
  isMapped: boolean;
}

interface CourierCity {
  id: string;
  courierId: number;
  name: string;
}

const WEIGHT_BRACKETS = [1, 2, 3, 5, 10];

function getOverride(tiers: Tier[] | undefined, weightKg: number): Tier | undefined {
  return (Array.isArray(tiers) ? tiers : []).find((t) => t.weightKg === weightKg);
}

export default function DistrictMappingsPage() {
  const [search, setSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("pathao");
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<CourierCity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mappingsResponse = await apiClient<any>(API_ROUTES.COURIER_MAPPINGS, { isAuthenticated: true });
        const mappingsData = mappingsResponse?.data || [];
        const providerMappings = mappingsData.filter((m: MappingRow) => m.provider === selectedProvider);
        const allDistrictsList = provinces.flatMap((p) =>
          p.districts.map((d) => ({ district: d.name, provinceId: p.id }))
        );
        const allDistricts: MappingRow[] = allDistrictsList.map((district) => {
          const existing = providerMappings.find((m: MappingRow) => m.district === district.district);
          return {
            district: district.district,
            provinceId: district.provinceId,
            provider: selectedProvider,
            courierCityId: existing?.courierCityId || null,
            courierCityName: existing?.courierCityName || null,
            courierAreaId: existing?.courierAreaId || null,
            courierAreaName: existing?.courierAreaName || null,
            courierBranch: existing?.courierBranch || null,
            deliveryChargeOverrides: existing?.deliveryChargeOverrides ?? [],
            isMapped: existing?.isMapped || false,
          };
        });
        setMappings(allDistricts);
      } catch {
        showError("Failed to load mappings");
      }
    };
    fetchData();
  }, [selectedProvider]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const citiesResponse = await apiClient<any>(`${API_ROUTES.COURIER_LOCATIONS}/${selectedProvider}/cities`, { isAuthenticated: true });
        if (citiesResponse?.data) setCities(citiesResponse.data);
      } catch {}
    };
    fetchLocations();
  }, [selectedProvider]);

  const updateMapping = (district: string, field: string, value: any) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.district !== district) return m;
        const updated = { ...m, [field]: value };
        if (field === "courierCityId") {
          const city = cities.find((c) => c.courierId === value);
          updated.courierCityName = city?.name || null;
          updated.courierAreaId = null;
          updated.courierAreaName = null;
        }
        updated.courierBranch = null;
        updated.isMapped = !!updated.courierCityId;
        return updated;
      })
    );
  };

  const updateOverridePrice = (district: string, weightKg: number, price: number | null) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.district !== district) return m;
        const others = (m.deliveryChargeOverrides || []).filter((t) => t.weightKg !== weightKg);
        const next =
          price == null
            ? others
            : [...others, { weightKg, price }].sort((a, b) => a.weightKg - b.weightKg);
        return { ...m, deliveryChargeOverrides: next };
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = mappings.map((m) => ({
        district: m.district,
        provinceId: m.provinceId,
        provider: selectedProvider,
        courierCityId: m.courierCityId,
        courierCityName: m.courierCityName,
        courierAreaId: m.courierAreaId,
        courierAreaName: m.courierAreaName,
        courierBranch: m.courierBranch,
        deliveryChargeOverrides: m.deliveryChargeOverrides,
        isMapped: m.isMapped,
      }));

      const response = await fetch(API_ROUTES.COURIER_MAPPINGS, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mappings: payload }),
      });
      const result = await response.json();
      if (result.success) {
        showSuccess(`Saved ${payload.length} mappings`);
      } else {
        showError(result.message || "Failed to save mappings");
      }
    } catch {
      showError("Failed to save mappings");
    } finally {
      setSaving(false);
    }
  };

  const filteredMappings = useMemo(() => {
    if (!search) return mappings;
    return mappings.filter((m) =>
      m.district.toLowerCase().includes(search.toLowerCase())
    );
  }, [mappings, search]);

  const mappedCount = mappings.filter((m) => m.isMapped).length;
  const totalCount = mappings.length;

  return (
    <div className="space-y-6">
      <DashboardHeading
        title="District Mappings"
        description="Map Nepal districts to courier cities/branches and set per-weight delivery charge overrides"
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Courier Provider</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
            >
              <option value="pathao">Pathao Courier</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Search District</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search districts..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
              />
            </div>
          </div>
           <div className="flex items-end gap-3">
            <div className="text-sm text-slate-500">
              <span className="font-bold text-slate-900">{mappedCount}</span>/{totalCount} mapped
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>
            Weight brackets (kg):{" "}
            <span className="font-semibold text-slate-700">{WEIGHT_BRACKETS.join(", ")}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-blue-50 ring-1 ring-blue-200" />
            Cell shaded blue = your custom override price (blank cells use the live price at checkout)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left font-bold text-slate-700 border-b border-slate-200">District</th>
                <th className="px-4 py-3 text-left font-bold text-slate-700 border-b border-slate-200">Province</th>
                <th className="px-4 py-3 text-left font-bold text-slate-700 border-b border-slate-200">City</th>
                {WEIGHT_BRACKETS.map((w) => (
                  <th
                    key={w}
                    className="px-3 py-3 text-right font-bold text-slate-700 border-b border-slate-200 whitespace-nowrap"
                  >
                    {w} kg
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-bold text-slate-700 border-b border-slate-200">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMappings.map((mapping) => (
                <tr key={mapping.district} className="hover:bg-slate-50/50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-slate-900 border-b border-slate-100">{mapping.district}</td>
                  <td className="px-4 py-3 text-slate-500 border-b border-slate-100">Province {mapping.provinceId}</td>
                  <td className="px-4 py-3 border-b border-slate-100">
                    <select
                      value={mapping.courierCityId || ""}
                      onChange={(e) => updateMapping(mapping.district, "courierCityId", e.target.value ? Number(e.target.value) : null)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    >
                      <option value="">Select city...</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.courierId}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  {WEIGHT_BRACKETS.map((w) => {
                    const override = getOverride(mapping.deliveryChargeOverrides, w);
                    const isOverride = override != null;
                    return (
                      <td key={w} className="px-2 py-2 border-b border-slate-100 whitespace-nowrap">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={isOverride ? override.price : ""}
                          placeholder={"auto"}
                          onChange={(e) =>
                            updateOverridePrice(
                              mapping.district,
                              w,
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                          className={
                            "h-9 w-24 rounded-lg border px-2 text-right text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 " +
                            (isOverride
                              ? "bg-blue-50 text-blue-700 font-bold border-blue-300"
                              : "bg-white text-slate-700 border-slate-200 placeholder:text-slate-300")
                          }
                        />
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center border-b border-slate-100">
                    {mapping.isMapped ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700">
                        <Check className="h-3 w-3" /> Mapped
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                        <X className="h-3 w-3" /> Unmapped
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
