"use client";

import { useEffect, useRef, useState } from "react";
import PrimaryButton from "@/components/ui/primary-button";
import FormField from "@/components/forms/form-field";
import { useForm } from "@/hooks/useForm";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import { showSuccess, showError } from "@/lib/toast-helper";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import { Eye } from "lucide-react";
import type { GlobalSeo } from "@/types/seo";

interface MicrosoftClarityFormProps {
  onSaved: () => void;
  currentSeo?: GlobalSeo | null;
}

export function MicrosoftClarityForm({ onSaved, currentSeo }: MicrosoftClarityFormProps) {
  const [isPending, setIsPending] = useState(false);

  const { values, handleChange, setField } = useForm({
    microsoftClarityId: "",
  });

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || currentSeo === undefined) return;
    didInit.current = true;
    setField("microsoftClarityId", currentSeo?.microsoftClarityId || "");
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
        googleAnalyticsId: current.googleAnalyticsId ?? null,
        microsoftClarityId: values.microsoftClarityId || null,
      };

      const res = await apiClient<any>(API_ROUTES.SEO, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showSuccess("Microsoft Clarity updated successfully");
        onSaved();
      }
    } catch (error: any) {
      showError(error.message || "Failed to update Microsoft Clarity");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isPending && <SubmittingLoader status="Saving Microsoft Clarity" />}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primarymain/10 rounded-xl">
              <Eye className="h-5 w-5 text-primarymain" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Microsoft Clarity</h3>
              <p className="text-xs text-slate-500">Session recordings and heatmaps</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <FormField
            label="Project ID"
            name="microsoftClarityId"
            value={values.microsoftClarityId}
            onChange={handleChange}
            placeholder="kx0xxxxxxx"
          />
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-600 leading-relaxed">
              Find your Project ID in the{" "}
              <a
                href="https://clarity.microsoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primarymain hover:underline font-medium"
              >
                Microsoft Clarity
              </a>{" "}
              dashboard under Settings &gt; Setup.
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
