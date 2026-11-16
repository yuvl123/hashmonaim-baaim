import type { Metadata } from "next";
import { Heebo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

const frank = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["700", "900"],
  variable: "--font-frank",
});

export const metadata: Metadata = {
  title: "החשמונאים באים | משחק רביעיות אסטרטגי אונליין",
  description:
    "משחק רביעיות אסטרטגי אינטראקטיבי לתקופת החשמונאים — 48 קלפים מקוריים, 12 רביעיות, מהלכים מיוחדים וחדרי מולטיפלייר עם קוד QR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${frank.variable}`}>
      <body className="min-h-screen bg-[#060b16] text-slate-100 antialiased selection:bg-amber-400/30 selection:text-amber-100">
        {children}
      </body>
    </html>
  );
}
