import { OneStoreLogo } from "@/components/brand/OneStoreLogo";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[85vh] flex flex-col items-center justify-center p-6 sm:p-12 bg-[#080B10] text-[#FFFFFF] select-none relative overflow-hidden"
    >
      {/* Ambient background glow accents */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#7DD3FC]/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-xl w-full flex flex-col items-center text-center space-y-8 relative z-10">
        {/* ONE STORE Dynamic Loading Logo */}
        <OneStoreLogo variant="loading" size="lg" asCard />

        {/* Big Headline & Supporting Text */}
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#FFFFFF] leading-[1.1]">
            Good things are loading.
          </h2>
          <p className="text-sm sm:text-base text-[#9CAFC3] font-medium tracking-wide animate-pulse">
            Loading curated experience...
          </p>
        </div>

        {/* Large Indeterminate Progress Bar */}
        <div className="w-full max-w-md h-2 bg-[#102A43] rounded-full overflow-hidden relative border border-[#243447]/60">
          <div className="h-full bg-gradient-to-r from-transparent via-[#7DD3FC] to-transparent w-full animate-[pulse_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
