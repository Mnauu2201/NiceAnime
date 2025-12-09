import { MetadataRoute } from 'next';
// ⚠️ QUAN TRỌNG: Import adminDb (Firestore) từ file cấu hình của bạn
import { adminDb } from '@/lib/firebaseAdmin';

interface EpisodeData {
    slug: string; // Tên đường dẫn của tập phim (ví dụ: 'one-piece-tap-1150')
    updatedAt: string; // Ngày cập nhật gần nhất (ISO String)
}

// Hàm truy vấn toàn bộ tập phim từ Firestore
async function getEpisodeSlugs(): Promise<EpisodeData[]> {
    try {
        // Sử dụng adminDb (Firestore) để truy vấn collection 'episodes'
        // GIẢ ĐỊNH: Tên collection lưu trữ tập phim của bạn là 'episodes'
        const snapshot = await adminDb
            .collection('episodes')
            // Tối ưu hóa: chỉ lấy các trường cần thiết ('slug' và 'updatedAt')
            .select('slug', 'updatedAt')
            .get();

        const realEpisodes: EpisodeData[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                slug: data.slug,
                // Chuyển Firebase Timestamp sang định dạng ISO string
                updatedAt: data.updatedAt.toDate().toISOString(),
            };
        });

        return realEpisodes;

    } catch (error) {
        // Báo lỗi nếu việc kết nối hoặc truy vấn Firebase gặp sự cố
        console.error("Lỗi khi tải dữ liệu sitemap từ Firebase:", error);
        return []; // Trả về mảng rỗng để không làm hỏng sitemap
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://niceanime.vercel.app';

    // 1. Định nghĩa các URL tĩnh (trang chủ, giới thiệu, liên hệ,...)
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(), // Cập nhật ngày thay đổi gần nhất
            changeFrequency: 'daily', // Tần suất thay đổi thường xuyên
            priority: 1.0, // Ưu tiên cao nhất
        },
        {
            url: `${baseUrl}/about`,
            lastModified: '2025-12-09T09:25:14.564Z', // Giữ ngày này hoặc cập nhật nếu bạn sửa trang Giới thiệu
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: '2025-12-09T09:25:14.564Z', // Giữ ngày này hoặc cập nhật nếu bạn sửa trang Liên hệ
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        // Thêm các trang tĩnh khác như /terms, /privacy-policy nếu có
    ];

    // 2. Lấy dữ liệu động thật (hàng nghìn tập phim)
    const episodes = await getEpisodeSlugs();

    const episodeRoutes: MetadataRoute.Sitemap = episodes.map((episode) => ({
        // Cấu trúc URL phải khớp với đường dẫn phim của bạn (app/movie/[slug]/page.tsx)
        url: `${baseUrl}/movie/${episode.slug}`,
        // Ngày cập nhật cuối cùng (quan trọng cho SEO)
        lastModified: episode.updatedAt,
        changeFrequency: 'weekly', // Phim hoạt hình thường cập nhật hàng tuần
        priority: 0.7, // Ưu tiên cao hơn các trang tĩnh phụ
    }));

    // 3. Kết hợp và trả về
    return [...staticRoutes, ...episodeRoutes];
}