"use client";

import { useEffect, useState } from "react";
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

export default function AdminPortalInventoryPage() {
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
          new_count: Number(adjustCount),
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to adjust stock");
      }

      setAdjustSuccess("Inventory adjusted and ledger transaction logged.");
      setItems((prev) =>
        prev.map((it) =>
          it.id === selectedItem.id
            ? {
                ...it,
                inventory_count: Number(adjustCount),
                is_low_stock: Number(adjustCount) <= it.low_stock_threshold,
              }
            : it
        )
      );

      setTimeout(() => {
        setSelectedItem(null);
        setAdjustSuccess(null);
        fetchInventory();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Adjustment error");
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243447] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#7DD3FC] font-semibold uppercase tracking-wider mb-1">
            <Layers className="h-4 w-4" />
            <span>Stock &amp; Logistics Controls</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
            Inventory &amp; Warehousing Engine
          </h1>
          <p className="text-xs text-[#9CAFC3] mt-1">
            Real-time atomic stock monitor, low-threshold alarms, and cryptographically verified inventory ledger movements.
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#FFFFFF] border border-[#243447] text-xs font-semibold transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#7DD3FC]" : ""}`} />
          <span>Sync Stock Levels</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#102A43]/40 border border-[#243447]">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setLowStockOnly(false)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !lowStockOnly
                ? "bg-[#7DD3FC] text-[#080B10]"
                : "text-[#9CAFC3] hover:text-[#FFFFFF] bg-[#080B10]"
            }`}
          >
            All Variant SKUs ({items.length})
          </button>
          <button
            onClick={() => setLowStockOnly(true)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              lowStockOnly
                ? "bg-amber-400 text-[#080B10]"
                : "text-amber-400 hover:text-amber-300 bg-[#080B10] border border-amber-900/40"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Low Stock Attention ({items.filter((i) => i.is_low_stock).length})</span>
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, Product, or Variant..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
          />
        </form>
      </div>

      {/* Inventory Items Table */}
      <div className="rounded-2xl border border-[#243447] bg-[#102A43]/20 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-xs text-[#9CAFC3]">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#7DD3FC]" />
            Reading atomic inventory balances...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-400">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080B10] border-b border-[#243447] text-[#9CAFC3] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Item &amp; Variant</th>
                  <th className="py-3.5 px-4">SKU Code</th>
                  <th className="py-3.5 px-4">Available Quantity</th>
                  <th className="py-3.5 px-4">Reserved Cart Stock</th>
                  <th className="py-3.5 px-4">Safety Threshold</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243447]/60">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#9CAFC3]">
                      No inventory items found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="hover:bg-[#102A43]/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#FFFFFF]">{it.product_name}</div>
                        <div className="text-[11px] text-[#7DD3FC] mt-0.5">{it.variant_name}</div>
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-[#FFFFFF]">{it.sku}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`font-mono font-bold text-sm ${
                            it.is_low_stock ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {it.inventory_count} units
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-[#9CAFC3]">
                        {it.reserved_count || 0}
                      </td>
                      <td className="py-4 px-4 font-mono text-[#9CAFC3]">
                        {it.low_stock_threshold} units
                      </td>
                      <td className="py-4 px-4">
                        {it.is_low_stock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                            <AlertTriangle className="h-3 w-3" /> Low Stock Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Optimal Stock
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openAdjustModal(it)}
                          className="px-3 py-1.5 rounded-lg bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#7DD3FC] border border-[#243447] text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <ArrowUpDown className="h-3.5 w-3.5" />
                          <span>Adjust Balance</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inventory Movement History Log */}
      <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
          <History className="h-4 w-4 text-[#7DD3FC]" />
          <span>Audit-Compliant Inventory Ledger Movement Records</span>
        </h2>

        {movements.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#9CAFC3]">
            No manual adjustments recorded in this session.
          </div>
        ) : (
          <div className="divide-y divide-[#243447]/60">
            {movements.slice(0, 8).map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-[#7DD3FC]">{m.variant_sku}</span>
                  <span className="text-[#9CAFC3] ml-2 font-normal">— {m.reason}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-mono font-bold ${
                      m.change_amount > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {m.change_amount > 0 ? `+${m.change_amount}` : m.change_amount} units
                  </span>
                  <span className="text-[11px] text-[#9CAFC3]">
                    {new Date(m.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#080B10] border border-[#243447] p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#243447] pb-4">
              <div>
                <div className="text-xs text-[#7DD3FC] font-semibold">Inventory Adjustment</div>
                <div className="text-base font-bold text-[#FFFFFF]">{selectedItem.product_name}</div>
                <div className="text-xs font-mono text-[#9CAFC3]">SKU: {selectedItem.sku}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] bg-[#102A43]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {adjustSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{adjustSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#FFFFFF]">New Available Stock Count</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={adjustCount}
                  onChange={(e) => setAdjustCount(Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs font-mono text-[#7DD3FC] font-bold focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#FFFFFF]">Reason / Ledger Entry</label>
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
    </div>
  );
}
