"use client";

import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/primary-button";
import FormField from "@/components/forms/form-field";
import { useCrud } from "@/hooks/useCRUD";
import { useForm } from "@/hooks/useForm";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { API_ROUTES } from "@/config/api-routes";
import { revalidateCoupons } from "@/actions/revalidate-action";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import type { CouponData } from "@/types/coupon";

const inputClass = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50";

export function CouponForm({ coupon }: { coupon?: CouponData }) {
  const isEditing = !!coupon;

  const { create, put } = useCrud<Record<string, any>>({
    endpoint: API_ROUTES.DISCOUNT,
    queryKey: "coupons",
    isAuthenticated: true,
  });

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
  });

  const isPending = isEditing ? put.isPending : create.isPending;

  const { onSuccess, onError } = useFormSubmit({
    entityName: "Coupon",
    redirectPath: "/dashboard/coupons",
    entityId: coupon?.id,
    revalidateAction: async () => {
      await revalidateCoupons();
    },
  });

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
