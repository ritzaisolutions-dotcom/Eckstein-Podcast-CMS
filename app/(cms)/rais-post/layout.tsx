import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export default function RaisPostLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      {children}
    </div>
  );
}
