// /app/admin/dashboard/page.js (Server Component)

// 1. Import Client Component đã đổi tên
import AdminDashboardClient from './AdminDashboardClient';
// 2. Import Firestore Client SDK 
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const MOVIES_PER_PAGE = 20;

/**
 * Hàm Fetch Data ban đầu chạy trên Server để tối ưu hóa tốc độ tải trang
 */
async function fetchInitialMovies() {
    // Query lấy 21 document (20 phim hiển thị + 1 để kiểm tra còn phim không)
    const q = query(
        collection(db, 'movies'),
        orderBy('createdAt', 'desc'),
        limit(MOVIES_PER_PAGE + 1)
    );

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    // Kiểm tra còn trang tiếp theo không
    const hasMore = docs.length > MOVIES_PER_PAGE;

    // Lấy 20 phim đầu tiên để hiển thị
    const initialMovies = docs.slice(0, MOVIES_PER_PAGE).map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Chuyển đối tượng Date thành chuỗi để truyền qua Server/Client boundary
        createdAt: doc.data().createdAt?.toDate().toISOString() || null,
        // Đảm bảo các trường này tồn tại để tránh lỗi
        category: Array.isArray(doc.data().category) ? doc.data().category : [doc.data().category].filter(Boolean),
        format: doc.data().format || 'Phim lẻ',
        otherTitles: doc.data().otherTitles || ''
    }));

    // Lấy ID của document thứ 20 (dùng làm con trỏ cho lần fetch tiếp theo)
    const lastVisibleDocId = hasMore ? docs[MOVIES_PER_PAGE - 1].id : null;

    return { initialMovies, lastVisibleDocId, initialHasMore: hasMore };
}

export default async function AdminDashboardPage() {
    // Gọi hàm fetch data (Server Component tự động await)
    const { initialMovies, lastVisibleDocId, initialHasMore } = await fetchInitialMovies();

    // Truyền dữ liệu ban đầu xuống Client Component
    return (
        <AdminDashboardClient
            initialMovies={initialMovies}
            initialLastVisibleDocId={lastVisibleDocId}
            initialHasMore={initialHasMore}
        />
    );
}