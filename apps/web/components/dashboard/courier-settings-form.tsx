"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import PrimaryButton from "@/components/ui/primary-button";
import FormField from "@/components/forms/form-field";
import { useCrud } from "@/hooks/useCRUD";
import { useForm } from "@/hooks/useForm";
import { API_ROUTES } from "@/config/api-routes";
import { showSuccess, showError } from "@/lib/toast-helper";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import Loading from "@/app/loading";
import { Key, Shield, Eye, EyeOff, RefreshCw, Truck, Loader2 } from "lucide-react";

interface CourierSettingsFormProps {
  provider: string;
  title: string;
  defaultApiUrl: string;
  credentialFields: { name: string; label: string; placeholder: string }[];
  configFields?: { name: string; label: string; placeholder: string }[];
  showSyncLocations?: boolean;
  logoSrc?: string;
  hideName?: boolean;
  hideApiUrl?: boolean;
  configInMain?: boolean;
  credentialHelp?: React.ReactNode;
  onSaved?: () => void;
}

export function CourierSettingsForm({
  provider,
  title,
  defaultApiUrl,
  credentialFields,
  configFields = [],
  showSyncLocations = true,
  logoSrc,
  hideName = false,
  hideApiUrl = false,
  configInMain = false,
  credentialHelp,
  onSaved,
}: CourierSettingsFormProps) {
  const router = useRouter();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ status: string; cities: number; zones: number; areas: number; errors: number } | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const { getOne, create, put } = useCrud({
    endpoint: API_ROUTES.COURIER_SETTINGS,
    queryKey: "courier-settings",
    isAuthenticated: true,
  });

  const { data: settings, isLoading: isLoadingSettings } = getOne(provider);

  const initialCredentialValues: Record<string, string> = {};
  credentialFields.forEach((f) => { initialCredentialValues[f.name] = ""; });
  const initialConfigValues: Record<string, string> = {};
  configFields.forEach((f) => { initialConfigValues[f.name] = ""; });

  const { values, handleChange, setField } = useForm<Record<string, string>>({
    name: title,
    apiBaseUrl: defaultApiUrl,
    isEnabled: "false",
    ...initialCredentialValues,
    ...initialConfigValues,
  });

  useEffect(() => {
    if (settings) {
      setField("name", settings.name || title);
      setField("apiBaseUrl", settings.apiBaseUrl || defaultApiUrl);
      setField("isEnabled", settings.isEnabled?.toString() || "false");
      try {
        const creds = JSON.parse(settings.credentials || "{}");
        credentialFields.forEach((f) => {
          setField(f.name, creds[f.name] || "");
        });
      } catch {}
      try {
        const config = JSON.parse(settings.config || "{}");
        configFields.forEach((f) => {
          setField(f.name, config[f.name] || "");
        });
      } catch {}
    }
  }, [settings]);

  const isEditing = !!settings;
  const isPending = isEditing ? put.isPending : create.isPending;

  const toggleSecret = (name: string) => {
    setShowSecrets((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const credentials: Record<string, string> = {};
    credentialFields.forEach((f) => { credentials[f.name] = values[f.name] || ""; });
    const config: Record<string, string> = {};
    configFields.forEach((f) => { config[f.name] = values[f.name] || ""; });

    const payload = {
      name: hideName ? title : values.name,
      apiBaseUrl: hideApiUrl ? defaultApiUrl : values.apiBaseUrl,
      credentials: JSON.stringify(credentials),
      config: configFields.length > 0 ? JSON.stringify(config) : undefined,
      isEnabled: values.isEnabled === "true",
    };

    const onSuccess = async (res: any) => {
      if (res.success) {
        showSuccess(`${title} updated successfully`);
        router.refresh();
        onSaved?.();
      }
    };

    if (isEditing) {
      put.mutate({ id: provider, data: payload }, { onSuccess, onError: (error: any) => showError(error.message || "Failed to update") });
    } else {
      create.mutate(payload as any, { onSuccess, onError: (error: any) => showError(error.message || "Failed to create") });
    }
  };

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(() => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_ROUTES.COURIER_SYNC}/${provider}/status`, { credentials: "include" });
        const result = await res.json();
        if (result.success) {
          const s = result.data;
          setSyncStatus(s);
          if (s.status === "completed") {
            stopPolling();
            setSyncing(false);
            showSuccess(`Synced: ${s.cities} cities, ${s.zones} zones, ${s.areas} areas`);
          } else if (s.status === "failed") {
            stopPolling();
            setSyncing(false);
            showError(s.message || "Sync failed");
          }
        }
      } catch {
        // ignore poll errors
      }
    }, 3000);
  }, [provider, stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleSyncLocations = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const response = await fetch(`${API_ROUTES.COURIER_SYNC}/${provider}`, {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        pollStatus();
      } else {
        setSyncing(false);
        showError(result.message || "Failed to start sync");
      }
    } catch {
      setSyncing(false);
      showError("Failed to start sync");
    }
  };

  if (isLoadingSettings) return <Loading />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isPending && <SubmittingLoader status={`Saving ${title}`} />}

      {/* Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              {logoSrc ? (
                <img src={logoSrc} alt={title} className="h-5 w-auto" />
              ) : (
                <Truck className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title} Configuration</h3>
              <p className="text-xs text-slate-500">API credentials and connection settings</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {!hideName && (
            <FormField label="Provider Name" name="name" value={values.name} onChange={handleChange} placeholder="Pathao Courier" />
          )}
          {!hideApiUrl && (
            <FormField label="API Base URL" name="apiBaseUrl" value={values.apiBaseUrl} onChange={handleChange} placeholder={defaultApiUrl} />
          )}

          {credentialFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Key className="h-3.5 w-3.5" />
                {field.label}
              </label>
              <div className="relative">
                <input
                  type={showSecrets[field.name] ? "text" : "password"}
                  name={field.name}
                  value={values[field.name] || ""}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all font-mono"
                />
                <button type="button" onClick={() => toggleSecret(field.name)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showSecrets[field.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}

          {configInMain && configFields.map((field) => (
            <FormField key={field.name} label={field.label} name={field.name} value={values[field.name] || ""} onChange={handleChange} placeholder={field.placeholder} />
          ))}
        </div>
      </div>

      {/* Status & Config */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-xl">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Status & Config</h3>
              <p className="text-xs text-slate-500">Enable provider and additional settings</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                name="isEnabled"
                checked={values.isEnabled === "true"}
                onChange={(e) => handleChange({ target: { name: "isEnabled", value: e.target.checked ? "true" : "false" } } as any)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-900">Enable {title}</span>
              <p className="text-xs text-slate-500">Allow this courier for deliveries</p>
            </div>
          </label>

          {!configInMain && configFields.map((field) => (
            <FormField key={field.name} label={field.label} name={field.name} value={values[field.name] || ""} onChange={handleChange} placeholder={field.placeholder} />
          ))}

          {showSyncLocations && (
            <>
              <button
                type="button"
                onClick={handleSyncLocations}
                disabled={syncing}
                className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-100 disabled:opacity-50"
              >
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {syncing ? "Syncing..." : "Sync Locations from API"}
              </button>
              {syncStatus && syncStatus.status === "syncing" && (
                <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing locations from Pathao API...
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
                    <span>Cities: {syncStatus.cities}</span>
                    <span>Zones: {syncStatus.zones}</span>
                    <span>Areas: {syncStatus.areas}</span>
                    <span>Errors: {syncStatus.errors}</span>
                  </div>
                  <p className="text-xs text-blue-500">This may take several minutes. You can safely navigate away.</p>
                </div>
              )}
              {syncStatus && syncStatus.status === "completed" && (
                <div className="mt-3 rounded-xl bg-green-50 border border-green-100 p-4 text-sm text-green-700">
                  Synced: {syncStatus.cities} cities, {syncStatus.zones} zones, {syncStatus.areas} areas
                  {syncStatus.errors > 0 && <span className="text-amber-600"> ({syncStatus.errors} errors)</span>}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <PrimaryButton type="submit" text={isEditing ? "Save Changes" : "Create Settings"} disabled={isPending} />
      </div>
    </form>
  );
}
