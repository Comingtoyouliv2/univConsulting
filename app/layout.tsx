import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "NOVA | 대학 컨설팅 관리 플랫폼",
  description: "학생과 컨설턴트가 성적, 활동, 미팅 기록과 지원 전략을 함께 관리하는 워크스페이스",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "NOVA | 대학 컨설팅 관리 플랫폼",
    description: "복잡한 입시 준비를 한 곳에서 선명하게.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "NOVA University Consulting" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NOVA | 대학 컨설팅 관리 플랫폼",
    description: "복잡한 입시 준비를 한 곳에서 선명하게.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
