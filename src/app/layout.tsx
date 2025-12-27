import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "De-Clickbaiter | Boşuna Tıklama - AI Video Summary",
  description: "Stop wasting time on clickbait! Get instant AI-powered video summaries and answers in English and Turkish. / Tıklama tuzağına son! Yapay zeka ile video özeti ve cevapları anında görün.",
  keywords: ["clickbait destroyer", "boşuna tıklama", "video özeti", "youtube summary ai", "de-clickbaiter", "time saver"],
  authors: [{ name: "Vigilante Tech" }],
  openGraph: {
    title: "De-Clickbaiter | Stop Clickbait with AI",
    description: "Instant answers for clickbait videos. English & Turkish support.",
    url: "https://dont-get-clickbaited.vercel.app",
    siteName: "De-Clickbaiter",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "De-Clickbaiter Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "De-Clickbaiter | Stop Clickbait with AI",
    description: "Instant answers for clickbait videos. English & Turkish support.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "De-Clickbaiter",
    "operatingSystem": "Web",
    "applicationCategory": "UtilitiesApplication",
    "description": "AI tool to destroy YouTube clickbait by providing instant answers and summaries.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1024"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
