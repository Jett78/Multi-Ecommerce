export interface CourierCity {
  courierId: number;
  name: string;
}

export interface CourierZone {
  courierId: number;
  name: string;
  cityCourierId: number;
}

export interface CourierArea {
  courierId: number;
  name: string;
  zoneCourierId: number;
  homeDelivery: boolean;
  pickup: boolean;
}

export interface CourierBranch {
  name: string;
  district: string;
  phone: string;
  address: string;
}

export interface DeliveryRateParams {
  weightKg: number;
  cityId?: number;
  zoneId?: number;
  areaId?: number;
  sourceBranch?: string;
  destBranch?: string;
  deliveryType?: string;
  codAmount?: number;
}

export interface DeliveryRate {
  provider: string;
  basePrice: number;
  discount: number;
  finalPrice: number;
  codEnabled: boolean;
  codPercentage: number;
  estimatedDays: number;
}

export interface CourierOrderParams {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  cityId?: number;
  zoneId?: number;
  areaId?: number;
  sourceBranch?: string;
  destBranch?: string;
  deliveryType?: string;
  itemWeight: number;
  itemQuantity: number;
  amountToCollect: number;
  itemDescription?: string;
  specialInstruction?: string;
}

export interface CourierOrderResult {
  consignmentId: string;
  deliveryFee: number;
  status: string;
}

export abstract class CourierAdapter {
  abstract readonly name: string;

  abstract getCities(): Promise<CourierCity[]>;
  abstract getZones(cityId: number): Promise<CourierZone[]>;
  abstract getAreas(zoneId: number): Promise<CourierArea[]>;
  abstract getBranches(): Promise<CourierBranch[]>;

  abstract calculateRate(params: DeliveryRateParams): Promise<DeliveryRate>;
  abstract createOrder(params: CourierOrderParams): Promise<CourierOrderResult>;
  abstract getOrderInfo(consignmentId: string): Promise<{
    consignmentId: string;
    orderStatus: string;
    orderStatusSlug: string;
    invoiceId?: string;
    updatedAt?: string;
  }>;
}

export interface PathaoOrderInfo {
  consignmentId: string;
  orderStatus: string;
  orderStatusSlug: string;
  invoiceId?: string;
  updatedAt?: string;
}
