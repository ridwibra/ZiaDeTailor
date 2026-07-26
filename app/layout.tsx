import { SITE_NAME, SITE_URL } from "@/utils/constants";
import "./globals.css";
import { Toaster } from "sonner";
import PageTracker from "@/components/auth/PageTracker";
import ClientThemeProvider from "@/components/shared/ClientThemeProvider";

// Global SEO defaults
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: `${SITE_NAME} – Authentic African fashion, crafted with pride and brought to Columbus. Discover vibrant prints, handmade designs, and timeless styles that celebrate culture, confidence, and creativity.`,
  keywords: [
    SITE_NAME,
    "tailor",
    "seamstress",
    "fashion",
    "fashion designer",
    "couture",
    "shirt",
    "trousers",
    "african wear",
    "batakari",
    "jalabia",
    "political suit",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: `${SITE_NAME} – Authentic African fashion, crafted with pride and brought to Columbus. Discover vibrant prints, handmade designs, and timeless styles that celebrate culture, confidence, and creativity`,
    url: SITE_URL,
    images: [`${SITE_URL}/images/logo.jpeg`],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning={true} className="">
        <PageTracker />
        <Toaster
          position="top-right"
          theme="system"
          duration={5000}
          richColors
          visibleToasts={1}
          closeButton
        />
        <ClientThemeProvider>{children}</ClientThemeProvider>
      </body>
    </html>
  );
}
