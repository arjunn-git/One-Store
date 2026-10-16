"use client";

import dynamic from "next/dynamic";
import { Activity, RefreshCw } from "lucide-react";

interface ClientLiveActivityMonitorProps {
  onOrderClick?: (orderNumber: string) => void;
  className?: string;
}

const LiveActivityMonitorInternal = dynamic(
  () => import("./LiveActivityMonitor").then((m) => m.LiveActivityMonitor),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl bg-[#102A43]/40 border border-[#243447] p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#243447] pb-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#FFFFFF]">
            <Activity className="h-4 w-4 text-[#7DD3FC] animate-pulse" />
            <span>Dynamic User Activity Stream</span>
          </div>
          <div className="text-xs text-[#9CAFC3] flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#7DD3FC]" />
            <span>Connecting stream...</span>
          </div>
        </div>
        <div className="py-8 text-center text-xs text-[#9CAFC3]">
          Synchronizing real-time telemetry from live store engines...
        </div>
      </div>
    ),
  }
);

export function ClientLiveActivityMonitor(props: ClientLiveActivityMonitorProps) {
  return <LiveActivityMonitorInternal {...props} />;
}
