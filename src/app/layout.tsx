import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import localFont from "next/font/local";
import { AuthProvider } from "@/domains/auth/context";
import { CartProvider } from "@/domains/cart";
import { ToastProvider } from "@/lib/layout/feedback/ToastContext";
import { QueryProvider } from "@/components/providers/query-provider";
import { OfferBarProvider } from "@/contexts/OfferBarContext";
import { GuestMergeHandler } from "@/components/providers/guest-merge-provider";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/ui/cookie-banner";
import "./globals.css";
import Footer from "@/lib/layout/layout/Footer";
import ConditionalNavbar from "@/lib/layout/layout/ConditionalNavbar";
import PageTransition from "@/lib/layout/feedback/PageTransition";
import Script from "next/script";

const satoshi = localFont({
  src: [
    {
      path: "../../public/fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Satoshi-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-heading",
  display: "swap",
});

const manrope = Manrope({
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Dude Menswear - Premium Streetwear & Fashion for Men",
    template: "%s | Dude Menswear"
  },
  description: "Discover premium streetwear and fashion for men at Dude Menswear. Shop the latest trends in shirts, t-shirts, jeans, and accessories. Free shipping on orders over ₹999.",
  keywords: ["menswear", "streetwear", "men's fashion", "premium clothing", "men's shirts", "men's t-shirts", "men's jeans", "fashion", "style", "clothing"],
  authors: [{ name: "Dude Menswear" }],
  creator: "Dude Menswear",
  publisher: "Dude Menswear",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Dude Menswear",
    title: "Dude Menswear - Premium Streetwear & Fashion for Men",
    description: "Discover premium streetwear and fashion for men. Shop the latest trends with free shipping on orders over ₹999.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dude Menswear - Premium Streetwear",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dude Menswear - Premium Streetwear & Fashion for Men",
    description: "Discover premium streetwear and fashion for men. Shop the latest trends.",
    images: ["/og-image.jpg"],
    creator: "@dudemenswear",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    title: 'Dudemw',
  },
  manifest: '/site.webmanifest',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Detect admin subdomain from headers (server-side)
  const { headers } = await import('next/headers');
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isAdminSubdomain = hostname.startsWith('admin.');

  return (
    <QueryProvider>
      <AuthProvider>
        <GuestMergeHandler />
        <CartProvider>
          <ToastProvider>
            <OfferBarProvider>
              <html lang="en">
                <head>
                  {/* Meta Pixel Code */}
                  <Script
                    id="meta-pixel"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                      __html: `
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '1536658574283034');
                        fbq('track', 'PageView');
                      `,
                    }}
                  />
                  <noscript>
                    <img
                      height="1"
                      width="1"
                      style={{ display: 'none' }}
                      src="https://www.facebook.com/tr?id=1536658574283034&ev=PageView&noscript=1"
                      alt=""
                    />
                  </noscript>
                </head>
                <body
                  className={`${satoshi.variable} ${manrope.variable} antialiased flex flex-col min-h-screen ${isAdminSubdomain ? 'admin-subdomain' : ''}`}
                  data-admin-subdomain={isAdminSubdomain ? 'true' : 'false'}
                >
                  {!isAdminSubdomain && <ConditionalNavbar />}
                  <main className={isAdminSubdomain ? "flex-1" : "flex-1 pt-[52px] lg:pt-[60px] [.pdp-page_&]:pt-0 [.pdp-page_&]:lg:pt-[60px] [.admin-page_&]:pt-0"}>
                    <PageTransition>{children}</PageTransition>
                  </main>
                  {!isAdminSubdomain && <Footer />}
                  {!isAdminSubdomain && <CookieBanner />}
                  <Toaster position="top-right" />
                </body>
              </html>
            </OfferBarProvider>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
