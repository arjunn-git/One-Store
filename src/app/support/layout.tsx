import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Active Customer Support & Concierge Desk — onestore.auth@gmail.com",
  description:
    "Get assistance with dual-market orders, tracking, 14-day returns, and 1-year hardware warranty. Direct desk routed to onestore.auth@gmail.com with <12h SLA.",
  alternates: {
    canonical: "https://one-store-gray.vercel.app/support",
  },
  openGraph: {
    title: "Customer Support & Inquiries — One Store",
    description: "Dedicated assistance for our India & UK customers.",
    url: "https://one-store-gray.vercel.app/support",
    type: "website",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I track my delivery in India or the UK?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Once dispatched, you will receive an SMS and email notification with your tracking number (Blue Dart / Delhivery in India, Royal Mail / DPD in the UK). You can also track your shipment live on our Order Tracking portal with your OS-2026 reference.",
      },
    },
    {
      "@type": "Question",
      name: "Where does my support inquiry go?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every customer support message is delivered directly to our active support mailbox at onestore.auth@gmail.com and logged in our real-time concierge dashboard.",
      },
    },
    {
      "@type": "Question",
      name: "Are customs duties and taxes included in my payment?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All prices displayed in INR (₹) and GBP (£) are fully inclusive of all applicable VAT, GST, and import duties. You will never be asked to pay additional charges upon delivery.",
      },
    },
    {
      "@type": "Question",
      name: "How does the 14-day return process work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Simply request a return through your account or order history page within 14 days of delivery. We will issue a prepaid return shipping label and credit your original payment method upon receipt.",
      },
    },
    {
      "@type": "Question",
      name: "What does the 1-year warranty cover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our warranty covers all manufacturing defects, internal component failures, and hardware performance issues. It does not cover accidental water damage or severe physical abuse.",
      },
    },
  ],
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
