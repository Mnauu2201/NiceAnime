// app/sitemap.ts
import { MetadataRoute } from 'next';

// -----------------------------------------------------
// GIẢ ĐỊNH: Hàm này mô phỏng việc fetch tất cả ID tập phim 
// từ Firebase hoặc API của bạn.
// -----------------------------------------------------
interface EpisodeData {
    id: string;
    updatedAt: string; // Sử dụng timestamp hoặc ngày cập nhật 
}

async function getEpisodeSlugs(): Promise<EpisodeData[]> {
    // THAY THẾ bằng logic fetch từ Firebase Firestore/RTDB của bạn
    // Ví dụ:
    // const episodeSnapshot = await firebase.firestore().collection('episodes').get();
    // return episodeSnapshot.docs.map(doc => ({ id: doc.id, updatedAt: doc.data().updatedAt.toDate().toISOString() }));

    // GIẢ ĐỊNH TẠM THỜI:
    const mockEpisodes: EpisodeData[] = [
        { id: 'one-piece-tap-1150', updatedAt: '2025-12-05T10:00:00.000Z' },
        { id: 'detective-conan-tap-1180', updatedAt: '2025-12-04T10:00:00.000Z' },
        // ... (hàng nghìn ID khác)
    ];
    return mockEpisodes;
}
// -----------------------------------------------------

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://niceanime.vercel.app';

    // 1. Lấy tất cả các URL tĩnh (trang chủ, giới thiệu, liên hệ, etc.)
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date().toISOString(),
            changeFrequency: 'daily', // Thay đổi hàng ngày
            priority: 1, // Ưu tiên cao nhất
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        // Thêm các URL tĩnh khác (Thể loại, Danh mục...)
    ];

    // 2. Lấy tất cả các URL động (Trang chi tiết tập phim)
    const episodes = await getEpisodeSlugs();

    const episodeRoutes: MetadataRoute.Sitemap = episodes.map((episode) => ({
        // Đường dẫn phải khớp với cấu trúc thư mục của bạn: app/movie/[id]/page.jsx
        url: `${baseUrl}/movie/${episode.id}`,
        lastModified: episode.updatedAt,
        changeFrequency: 'weekly', // Hoặc 'daily' nếu bạn cập nhật thường xuyên
        priority: 0.7, // Ưu tiên cao hơn các trang tĩnh phụ
    }));

    // 3. Trả về tổng hợp tất cả các URL
    return [...staticRoutes, ...episodeRoutes];
}