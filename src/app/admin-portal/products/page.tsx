"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Package,
  PlusCircle,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Eye,
  RefreshCw,
  Archive,
} from "lucide-react";
import type { Product, Category, ProductVariant } from "@/lib/types/database";

type ProductWithDetails = Product & {
  category?: Category;
  variants?: ProductVariant[];
};

export default function AdminPortalProductsPage() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [marketFilter, setMarketFilter] = useState<"all" | "IN" | "GB">("all");
  const [isPending, startTransition] = useTransition();

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (marketFilter !== "all") params.set("market", marketFilter);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load products");
      }
      setProducts(data.products || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, marketFilter]);

  const togglePublishUkTestProducts = async (publish: boolean) => {
    setLoading(true);
    const ukTestProducts = products.filter((p) => p.is_test_data);
    for (const p of ukTestProducts) {
      try {
        await fetch(`/api/admin/products/${p.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: publish ? "active" : "draft" }),
        });
      } catch {
        // Continue
      }
    }
    await fetchProducts();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const toggleProductStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "archived" : "active";
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: nextStatus as Product["status"] } : p))
        );
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/products/${id}?hard=true`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete product.");
      }
    } catch {
      alert("Network error while deleting product.");
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header & New Product CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243447] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#7DD3FC] font-semibold uppercase tracking-wider mb-1">
            <Package className="h-4 w-4" />
            <span>One Store Catalog Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
            Product Catalog Management
          </h1>
          <p className="text-xs text-[#9CAFC3] mt-1">
            Manage luxury inventory across India (₹) and the UK Flagship (£), configure variants, and control regional catalog publication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin-portal/products/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] text-xs font-semibold transition-colors shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Product</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#0C131C] border border-[#243447]/80 shadow-lg">
        {/* Status and Market filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1 bg-[#080B10] p-1 rounded-xl border border-[#243447]">
            {["all", "active", "draft", "archived"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? "bg-[#7DD3FC]/10 text-[#7DD3FC] border border-[#7DD3FC]/30 shadow-sm font-semibold"
                    : "text-[#9CAFC3] hover:text-[#FFFFFF]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#080B10] p-1 rounded-xl border border-[#243447]">
            {(["all", "IN", "GB"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMarketFilter(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition-colors ${
                  marketFilter === m
                    ? "bg-[#7DD3FC]/10 text-[#7DD3FC] border border-[#7DD3FC]/30 shadow-sm font-semibold"
                    : "text-[#9CAFC3] hover:text-[#FFFFFF]"
                }`}
              >
                {m === "all" ? "All Markets" : m === "IN" ? "🇮🇳 India (₹)" : "🇬🇧 UK (£)"}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CAFC3]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, SKU, or tag..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] placeholder:text-[#9CAFC3]/60 focus:outline-none focus:border-[#7DD3FC]/60 focus:ring-1 focus:ring-[#7DD3FC]/30"
          />
        </form>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-[#243447]/80 bg-[#0C131C] overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-xs text-[#9CAFC3]">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#7DD3FC]" />
            Loading catalog database...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-400">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-rose-500" />
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080B10] border-b border-[#243447]/60 text-[#9CAFC3] text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Product Info</th>
                  <th className="py-3.5 px-4">SKU / ID</th>
                  <th className="py-3.5 px-4">Market Availability</th>
                  <th className="py-3.5 px-4">Prices (₹ / £)</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243447]/60">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#9CAFC3]">
                      No products match your selected filters.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const totalInventory =
                      p.variants && p.variants.length > 0
                        ? p.variants.reduce((acc, v) => acc + (v.inventory_count || 0), 0)
                        : 0;

                    return (
                      <tr key={p.id} className="hover:bg-[#102A43]/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-[#102A43] border border-[#243447] overflow-hidden shrink-0 flex items-center justify-center">
                              {p.images && p.images[0] ? (
                                <img
                                  src={p.images[0]}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-[#9CAFC3]" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-[#FFFFFF] text-sm flex items-center gap-2">
                                <span>{p.name}</span>
                                {p.is_test_data && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                                    TEST
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#9CAFC3] mt-0.5">
                                {p.category?.name || "Luxury Essentials"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-[#7DD3FC]">{p.sku}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            {p.available_in_in && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
                                IN (₹)
                              </span>
                            )}
                            {p.available_in_gb && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#102A43] text-emerald-400 border border-[#243447]">
                                GB (£)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-[#FFFFFF]">
                            ₹{Number(p.price_inr).toLocaleString("en-IN")}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-semibold">
                            £{Number(p.price_gbp).toFixed(2)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`font-mono font-bold ${
                              totalInventory <= 5 ? "text-amber-400" : "text-[#FFFFFF]"
                            }`}
                          >
                            {totalInventory} units
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              p.status === "active"
                                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                                : p.status === "draft"
                                ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              href={`/products/${p.slug}`}
                              target="_blank"
                              title="View on Live Storefront"
                              className="p-1.5 rounded-lg bg-[#080B10] hover:bg-[#102A43] border border-[#243447] text-[#9CAFC3] hover:text-[#7DD3FC] transition-all"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                              href={`/admin-portal/products/${p.id}/edit`}
                              title="Edit Product"
                              className="p-1.5 rounded-lg bg-[#080B10] hover:bg-[#102A43] border border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF] transition-all"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleProductStatus(p.id, p.status)}
                              title={p.status === "active" ? "Archive Product" : "Publish Product"}
                              className={`p-1.5 rounded-lg border text-xs transition-all ${
                                p.status === "active"
                                  ? "bg-[#080B10] border-[#243447] text-[#9CAFC3] hover:text-amber-400 hover:border-amber-400"
                                  : "bg-[#080B10] border-[#243447] text-[#9CAFC3] hover:text-emerald-400 hover:border-emerald-400"
                              }`}
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              title="Permanently Delete Product"
                              className="p-1.5 rounded-lg bg-[#080B10] hover:bg-red-950/70 border border-[#243447] hover:border-red-600 text-[#9CAFC3] hover:text-red-400 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
