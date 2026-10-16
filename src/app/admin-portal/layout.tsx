import { AdminPortalHeader } from "@/components/admin/AdminPortalHeader";

export const metadata = {
  title: "Admin Command Center | One Store",
  description: "Secure Operations & Financial Command Console for One Store",
  robots: {
    index: false,
    follow: false,
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
      <footer className="border-t border-[#243447] bg-[#080B10] py-4 px-6 text-center text-xs text-[#9CAFC3]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>One Store Operations Command • Confidential</span>
          <span className="text-[11px] text-[#7DD3FC]">
            Dual Market Telemetry Active (INR ₹ &amp; GBP £)
          </span>
        </div>
      </footer>
    </div>
  );
}
