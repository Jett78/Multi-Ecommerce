"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ROUTES } from "@/config/api-routes";
import { apiClient } from "@/lib/api-client";
import { useCrud } from "@/hooks/useCRUD";
import DashboardHeading from "@/components/dashboard/dashboard-heading";
import { PluginModal } from "@/components/dashboard/plugin-modal";
import { PaymentSettingsForm } from "@/components/dashboard/payment-settings-form";
import { CourierSettingsForm } from "@/components/dashboard/courier-settings-form";
import { GoogleAnalyticsForm } from "@/components/dashboard/plugins/google-analytics-form";
import { GoogleSearchConsoleForm } from "@/components/dashboard/plugins/google-search-console-form";
import { MicrosoftClarityForm } from "@/components/dashboard/plugins/microsoft-clarity-form";

type PluginKey = "khalti" | "pathao" | "ga" | "gsc" | "clarity" | null;

interface PluginCard {
  key: Exclude<PluginKey, null>;
  name: string;
  description: string;
  logo: string;
  category: string;
  configured: boolean;
}

export function PluginsManager() {
  const [activePlugin, setActivePlugin] = useState<PluginKey>(null);
  const queryClient = useQueryClient();

  const { getOne: getKhalti } = useCrud({
    endpoint: API_ROUTES.PAYMENT_SETTINGS,
    queryKey: "payment-settings",
    isAuthenticated: true,
  });
  const { getOne: getPathao } = useCrud({
    endpoint: API_ROUTES.COURIER_SETTINGS,
    queryKey: "courier-settings",
    isAuthenticated: true,
  });

  const khaltiQuery = getKhalti("khalti");
  const pathaoQuery = getPathao("pathao");

  const seoQuery = useQuery({
    queryKey: ["plugins-seo"],
    queryFn: async () => {
      const res = await apiClient<any>(API_ROUTES.SEO);
      return res?.data;
    },
  });

  const khaltiData = khaltiQuery.data?.data || khaltiQuery.data;
  const pathaoData = pathaoQuery.data?.data || pathaoQuery.data;
  const seoData = seoQuery.data;

  const pathaoConfigured = !!pathaoData?.isEnabled;

  const khaltiConfigured = !!khaltiData?.secretKey && !!khaltiData?.publicKey && khaltiData?.isEnabled === true;
  const gaConfigured = !!seoData?.googleAnalyticsId;
  const gscConfigured = !!seoData?.googleSearchConsoleVerification;
  const clarityConfigured = !!seoData?.microsoftClarityId;

  const plugins: PluginCard[] = [
      {
        key: "khalti",
        name: "Khalti Payment",
        description: "Accept payments via the Khalti payment gateway",
        logo: "/icons/khalti.png",
        category: "Payments",
        configured: khaltiConfigured,
      },
      {
        key: "pathao",
        name: "Pathao Courier",
        description: "Configure Pathao Courier API for deliveries",
        logo: "/icons/pathao.png",
        category: "Shipping",
        configured: pathaoConfigured,
      },
      {
        key: "ga",
        name: "Google Analytics",
        description: "Track site traffic with GA4 Measurement ID",
        logo: "/icons/analytics.png",
        category: "Analytics",
        configured: gaConfigured,
      },
      {
        key: "gsc",
        name: "Google Search Console",
        description: "Verify your site ownership with Google",
        logo: "/icons/search-console.png",
        category: "SEO",
        configured: gscConfigured,
      },
      {
        key: "clarity",
        name: "Microsoft Clarity",
        description: "Session recordings and heatmaps for UX insights",
        logo: "/icons/clarity.png",
        category: "Analytics",
        configured: clarityConfigured,
      },
  ];

  const handleClose = useCallback(() => {
    setActivePlugin(null);
    queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
    queryClient.invalidateQueries({ queryKey: ["courier-settings"] });
    queryClient.invalidateQueries({ queryKey: ["plugins-seo"] });
  }, [queryClient]);

  return (
    <div className="space-y-6">
      <DashboardHeading
        title="Plugins"
        description="Manage your integrations and third-party connections"
      />

      {(() => {
        const installed = plugins.filter((p) => p.configured);
        const available = plugins.filter((p) => !p.configured);

        const renderCard = (plugin: PluginCard) => (
          <button
            key={plugin.key}
            type="button"
            onClick={() => setActivePlugin(plugin.key)}
            className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left transition-colors hover:border-slate-300 w-full"
          >
            <div className="p-3 rounded-xl bg-slate-50 shrink-0">
              <img src={plugin.logo} alt={plugin.name} className="h-7 w-7 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">{plugin.name}</h3>
                <span className="inline-flex items-center shrink-0 text-xs font-semibold text-white bg-primarymain rounded-full px-2.5 py-0.5">
                  {plugin.category}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{plugin.description}</p>
            </div>
          </button>
        );

        return (
          <>
            {installed.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700">Installed Plugins</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {installed.map(renderCard)}
                </div>
              </section>
            )}

            {available.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700">Available Plugins</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {available.map(renderCard)}
                </div>
              </section>
            )}
          </>
        );
      })()}

      <PluginModal
        open={activePlugin === "khalti"}
        onClose={handleClose}
        title="Khalti Payment"
        icon={<img src="/icons/khalti.png" alt="Khalti" className="h-6 w-6 object-contain" />}
      >
        <PaymentSettingsForm onSaved={handleClose} hideApiUrl />
      </PluginModal>

      <PluginModal
        open={activePlugin === "pathao"}
        onClose={handleClose}
        title="Pathao Courier"
        icon={<img src="/icons/pathao.png" alt="Pathao" className="h-6 w-6 object-contain" />}
      >
        <CourierSettingsForm
          provider="pathao"
          title="Pathao Courier"
          defaultApiUrl="https://courier-api.pathao.com"
          logoSrc="/icons/pathao.png"
          hideName
          hideApiUrl
          configInMain
          showSyncLocations={false}
          credentialFields={[
            { name: "clientId", label: "Client ID", placeholder: "Enter Pathao client ID" },
            { name: "clientSecret", label: "Client Secret", placeholder: "Enter Pathao client secret" },
            { name: "username", label: "Username", placeholder: "Enter Pathao username" },
            { name: "password", label: "Password", placeholder: "Enter Pathao password" },
          ]}
          configFields={[{ name: "storeId", label: "Store ID", placeholder: "Enter your Pathao store ID" }]}
          onSaved={handleClose}
        />
      </PluginModal>

      <PluginModal
        open={activePlugin === "ga"}
        onClose={handleClose}
        title="Google Analytics"
        icon={<img src="/icons/analytics.png" alt="Google Analytics" className="h-6 w-6 object-contain" />}
      >
        <GoogleAnalyticsForm onSaved={handleClose} currentSeo={seoData} />
      </PluginModal>

      <PluginModal
        open={activePlugin === "gsc"}
        onClose={handleClose}
        title="Google Search Console"
        icon={<img src="/icons/search-console.png" alt="Google Search Console" className="h-6 w-6 object-contain" />}
      >
        <GoogleSearchConsoleForm onSaved={handleClose} currentSeo={seoData} />
      </PluginModal>

      <PluginModal
        open={activePlugin === "clarity"}
        onClose={handleClose}
        title="Microsoft Clarity"
        icon={<img src="/icons/analytics.png" alt="Microsoft Clarity" className="h-6 w-6 object-contain" />}
      >
        <MicrosoftClarityForm onSaved={handleClose} currentSeo={seoData} />
      </PluginModal>
    </div>
  );
}
