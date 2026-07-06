import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GH Bucketlist — Curated Experiences & Activities in Accra",
    template: "%s | GH Bucketlist",
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
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider delayDuration={200}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </TooltipProvider>
        <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
