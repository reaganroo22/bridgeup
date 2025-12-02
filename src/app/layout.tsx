import type { Metadata, Viewport } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

// Get the site URL from environment variable or use default
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://wizzmo.app');

export const metadata: Metadata = {
  title: "Wizzmo",
  description: "Get personalized college advice from students who've been there",
  icons: {
    icon: '/wizzmo.svg',
    shortcut: '/wizzmo.svg',
    apple: '/wizzmo_santa.png',
  },
  openGraph: {
    title: "Wizzmo",
    description: "Get personalized college advice from students who've been there",
    url: siteUrl,
    siteName: "Wizzmo",
    images: [
      {
        url: `${siteUrl}/wizzmo_santa.png`,
        width: 1200,
        height: 1200,
        alt: "Wizzmo Bear",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wizzmo",
    description: "Get personalized college advice from students who've been there",
    images: [`${siteUrl}/wizzmo_santa.png`],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wizzmo",
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        {children}
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
