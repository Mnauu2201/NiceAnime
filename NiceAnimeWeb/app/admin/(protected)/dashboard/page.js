// app/admin/page.js
'use client';
import { useState } from 'react';
// Đảm bảo đường dẫn import component đúng với thư mục của bạn
import AdminSidebar from '../../../../components/admin/AdminSidebar';

// 2. IMPORT CLIENT COMPONENT (Đã di chuyển)
// Đường dẫn tương đối dựa trên cấu trúc: page.js -> (dashboard) -> (protected) -> admin -> app -> components/AdminDashboardClient.js
import AdminDashboardClient from '../../../../components/AdminDashboardClient';
import MovieListClient from '../../../../components/admin/MovieListClient'; 

export default function AdminPage() {
    // State để quản lý Tab hiện tại đang được chọn
    const [activeTab, setActiveTab] = useState('dashboard'); // Mặc định là 'dashboard'

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
    };

    // Hàm quyết định nội dung nào được hiển thị
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                // Component này chứa Form Thêm/Sửa Phim
                return <AdminDashboardClient />; 
            case 'movie-list':
                // Component này chứa Danh sách Phim và thanh tìm kiếm
                return <MovieListClient />;
            default:
                // Trường hợp mặc định
                return <div className="p-8 text-white">Vui lòng chọn một chức năng từ Sidebar.</div>;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-900">
            {/* Truyền trạng thái và hàm xử lý sự kiện xuống Sidebar */}
            <AdminSidebar 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
            />
            
            {/* Vùng hiển thị Nội dung Tab */}
            <main className="flex-1 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
}