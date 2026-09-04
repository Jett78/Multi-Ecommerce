"use client";

import { useState } from "react";
import { Bell, Mail, CheckCircle } from "lucide-react";
import PrimaryButton from "@/components/ui/primary-button";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import { showSuccess } from "@/lib/toast-helper";

export default function AccountSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    showSuccess("Settings saved successfully!");
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {isSaving && <SubmittingLoader status="Saving settings" />}

      {/* Notification Info */}
      <div className="flex items-start gap-4 bg-white border border-gray-200 p-5">
        <div className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 flex-shrink-0">
          <Bell className="size-4 text-gray-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Notification Preferences
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Choose how you want to be notified about account activity and updates.
          </p>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="border border-gray-200 bg-white">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Email Notifications</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage your email notification settings
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-100 hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200">
                  <Mail className="size-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Email Notifications
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Receive email updates about your account activity.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primarymain" />
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-100 hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200">
                  <CheckCircle className="size-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Marketing Emails
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Receive emails about new features and updates.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingEmails}
                  onChange={(e) => setMarketingEmails(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primarymain" />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <PrimaryButton
              type="submit"
              text={isSaving ? "Saving..." : "Save Changes"}
              disabled={isSaving}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
