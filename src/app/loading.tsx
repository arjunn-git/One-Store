export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      {/* Top glowing cyber progress indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-[#102A43] overflow-hidden">
        <div className="h-full bg-gradient-to-r from-transparent via-[#7DD3FC] to-transparent w-full animate-[pulse_1s_ease-in-out_infinite]" />
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-[#102A43] border border-[#7DD3FC]/40 flex items-center justify-center text-[#7DD3FC] shadow-xl shadow-[#7DD3FC]/10 animate-pulse">
            <span className="font-mono text-2xl font-black">1</span>
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-[#7DD3FC]/20 blur-md -z-10 animate-ping" />
        </div>
        <p className="text-xs uppercase tracking-widest font-mono text-[#9CAFC3] animate-pulse">
          Loading Curated Experience...
        </p>
      </div>
    </div>
  );
}
