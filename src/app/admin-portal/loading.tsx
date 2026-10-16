import { Activity, Package, Users, DollarSign, TrendingUp, RefreshCw } from "lucide-react";

export default function AdminPortalLoading() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Title skeleton */}
      <div className="border-b border-[#243447] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#7DD3FC]/50" />
            <div className="h-3 w-48 bg-[#102A43] rounded" />
          </div>
          <div className="h-8 w-64 bg-[#102A43] rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 bg-[#102A43] rounded-xl" />
          <div className="h-9 w-36 bg-[#102A43] rounded-xl" />
        </div>
      </div>

      {/* 4 Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-28 bg-[#102A43] rounded" />
              <div className="h-4 w-4 bg-[#102A43] rounded-full" />
            </div>
            <div className="h-7 w-36 bg-[#102A43] rounded-lg" />
            <div className="h-3 w-24 bg-[#102A43]/60 rounded" />
          </div>
        ))}
      </div>

      {/* Live Stream skeleton */}
      <div className="rounded-2xl bg-[#102A43]/40 border border-[#243447] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-4 w-52 bg-[#102A43] rounded" />
            <div className="h-3 w-80 bg-[#102A43]/60 rounded" />
          </div>
          <div className="h-8 w-36 bg-[#102A43] rounded-xl" />
        </div>
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-[#9CAFC3]">
          <RefreshCw className="h-5 w-5 animate-spin text-[#7DD3FC]" />
          <span>Synchronizing Operations Command Telemetry...</span>
        </div>
      </div>

      {/* Orders table skeleton */}
      <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
        <div className="h-5 w-40 bg-[#102A43] rounded" />
        <div className="h-3 w-72 bg-[#102A43]/60 rounded" />
        <div className="h-48 bg-[#080B10]/40 rounded-xl border border-[#243447]/60" />
      </div>
    </div>
  );
}
