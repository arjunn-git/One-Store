import { OneStoreLogo } from "@/components/brand/OneStoreLogo";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-[#080B10] text-[#FFFFFF] select-none"
    >
      {/* Ambient background glow accents */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[260px] bg-[#7DD3FC]/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-sm w-full flex flex-col items-center text-center space-y-6 relative z-10">
        {/* ONE STORE Dynamic Loading Logo */}
        <OneStoreLogo variant="loading" size="md" asCard />

        {/* Headline & Supporting Text */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#FFFFFF]">
            Good things are loading.
          </h2>
          <p className="text-xs text-[#9CAFC3] font-medium tracking-wide animate-pulse">
            Loading curated experience...
          </p>
        </div>

        {/* Slim Indeterminate Progress Bar */}
        <div className="w-64 h-1 bg-[#102A43] rounded-full overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-transparent via-[#7DD3FC] to-transparent w-full animate-[pulse_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
