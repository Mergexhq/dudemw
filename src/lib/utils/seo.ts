// SEO Schema Generation Utilities

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Dude Menswear",
    "description": "Premium streetwear and fashion for men",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://dudemenswear.com",
    "logo": `${process.env.NEXT_PUBLIC_APP_URL || "https://dudemenswear.com"}/logo/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+919876543210",
      "contactType": "customer service",
      "availableLanguage": ["English", "Hindi"]
    },
    "sameAs": [
      "https://www.instagram.com/dudemenswear",
      "https://www.facebook.com/dudemenswear",
      "https://twitter.com/dudemenswear"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN",
      "addressRegion": "Tamil Nadu"
    }
  }
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Dude Menswear",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://dudemenswear.com",
    "description": "Premium streetwear and fashion for men. Shop the latest trends in shirts, t-shirts, jeans, and accessories.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${process.env.NEXT_PUBLIC_APP_URL || "https://dudemenswear.com"}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }
}

export function generateProductSchema(product: {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  slug: string
  brand?: string
  category?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.description,
    "image": product.images,
    "url": `${process.env.NEXT_PUBLIC_APP_URL || "https://dudemenswear.com"}/products/${product.slug}`,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Dude Menswear"
    },
    "category": product.category,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Dude Menswear"
      }
    }
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url

    }))
  }
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
}

export function generatePolicySchema(name: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": name,
    "url": url,
    "publisher": {
      "@type": "Organization",
      "name": "Dude Menswear",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_APP_URL || "https://dudemenswear.com"}/logo/logo.png`
      }
    }
  }
}
