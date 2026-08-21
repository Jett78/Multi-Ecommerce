"use client";

import * as React from "react";
import { Plus, MapPin, Loader2 } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { showSuccess, showError } from "@/lib/toast-helper";
import { AddressCard } from "./address-card";
import { AddressForm } from "./address-form";
import type { ShippingAddress, AddressFormValues } from "@/types/address";

export function ProfileAddresses() {
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<ShippingAddress | null>(null);

  const { getAll, create, update, remove } = useCrud<AddressFormValues>({
    endpoint: API_ROUTES.SHIPPING_ADDRESS,
    queryKey: "shipping-addresses",
    isAuthenticated: true,
  });

  const { data: addresses, isLoading } = getAll();
  const list = (addresses as ShippingAddress[]) || [];

  const handleSubmit = (values: AddressFormValues) => {
    if (editing) {
      update.mutate(
        { id: editing.id, data: values },
        {
          onSuccess: () => {
            showSuccess("Address updated successfully");
            setShowForm(false);
            setEditing(null);
          },
          onError: () => showError("Failed to update address"),
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: () => {
          showSuccess("Address added successfully");
          setShowForm(false);
          setEditing(null);
        },
        onError: () => showError("Failed to add address"),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this address?")) return;
    remove.mutate(id, {
      onSuccess: () => showSuccess("Address deleted"),
      onError: () => showError("Failed to delete address"),
    });
  };

  const handleSetDefault = (id: string) => {
    update.mutate(
      { id, data: { isDefault: true } },
      {
        onSuccess: () => showSuccess("Default address updated"),
        onError: () => showError("Failed to update default"),
      },
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50/80 to-transparent">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-primarymain" />
          <h2 className="text-sm font-bold text-slate-900">Saved Addresses</h2>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primarymain px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primarymain/90"
          >
            <Plus className="h-3.5 w-3.5" /> Add Address
          </button>
        )}
      </div>

      <div className="p-6">
        {showForm ? (
          <AddressForm
            initial={editing || undefined}
            isSubmitting={create.isPending || update.isPending}
            submitLabel={editing ? "Update Address" : "Add Address"}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-primarymain" />
          </div>
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No saved addresses yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={() => {
                  setEditing(addr);
                  setShowForm(true);
                }}
                onDelete={() => handleDelete(addr.id)}
                onSetDefault={() => handleSetDefault(addr.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
