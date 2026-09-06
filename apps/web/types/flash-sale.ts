export interface FlashSale {
  id: string;
  name: string;
  slug: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  products?: FlashSaleProduct[];
}

export interface FlashSaleProduct {
  id: string;
  flashSaleId: string;
  variantId: string;
  salePrice: number;
  originalPrice: number;
  maxQuantity?: number;
  soldQuantity: number;
  createdAt: string;
  productName: string;
  productSlug: string;
  variantSku?: string;
  variantPrice: number;
}

export interface ActiveFlashSaleProduct {
  id: string;
  flashSaleId: string;
  variantId: string;
  salePrice: number;
  originalPrice: number;
  maxQuantity?: number;
  soldQuantity: number;
  flashSaleName: string;
  flashSaleSlug: string;
  flashSaleStartsAt: string;
  flashSaleEndsAt: string;
  productId: string;
  productName: string;
  productSlug: string;
}
