"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AdminNav } from "@/components/admin/AdminNav";
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

export default function AdminProductsPage() {
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

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />
      <AdminNav />

      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
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
                Create, update, and manage dual-market pricing (INR ₹ / GBP £), variants, and inventory.
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold text-xs transition-all shadow-lg shadow-[#7DD3FC]/10"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add New Product</span>
            </Link>
          </div>

          {/* Filters & Search */}
          <div className="p-4 rounded-2xl bg-[#102A43]/40 border border-[#243447] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-[#9CAFC3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, SKU, or keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#FFFFFF] border border-[#243447] text-xs font-semibold transition-all"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#9CAFC3]">Status:</span>
                {(["all", "active", "draft", "archived"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                      statusFilter === st
                        ? "bg-[#7DD3FC] text-[#080B10] shadow-sm font-bold"
                        : "bg-[#080B10] text-[#9CAFC3] border border-[#243447] hover:text-[#FFFFFF]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Market Filter */}
              <div className="flex items-center gap-1.5 border-l border-[#243447] pl-4">
                <span className="text-xs text-[#9CAFC3]">Market:</span>
                {[
                  { id: "all", label: "All" },
                  { id: "IN", label: "🇮🇳 India" },
                  { id: "GB", label: "🇬🇧 UK" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMarketFilter(m.id as "all" | "IN" | "GB")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      marketFilter === m.id
                        ? "bg-[#7DD3FC] text-[#080B10] shadow-sm font-bold"
                        : "bg-[#080B10] text-[#9CAFC3] border border-[#243447] hover:text-[#FFFFFF]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Development Action: UK Test Catalogue */}
              <div className="flex items-center gap-2 border-l border-[#243447] pl-4">
                <button
                  type="button"
                  onClick={() => togglePublishUkTestProducts(true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 text-[11px] font-semibold transition-all"
                  title="Make all 6 UK test products active for storefront testing"
                >
                  Publish UK Test Products
                </button>
                <button
                  type="button"
                  onClick={() => togglePublishUkTestProducts(false)}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800 text-[11px] font-semibold transition-all"
                  title="Move all 6 UK test products to draft"
                >
                  Unpublish to Draft
                </button>
                <button
                  onClick={fetchProducts}
                  title="Refresh catalog list"
                  className="p-1.5 rounded-lg bg-[#080B10] border border-[#243447] hover:border-[#7DD3FC] text-[#9CAFC3] hover:text-[#FFFFFF]"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#7DD3FC]" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Products Table */}
          <div className="rounded-2xl bg-[#102A43]/40 border border-[#243447] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#243447] bg-[#0c141e] text-[#9CAFC3] uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price (INR)</th>
                    <th className="py-3.5 px-4">Price (GBP)</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243447]/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-[#9CAFC3]">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#7DD3FC] mb-2" />
                        Loading products from catalog...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-[#9CAFC3]">
                        No products match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const totalStock =
                        p.variants && p.variants.length > 0
                          ? p.variants.reduce((acc, v) => acc + (v.inventory_count || 0), 0)
                          : 0;

                      return (
                        <tr key={p.id} className="hover:bg-[#102A43]/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-[#080B10] border border-[#243447] flex items-center justify-center shrink-0 overflow-hidden">
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
                              <div className="max-w-xs">
                                <Link
                                  href={`/admin/products/${p.id}/edit`}
                                  className="font-bold text-[#FFFFFF] hover:text-[#7DD3FC] transition-colors block truncate"
                                >
                                  {p.name}
                                </Link>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className="text-[11px] text-[#9CAFC3]">
                                    {p.variants?.length || 1} variant(s)
                                  </span>
                                  {p.available_in_in && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#080B10] text-[#7DD3FC] border border-[#243447] font-semibold">
                                      🇮🇳 IN
                                    </span>
                                  )}
                                  {p.available_in_gb && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#080B10] text-[#7DD3FC] border border-[#243447] font-semibold">
                                      🇬🇧 UK
                                    </span>
                                  )}
                                  {p.is_test_data && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-mono font-bold">
                                      TEST DATA
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-mono text-[11px] text-[#7DD3FC]">
                            {p.sku}
                          </td>
                          <td className="py-4 px-4 text-[#9CAFC3]">
                            {p.category?.name || "General"}
                          </td>
                          <td className="py-4 px-4 font-semibold text-[#FFFFFF]">
                            ₹{p.price_inr?.toLocaleString("en-IN")}
                          </td>
                          <td className="py-4 px-4 font-semibold text-[#FFFFFF]">
                            £{p.price_gbp?.toFixed(2)}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                                totalStock <= 5
                                  ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                                  : "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                              }`}
                            >
                              {totalStock} in stock
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                p.status === "active"
                                  ? "bg-[#102A43] text-[#7DD3FC] border border-[#243447]"
                                  : p.status === "draft"
                                  ? "bg-amber-950/50 text-amber-300 border border-amber-800"
                                  : "bg-gray-800 text-gray-400 border border-gray-700"
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
                                href={`/admin/products/${p.id}/edit`}
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
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
