import { AdminPortalHeader } from "@/components/admin/AdminPortalHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Admin Command Center | One Store",
  description: "Secure Operations & Financial Command Console for One Store",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/favicons/admin-dashboard.svg",
  },
};

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10] text-[#FFFFFF]">
      <AdminPortalHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[#243447]/60 bg-[#080B10] py-3.5 px-4 sm:px-6 lg:px-8 text-xs text-[#9CAFC3]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-[#9CAFC3]">One Store Operations Command • Confidential</span>
          <span className="text-[11px] text-[#7DD3FC] font-medium flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span>Dual Market Telemetry Active (INR ₹ &amp; GBP £)</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
