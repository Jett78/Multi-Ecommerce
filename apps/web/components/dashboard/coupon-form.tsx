"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/primary-button";
import FormField from "@/components/forms/form-field";
import { useCrud } from "@/hooks/useCRUD";
import { useForm } from "@/hooks/useForm";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { API_ROUTES } from "@/config/api-routes";
import { revalidateCoupons } from "@/actions/revalidate-action";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import { X } from "lucide-react";
import type { CouponData } from "@/types/coupon";

const inputClass = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50";

export function CouponForm({ coupon }: { coupon?: CouponData }) {
  const isEditing = !!coupon;

  const { create, put } = useCrud<Record<string, any>>({
    endpoint: API_ROUTES.DISCOUNT,
    queryKey: "coupons",
    isAuthenticated: true,
  });

  const { getAll: getCategories } = useCrud<{ id: string; name: string }>({
    endpoint: API_ROUTES.CATEGORY,
    queryKey: "categories",
  });

  const { getAll: getBrands } = useCrud<{ id: string; name: string }>({
    endpoint: API_ROUTES.BRAND,
    queryKey: "brands",
  });

  const { data: categoriesData } = getCategories({ take: 100, skip: 0 });
  const { data: brandsData } = getBrands({ take: 100, skip: 0 });

  const categories: { id: string; name: string }[] = categoriesData || [];
  const brands: { id: string; name: string }[] = brandsData || [];

  const { values, errors, handleChange, setField } = useForm({
    code: coupon?.code || "",
    type: coupon?.type || "percentage",
    value: coupon?.type === "fixed" && coupon?.value ? (coupon.value / 100).toString() : coupon?.value?.toString() || "0",
    minOrderAmount: coupon?.minOrderAmount ? (coupon.minOrderAmount / 100).toString() : "",
    maxDiscountAmount: coupon?.maxDiscountAmount ? (coupon.maxDiscountAmount / 100).toString() : "",
    usageLimit: coupon?.usageLimit?.toString() || "",
    isActive: coupon?.isActive ?? true,
    description: coupon?.description || "",
    startsAt: coupon?.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : "",
    expiresAt: coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
    filterLogic: coupon?.filterLogic || "and",
  });

  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<string[]>(coupon?.categoryIds || []);
  const [selectedBrandIds, setSelectedBrandIds] = React.useState<string[]>(coupon?.brandIds || []);
  const [categorySearch, setCategorySearch] = React.useState("");
  const [brandSearch, setBrandSearch] = React.useState("");

  const isPending = isEditing ? put.isPending : create.isPending;

  const { onSuccess, onError } = useFormSubmit({
    entityName: "Coupon",
    redirectPath: "/dashboard/coupons",
    entityId: coupon?.id,
    revalidateAction: async () => {
      await revalidateCoupons();
    },
  });

  const hasBothFilters = selectedCategoryIds.length > 0 && selectedBrandIds.length > 0;

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleBrand = (id: string) => {
    setSelectedBrandIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const filteredCategories = categories.filter((c: { id: string; name: string }) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredBrands = brands.filter((b: { id: string; name: string }) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, any> = {
      code: values.code.trim().toUpperCase(),
      type: values.type,
      value: values.type === "free_shipping" ? 0 : Math.round(Number(values.value) * (values.type === "fixed" ? 100 : 1)),
      isActive: values.isActive,
      description: values.description || undefined,
      minOrderAmount: values.minOrderAmount ? Math.round(Number(values.minOrderAmount) * 100) : undefined,
      maxDiscountAmount: values.maxDiscountAmount ? Math.round(Number(values.maxDiscountAmount) * 100) : undefined,
      usageLimit: values.usageLimit ? Number(values.usageLimit) : undefined,
      perUserLimit: 1,
      startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : undefined,
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
      categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      brandIds: selectedBrandIds.length > 0 ? selectedBrandIds : undefined,
      filterLogic: hasBothFilters ? values.filterLogic : undefined,
    };

    if (isEditing && coupon?.id) {
      put.mutate({ id: coupon.id, data: payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {isPending && <SubmittingLoader status={isEditing ? "Updating coupon" : "Creating coupon"} />}

      {/* Basic Info */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Coupon Information</h3>
          <p className="text-xs text-slate-500 mt-1">Basic coupon details and discount configuration.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="Coupon Code *"
            name="code"
            value={values.code}
            onChange={(e) => setField("code", e.target.value.toUpperCase())}
            placeholder="e.g., SAVE10"
            errors={errors.code}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Type *</label>
            <select
              name="type"
              value={values.type}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>

          {values.type !== "free_shipping" ? (
            <FormField
              label={values.type === "fixed" ? "Amount (Rs.) *" : "Percentage (%) *"}
              name="value"
              type="number"
              value={values.value}
              onChange={handleChange}
              placeholder="0"
              errors={errors.value}
            />
          ) : (
            <FormField
              label="Value"
              name="value"
              type="number"
              value="0"
              onChange={() => {}}
              disabled
            />
          )}
        </div>

        <FormField
          label="Description"
          name="description"
          textarea
          rows={6}
          value={values.description}
          onChange={handleChange}
          placeholder="e.g., 10% off on orders above Rs. 1000"
        />
      </div>

      {/* Restrictions */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Restrictions</h3>
          <p className="text-xs text-slate-500 mt-1">Set limits on how this coupon can be used.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Minimum Order</label>
            <div className="flex gap-2">
              <select
                value={values.minOrderAmount === "" ? "none" : "custom"}
                onChange={(e) => setField("minOrderAmount", e.target.value === "none" ? "" : "0")}
                className={inputClass}
              >
                <option value="none">No minimum</option>
                <option value="custom">Custom amount</option>
              </select>
              {values.minOrderAmount !== "" && (
                <input
                  type="number"
                  name="minOrderAmount"
                  value={values.minOrderAmount}
                  onChange={handleChange}
                  placeholder="Rs."
                  className={inputClass}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Usage Limit</label>
            <div className="flex gap-2">
              <select
                value={values.usageLimit === "" ? "unlimited" : "custom"}
                onChange={(e) => setField("usageLimit", e.target.value === "unlimited" ? "" : "1")}
                className={inputClass}
              >
                <option value="unlimited">Unlimited</option>
                <option value="custom">Custom limit</option>
              </select>
              {values.usageLimit !== "" && (
                <input
                  type="number"
                  name="usageLimit"
                  value={values.usageLimit}
                  onChange={handleChange}
                  placeholder="Limit"
                  className={inputClass}
                />
              )}
            </div>
          </div>
        </div>

        {values.type === "percentage" && (
          <FormField
            label="Max Discount (Rs.)"
            name="maxDiscountAmount"
            type="number"
            value={values.maxDiscountAmount}
            onChange={handleChange}
            placeholder="No cap"
          />
        )}
      </div>

      {/* Applicability */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Applicability</h3>
          <p className="text-xs text-slate-500 mt-1">Choose which categories and brands this coupon applies to. Leave empty to apply to all products.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Category Multi-Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Categories</label>
            <input
              type="text"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className={inputClass}
            />
            <div className="border border-slate-200 rounded-md max-h-40 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <p className="text-xs text-slate-500 p-3">No categories found</p>
              ) : (
                filteredCategories.map((cat: { id: string; name: string }) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                    />
                    <span className="text-sm text-slate-700">{cat.name}</span>
                  </label>
                ))
              )}
            </div>
            {selectedCategoryIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCategoryIds.map((id) => {
                  const cat = categories.find((c: { id: string; name: string }) => c.id === id);
                  return cat ? (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {cat.name}
                      <button
                        type="button"
                        onClick={() => toggleCategory(id)}
                        className="hover:text-primary/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Brand Multi-Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Brands</label>
            <input
              type="text"
              placeholder="Search brands..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className={inputClass}
            />
            <div className="border border-slate-200 rounded-md max-h-40 overflow-y-auto">
              {filteredBrands.length === 0 ? (
                <p className="text-xs text-slate-500 p-3">No brands found</p>
              ) : (
                filteredBrands.map((brand: { id: string; name: string }) => (
                  <label
                    key={brand.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrandIds.includes(brand.id)}
                      onChange={() => toggleBrand(brand.id)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                    />
                    <span className="text-sm text-slate-700">{brand.name}</span>
                  </label>
                ))
              )}
            </div>
            {selectedBrandIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedBrandIds.map((id) => {
                  const brand = brands.find((b: { id: string; name: string }) => b.id === id);
                  return brand ? (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {brand.name}
                      <button
                        type="button"
                        onClick={() => toggleBrand(id)}
                        className="hover:text-primary/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Filter Logic Toggle */}
        {hasBothFilters && (
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <label className="text-sm font-medium text-slate-700">Match Logic</label>
            <p className="text-xs text-slate-500">Choose how categories and brands are combined for eligibility.</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="filterLogic"
                  value="and"
                  checked={values.filterLogic === "and"}
                  onChange={handleChange}
                  className="h-4 w-4 border-slate-300 text-primary focus:ring-primary/20"
                />
                <span className="text-sm text-slate-700">
                  <span className="font-medium">AND</span> - Must match ALL selected
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="filterLogic"
                  value="or"
                  checked={values.filterLogic === "or"}
                  onChange={handleChange}
                  className="h-4 w-4 border-slate-300 text-primary focus:ring-primary/20"
                />
                <span className="text-sm text-slate-700">
                  <span className="font-medium">OR</span> - Match ANY selected
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Schedule & Status */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Schedule & Status</h3>
          <p className="text-xs text-slate-500 mt-1">Control when the coupon is active.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Starts At"
            name="startsAt"
            type="datetime-local"
            value={values.startsAt}
            onChange={handleChange}
          />

          <FormField
            label="Expires At"
            name="expiresAt"
            type="datetime-local"
            value={values.expiresAt}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            name="isActive"
            value={values.isActive ? "true" : "false"}
            onChange={(e) => setField("isActive", e.target.value === "true")}
            className={inputClass}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4">
        <PrimaryButton
          type="submit"
          text={isEditing ? "Update Coupon" : "Create Coupon"}
          disabled={isPending}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
