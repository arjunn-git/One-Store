import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductDetailView } from "@/components/storefront/ProductDetailView";
import { getProductBySlug, getProducts } from "@/lib/services/products";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found — One Store",
    };
  }

  return {
    title: `${product.seo_title || product.name} — One Store`,
    description: product.seo_description || product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = (await getProducts({ categorySlug: product.category?.slug })).filter(
    (p) => p.id !== product.id
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-[#9CAFC3] mb-8">
            <Link href="/" className="hover:text-[#FFFFFF] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#FFFFFF] transition-colors">
              Products
            </Link>
            {product.category && (
              <>
                <span>/</span>
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="hover:text-[#FFFFFF] transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-[#7DD3FC] truncate max-w-xs">{product.name}</span>
          </div>

          <ProductDetailView product={product} relatedProducts={related} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
