// app/admin/movie-list/page.js
// Next.js Server Component
import AdminSidebar from '@/components/admin/AdminSidebar';
import MovieListClient from '@/components/admin/MovieListClient';
// Đảm bảo đường dẫn import của bạn là chính xác

export default function MovieListPage() {
    return (
        <div className="flex min-h-screen bg-gray-900">
            {/* Sidebar nằm ở bên trái */}
            <AdminSidebar />

            {/* Nội dung chính của trang (Danh sách phim) */}
            <MovieListClient />
        </div>
    );
}