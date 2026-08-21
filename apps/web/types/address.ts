export interface ShippingAddress {
  id: string;
  userId: string;
  type: "home" | "office" | "other";
  label?: string | null;
  provinceId: number;
  provinceName: string;
  district: string;
  municipality: string;
  landmark?: string | null;
  streetAddress: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressFormValues {
  type?: "home" | "office" | "other";
  label?: string;
  provinceId?: number;
  provinceName?: string;
  district?: string;
  municipality?: string;
  landmark?: string;
  streetAddress?: string;
  isDefault?: boolean;
}
