"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PrimaryButton from "@/components/ui/primary-button";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import AvatarUpload from "@/components/ui/avatar-upload";
import { ProfileAddresses } from "@/components/address/profile-addresses";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { apiClient } from "@/lib/api-client";
import { showSuccess, showError } from "@/lib/toast-helper";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function UserProfilePage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { getAll } = useCrud<UserProfile>({
    endpoint: `${API_ROUTES.AUTH}/profile`,
    queryKey: "user-profile",
  });

  const { data: profile, isLoading } = getAll();

  const profileData = profile as UserProfile | undefined;

  if (profileData && !initialized) {
    setName(profileData.name || "");
    setPhone(profileData.phone || "");
    setAddress(profileData.address || "");
    setImageUrl(profileData.image || null);
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: (data: { name: string; phone: string; address: string; image: string | null }) =>
      apiClient<{ success: boolean; data: UserProfile }>(
        `${API_ROUTES.AUTH}/profile`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
          isAuthenticated: true,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      showSuccess("Profile updated successfully!");
    },
    onError: () => {
      showError("Failed to update profile");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, phone, address, image: imageUrl });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="size-8 border-4 border-primarymain border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">Failed to load profile</p>
      </div>
    );
  }

  const initials = profileData.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-8">
      {mutation.isPending && <SubmittingLoader status="Saving profile" />}

      {/* Profile Header */}
      <div className="border border-gray-200 bg-white">
        <div className="h-20 bg-gray-50 border-b border-gray-100" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <AvatarUpload
              currentImage={imageUrl}
              initials={initials}
              onImageUploaded={(url) => setImageUrl(url)}
              size="md"
            />
            <div className="flex-1 sm:pb-1">
              <h1 className="text-xl font-bold text-gray-900">
                {profileData.name}
              </h1>
              <p className="text-sm text-gray-500">{profileData.email}</p>
            </div>
            <div className="flex items-center gap-2 sm:pb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-gray-100 text-gray-700 uppercase tracking-wide">
                <Shield className="size-3.5" />
                {profileData.role?.replace("_", " ")}
              </span>
              {profileData.emailVerified && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-green-50 text-green-700 uppercase tracking-wide">
                  <CheckCircle className="size-3.5" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 bg-white border border-gray-200 p-4">
          <div className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200">
            <Mail className="size-4 text-gray-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Email</p>
            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
              {profileData.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white border border-gray-200 p-4">
          <div className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200">
            <Phone className="size-4 text-gray-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Phone</p>
            <p className="text-sm font-medium text-gray-900">
              {profileData.phone || "Not set"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white border border-gray-200 p-4">
          <div className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200">
            <Calendar className="size-4 text-gray-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Joined</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(profileData.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="border border-gray-200 bg-white">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Personal Information
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Update your personal details
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="pl-10 h-11 border-gray-200 focus:border-primarymain"
                  disabled={mutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  className="pl-10 h-11 bg-gray-50 border-gray-200"
                  disabled
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Contact support to change your email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+977-9841234567"
                  className="pl-10 h-11 border-gray-200 focus:border-primarymain"
                  disabled={mutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Role
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  value={profileData.role?.replace("_", " ") || "customer"}
                  className="pl-10 h-11 bg-gray-50 border-gray-200 capitalize"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Address
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address"
                  className="pl-10 h-11 border-gray-200 focus:border-primarymain"
                  disabled={mutation.isPending}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <PrimaryButton
              type="submit"
              text={mutation.isPending ? "Saving..." : "Save Changes"}
              disabled={mutation.isPending}
            />
          </div>
        </form>
      </div>

      {/* Saved Addresses */}
      <ProfileAddresses />
    </div>
  );
}
