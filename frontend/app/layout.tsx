import type { Metadata } from "next";
// Import các font bạn đang dùng
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

// ** BƯỚC TỐI ƯU SEO: Khai báo Metadata chi tiết **
export const metadata: Metadata = {
  // 1. Title
  title: {
    default: "NiceAnime - Khám phá kho phim Vietsub chất lượng cao", // Tiêu đề mặc định cho trang chủ
    template: "%s | NiceAnime", // Định dạng cho các trang con
  },
  // 2. Description
  description:
    "Xem phim Anime Vietsub, phim hoạt hình online chất lượng cao, cập nhật liên tục mỗi ngày. Kho phim không quảng cáo, tốc độ load nhanh, độ nét full HD.",
  // 3. Icons (Favicon) - Đã có sẵn trong code của bạn
  icons: {
    icon: "/favicon-32x32.png",
    shortcut: "/favicon-32x32.png",
    apple: "/NiceAnime.png",
  },
  // 4. Open Graph (Cho Facebook, Zalo) - QUAN TRỌNG
  openGraph: {
    title: "NiceAnime - Xem Anime Vietsub Full HD Mới Nhất",
    description:
      "Tuyển tập phim Anime, hoạt hình Vietsub chất lượng cao, cập nhật liên tục. Xem miễn phí, tốc độ cao.",
    url: "https://yourdomain.com", // Thay bằng domain thật của bạn
    siteName: "NiceAnime",
    images: [
      {
        url: "/NiceAnime-header.png", // Thay bằng URL ảnh lớn (1200x630)
        width: 1200,
        height: 630,
        alt: "NiceAnime Logo và Slogan",
      },
    ],
    locale: "vi_VN", // Ngôn ngữ Việt Nam
    type: "website",
  },
  // 5. Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "NiceAnime - Xem Anime Vietsub Full HD Mới Nhất",
    description: "Kho phim không quảng cáo, tốc độ load nhanh, độ nét full HD.",
    // image: '/NiceAnime-header.png', // Tương tự ảnh OG
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ** BƯỚC TỐI ƯU SEO: Đổi lang="en" thành lang="vi" **
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}