export interface WishlistItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  price: number;
  imageUrl?: string;
  attributes?: { attributeName: string; attributeValue: string }[];
}

export interface WishlistStore {
  items: WishlistItem[];
  toggleItem: (item: WishlistItem) => void;
  addItem: (item: WishlistItem) => void;
  removeItem: (variantId: string) => void;
  hasItem: (variantId: string) => boolean;
  clearWishlist: () => void;
  itemCount: () => number;
}
