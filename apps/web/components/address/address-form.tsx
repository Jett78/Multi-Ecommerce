"use client";

import * as React from "react";
import { ChevronDown, Home, Building2, MapPin } from "lucide-react";
import { provinces } from "@/data/nepal-geography";
import type { AddressFormValues, ShippingAddress } from "@/types/address";

interface AddressFormProps {
  initial?: Partial<ShippingAddress>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: AddressFormValues) => void;
  onCancel?: () => void;
}

const TYPE_OPTIONS: { value: AddressFormValues["type"]; label: string; icon: React.ReactNode }[] = [
  { value: "home", label: "Home", icon: <Home className="h-4 w-4" /> },
  { value: "office", label: "Office", icon: <Building2 className="h-4 w-4" /> },
  { value: "other", label: "Other", icon: <MapPin className="h-4 w-4" /> },
];

export function AddressForm({
  initial,
  isSubmitting = false,
  submitLabel = "Save Address",
  onSubmit,
  onCancel,
}: AddressFormProps) {
  const [type, setType] = React.useState<AddressFormValues["type"]>(initial?.type || "home");
  const [provinceId, setProvinceId] = React.useState<string>(initial?.provinceId ? String(initial.provinceId) : "");
  const [district, setDistrict] = React.useState(initial?.district || "");
  const [municipality, setMunicipality] = React.useState(initial?.municipality || "");
  const [landmark, setLandmark] = React.useState(initial?.landmark || "");
  const [streetAddress, setStreetAddress] = React.useState(initial?.streetAddress || "");
  const [isDefault, setIsDefault] = React.useState(initial?.isDefault || false);

  const selectedProvince = provinces.find((p) => p.id === Number(provinceId));
  const availableDistricts = selectedProvince?.districts || [];
  const availableLocalLevels = selectedProvince?.districts.find((d) => d.name === district)?.localLevels || [];

  const handleSubmit = () => {
    if (!provinceId || !district || !municipality || !streetAddress) return;
    onSubmit({
      type,
      provinceId: Number(provinceId),
      provinceName: selectedProvince?.name || "",
      district,
      municipality,
      landmark: landmark || undefined,
      streetAddress,
      isDefault,
    });
  };

  const selectClass =
    "block w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 pr-10 text-sm text-gray-900 transition-all focus:border-primarymain focus:bg-white focus:ring-2 focus:ring-primarymain/10 focus:outline-none";

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="grid grid-cols-3 gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
              type === opt.value
                ? "border-primarymain bg-primarymain/5 text-primarymain"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="relative">
          <select
            value={provinceId}
            onChange={(e) => {
              setProvinceId(e.target.value);
              setDistrict("");
              setMunicipality("");
            }}
            required
            className={selectClass}
          >
            <option value="">Province</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                Province {p.id} - {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
        </div>

        <div className="relative">
          <select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setMunicipality("");
            }}
            required
            disabled={!provinceId}
            className={selectClass}
          >
            <option value="">District</option>
            {availableDistricts.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
        </div>

        <div className="relative">
          <select
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
            required
            disabled={!district}
            className={selectClass}
          >
            <option value="">Municipality / Rural Municipality</option>
            {availableLocalLevels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
        </div>

        <input
          type="text"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          placeholder="Landmark (optional)"
          className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-primarymain focus:bg-white focus:ring-2 focus:ring-primarymain/10 focus:outline-none"
        />
      </div>

      <textarea
        value={streetAddress}
        onChange={(e) => setStreetAddress(e.target.value)}
        required
        rows={2}
        placeholder="Street address, ward, house number..."
        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-primarymain focus:bg-white focus:ring-2 focus:ring-primarymain/10 focus:outline-none"
      />

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primarymain focus:ring-primarymain/20"
        />
        Set as default address
      </label>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-primarymain px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primarymain/90 disabled:opacity-50 active:scale-[0.98]"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
