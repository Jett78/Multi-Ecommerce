"use client";

import { useEffect, useRef, useState } from "react";
import PrimaryButton from "@/components/ui/primary-button";
import FormField from "@/components/forms/form-field";
import { useForm } from "@/hooks/useForm";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import { showSuccess, showError } from "@/lib/toast-helper";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import { BarChart3 } from "lucide-react";
import type { GlobalSeo } from "@/types/seo";

interface GoogleAnalyticsFormProps {
  onSaved: () => void;
  currentSeo?: GlobalSeo | null;
}

export function GoogleAnalyticsForm({ onSaved, currentSeo }: GoogleAnalyticsFormProps) {
  const [isPending, setIsPending] = useState(false);

  const { values, handleChange, setField } = useForm({
    googleAnalyticsId: "",
  });

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || currentSeo === undefined) return;
    didInit.current = true;
    setField("googleAnalyticsId", currentSeo?.googleAnalyticsId || "");
  }, [currentSeo, setField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const current =
        currentSeo ?? (await apiClient<any>(API_ROUTES.SEO))?.data ?? {};

      const payload = {
        metaTitle: current.metaTitle ?? null,
        metaDescription: current.metaDescription ?? null,
        ogTitle: current.ogTitle ?? null,
        ogDescription: current.ogDescription ?? null,
        ogImageKey: current.ogImageKey ?? null,
        gtmContainerId: current.gtmContainerId ?? null,
        googleSearchConsoleVerification: current.googleSearchConsoleVerification ?? null,
        googleAnalyticsId: values.googleAnalyticsId || null,
      };

      const res = await apiClient<any>(API_ROUTES.SEO, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showSuccess("Google Analytics updated successfully");
        onSaved();
      }
    } catch (error: any) {
      showError(error.message || "Failed to update Google Analytics");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isPending && <SubmittingLoader status="Saving Google Analytics" />}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primarymain/10 rounded-xl">
              <BarChart3 className="h-5 w-5 text-primarymain" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Google Analytics (GA4)</h3>
              <p className="text-xs text-slate-500">Track traffic and user behavior</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <FormField
            label="Measurement ID"
            name="googleAnalyticsId"
            value={values.googleAnalyticsId}
            onChange={handleChange}
            placeholder="G-XXXXXXX"
          />
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-600 leading-relaxed">
              Find your Measurement ID in the{" "}
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primarymain hover:underline font-medium"
              >
                Google Analytics
              </a>{" "}
              admin panel under Data Streams.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <PrimaryButton type="submit" text="Save Changes" disabled={isPending} />
      </div>
    </form>
  );
}
