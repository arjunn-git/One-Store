import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { getCategoryBySlug, getProducts } from "@/lib/services/products";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageOpen } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const cookieStore = await cookies();
  const rawMarket = cookieStore.get("one_store_market")?.value;
  const market = (rawMarket === "GB" ? "GB" : "IN") as "IN" | "GB";

  const products = await getProducts({ categorySlug: slug, market });

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-[#9CAFC3] mb-6">
            <Link href="/" className="hover:text-[#FFFFFF] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-[#FFFFFF] transition-colors">
              Categories
            </Link>
            <span>/</span>
            <span className="text-[#7DD3FC]">{category.name}</span>
          </div>

          {/* Department Header */}
          <div className="border-b border-[#243447] pb-8 mb-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#FFFFFF] tracking-tight">
              {category.name}
            </h1>
            <p className="text-xs md:text-sm text-[#9CAFC3] mt-2 max-w-2xl leading-relaxed">
              {category.description}
            </p>
            <div className="mt-4 text-xs text-[#7DD3FC]">
              {products.length} {products.length === 1 ? "model" : "models"} currently available
            </div>
          </div>

          {/* Product grid */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#243447] rounded-xl bg-[#102A43]/20">
              <PackageOpen className="h-10 w-10 text-[#9CAFC3] mb-3" />
              <h3 className="text-base font-bold text-[#FFFFFF]">Department Empty</h3>
              <p className="text-xs text-[#9CAFC3] mt-1">
                New inventory is actively being stocked for this department.
              </p>
              <Link
                href="/products"
                className="mt-4 px-4 py-2 rounded-lg bg-[#102A43] text-[#7DD3FC] text-xs font-semibold border border-[#243447]"
              >
                View All Products
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
      </main>

      <Footer />
    </div>
  );
}
