"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
} from "lucide-react";

interface CustomerRecord {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  phone_verified?: boolean;
  role: string;
  apartment_unit: string | null;
  street_address: string | null;
  city: string | null;
  state_or_province: string | null;
  postal_code: string | null;
  delivery_instructions: string | null;
  is_profile_complete: boolean;
  profile_completion_percentage: number;
  created_at: string;
  orders_count: number;
  total_spent_inr: number;
  total_spent_gbp: number;
  addresses?: any[];
}

export default function AdminPortalCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "COMPLETE" | "INCOMPLETE">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load customers.");
      setCustomers(data.customers || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching customer details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    if (filter === "COMPLETE" && !c.is_profile_complete) return false;
    if (filter === "INCOMPLETE" && c.is_profile_complete) return false;

    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      (c.full_name && c.full_name.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.phone_number && c.phone_number.includes(query)) ||
      (c.city && c.city.toLowerCase().includes(query)) ||
      (c.postal_code && c.postal_code.toLowerCase().includes(query))
    );
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243447] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#7DD3FC] font-semibold uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" />
            <span>Registered Customer Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
            Customer Profiles &amp; Addresses
          </h1>
          <p className="text-xs text-[#9CAFC3] mt-1">
            View full verified profile details, complete shipping addresses, profile completion status, and lifetime purchase metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCustomers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#7DD3FC] border border-[#243447] text-xs font-bold transition-all shadow-md self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Fetch All Details</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#102A43]/40 border border-[#243447]">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-[#080B10] p-1 rounded-xl border border-[#243447] text-xs">
            {(["ALL", "COMPLETE", "INCOMPLETE"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filter === tab
                    ? "bg-[#7DD3FC] text-[#080B10]"
                    : "text-[#9CAFC3] hover:text-[#FFFFFF]"
                }`}
              >
                {tab === "ALL" && `All Users (${customers.length})`}
                {tab === "COMPLETE" && `100% Complete (${customers.filter((c) => c.is_profile_complete).length})`}
                {tab === "INCOMPLETE" && `Incomplete (${customers.filter((c) => !c.is_profile_complete).length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, city, PIN..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="rounded-2xl border border-[#243447] bg-[#102A43]/20 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-xs text-[#9CAFC3]">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#7DD3FC]" />
            Fetching verified customer accounts and saved addresses...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-400">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#9CAFC3]">
            No customer accounts found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080B10] border-b border-[#243447] text-[#9CAFC3] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Profile Status</th>
                  <th className="py-3.5 px-4">Primary Address</th>
                  <th className="py-3.5 px-4">Orders &amp; Spend</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243447]/60">
                {filtered.map((c) => {
                  const isExpanded = expandedId === c.id;
                  const hasAddress = c.street_address || c.city || c.postal_code;

                  return (
                    <tr key={c.id} className="hover:bg-[#102A43]/30 transition-colors">
                      {/* Customer Name & Role */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#FFFFFF] text-sm flex items-center gap-2">
                          <span>{c.full_name || "Guest Account"}</span>
                          {c.role === "admin" && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#7DD3FC]/15 text-[#7DD3FC] border border-[#7DD3FC]/30">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-[#9CAFC3] mt-0.5">
                          ID: {c.auth_user_id ? `${c.auth_user_id.slice(0, 10)}...` : c.id}
                        </div>
                        <div className="text-[10px] text-[#9CAFC3] flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>Joined {new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-[#FFFFFF]">
                          <Mail className="h-3.5 w-3.5 text-[#7DD3FC]" />
                          <span className="font-medium">{c.email}</span>
                        </div>
                        {c.phone_number ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#9CAFC3]">
                            <Phone className="h-3 w-3 text-emerald-400" />
                            <span className="font-mono">{c.phone_number}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-400">Phone missing</div>
                        )}
                      </td>

                      {/* Profile Status */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-[#FFFFFF]">
                              {c.is_profile_complete ? "100% Complete" : `${c.profile_completion_percentage || 0}%`}
                            </span>
                            {c.is_profile_complete ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                            )}
                          </div>
                          <div className="h-1.5 w-28 bg-[#080B10] rounded-full overflow-hidden border border-[#243447]">
                            <div
                              className={`h-full transition-all rounded-full ${
                                c.is_profile_complete ? "bg-emerald-400" : "bg-amber-400"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(10, c.profile_completion_percentage || 0))}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-[#9CAFC3]">
                            {c.is_profile_complete ? "Eligible for checkout" : "Profile incomplete"}
                          </div>
                        </div>
                      </td>

                      {/* Primary Address */}
                      <td className="py-4 px-4 max-w-xs">
                        {hasAddress ? (
                          <div className="space-y-0.5 text-xs">
                            <div className="text-[#FFFFFF] font-medium truncate">
                              {[c.apartment_unit, c.street_address].filter(Boolean).join(", ")}
                            </div>
                            <div className="text-[#9CAFC3] text-[11px]">
                              {[c.city, c.state_or_province, c.postal_code].filter(Boolean).join(", ")}
                            </div>
                            {c.delivery_instructions && (
                              <div className="text-[10px] text-[#7DD3FC] italic truncate">
                                Note: {c.delivery_instructions}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#9CAFC3] italic">No address on file</span>
                        )}
                      </td>

                      {/* Orders & Lifetime Spend */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#FFFFFF] flex items-center gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5 text-[#7DD3FC]" />
                          <span>{c.orders_count || 0} order(s)</span>
                        </div>
                        {c.total_spent_inr > 0 && (
                          <div className="text-[11px] text-emerald-400 font-semibold">
                            ₹{c.total_spent_inr.toLocaleString("en-IN")}
                          </div>
                        )}
                        {c.total_spent_gbp > 0 && (
                          <div className="text-[11px] text-emerald-400 font-semibold">
                            £{c.total_spent_gbp.toFixed(2)}
                          </div>
                        )}
                        {c.total_spent_inr === 0 && c.total_spent_gbp === 0 && (
                          <div className="text-[10px] text-[#9CAFC3]">No spend yet</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : c.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#080B10] hover:bg-[#102A43] border border-[#243447] text-[#7DD3FC] text-xs font-semibold inline-flex items-center gap-1 transition-all"
                        >
                          <span>{isExpanded ? "Hide" : "Details"}</span>
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
