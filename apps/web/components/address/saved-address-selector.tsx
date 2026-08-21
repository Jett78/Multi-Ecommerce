"use client";

import * as React from "react";
import { Plus, Loader2 } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { showSuccess, showError } from "@/lib/toast-helper";
import { AddressCard } from "./address-card";
import { AddressForm } from "./address-form";
import type { ShippingAddress, AddressFormValues } from "@/types/address";

interface SavedAddressSelectorProps {
  selectedId?: string;
  onApply: (address: ShippingAddress) => void;
}

export function SavedAddressSelector({ selectedId, onApply }: SavedAddressSelectorProps) {
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<ShippingAddress | null>(null);

  const { getAll, create, put, remove } = useCrud<AddressFormValues>({
    endpoint: API_ROUTES.SHIPPING_ADDRESS,
    queryKey: "shipping-addresses",
    isAuthenticated: true,
  });

  const { data: addresses, isLoading } = getAll();
  const list = (addresses as ShippingAddress[]) || [];

  const handleAdd = async (values: AddressFormValues) => {
    try {
      const res = await create.mutateAsync(values);
      const addr = (res as any)?.data || res;
      if (addr?.id) {
        onApply(addr as ShippingAddress);
        showSuccess("Address saved");
      }
      setShowForm(false);
    } catch {
      showError("Failed to save address");
    }
  };

  const handleEdit = async (values: AddressFormValues) => {
    if (!editing) return;
    try {
      const res = await put.mutateAsync({ id: editing.id, data: values });
      const addr = (res as any)?.data || res;
      if (addr?.id && addr.id === selectedId) {
        onApply(addr as ShippingAddress);
      }
      showSuccess("Address updated");
      setShowForm(false);
      setEditing(null);
    } catch {
      showError("Failed to update address");
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this address?")) return;
    remove.mutate(id, {
      onSuccess: () => {
        showSuccess("Address deleted");
        if (id === selectedId) {
          const remaining = list.filter((a) => a.id !== id);
          const next = remaining[0];
          if (next) onApply(next);
        }
      },
      onError: () => showError("Failed to delete address"),
    });
  };

  const handleSetDefault = async (id: string) => {
    try {
      await fetch(`${API_ROUTES.SHIPPING_ADDRESS}/${id}/default`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      showSuccess("Default address updated");
    } catch {
      showError("Failed to update default");
    }
  };

  const startEdit = (addr: ShippingAddress) => {
    setEditing(addr);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-indigo-100/10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primarymain text-white">
          <Plus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Delivery Address</h2>
          <p className="text-xs text-gray-400">Select a saved address or add a new one</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primarymain" />
        </div>
      ) : showForm ? (
        <div onClick={(e) => e.stopPropagation()}>
          <AddressForm
            initial={editing || undefined}
            isSubmitting={create.isPending || put.isPending}
            submitLabel={editing ? "Update Address" : "Save & Use"}
            onSubmit={editing ? handleEdit : handleAdd}
            onCancel={cancelForm}
          />
        </div>
      ) : (
        <>
          {list.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  selectable
                  selected={addr.id === selectedId}
                  onSelect={() => onApply(addr)}
                  onEdit={() => startEdit(addr)}
                  onDelete={() => handleDelete(addr.id)}
                  onSetDefault={() => handleSetDefault(addr.id)}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-primarymain hover:text-primarymain"
          >
            <Plus className="h-4 w-4" />
            Add a new address
          </button>
        </>
      )}
    </div>
  );
}
