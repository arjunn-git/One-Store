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

const baseUrl = "https://one-store-gray.vercel.app";

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const primaryImage = product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&q=80";
  const title = `${product.seo_title || product.name} — Dual Market (INR ₹ & GBP £)`;
  const description =
    product.seo_description ||
    product.description ||
    `Order ${product.name} at One Store. Available in India (₹${product.price_inr.toLocaleString("en-IN")}) and the UK (£${product.price_gbp.toFixed(2)}) with express tracked delivery.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/products/${slug}`,
      languages: {
        "en-IN": `${baseUrl}/products/${slug}?country=IN`,
        "en-GB": `${baseUrl}/products/${slug}?country=UK`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/products/${slug}`,
      type: "website",
      siteName: "One Store",
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [primaryImage],
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

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images || [],
    description: product.description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: "One Store",
    },
    offers: [
      {
        "@type": "Offer",
        priceCurrency: "INR",
        price: product.price_inr,
        itemCondition: "https://schema.org/NewCondition",
        availability: "https://schema.org/InStock",
        url: `${baseUrl}/products/${slug}?country=IN`,
        seller: {
          "@type": "Organization",
          name: "One Store India",
        },
      },
      {
        "@type": "Offer",
        priceCurrency: "GBP",
        price: product.price_gbp,
        itemCondition: "https://schema.org/NewCondition",
        availability: "https://schema.org/InStock",
        url: `${baseUrl}/products/${slug}?country=UK`,
        seller: {
          "@type": "Organization",
          name: "One Store UK",
        },
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "128",
      bestRating: "5",
      worstRating: "1",
    },
  };

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${baseUrl}/products`,
      },
      ...(product.category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.category.name,
              item: `${baseUrl}/categories/${product.category.slug}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: product.name,
              item: `${baseUrl}/products/${slug}`,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 3,
              name: product.name,
              item: `${baseUrl}/products/${slug}`,
            },
          ]),
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
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
