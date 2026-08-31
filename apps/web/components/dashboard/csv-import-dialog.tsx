"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import {
  parseCsvToProducts,
  buildNameToIdMap,
  autoMapFields,
  remapCsvData,
  IMPORT_FIELDS,
  type FieldMapping,
  type ParsedProduct,
} from "@/lib/csv-helpers";
import { showSuccess, showError } from "@/lib/toast-helper";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: { id: string; name: string }[];
  subcategories: { id: string; name: string; categoryId: string }[];
  brands: { id: string; name: string }[];
}

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "done";

interface ImportResult {
  succeeded: number;
  failed: number;
  errors: { product: string; message: string }[];
}

const STEPS = [
  { key: "upload", label: "Upload" },
  { key: "mapping", label: "Map Fields" },
  { key: "preview", label: "Preview" },
  { key: "importing", label: "Import" },
  { key: "done", label: "Done" },
] as const;

const STEP_INDEX: Record<ImportStep, number> = {
  upload: 0,
  mapping: 1,
  preview: 2,
  importing: 3,
  done: 4,
};

const selectClass = "h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary truncate max-w-[180px]";

export default function CsvImportDialog({
  open,
  onOpenChange,
  onSuccess,
  categories,
  subcategories,
  brands,
}: CsvImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawCsvData, setRawCsvData] = useState<Record<string, string>[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { create } = useCrud<Record<string, any>>({
    endpoint: API_ROUTES.PRODUCT,
    queryKey: "products",
    isAuthenticated: true,
  });

  const reset = useCallback(() => {
    setStep("upload");
    setCsvHeaders([]);
    setRawCsvData([]);
    setFieldMapping({});
    setParsedProducts([]);
    setParseErrors([]);
    setImportProgress({ current: 0, total: 0 });
    setImportResult(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseErrors([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        if (data.length === 0) {
          setParseErrors(["CSV file is empty"]);
          setRawCsvData([]);
          setCsvHeaders([]);
          return;
        }

        const headers = data[0] ? Object.keys(data[0]) : [];
        setCsvHeaders(headers);
        setRawCsvData(data);
        setFieldMapping(autoMapFields(headers));
      },
      error: (err) => {
        setParseErrors([`Failed to parse CSV: ${err.message}`]);
        setRawCsvData([]);
        setCsvHeaders([]);
      },
    });
  };

  const handleMappingToPreview = () => {
    const nameMapped = fieldMapping["name"];
    if (!nameMapped) {
      showError("Product Name must be mapped to a CSV column");
      return;
    }

    const remapped = remapCsvData(rawCsvData, fieldMapping);
    const nameMap = buildNameToIdMap(categories, subcategories, brands);
    const products = parseCsvToProducts(remapped, nameMap);

    const allErrors: string[] = [];
    for (const p of products) {
      if (p._errors.length > 0) {
        allErrors.push(`Row(s) ${p._rowNumbers.join(", ")}: ${p._errors.join("; ")}`);
      }
    }

    setParsedProducts(products);
    setParseErrors(allErrors);
    setStep("preview");
  };

  const handleImport = async () => {
    const validProducts = parsedProducts.filter((p) => p._errors.length === 0);
    if (validProducts.length === 0) return;

    setStep("importing");
    setImportProgress({ current: 0, total: validProducts.length });

    const result: ImportResult = { succeeded: 0, failed: 0, errors: [] };

    for (let i = 0; i < validProducts.length; i++) {
      const product = validProducts[i];
      if (!product) continue;
      setImportProgress({ current: i + 1, total: validProducts.length });

      const payload: Record<string, any> = {
        name: product.name,
        slug: product.slug,
        description: product.description || undefined,
        categoryId: product.categoryId || undefined,
        subcategoryId: product.subcategoryId || undefined,
        brandId: product.brandId || undefined,
        sku: product.sku || undefined,
        status: product.status,
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        tags: product.tags.length > 0 ? product.tags : undefined,
      };

      const hasVariants = product.variants.length > 0 && product.variants.some(
        (v) => v.sku || v.price !== null || v.stockQuantity !== null
      );

      if (hasVariants) {
        payload.variants = product.variants.map((v, idx) => {
          const variantPayload: Record<string, any> = {
            sku: v.sku || `VARIANT-${idx + 1}`,
            price: v.price ?? 0,
            stockQuantity: v.stockQuantity ?? 0,
            sortOrder: idx,
          };
          if (v.compareAtPrice !== null) variantPayload.compareAtPrice = v.compareAtPrice;
          if (v.costPrice !== null) variantPayload.costPrice = v.costPrice;
          if (v.allowBackorder) variantPayload.allowBackorder = true;
          if (v.lowStockThreshold !== null) variantPayload.lowStockThreshold = v.lowStockThreshold;
          if (v.weight !== null) variantPayload.weight = v.weight;
          if (v.barcode) variantPayload.barcode = v.barcode;
          if (v.attributes.length > 0) {
            variantPayload.attributes = v.attributes.map((a, ai) => ({
              attributeName: a.attributeName,
              attributeValue: a.attributeValue,
              sortOrder: ai,
            }));
          }
          return variantPayload;
        });
      } else if (product.variants.length > 0) {
        const v = product.variants[0];
        if (v) {
          if (v.price !== null) payload.price = v.price;
          if (v.compareAtPrice !== null) payload.compareAtPrice = v.compareAtPrice;
          if (v.costPrice !== null) payload.costPrice = v.costPrice;
          if (v.stockQuantity !== null) payload.stockQuantity = v.stockQuantity;
          if (v.weight !== null) payload.weight = v.weight;
          if (v.barcode) payload.barcode = v.barcode;
        }
      }

      try {
        await create.mutateAsync(payload);
        result.succeeded++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          product: product.name,
          message: err?.message || "Unknown error",
        });
      }
    }

    setImportResult(result);
    setStep("done");

    if (result.failed === 0) {
      showSuccess(`Successfully imported ${result.succeeded} product(s)`);
    }
  };

  const previewSample = useMemo(() => {
    if (rawCsvData.length === 0) return {};
    const sample: Record<string, string> = {};
    for (const header of csvHeaders) {
      sample[header] = rawCsvData[0]?.[header] || "—";
    }
    return sample;
  }, [rawCsvData, csvHeaders]);

  const mappedCount = Object.values(fieldMapping).filter(Boolean).length;
  const requiredUnmapped = IMPORT_FIELDS.filter(
    (f) => f.required && !fieldMapping[f.key]
  );
  const validCount = parsedProducts.filter((p) => p._errors.length === 0).length;
  const currentStepIdx = STEP_INDEX[step];

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange} >
      <AlertDialogContent size="xl" className="shadow-none p-0 gap-0">
        {/* Stepper */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-200/80">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const isCompleted = i < currentStepIdx;
              const isCurrent = i === currentStepIdx;
              const isUpcoming = i > currentStepIdx;

              return (
                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex items-center justify-center size-8 rounded-full text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? "bg-primary text-white shadow-sm shadow-primary/20"
                          : isCurrent
                          ? "bg-primary/10 text-primary border-2 border-primary/40 shadow-sm shadow-primary/10"
                          : "bg-slate-100 text-slate-400 border-2 border-slate-200"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="size-3.5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold transition-colors ${
                        isCurrent
                          ? "text-primary"
                          : isCompleted
                          ? "text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div
                        className={`h-0.5 rounded-full transition-colors duration-500 ${
                          isCompleted ? "bg-primary/60" : "bg-slate-200"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[450px] max-h-[70vh] overflow-auto">
          {/* Step: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              {parseErrors.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200/60 px-4 py-2.5 flex items-center gap-2">
                  <AlertCircle className="size-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">{parseErrors[0]}</p>
                </div>
              )}

              <div
                onClick={() => rawCsvData.length === 0 && fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-all ${
                  rawCsvData.length > 0
                    ? "border-emerald-300 bg-emerald-50/50 cursor-default"
                    : "border-slate-300 bg-slate-50 cursor-pointer hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {rawCsvData.length > 0 ? (
                  <>
                    <div className="flex items-center justify-center size-14 rounded-full bg-emerald-100">
                      <CheckCircle2 className="size-7 text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-800">{fileName}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {rawCsvData.length} rows · {csvHeaders.length} columns detected
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileName("");
                        setRawCsvData([]);
                        setCsvHeaders([]);
                        setParseErrors([]);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-xs text-slate-400 hover:text-red-500 underline underline-offset-2 transition-colors"
                    >
                      Choose a different file
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center size-14 rounded-full bg-slate-100">
                      <FileText className="size-7 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700">
                        Click to select a CSV file
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports .csv files with product data
                      </p>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Step: Mapping */}
          {step === "mapping" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Configure Import</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Map your CSV columns to the required fields.
                    <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {rawCsvData.length} rows · {csvHeaders.length} columns
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-primary">{mappedCount}</span>
                    <span className="text-slate-400"> / {IMPORT_FIELDS.length}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${(mappedCount / IMPORT_FIELDS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {requiredUnmapped.length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200/60 px-4 py-2.5 flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">
                    <span className="font-semibold">{requiredUnmapped.map((f) => f.label).join(", ")}</span>{" "}
                    must be mapped to continue
                  </p>
                </div>
              )}

              {/* Product Fields */}
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-primary" />
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Product Fields</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {IMPORT_FIELDS.filter((f) => f.group === "product").map((field) => {
                    const selectedCsvCol = fieldMapping[field.key] || "";
                    const previewVal = selectedCsvCol ? previewSample[selectedCsvCol] || "—" : "—";
                    const isMapped = !!selectedCsvCol;

                    return (
                      <div
                        key={field.key}
                        className={`flex items-center px-4 py-2.5 transition-colors ${
                          field.required && !selectedCsvCol
                            ? "bg-red-50/40"
                            : isMapped
                            ? "bg-emerald-50/30 hover:bg-emerald-50/50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Field Name */}
                        <div className="w-[280px] shrink-0 flex items-center gap-2">
                          <div className={`size-1.5 rounded-full shrink-0 ${isMapped ? "bg-emerald-500" : field.required ? "bg-red-400" : "bg-slate-300"}`} />
                          <span className="text-xs font-medium text-slate-700">{field.label}</span>
                          {field.required && (
                            <span className="text-red-400 text-[10px] font-bold">*</span>
                          )}
                        </div>

                        {/* CSV Column Dropdown */}
                        <div className="flex-1 px-4">
                          <select
                            value={selectedCsvCol}
                            onChange={(e) =>
                              setFieldMapping((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            className={`h-8 w-full rounded-md border px-2 py-1 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-colors ${
                              isMapped
                                ? "border-emerald-200 bg-white"
                                : field.required
                                ? "border-red-200 bg-white"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <option value="">— Select column —</option>
                            {csvHeaders.map((header) => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Preview */}
                        <div className="w-[220px] shrink-0 pl-4">
                          <span
                            className={`text-xs truncate block ${
                              previewVal === "—"
                                ? "text-slate-300 italic"
                                : "text-slate-600 font-medium"
                            }`}
                            title={previewVal}
                          >
                            {previewVal}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Variant Fields */}
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50/80 to-purple-100/30 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-purple-500" />
                  <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Variant Fields</span>
                  <span className="text-[10px] text-purple-400 font-medium">(Optional)</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {IMPORT_FIELDS.filter((f) => f.group === "variant").map((field) => {
                    const selectedCsvCol = fieldMapping[field.key] || "";
                    const previewVal = selectedCsvCol ? previewSample[selectedCsvCol] || "—" : "—";
                    const isMapped = !!selectedCsvCol;

                    return (
                      <div
                        key={field.key}
                        className={`flex items-center px-4 py-2.5 transition-colors ${
                          isMapped
                            ? "bg-purple-50/30 hover:bg-purple-50/50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Field Name */}
                        <div className="w-[280px] shrink-0 flex items-center gap-2">
                          <div className={`size-1.5 rounded-full shrink-0 ${isMapped ? "bg-purple-500" : "bg-slate-300"}`} />
                          <span className="text-xs font-medium text-slate-700">{field.label}</span>
                          {field.hint && (
                            <span className="text-[10px] text-slate-400">{field.hint}</span>
                          )}
                        </div>

                        {/* CSV Column Dropdown */}
                        <div className="flex-1 px-4">
                          <select
                            value={selectedCsvCol}
                            onChange={(e) =>
                              setFieldMapping((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            className={`h-8 w-full rounded-md border px-2 py-1 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-colors ${
                              isMapped
                                ? "border-purple-200 bg-white"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <option value="">— Select column —</option>
                            {csvHeaders.map((header) => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Preview */}
                        <div className="w-[180px] shrink-0 pl-3">
                          <span
                            className={`text-xs truncate block ${
                              previewVal === "—"
                                ? "text-slate-300 italic"
                                : "text-slate-600 font-medium"
                            }`}
                            title={previewVal}
                          >
                            {previewVal}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              {parseErrors.length > 0 && (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-800 space-y-1">
                      <p className="font-semibold">Warnings:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {parseErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-700">
                    Preview — {parsedProducts.length} product(s) found
                    {parsedProducts.filter((p) => p._errors.length > 0).length > 0 && (
                      <span className="text-amber-600 ml-2">
                        ({parsedProducts.filter((p) => p._errors.length > 0).length} with warnings)
                      </span>
                    )}
                  </p>
                </div>
                <div className="max-h-[280px] overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Variants</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedProducts.map((product, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-700">{product.name}</td>
                          <td className="px-3 py-2 text-slate-600">
                            {product.variants.length > 0 ? product.variants.length : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              product.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : product.status === "draft"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              {product.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {product._errors.length > 0 ? (
                              <span className="text-amber-600 text-[10px]">
                                {product._errors.length} issue(s)
                              </span>
                            ) : (
                              <CheckCircle2 className="size-3.5 text-emerald-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step: Importing */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <Loader2 className="size-8 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">
                  Importing product {importProgress.current} of {importProgress.total}...
                </p>
                <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(importProgress.current / importProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && importResult && (
            <div className="space-y-4">
              <div className={`rounded-md p-4 ${
                importResult.failed === 0
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-amber-50 border border-amber-200"
              }`}>
                <div className="flex items-start gap-3">
                  {importResult.failed === 0 ? (
                    <CheckCircle2 className="size-5 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="size-5 text-amber-600 mt-0.5 shrink-0" />
                  )}
                  <div className="text-sm">
                    <p className={`font-semibold ${
                      importResult.failed === 0 ? "text-emerald-800" : "text-amber-800"
                    }`}>
                      Import Complete
                    </p>
                    <p className={`mt-1 ${
                      importResult.failed === 0 ? "text-emerald-700" : "text-amber-700"
                    }`}>
                      {importResult.succeeded} product(s) imported successfully
                      {importResult.failed > 0 && (
                        <>, {importResult.failed} failed</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 max-h-[150px] overflow-auto">
                  <p className="text-xs font-semibold text-red-800 mb-2">Failed imports:</p>
                  <ul className="text-xs text-red-700 space-y-1 list-disc pl-4">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>
                        <span className="font-medium">{err.product}</span>: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-between">
          <div>
            {step !== "upload" && step !== "importing" && step !== "done" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (step === "mapping") setStep("upload");
                  if (step === "preview") setStep("mapping");
                }}
                className="gap-1.5"
              >
                <ArrowLeft className="size-3" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === "upload" && (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  size="sm"
                  onClick={() => setStep("mapping")}
                  disabled={rawCsvData.length === 0}
                  className="gap-1.5"
                >
                  Next
                  <ArrowRight className="size-3" />
                </Button>
              </>
            )}
            {step === "mapping" && (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  size="sm"
                  onClick={handleMappingToPreview}
                  disabled={requiredUnmapped.length > 0}
                  className="gap-1.5"
                >
                  Next
                  <ArrowRight className="size-3" />
                </Button>
              </>
            )}
            {step === "preview" && (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={validCount === 0}
                  className="gap-1.5"
                >
                  Import {validCount} Product(s)
                </Button>
              </>
            )}
            {step === "importing" && (
              <Button size="sm" disabled>
                <Loader2 className="size-3 animate-spin mr-1" />
                Importing...
              </Button>
            )}
            {step === "done" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={reset}
                >
                  Import Another
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleOpenChange(false);
                    onSuccess();
                  }}
                >
                  Done
                </Button>
              </>
            )}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
