import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

/**
 * Kept — Root Layout
 *
 * Fonts: Geist for UI/body, Geist Mono for money/dates with tabular figures.
 * See kept-design-system.md §3 for the full type rationale.
 *
 * Favicon/icon references use the files from kept-design-system.md §4,
 * copied from the upload/ folder to public/.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kept — Your Purchase Vault",
  description:
    "Snap a receipt. Never lose a warranty or a subscription again. Kept tracks your purchases, warranties, subscriptions, and bills in one place.",
  keywords: [
    "receipt tracker",
    "warranty tracker",
    "subscription manager",
    "purchase vault",
    "kept",
  ],
  icons: {
    icon: "/favicon.ico",
    svg: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Kept — Your Purchase Vault",
    description:
      "Snap a receipt. Never lose a warranty or a subscription again.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kept — Your Purchase Vault",
    description:
      "Snap a receipt. Never lose a warranty or a subscription again.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}