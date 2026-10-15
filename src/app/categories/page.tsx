import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCategories, getProducts } from "@/lib/services/products";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

export default async function CategoriesPage() {
  const cookieStore = await cookies();
  const rawMarket = cookieStore.get("one_store_market")?.value;
  const market = (rawMarket === "GB" ? "GB" : "IN") as "IN" | "GB";

  const [categories, products] = await Promise.all([
    getCategories(market),
    getProducts({ market }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="border-b border-[#243447] pb-8 mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
              Navigation
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#FFFFFF] tracking-tight mt-1">
              Curated Departments
            </h1>
            <p className="text-xs md:text-sm text-[#9CAFC3] mt-2 max-w-xl">
              Discover catalog offerings organized by functional category.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
              return (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group relative p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] hover:border-[#7DD3FC] transition-all flex flex-col justify-between min-h-[260px] shadow-sm hover:shadow-xl hover:shadow-[#7DD3FC]/5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#102A43] border border-[#243447] text-[#7DD3FC] group-hover:scale-110 transition-transform">
                        <Layers className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-mono text-[#7DD3FC] bg-[#7DD3FC]/10 px-2.5 py-1 rounded border border-[#7DD3FC]/30">
                        {count} {count === 1 ? "Product" : "Products"}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-[#FFFFFF] group-hover:text-[#7DD3FC] transition-colors">
                      {cat.name}
                    </h2>
                    <p className="text-xs md:text-sm text-[#9CAFC3] mt-3 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-[#243447]/60 flex items-center justify-between text-xs font-semibold text-[#7DD3FC]">
                    <span>Explore Department</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
