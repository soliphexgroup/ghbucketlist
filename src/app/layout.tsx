import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteChrome } from "@/components/site-chrome";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

// One family for the whole site (per the brand notes): Inter for body and headings,
// with hierarchy carried by weight. --font-heading is aliased to --font-sans in globals.css.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GHBucketlist — Curated Experiences & Activities in Accra",
    template: "%s | GHBucketlist",
  },
  description:
    "Discover, book, and gift curated experiences and activities in Accra and beyond. Gather differently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            <SiteChrome>{children}</SiteChrome>
          </TooltipProvider>
        </AuthProvider>
        <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
