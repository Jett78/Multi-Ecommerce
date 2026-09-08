"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Plus, Loader2, X, MapPin } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { useQueryClient } from "@tanstack/react-query";
import { API_ROUTES } from "@/config/api-routes";
import { showSuccess, showError } from "@/lib/toast-helper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddressCard } from "./address-card";
import { AddressForm } from "./address-form";
import type { ShippingAddress, AddressFormValues } from "@/types/address";

interface SavedAddressSelectorProps {
  selectedId?: string;
  onApply: (address: ShippingAddress) => void;
}

export function SavedAddressSelector({ selectedId, onApply }: SavedAddressSelectorProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState<ShippingAddress | null>(null);
  const [settingDefaultId, setSettingDefaultId] = React.useState<string | null>(null);
  const [deletingAddr, setDeletingAddr] = React.useState<ShippingAddress | null>(null);
  const queryClient = useQueryClient();
  const onApplyRef = React.useRef(onApply);
  onApplyRef.current = onApply;

  const { getAll, create, put, remove } = useCrud<AddressFormValues>({
    endpoint: API_ROUTES.SHIPPING_ADDRESS,
    queryKey: "shipping-addresses",
    isAuthenticated: true,
  });

  const { data: addresses, isLoading } = getAll();
  const list = (addresses as ShippingAddress[]) || [];

  React.useEffect(() => {
    if (list.length > 0 && !selectedId) {
      const defaultAddr = list.find((a) => a.isDefault);
      if (defaultAddr) {
        onApplyRef.current(defaultAddr);
      }
    }
  }, [list, selectedId]);

  const handleAdd = async (values: AddressFormValues) => {
    try {
      const res = await create.mutateAsync(values);
      const addr = (res as any)?.data || res;
      if (addr?.id) {
        onApply(addr as ShippingAddress);
        showSuccess("Address saved");
      }
      setShowModal(false);
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
      setShowModal(false);
      setEditing(null);
    } catch {
      showError("Failed to update address");
    }
  };

  const handleDelete = () => {
    if (!deletingAddr) return;
    remove.mutate(deletingAddr.id, {
      onSuccess: () => {
        showSuccess("Address deleted");
        if (deletingAddr.id === selectedId) {
          const remaining = list.filter((a) => a.id !== deletingAddr.id);
          const next = remaining[0];
          if (next) onApply(next);
        }
        setDeletingAddr(null);
      },
      onError: () => {
        showError("Failed to delete address");
        setDeletingAddr(null);
      },
    });
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await fetch(`${API_ROUTES.SHIPPING_ADDRESS}/${id}/default`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      await queryClient.refetchQueries({ queryKey: ["shipping-addresses"] });
    } catch {
      // silent
    } finally {
      setSettingDefaultId(null);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (addr: ShippingAddress) => {
    setEditing(addr);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Delivery Address</h2>
            <p className="text-xs text-gray-400">
              {list.length > 0 ? "Select a saved address or add a new one" : "Add your delivery address to continue"}
            </p>
          </div>
        </div>
        {list.length > 0 && (
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-xl bg-primarymain px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-primarymain/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add New
          </button>
        )}
      </div>

      {/* Address list */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primarymain" />
        </div>
      ) : list.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              selectable
              selected={addr.id === selectedId}
              onSelect={() => onApply(addr)}
              onEdit={() => openEdit(addr)}
              onDelete={() => setDeletingAddr(addr)}
              onSetDefault={() => handleSetDefault(addr.id)}
              loadingDefault={settingDefaultId === addr.id}
            />
          ))}
        </div>
      ) : (
        <AddressForm
          isSubmitting={create.isPending}
          submitLabel="Save Address"
          onSubmit={handleAdd}
        />
      )}

      {/* Modal */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  {editing ? "Edit Address" : "Add New Address"}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <AddressForm
                initial={editing || undefined}
                isSubmitting={create.isPending || put.isPending}
                submitLabel={editing ? "Update Address" : "Save Address"}
                onSubmit={editing ? handleEdit : handleAdd}
                onCancel={closeModal}
              />
            </div>
          </div>,
          document.body
        )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingAddr} onOpenChange={(open) => { if (!open) setDeletingAddr(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={remove.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {remove.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
