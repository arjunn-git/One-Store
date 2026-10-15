import { Suspense } from "react";
import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { getProducts, getCategories } from "@/lib/services/products";
import Link from "next/link";
import { PackageOpen } from "lucide-react";

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
  }>;
}

async function ProductsList({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams.category;
  const currentSort = resolvedParams.sort || "featured";

  const cookieStore = await cookies();
  const rawMarket = cookieStore.get("one_store_market")?.value;
  const market = (rawMarket === "GB" ? "GB" : "IN") as "IN" | "GB";

  const [allProducts, categories] = await Promise.all([
    getProducts({ categorySlug: currentCategory, market }),
    getCategories(market),
  ]);

  const products = [...allProducts].sort((a, b) => {
    if (currentSort === "price-asc") {
      const priceA = market === "IN" ? a.price_inr : a.price_gbp;
      const priceB = market === "IN" ? b.price_inr : b.price_gbp;
      return priceA - priceB;
    }
    if (currentSort === "price-desc") {
      const priceA = market === "IN" ? a.price_inr : a.price_gbp;
      const priceB = market === "IN" ? b.price_inr : b.price_gbp;
      return priceB - priceA;
    }
    return 0;
  });

  return (
    <>
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#243447] pb-8 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#9CAFC3] mb-2">
            <Link href="/" className="hover:text-[#FFFFFF] transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#7DD3FC]">Products</span>
            {currentCategory && (
              <>
                <span>/</span>
                <span className="text-[#FFFFFF] capitalize">
                  {currentCategory.replace("-", " ")}
                </span>
              </>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
            {currentCategory
              ? categories.find((c) => c.slug === currentCategory)?.name || "Category Products"
              : "All Engineered Products"}
          </h1>
          <p className="text-xs md:text-sm text-[#9CAFC3] mt-2 max-w-xl">
            Precision-engineered essentials available for on-demand dispatch across India (INR ₹)
            and the United Kingdom (GBP £).
          </p>
        </div>

        <div className="mt-6 md:mt-0 flex items-center gap-3">
          <span className="text-xs text-[#9CAFC3]">
            Showing <strong className="text-[#FFFFFF]">{products.length}</strong> items
          </span>
        </div>
      </div>

      {/* Categories Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 text-xs scrollbar-none">
        <Link
          href="/products"
          className={`px-4 py-2 rounded-lg font-medium transition-all shrink-0 ${
            !currentCategory
              ? "bg-[#7DD3FC] text-[#080B10] font-semibold"
              : "bg-[#102A43] text-[#9CAFC3] hover:text-[#FFFFFF] border border-[#243447]"
          }`}
        >
          All Categories
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className={`px-4 py-2 rounded-lg font-medium transition-all shrink-0 ${
              currentCategory === cat.slug
                ? "bg-[#7DD3FC] text-[#080B10] font-semibold"
                : "bg-[#102A43] text-[#9CAFC3] hover:text-[#FFFFFF] border border-[#243447]"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#243447] rounded-2xl bg-[#102A43]/20">
          <PackageOpen className="h-12 w-12 text-[#9CAFC3] mb-4" />
          <h3 className="text-lg font-bold text-[#FFFFFF]">No Products Found</h3>
          <p className="text-xs text-[#9CAFC3] max-w-sm mt-1">
            No active products match this category selection.
          </p>
          <Link
            href="/products"
            className="mt-6 px-6 py-2.5 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447] text-xs font-semibold hover:border-[#7DD3FC]"
          >
            Reset Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <Suspense
            fallback={
              <div className="py-20 text-center text-xs text-[#9CAFC3] animate-pulse">
                Loading One Store catalog...
              </div>
            }
          >
            <ProductsList searchParams={searchParams} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
