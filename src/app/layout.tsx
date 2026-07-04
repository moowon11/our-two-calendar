import type { Metadata } from "next";
import { Gaegu, Gowun_Dodum, Geist_Mono } from "next/font/google";
import "./globals.css";

const gaegu = Gaegu({
  variable: "--font-hand",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const gowunDodum = Gowun_Dodum({
  variable: "--font-body",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "우리 달력",
  description: "너랑 나랑, 우리만의 다이어리 같은 커플 캘린더",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${gaegu.variable} ${gowunDodum.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
