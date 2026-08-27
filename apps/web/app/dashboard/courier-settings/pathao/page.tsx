import { CourierSettingsForm } from "@/components/dashboard/courier-settings-form";
import DashboardHeading from "@/components/dashboard/dashboard-heading";

export const metadata = {
  title: "Pathao Courier Settings | Dashboard",
};

export default function PathaoSettingsPage() {
  return (
    <div className="space-y-6">
      <DashboardHeading
        title="Pathao Courier"
        description="Configure Pathao Courier API credentials for delivery"
      />
      <CourierSettingsForm
        provider="pathao"
        title="Pathao Courier"
        defaultApiUrl="https://courier-api-sandbox.pathao.com"
        credentialFields={[
          { name: "clientId", label: "Client ID", placeholder: "Enter Pathao client ID" },
          { name: "clientSecret", label: "Client Secret", placeholder: "Enter Pathao client secret" },
          { name: "username", label: "Username", placeholder: "Enter Pathao username" },
          { name: "password", label: "Password", placeholder: "Enter Pathao password" },
        ]}
        configFields={[
          { name: "storeId", label: "Store ID", placeholder: "Enter your Pathao store ID" },
        ]}
      />
    </div>
  );
}
