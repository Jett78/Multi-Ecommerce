"use client";

import { useEffect, useRef, useState } from "react";
import PrimaryButton from "@/components/ui/primary-button";
import FormField from "@/components/forms/form-field";
import { useForm } from "@/hooks/useForm";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import { showSuccess, showError } from "@/lib/toast-helper";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import { Tag } from "lucide-react";
import type { GlobalSeo } from "@/types/seo";

interface GoogleSearchConsoleFormProps {
  onSaved: () => void;
  currentSeo?: GlobalSeo | null;
}

export function GoogleSearchConsoleForm({ onSaved, currentSeo }: GoogleSearchConsoleFormProps) {
  const [isPending, setIsPending] = useState(false);

  const { values, handleChange, setField } = useForm({
    googleSearchConsoleVerification: "",
  });

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || currentSeo === undefined) return;
    didInit.current = true;
    setField("googleSearchConsoleVerification", currentSeo?.googleSearchConsoleVerification || "");
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
        googleAnalyticsId: current.googleAnalyticsId ?? null,
        googleSearchConsoleVerification: values.googleSearchConsoleVerification || null,
      };

      const res = await apiClient<any>(API_ROUTES.SEO, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showSuccess("Search Console updated successfully");
        onSaved();
      }
    } catch (error: any) {
      showError(error.message || "Failed to update Search Console");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isPending && <SubmittingLoader status="Saving Search Console" />}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primarymain/10 rounded-xl">
              <Tag className="h-5 w-5 text-primarymain" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Google Search Console</h3>
              <p className="text-xs text-slate-500">Verify your site with Google</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <FormField
            label="Verification Code"
            name="googleSearchConsoleVerification"
            value={values.googleSearchConsoleVerification}
            onChange={handleChange}
            placeholder="aBcDeFgHiJkLmNoPqRsTuVwXyZ"
          />
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-600 leading-relaxed">
              Get your verification code from{" "}
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primarymain hover:underline font-medium"
              >
                Google Search Console
              </a>
              . Add the HTML tag or meta tag content here.
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
