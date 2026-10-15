"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  Layers,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowUpDown,
  History,
  CheckCircle2,
  X,
  PlusCircle,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  variant_name: string;
  sku: string;
  inventory_count: number;
  reserved_count?: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  options: Record<string, string>;
  image: string | null;
  status?: string;
}

interface InventoryMovement {
  id: string;
  variant_sku?: string;
  change_amount: number;
  previous_count?: number;
  new_count?: number;
  reason: string;
  performed_by: string;
  created_at: string;
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Adjustment Modal
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustCount, setAdjustCount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>("Supplier Restock Intake");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (lowStockOnly) params.set("lowStock", "true");
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load inventory");
      }

      setItems(data.items || []);
      setMovements(data.movements || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustCount(item.inventory_count);
    setAdjustReason("Supplier Restock Intake");
    setAdjustSuccess(null);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setAdjusting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_id: selectedItem.id,
          new_count: adjustCount,
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to adjust inventory");
      }

      setAdjustSuccess(
        `Successfully adjusted ${selectedItem.sku} from ${selectedItem.inventory_count} to ${adjustCount} units.`
      );

      // Refresh local state
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? {
                ...i,
                inventory_count: adjustCount,
                is_low_stock: adjustCount <= i.low_stock_threshold,
              }
            : i
        )
      );

      setTimeout(() => {
        setSelectedItem(null);
        setAdjustSuccess(null);
        fetchInventory();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving adjustment");
    } finally {
      setAdjusting(false);
    }
  };

  const lowStockCount = items.filter((i) => i.is_low_stock).length;
  const outOfStockCount = items.filter((i) => i.inventory_count === 0).length;
  const totalUnits = items.reduce((acc, i) => acc + (i.inventory_count || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />
      <AdminNav />

      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243447] pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7DD3FC] font-semibold uppercase tracking-wider mb-1">
                <Layers className="h-4 w-4" />
                <span>Inventory &amp; Stock Operations</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                Variant Inventory Control
              </h1>
              <p className="text-xs text-[#9CAFC3] mt-1">
                Real-time SKU stock levels, reservation buffer, and atomic inventory movement logs.
              </p>
            </div>

            <button
              onClick={fetchInventory}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#FFFFFF] border border-[#243447] text-xs font-semibold transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#7DD3FC]" : ""}`} />
              <span>Refresh Stock Matrix</span>
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-1">
              <div className="text-xs text-[#9CAFC3]">Tracked SKUs</div>
              <div className="text-2xl font-black text-[#FFFFFF]">{items.length}</div>
              <div className="text-[11px] text-[#7DD3FC]">Active variant endpoints</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-1">
              <div className="text-xs text-[#9CAFC3]">Units In Reserve/Buffer</div>
              <div className="text-2xl font-black text-[#FFFFFF]">{totalUnits}</div>
              <div className="text-[11px] text-emerald-400">Available across all variants</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-1">
              <div className="text-xs text-[#9CAFC3]">Low Stock Alerts</div>
              <div className="text-2xl font-black text-amber-400">{lowStockCount}</div>
              <div className="text-[11px] text-amber-300">Below threshold trigger</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-1">
              <div className="text-xs text-[#9CAFC3]">Depleted (0 Units)</div>
              <div className="text-2xl font-black text-red-400">{outOfStockCount}</div>
              <div className="text-[11px] text-red-300">Preventing checkout overselling</div>
            </div>
          </div>

          {/* Low Stock Warning Banner */}
          {lowStockCount > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/80 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-amber-300">Action Required:</span>{" "}
                  <span className="text-[#FFFFFF]">
                    {lowStockCount} SKU(s) have dropped to or below their safe reorder threshold.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className="px-3 py-1.5 rounded-lg bg-amber-900/60 border border-amber-700 text-amber-200 font-semibold hover:bg-amber-800/80 transition-all shrink-0"
              >
                {lowStockOnly ? "Show All SKUs" : "Filter Low Stock"}
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#102A43]/40 border border-[#243447] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-[#9CAFC3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by SKU, product name, or variant..."
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  lowStockOnly
                    ? "bg-amber-950/70 border-amber-600 text-amber-300 font-bold"
                    : "bg-[#080B10] border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF]"
                }`}
              >
                Low Stock Only ({lowStockCount})
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="rounded-2xl bg-[#102A43]/40 border border-[#243447] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#243447] bg-[#0c141e] text-[#9CAFC3] uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Variant SKU</th>
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4">Variant Option</th>
                    <th className="py-3.5 px-4">Current Stock</th>
                    <th className="py-3.5 px-4">Threshold</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Quick Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243447]/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-[#9CAFC3]">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#7DD3FC] mb-2" />
                        Querying inventory counts...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-[#9CAFC3]">
                        No variant SKUs found.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-[#102A43]/30 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-[#7DD3FC]">
                          {item.sku}
                        </td>
                        <td className="py-4 px-4 font-semibold text-[#FFFFFF]">
                          {item.product_name}
                        </td>
                        <td className="py-4 px-4 text-[#9CAFC3]">
                          {item.variant_name}
                        </td>
                        <td className="py-4 px-4 font-mono font-black text-sm text-[#FFFFFF]">
                          {item.inventory_count}
                        </td>
                        <td className="py-4 px-4 font-mono text-[#9CAFC3]">
                          &le; {item.low_stock_threshold}
                        </td>
                        <td className="py-4 px-4">
                          {item.inventory_count === 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-800">
                              Out of Stock
                            </span>
                          ) : item.is_low_stock ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                              Low Stock Warning
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openAdjustModal(item)}
                            className="px-3 py-1.5 rounded-lg bg-[#080B10] hover:bg-[#7DD3FC] text-[#FFFFFF] hover:text-[#080B10] border border-[#243447] text-xs font-semibold transition-all"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Log / Movement History */}
          <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
              <History className="h-5 w-5 text-[#7DD3FC]" />
              <span>Stock Movements &amp; Dropship Audit Log</span>
            </h2>
            <p className="text-xs text-[#9CAFC3]">
              Immutable record of all checkout deductions, returns, supplier intakes, and manual adjustments.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
              {movements.length === 0 ? (
                <div className="p-4 text-center text-[#9CAFC3]">No recorded movements yet.</div>
              ) : (
                movements.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="p-3.5 rounded-xl bg-[#080B10] border border-[#243447] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                          m.change_amount > 0
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                            : "bg-red-950/80 text-red-300 border-red-800"
                        }`}
                      >
                        {m.change_amount > 0 ? `+${m.change_amount}` : m.change_amount}
                      </span>
                      <div>
                        <span className="font-mono text-[11px] text-[#7DD3FC]">
                          {m.variant_sku || "SKU-UPDATE"}
                        </span>
                        <div className="text-[#FFFFFF] font-medium mt-0.5">{m.reason}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#9CAFC3] text-right">
                      <div>By: {m.performed_by}</div>
                      <div className="text-[10px] text-[#9CAFC3]/70">
                        {new Date(m.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Manual Stock Adjustment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0c141e] border border-[#243447] space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#243447] pb-3">
              <div>
                <h3 className="font-bold text-[#FFFFFF] text-base">Adjust Stock Level</h3>
                <p className="text-xs font-mono text-[#7DD3FC] mt-0.5">{selectedItem.sku}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg hover:bg-[#102A43] text-[#9CAFC3] hover:text-[#FFFFFF]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-[#9CAFC3]">
              Product: <span className="text-[#FFFFFF] font-semibold">{selectedItem.product_name}</span>{" "}
              ({selectedItem.variant_name})
            </div>

            {adjustSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{adjustSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#FFFFFF]">New In-Stock Quantity *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={adjustCount}
                  onChange={(e) => setAdjustCount(Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-sm font-bold text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#FFFFFF]">Audit Reason *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                >
                  <option value="Supplier Restock Intake">Supplier Restock Intake</option>
                  <option value="Physical Warehouse Inventory Audit">Physical Warehouse Inventory Audit</option>
                  <option value="Damaged / Scrapped Units">Damaged / Scrapped Units</option>
                  <option value="Customer Return Restock">Customer Return Restock</option>
                  <option value="Dropship Stock Adjustment">Dropship Stock Adjustment</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl bg-[#080B10] border border-[#243447] text-xs font-semibold text-[#9CAFC3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold text-xs transition-all shadow-lg shadow-[#7DD3FC]/10 disabled:opacity-50"
                >
                  {adjusting ? "Saving..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
