import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // thay 'img.server.com' bằng domain thật nơi anh lấy thumbnail. Nếu có nhiều domain, thêm vào mảng
    domains: ["phim.nguonc.com", "animehay.ai", "wibu47.site", "vuighe.cam"],
  },
};

export default nextConfig;
