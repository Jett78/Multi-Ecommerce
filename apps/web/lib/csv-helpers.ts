import Papa from "papaparse";
import type { Product, ProductVariant } from "@/types/product";

// ─── Export Types ────────────────────────────────────────────────────────────

export interface CsvExportRow {
  name: string;
  slug: string;
  description: string;
  category: string;
  categoryId: string;
  subcategory: string;
  subcategoryId: string;
  brand: string;
  brandId: string;
  sku: string;
  status: string;
  isFeatured: string;
  tags: string;
  isActive: string;
  variantSku: string;
  variantPrice: string;
  variantCompareAtPrice: string;
  variantCostPrice: string;
  variantStockQuantity: string;
  variantWeight: string;
  variantBarcode: string;
  variantAllowBackorder: string;
  variantLowStockThreshold: string;
  variantAttributes: string;
}

// ─── Export ──────────────────────────────────────────────────────────────────

function formatVariantAttributes(variant: ProductVariant): string {
  if (!variant.attributes || variant.attributes.length === 0) return "";
  return variant.attributes
    .map((a) => `${a.attributeName}:${a.attributeValue}`)
    .join(", ");
}

export function productsToCsvRows(products: Product[]): CsvExportRow[] {
  const rows: CsvExportRow[] = [];

  for (const product of products) {
    const hasVariants = product.variants && product.variants.length > 0;

    if (hasVariants) {
      for (const variant of product.variants!) {
        rows.push({
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          category: product.category?.name || "",
          categoryId: product.categoryId || "",
          subcategory: product.subcategory?.name || "",
          subcategoryId: product.subcategoryId || "",
          brand: product.brand?.name || "",
          brandId: product.brandId || "",
          sku: product.sku || "",
          status: product.status,
          isFeatured: String(product.isFeatured),
          tags: product.tags?.join(", ") || "",
          isActive: String(product.isActive),
          variantSku: variant.sku || "",
          variantPrice: String(variant.price ?? ""),
          variantCompareAtPrice: String(variant.compareAtPrice ?? ""),
          variantCostPrice: String(variant.costPrice ?? ""),
          variantStockQuantity: String(variant.stockQuantity ?? ""),
          variantWeight: String(variant.weight ?? ""),
          variantBarcode: variant.barcode || "",
          variantAllowBackorder: String(variant.allowBackorder ?? false),
          variantLowStockThreshold: String(variant.lowStockThreshold ?? ""),
          variantAttributes: formatVariantAttributes(variant),
        });
      }
    } else {
      rows.push({
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        category: product.category?.name || "",
        categoryId: product.categoryId || "",
        subcategory: product.subcategory?.name || "",
        subcategoryId: product.subcategoryId || "",
        brand: product.brand?.name || "",
        brandId: product.brandId || "",
        sku: product.sku || "",
        status: product.status,
        isFeatured: String(product.isFeatured),
        tags: product.tags?.join(", ") || "",
        isActive: String(product.isActive),
        variantSku: "",
        variantPrice: String(product.price ?? ""),
        variantCompareAtPrice: String(product.compareAtPrice ?? ""),
        variantCostPrice: String(product.costPrice ?? ""),
        variantStockQuantity: String(product.stockQuantity ?? ""),
        variantWeight: String(product.weight ?? ""),
        variantBarcode: product.barcode || "",
        variantAllowBackorder: String(product.allowBackorder ?? false),
        variantLowStockThreshold: String(product.lowStockThreshold ?? ""),
        variantAttributes: "",
      });
    }
  }

  return rows;
}

export function downloadCsv(rows: CsvExportRow[], filename: string) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Import Types ────────────────────────────────────────────────────────────

export interface ParsedVariant {
  sku: string;
  price: number | null;
  compareAtPrice: number | null;
  costPrice: number | null;
  stockQuantity: number | null;
  weight: number | null;
  barcode: string;
  allowBackorder: boolean;
  lowStockThreshold: number | null;
  attributes: { attributeName: string; attributeValue: string }[];
}

export interface ParsedProduct {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  brandId: string;
  sku: string;
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  tags: string[];
  isActive: boolean;
  variants: ParsedVariant[];
  _rowNumbers: number[];
  _errors: string[];
}

// ─── Import ──────────────────────────────────────────────────────────────────

export interface FieldMapping {
  [ourField: string]: string; // our field key → CSV column name (empty = unmapped)
}

export const IMPORT_FIELDS: { key: string; label: string; required: boolean; group: string; hint?: string }[] = [
  { key: "name", label: "Product Name", required: true, group: "product" },
  { key: "slug", label: "Slug", required: false, group: "product" },
  { key: "description", label: "Description", required: false, group: "product" },
  { key: "category", label: "Category", required: false, group: "product", hint: "Name or UUID" },
  { key: "subcategory", label: "Subcategory", required: false, group: "product", hint: "Name or UUID" },
  { key: "brand", label: "Brand", required: false, group: "product", hint: "Name or UUID" },
  { key: "sku", label: "SKU", required: false, group: "product" },
  { key: "status", label: "Status", required: false, group: "product", hint: "draft/active/archived" },
  { key: "isFeatured", label: "Is Featured", required: false, group: "product", hint: "true/false" },
  { key: "tags", label: "Tags", required: false, group: "product", hint: "Comma-separated" },
  { key: "isActive", label: "Is Active", required: false, group: "product", hint: "true/false" },
  { key: "price", label: "Price (paisa)", required: false, group: "product", hint: "Product-level price" },
  { key: "compareAtPrice", label: "Compare At Price", required: false, group: "product" },
  { key: "costPrice", label: "Cost Price", required: false, group: "product" },
  { key: "stockQuantity", label: "Stock Quantity", required: false, group: "product" },
  { key: "weight", label: "Weight (g)", required: false, group: "product" },
  { key: "barcode", label: "Barcode", required: false, group: "product" },
  { key: "variantSku", label: "Variant SKU", required: false, group: "variant" },
  { key: "variantPrice", label: "Variant Price (paisa)", required: false, group: "variant" },
  { key: "variantCompareAtPrice", label: "Variant Compare At Price", required: false, group: "variant" },
  { key: "variantCostPrice", label: "Variant Cost Price", required: false, group: "variant" },
  { key: "variantStockQuantity", label: "Variant Stock Quantity", required: false, group: "variant" },
  { key: "variantWeight", label: "Variant Weight (g)", required: false, group: "variant" },
  { key: "variantBarcode", label: "Variant Barcode", required: false, group: "variant" },
  { key: "variantAllowBackorder", label: "Variant Allow Backorder", required: false, group: "variant", hint: "true/false" },
  { key: "variantLowStockThreshold", label: "Variant Low Stock Threshold", required: false, group: "variant" },
  { key: "variantAttributes", label: "Variant Attributes", required: false, group: "variant", hint: "Color:Blue,Size:XL" },
];

// Fuzzy auto-map: tries to match CSV column header to our field label/key
export function autoMapFields(csvHeaders: string[]): FieldMapping {
  const mapping: FieldMapping = {};
  const normalized = csvHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  for (const field of IMPORT_FIELDS) {
    const fieldNorm = field.label.toLowerCase().replace(/[^a-z0-9]/g, "");
    const keyNorm = field.key.toLowerCase();

    // Try exact match on label or key
    let idx = normalized.findIndex((n) => n === fieldNorm || n === keyNorm);
    // Try partial match (csv header contains field key or vice versa)
    if (idx === -1) {
      idx = normalized.findIndex(
        (n) => n.includes(keyNorm) || keyNorm.includes(n)
      );
    }
    // Try partial match on label words
    if (idx === -1) {
      const words = fieldNorm.split(/\s+/);
      idx = normalized.findIndex((n) => words.some((w) => w.length > 2 && n.includes(w)));
    }

    if (idx !== -1 && csvHeaders[idx]) {
      mapping[field.key] = csvHeaders[idx]!;
    } else {
      mapping[field.key] = "";
    }
  }

  return mapping;
}

// Remap raw CSV data using the field mapping (our field → CSV column → value)
export function remapCsvData(
  rawData: Record<string, string>[],
  mapping: FieldMapping
): Record<string, string>[] {
  return rawData.map((row) => {
    const remapped: Record<string, string> = {};
    for (const [ourField, csvColumn] of Object.entries(mapping)) {
      remapped[ourField] = csvColumn ? row[csvColumn] || "" : "";
    }
    return remapped;
  });
}

// ─── Import Helpers ──────────────────────────────────────────────────────────

function parseAttributes(raw: string): { attributeName: string; attributeValue: string }[] {
  if (!raw || !raw.trim()) return [];
  return raw.split(",").map((pair) => {
    const [name, ...valueParts] = pair.split(":");
    return {
      attributeName: (name || "").trim(),
      attributeValue: valueParts.join(":").trim(),
    };
  }).filter((a) => a.attributeName && a.attributeValue);
}

function toNum(val: string): number | null {
  if (!val || !val.trim()) return null;
  const n = parseInt(val.trim(), 10);
  return isNaN(n) ? null : n;
}

function toBool(val: string): boolean {
  return val.trim().toLowerCase() === "true";
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface NameToIdMap {
  categories: Map<string, string>;
  subcategories: Map<string, string>;
  brands: Map<string, string>;
}

export function buildNameToIdMap(
  categories: { id: string; name: string }[],
  subcategories: { id: string; name: string }[],
  brands: { id: string; name: string }[]
): NameToIdMap {
  return {
    categories: new Map(categories.map((c) => [c.name.toLowerCase(), c.id])),
    subcategories: new Map(subcategories.map((s) => [s.name.toLowerCase(), s.id])),
    brands: new Map(brands.map((b) => [b.name.toLowerCase(), b.id])),
  };
}

function resolveId(
  value: string,
  nameMap: Map<string, string>,
  fieldName: string,
  errors: string[]
): string | undefined {
  if (!value || !value.trim()) return undefined;
  // Already a UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())) {
    return value.trim();
  }
  // Try name lookup
  const id = nameMap.get(value.trim().toLowerCase());
  if (!id) {
    errors.push(`${fieldName} "${value}" not found`);
    return undefined;
  }
  return id;
}

export function parseCsvToProducts(
  data: Record<string, string>[],
  nameMap: NameToIdMap
): ParsedProduct[] {
  const grouped = new Map<string, ParsedProduct>();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    const rowNum = i + 2; // +2 for 1-indexed + header row
    const productName = (row.name || "").trim();

    if (!productName) continue;

    const key = productName.toLowerCase();
    const errors: string[] = [];

    const categoryId = resolveId(row.categoryId || "", nameMap.categories, "categoryId", errors)
      || resolveId(row.category || "", nameMap.categories, "category", errors);
    const subcategoryId = resolveId(row.subcategoryId || "", nameMap.subcategories, "subcategoryId", errors)
      || resolveId(row.subcategory || "", nameMap.subcategories, "subcategory", errors);
    const brandId = resolveId(row.brandId || "", nameMap.brands, "brandId", errors)
      || resolveId(row.brand || "", nameMap.brands, "brand", errors);

    const status = (row.status || "active").trim().toLowerCase();
    if (!["draft", "active", "archived"].includes(status)) {
      errors.push(`Invalid status "${row.status}"`);
    }

    const variant: ParsedVariant = {
      sku: (row.variantSku || "").trim(),
      price: toNum(row.variantPrice || row.price || ""),
      compareAtPrice: toNum(row.variantCompareAtPrice || ""),
      costPrice: toNum(row.variantCostPrice || ""),
      stockQuantity: toNum(row.variantStockQuantity || ""),
      weight: toNum(row.variantWeight || ""),
      barcode: (row.variantBarcode || "").trim(),
      allowBackorder: toBool(row.variantAllowBackorder || ""),
      lowStockThreshold: toNum(row.variantLowStockThreshold || ""),
      attributes: parseAttributes(row.variantAttributes || ""),
    };

    const hasVariantData = variant.sku || variant.price !== null || variant.stockQuantity !== null;

    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      if (hasVariantData) {
        existing.variants.push(variant);
      }
      existing._rowNumbers.push(rowNum);
      existing._errors.push(...errors);
    } else {
      const tags = (row.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
      const product: ParsedProduct = {
        name: productName,
        slug: (row.slug || "").trim() || generateSlug(productName),
        description: (row.description || "").trim(),
        categoryId: categoryId || undefined as any,
        subcategoryId: subcategoryId || undefined as any,
        brandId: brandId || undefined as any,
        sku: (row.sku || "").trim() || undefined as any,
        status: status as "draft" | "active" | "archived",
        isFeatured: toBool(row.isFeatured || ""),
        tags,
        isActive: row.isActive !== undefined ? toBool(row.isActive) : true,
        variants: hasVariantData ? [variant] : [],
        _rowNumbers: [rowNum],
        _errors: errors,
      };
      grouped.set(key, product);
    }
  }

  return Array.from(grouped.values());
}
