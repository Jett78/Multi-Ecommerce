"use client";

import { Home, Building2, MapPin, Star, Pencil, Trash2, Check, Loader2 } from "lucide-react";
import type { ShippingAddress } from "@/types/address";

interface AddressCardProps {
  address: ShippingAddress;
  selected?: boolean;
  selectable?: boolean;
  loadingDefault?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}

const TYPE_ICON: Record<ShippingAddress["type"], React.ReactNode> = {
  home: <Home className="h-4 w-4" />,
  office: <Building2 className="h-4 w-4" />,
  other: <MapPin className="h-4 w-4" />,
};

export function AddressCard({
  address,
  selected = false,
  selectable = false,
  loadingDefault = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  const fullAddress = [
    address.streetAddress,
    address.municipality,
    address.district,
    `Province ${address.provinceId}`,
    "Nepal",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      onClick={selectable ? onSelect : undefined}
      className={`rounded-2xl border-2 p-4 transition-all ${
        selected
          ? "border-primarymain bg-primarymain/5 shadow-md shadow-primarymain/10"
          : "border-gray-100 hover:border-gray-200"
      } ${selectable ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primarymain/10 text-primarymain">
            {TYPE_ICON[address.type]}
          </span>
          <div>
            <p className="text-sm font-semibold capitalize text-gray-900">
              {address.label || address.type}
            </p>
            {address.isDefault && (
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-600">
                <Star className="h-3 w-3" /> Default
              </span>
            )}
          </div>
        </div>

        {selectable && selected && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primarymain text-white">
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-600">{fullAddress}</p>
      {address.landmark && (
        <p className="mt-0.5 text-xs text-gray-400">Landmark: {address.landmark}</p>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
        {!address.isDefault && onSetDefault && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault();
            }}
            disabled={loadingDefault}
            className="flex items-center gap-1 text-xs font-medium text-primarymain hover:underline disabled:opacity-50"
          >
            {loadingDefault ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : null}
            {loadingDefault ? "Setting..." : "Set default"}
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
