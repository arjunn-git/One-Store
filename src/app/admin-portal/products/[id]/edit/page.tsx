"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Globe,
  Tag,
  DollarSign,
  Truck,
  Image as ImageIcon,
  Archive,
} from "lucide-react";
import type { Category, Product, ProductVariant } from "@/lib/types/database";

interface VariantFormItem {
  id?: string;
  name: string;
  sku: string;
  price_inr_adjustment: number;
  price_gbp_adjustment: number;
  cost_price_inr: number;
  cost_price_gbp: number;
  inventory_count: number;
  low_stock_threshold: number;
}

export default function AdminPortalEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

  // Pricing
  const [priceInr, setPriceInr] = useState<number | "">("");
  const [comparePriceInr, setComparePriceInr] = useState<number | "">("");
  const [costPriceInr, setCostPriceInr] = useState<number | "">("");

  const [priceGbp, setPriceGbp] = useState<number | "">("");
  const [comparePriceGbp, setComparePriceGbp] = useState<number | "">("");
  const [costPriceGbp, setCostPriceGbp] = useState<number | "">("");

  // Dropshipping & Operations
  const [supplierName, setSupplierName] = useState("");
  const [availableInIn, setAvailableInIn] = useState(true);
  const [availableInGb, setAvailableInGb] = useState(true);
  const [shippingInfo, setShippingInfo] = useState("");
  const [status, setStatus] = useState<"active" | "draft" | "archived">("active");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTestData, setIsTestData] = useState(false);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // Variants
  const [variants, setVariants] = useState<VariantFormItem[]>([]);

  // Load existing product & categories
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load categories
        const catRes = await fetch("/api/admin/categories");
        const catData = await catRes.json();
        if (catData.categories) setCategories(catData.categories);

        // Load product
        const prodRes = await fetch(`/api/admin/products/${id}`);
        const prodData = await prodRes.json();
        if (!prodRes.ok || !prodData.product) {
          throw new Error(prodData.error || "Product not found");
        }

        const p = prodData.product;
        setName(p.name || "");
        setSlug(p.slug || "");
        setSku(p.sku || "");
        setDescription(p.description || "");
        setCategoryId(p.category_id || "");
        setImages(p.images || []);
        setPriceInr(p.price_inr ?? "");
        setComparePriceInr(p.compare_at_price_inr ?? "");
        setCostPriceInr(p.cost_price_inr ?? "");
        setPriceGbp(p.price_gbp ?? "");
        setComparePriceGbp(p.compare_at_price_gbp ?? "");
        setCostPriceGbp(p.cost_price_gbp ?? "");
        setSupplierName(p.supplier_name || "");
        setAvailableInIn(p.available_in_in ?? true);
        setAvailableInGb(p.available_in_gb ?? true);
        setShippingInfo(p.shipping_info || "");
        setStatus(p.status || "active");
        setIsFeatured(!!p.is_featured);
        setIsTestData(!!p.is_test_data);
        setSeoTitle(p.seo_title || "");
        setSeoDescription(p.seo_description || "");

        if (p.variants && p.variants.length > 0) {
          setVariants(
            p.variants.map((v: ProductVariant) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              price_inr_adjustment: v.price_inr_adjustment || 0,
              price_gbp_adjustment: v.price_gbp_adjustment || 0,
              cost_price_inr: v.cost_price_inr || 0,
              cost_price_gbp: v.cost_price_gbp || 0,
              inventory_count: v.inventory_count || 0,
              low_stock_threshold: v.low_stock_threshold || 5,
            }))
          );
        } else {
          setVariants([
            {
              name: "Standard",
              sku: `${p.sku}-STD`,
              price_inr_adjustment: 0,
              price_gbp_adjustment: 0,
              cost_price_inr: 0,
              cost_price_gbp: 0,
              inventory_count: 10,
              low_stock_threshold: 5,
            },
          ]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading product");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 5MB.");
      return;
    }

    setUploadingImage(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image upload failed");
      setImages((prev) => [...prev, data.url]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error uploading file");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: `Option ${prev.length + 1}`,
        sku: `${sku || "SKU"}-V${prev.length + 1}`,
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        cost_price_inr: 0,
        cost_price_gbp: 0,
        inventory_count: 10,
        low_stock_threshold: 5,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof VariantFormItem, val: unknown) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: val } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        sku: sku.trim().toUpperCase(),
        description: description.trim(),
        category_id: categoryId || null,
        images,
        price_inr: Number(priceInr),
        compare_at_price_inr: comparePriceInr !== "" ? Number(comparePriceInr) : null,
        cost_price_inr: costPriceInr !== "" ? Number(costPriceInr) : 0,
        price_gbp: Number(priceGbp),
        compare_at_price_gbp: comparePriceGbp !== "" ? Number(comparePriceGbp) : null,
        cost_price_gbp: costPriceGbp !== "" ? Number(costPriceGbp) : 0,
        supplier_name: supplierName.trim() || null,
        available_in_in: availableInIn,
        available_in_gb: availableInGb,
        is_test_data: isTestData,
        shipping_info: shippingInfo.trim() || null,
        status,
        is_featured: isFeatured,
        seo_title: seoTitle.trim(),
        seo_description: seoDescription.trim(),
        variants: variants.map((v) => ({
          ...v,
          sku: v.sku.toUpperCase(),
        })),
      };

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      setSuccessMessage("Product saved successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error updating product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#9CAFC3] flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[#7DD3FC] mr-2" />
        Loading product records...
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[#243447] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin-portal/products"
            className="p-2 rounded-xl bg-[#102A43] border border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF] transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#FFFFFF]">Edit Product: {name}</h1>
            <p className="text-xs font-mono text-[#7DD3FC]">SKU: {sku}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatus("draft")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              status === "draft"
                ? "bg-amber-950/60 border-amber-600 text-amber-300"
                : "bg-[#080B10] border-[#243447] text-[#9CAFC3]"
            }`}
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => setStatus("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              status === "active"
                ? "bg-[#102A43] border-[#7DD3FC] text-[#7DD3FC]"
                : "bg-[#080B10] border-[#243447] text-[#9CAFC3]"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatus("archived")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              status === "archived"
                ? "bg-zinc-800 border-zinc-600 text-zinc-300"
                : "bg-[#080B10] border-[#243447] text-[#9CAFC3]"
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. General Product Info */}
        <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
          <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
            <Tag className="h-4 w-4 text-[#7DD3FC]" />
            <span>General Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-[#FFFFFF]">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#FFFFFF]">URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs font-mono text-[#7DD3FC] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#FFFFFF]">Base SKU *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs font-mono text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#FFFFFF]">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#FFFFFF]">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-[#243447] text-[#7DD3FC] focus:ring-0"
                />
                <span>Highlight as Featured Product on Storefront Homepage</span>
              </label>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-[#FFFFFF]">Full Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
          </div>
        </div>

        {/* 2. Media Uploads */}
        <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
          <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[#7DD3FC]" />
            <span>Product Media &amp; Imagery</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {images.map((imgUrl, i) => (
              <div
                key={i}
                className="relative group rounded-xl overflow-hidden border border-[#243447] aspect-square bg-[#080B10]"
              >
                <img src={imgUrl} alt={`Product ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-950/80 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <label className="border-2 border-dashed border-[#243447] hover:border-[#7DD3FC] rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer text-center bg-[#080B10]/50 transition-all aspect-square">
              {uploadingImage ? (
                <RefreshCw className="h-6 w-6 animate-spin text-[#7DD3FC]" />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-[#9CAFC3] mb-2" />
                  <span className="text-[11px] font-semibold text-[#FFFFFF]">Upload Image</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingImage}
              />
            </label>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="url"
              placeholder="Or paste an image URL..."
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="flex-1 h-10 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="h-10 px-4 rounded-xl bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#FFFFFF] border border-[#243447] text-xs font-semibold transition-all"
            >
              Add URL
            </button>
          </div>
        </div>

        {/* 3. Dual-Market Pricing & Economics */}
        <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
          <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#7DD3FC]" />
            <span>Dual-Market Pricing &amp; Profit Margins</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* India INR */}
            <div className="p-4 rounded-xl bg-[#080B10] border border-[#243447] space-y-3">
              <div className="text-xs font-bold text-[#7DD3FC] uppercase tracking-wider">
                India Market (₹ INR)
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#FFFFFF]">Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1}
                  value={priceInr}
                  onChange={(e) => setPriceInr(e.target.value ? Number(e.target.value) : "")}
                  className="w-full h-10 px-3 rounded-lg bg-[#102A43]/30 border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#9CAFC3]">Compare-At Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={comparePriceInr}
                  onChange={(e) =>
                    setComparePriceInr(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#102A43]/30 border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#9CAFC3]">Cost Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={costPriceInr}
                  onChange={(e) => setCostPriceInr(e.target.value ? Number(e.target.value) : "")}
                  className="w-full h-10 px-3 rounded-lg bg-[#102A43]/30 border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>
            </div>

            {/* UK GBP */}
            <div className="p-4 rounded-xl bg-[#080B10] border border-[#243447] space-y-3">
              <div className="text-xs font-bold text-[#7DD3FC] uppercase tracking-wider">
                United Kingdom Market (£ GBP)
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#FFFFFF]">Selling Price (£) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={priceGbp}
                  onChange={(e) => setPriceGbp(e.target.value ? Number(e.target.value) : "")}
                  className="w-full h-10 px-3 rounded-lg bg-[#102A43]/30 border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#9CAFC3]">Compare-At Price (£)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={comparePriceGbp}
                  onChange={(e) =>
                    setComparePriceGbp(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#102A43]/30 border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#9CAFC3]">Cost Price (£)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={costPriceGbp}
                  onChange={(e) => setCostPriceGbp(e.target.value ? Number(e.target.value) : "")}
                  className="w-full h-10 px-3 rounded-lg bg-[#102A43]/30 border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Dropshipping & Regional Logistics */}
        <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
          <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#7DD3FC]" />
            <span>Dropshipping &amp; Regional Logistics</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#FFFFFF]">Assigned Supplier</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#FFFFFF]">Fulfillment &amp; Shipping Policy</label>
              <input
                type="text"
                value={shippingInfo}
                onChange={(e) => setShippingInfo(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="flex items-center gap-6 pt-2 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#FFFFFF]">
                <input
                  type="checkbox"
                  checked={availableInIn}
                  onChange={(e) => setAvailableInIn(e.target.checked)}
                  className="rounded border-[#243447] text-[#7DD3FC] focus:ring-0"
                />
                <span>Available for Customers in India (₹ INR)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#FFFFFF]">
                <input
                  type="checkbox"
                  checked={availableInGb}
                  onChange={(e) => setAvailableInGb(e.target.checked)}
                  className="rounded border-[#243447] text-[#7DD3FC] focus:ring-0"
                />
                <span>Available for Customers in United Kingdom (£ GBP)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-300">
                <input
                  type="checkbox"
                  checked={isTestData}
                  onChange={(e) => setIsTestData(e.target.checked)}
                  className="rounded border-amber-800 text-amber-500 focus:ring-0"
                />
                <span>Mark as Development Test Record</span>
              </label>
            </div>
          </div>
        </div>

        {/* 5. Product Variants & SKU Matrix */}
        <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
              <Package className="h-4 w-4 text-[#7DD3FC]" />
              <span>Product Variants &amp; Inventory Quantities</span>
            </h2>
            <button
              type="button"
              onClick={handleAddVariant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#FFFFFF] border border-[#243447] text-xs font-semibold transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Variant</span>
            </button>
          </div>

          <div className="space-y-3">
            {variants.map((v, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-[#080B10] border border-[#243447] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 items-end"
              >
                <div className="space-y-1">
                  <label className="text-[10px] text-[#9CAFC3] uppercase">Variant Name</label>
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => handleVariantChange(i, "name", e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-[#102A43]/30 border border-[#243447] text-xs text-[#FFFFFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9CAFC3] uppercase">SKU</label>
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => handleVariantChange(i, "sku", e.target.value.toUpperCase())}
                    className="w-full h-9 px-2 rounded-lg bg-[#102A43]/30 border border-[#243447] text-xs font-mono text-[#7DD3FC]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9CAFC3] uppercase">₹ Price Adj.</label>
                  <input
                    type="number"
                    value={v.price_inr_adjustment}
                    onChange={(e) =>
                      handleVariantChange(i, "price_inr_adjustment", Number(e.target.value))
                    }
                    className="w-full h-9 px-2 rounded-lg bg-[#102A43]/30 border border-[#243447] text-xs text-[#FFFFFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9CAFC3] uppercase">£ Price Adj.</label>
                  <input
                    type="number"
                    step={0.01}
                    value={v.price_gbp_adjustment}
                    onChange={(e) =>
                      handleVariantChange(i, "price_gbp_adjustment", Number(e.target.value))
                    }
                    className="w-full h-9 px-2 rounded-lg bg-[#102A43]/30 border border-[#243447] text-xs text-[#FFFFFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9CAFC3] uppercase">Stock Qty</label>
                  <input
                    type="number"
                    min={0}
                    value={v.inventory_count}
                    onChange={(e) =>
                      handleVariantChange(i, "inventory_count", Number(e.target.value))
                    }
                    className="w-full h-9 px-2 rounded-lg bg-[#102A43]/30 border border-[#243447] text-xs text-[#FFFFFF] font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#9CAFC3] uppercase">Low Alert</label>
                  <input
                    type="number"
                    min={1}
                    value={v.low_stock_threshold}
                    onChange={(e) =>
                      handleVariantChange(i, "low_stock_threshold", Number(e.target.value))
                    }
                    className="w-full h-9 px-2 rounded-lg bg-[#102A43]/30 border border-[#243447] text-xs text-[#FFFFFF]"
                  />
                </div>

                <div className="flex items-center justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(i)}
                    disabled={variants.length <= 1}
                    className="p-2 rounded-lg bg-red-950/40 text-red-300 hover:bg-red-900/60 disabled:opacity-30 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. SEO Metadata */}
        <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
          <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#7DD3FC]" />
            <span>Search Engine Optimization (SEO)</span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#FFFFFF]">Meta Title</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#FFFFFF]">Meta Description</label>
              <textarea
                rows={2}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between pt-4 border-t border-[#243447]">
          <Link
            href={`/products/${slug}`}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-[#080B10] border border-[#243447] text-xs font-semibold text-[#7DD3FC] hover:border-[#7DD3FC] transition-all"
          >
            View on Storefront
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/admin-portal/products"
              className="px-5 py-2.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs font-semibold text-[#9CAFC3] hover:text-[#FFFFFF] transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold text-xs transition-all shadow-lg shadow-[#7DD3FC]/10 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
