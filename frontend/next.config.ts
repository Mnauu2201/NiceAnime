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

    // Tối ưu format ảnh (WebP nhẹ hơn 30-50%)
    formats: ['image/webp'],

    // Responsive image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Cache ảnh 1 phút (đủ cho development, tăng lên production)
    minimumCacheTTL: 60,

    // Cho phép external patterns (backup nếu domains không đủ)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],

    // Tắt static image optimization cho external images
    unoptimized: false,
  },

  // Bật compression (giảm 60-70% kích thước file)
  compress: true,

  // React Strict Mode để phát hiện lỗi
  reactStrictMode: true,

  // --- START TURBOPACK FIX ---
  // Thêm khối rỗng này để thông báo cho Next.js/Turbopack rằng
  // cấu hình webpack được giữ lại nhưng không cần cảnh báo.
  // Các tối ưu hóa Webpack sẽ bị bỏ qua khi chạy với Turbopack (mặc định).
  turbopack: {},
  // --- END TURBOPACK FIX ---

  // Tối ưu production build
  poweredByHeader: false, // Ẩn header "X-Powered-By: Next.js"

  // Compiler optimizations
  compiler: {
    // Xóa console.log trong production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Experimental features
  experimental: {
    // Tối ưu CSS
    optimizeCss: true,

    // Tree-shake Firebase và các package lớn
    optimizePackageImports: [
      'firebase/firestore',
      'firebase/app',
      'react-icons',
      'lucide-react'
    ],

    // Tối ưu server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Code splitting optimization
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework bundle (React, Next.js)
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Firebase bundle
            firebase: {
              name: 'firebase',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]firebase[\\/]/,
              priority: 30,
              enforce: true,
            },
            // Commons bundle (shared code)
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            // Lib bundle (other node_modules)
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              priority: 10,
            },
          },
        },
        // Minimize bundle size
        minimize: true,
      };

      // Tắt source maps trong production (giảm bundle size)
      config.devtool = false;
    }

    return config;
  },

  // Headers optimization
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      // Cache static assets
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;