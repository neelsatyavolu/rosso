import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

const condensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-condensed",
});

export const metadata: Metadata = {
  title: "SIXTY",
  description:
    "Sixty seconds. Same problems. First across the line. Sign up, friend people, and race them in mental math.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${condensed.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-ink">
        {children}
        <Script src="https://analytics.n3el.dev/p.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
