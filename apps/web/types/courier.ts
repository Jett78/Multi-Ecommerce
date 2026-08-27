export interface CourierSettings {
  id: string;
  provider: string;
  name: string;
  apiBaseUrl: string;
  credentials: string;
  config: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryRate {
  provider: string;
  basePrice: number;
  discount: number;
  finalPrice: number;
  codEnabled: boolean;
  codPercentage: number;
  estimatedDays: number;
  providerUsed?: string;
}

export interface DistrictMapping {
  id: string;
  district: string;
  provinceId: number;
  provider: string;
  courierCityId: number | null;
  courierCityName: string | null;
  courierAreaId: number | null;
  courierAreaName: string | null;
  courierBranch: string | null;
  deliveryChargeOverrides: Array<{ weightKg: number; price: number }> | null;
  isMapped: boolean;
}

export interface CourierCity {
  id: string;
  provider: string;
  courierId: number;
  name: string;
}

export interface CourierZone {
  id: string;
  provider: string;
  cityId: string;
  courierId: number;
  name: string;
}

export interface CourierArea {
  id: string;
  provider: string;
  zoneId: string;
  courierId: number;
  name: string;
  homeDelivery: boolean;
  pickup: boolean;
}

export interface CourierBranch {
  id: string;
  provider: string;
  name: string;
  district: string | null;
  phone: string | null;
  address: string | null;
}
