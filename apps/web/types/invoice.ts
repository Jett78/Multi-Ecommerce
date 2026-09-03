import type { Order, OrderItem } from "./order";

export interface InvoiceCompanyProfile {
  companyName: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  logoKey?: string;
}

export interface InvoiceData {
  order: Order & { items: OrderItem[] };
  company: InvoiceCompanyProfile;
}
