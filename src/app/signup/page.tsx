import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmailOtpForm } from "@/components/auth/EmailOtpForm";
import { Sparkles } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4 md:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#102A43] border border-[#243447] text-[11px] font-medium text-[#7DD3FC] mb-4">
              <Sparkles className="h-3 w-3" />
              <span>Direct Customer Registration</span>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="p-8 rounded-2xl bg-[#102A43]/50 border border-[#243447] text-center text-xs text-[#9CAFC3] animate-pulse">
                Loading registration system...
              </div>
            }
          >
            <EmailOtpForm mode="signup" />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
