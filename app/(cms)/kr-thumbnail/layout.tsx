import { Archivo_Black, Inter } from "next/font/google";

const archivoBlack = Archivo_Black({
  variable: "--font-kr-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export default function KRThumbnailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${archivoBlack.variable} ${inter.variable}`}>
      {children}
    </div>
  );
}
