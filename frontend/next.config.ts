// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   images: {
//     // thay 'img.server.com' bằng domain thật nơi anh lấy thumbnail. Nếu có nhiều domain, thêm vào mảng
//     domains: ["phim.nguonc.com", "animehay.ai", "wibu47.site", "vuighe.cam"],
//   },
// };

// export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cấu hình domains - BẮT BUỘC cho Next.js Image
    domains: ["phim.nguonc.com", "animehay.ai", "wibu47.site", "vuighe.cam"],

    // Tối ưu format ảnh (WebP/AVIF nhẹ hơn 30-50%)
    formats: ['image/webp', 'image/avif'],

    // Responsive image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Cache ảnh 1 giờ
    minimumCacheTTL: 3600,

    // Cho phép external patterns (backup nếu domains không đủ)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Bật compression (giảm 60-70% kích thước file)
  compress: true,

  // React Strict Mode để phát hiện lỗi
  reactStrictMode: true,

  // Tối ưu production build
  poweredByHeader: false, // Ẩn header "X-Powered-By: Next.js"

  // ✅ SỬA: Dùng experimental thay vì swcMinify
  experimental: {
    optimizeCss: true, // Tối ưu CSS
    optimizePackageImports: ['firebase/firestore', 'firebase/app'], // Tree-shake Firebase
  },
};

export default nextConfig;