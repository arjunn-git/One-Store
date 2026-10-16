import { Suspense } from "react";
import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { getProducts } from "@/lib/services/products";
import { Search as SearchIcon, PackageX } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Catalog — One Store",
  description:
    "Search curated audio gear, minimalist carry, and precision timepieces across India & the UK.",
  robots: {
    index: false,
    follow: true,
  },
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

async function SearchResults({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const cookieStore = await cookies();
  const rawMarket = cookieStore.get("one_store_market")?.value;
  const market = (rawMarket === "GB" ? "GB" : "IN") as "IN" | "GB";

  const [products, popularProducts] = await Promise.all([
    q.trim() ? getProducts({ searchQuery: q, market }) : Promise.resolve([]),
    !q.trim() ? getProducts({ featuredOnly: true, market }) : Promise.resolve([]),
  ]);

  return (
    <>
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center mb-12">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
          Catalog Discovery
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#FFFFFF] tracking-tight mt-1 mb-6">
          Search One Store
        </h1>

        {/* Search Input Form */}
        <form action="/search" method="GET" className="relative w-full">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search products by model, specification or category..."
            className="w-full h-14 pl-12 pr-28 rounded-xl bg-[#102A43] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC] shadow-lg transition-all"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CAFC3]" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all"
          >
            Search
          </button>
        </form>

        {/* Quick suggestion terms */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[#9CAFC3] flex-wrap">
          <span>Suggestions:</span>
          {["Headphones", "Daypack", "Chronograph", "Lamp", "Bottle"].map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="px-2.5 py-0.5 rounded bg-[#102A43] text-[#7DD3FC] border border-[#243447] hover:border-[#7DD3FC] transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      {/* When no query is entered, show popular curated releases */}
      {!q.trim() && popularProducts.length > 0 && (
        <div className="border-t border-[#243447] pt-12 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
                Trending Right Now
              </span>
              <h2 className="text-xl font-bold text-[#FFFFFF] mt-0.5">
                Popular Flagship Releases
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs text-[#7DD3FC] hover:text-[#FFFFFF] transition-colors"
            >
              Browse All Products →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {popularProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Results section */}
      {q.trim() && (
        <div className="border-t border-[#243447] pt-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-semibold text-[#9CAFC3]">
              Search results for: <span className="text-[#FFFFFF]">"{q}"</span>
            </h2>
            <span className="text-xs text-[#7DD3FC]">
              {products.length} {products.length === 1 ? "result" : "results"} found
            </span>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#243447] rounded-2xl bg-[#102A43]/20">
              <PackageX className="h-12 w-12 text-[#9CAFC3] mb-4" />
              <h3 className="text-lg font-bold text-[#FFFFFF]">No Matching Products Found</h3>
              <p className="text-xs text-[#9CAFC3] max-w-sm mt-1">
                We couldn't find any items matching your query. Try searching for broader terms like "Audio" or "Pack".
              </p>
              <Link
                href="/products"
                className="mt-6 px-6 py-2.5 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447] text-xs font-semibold hover:border-[#7DD3FC]"
              >
                Browse Complete Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <Suspense
            fallback={
              <div className="py-20 text-center text-xs text-[#9CAFC3] animate-pulse">
                Initializing search engine...
              </div>
            }
          >
            <SearchResults searchParams={searchParams} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
