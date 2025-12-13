// components/admin/AdminSidebar.js
'use client';

import { usePathname } from 'next/navigation'; // Vẫn giữ lại nếu bạn cần path cho logic khác
import { useState, useEffect } from 'react'; 
// import Link from 'next/link'; // ✅ ĐÃ XÓA

// Icon Components đã được tách ra
const DashboardIcon = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10v11h6V10M11 20h2v-8h-2m4 8h2v-4h-2M4 7l8-4 8 4M12 21V5"></path></svg>
);

const ListIcon = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
);


const HEADER_GRADIENT_STYLE = {
    background: 'linear-gradient(180deg, rgba(5,6,11,1) 0%, rgba(59,7,100,1) 60%, rgba(190,24,93,1) 100%)',
};

// ✅ NHẬN activeTab và onTabChange từ Component cha
export default function AdminSidebar({ activeTab, onTabChange }) {
    const [isCollapsed, setIsCollapsed] = useState(false); 

    useEffect(() => {
        const storedState = typeof window !== 'undefined' ? localStorage.getItem('sidebarCollapsed') : null;
        const shouldBeCollapsed = storedState === 'true';

        if (storedState !== null && shouldBeCollapsed !== isCollapsed) {
            setIsCollapsed(shouldBeCollapsed);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    // ✅ Định nghĩa tabKey thay vì href
    const navItems = [
        { name: 'Dashboard', tabKey: 'dashboard', Icon: DashboardIcon }, 
        { name: 'Danh sách Phim', tabKey: 'movie-list', Icon: ListIcon },    
    ];

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    // ✅ Logic kiểm tra tab đang active
    const getLinkClass = (tabKey) => { 
        const isActive = activeTab === tabKey; 
        
        const baseClasses = [
            'block', 'p-3', 'transition-colors', 'duration-200', 'ease-in-out', 'whitespace-nowrap',
            'hover:bg-fuchsia-800/50', 'hover:border-l-4', 'hover:border-rose-500' 
        ];

        const activeClasses = isActive
            ? ['bg-fuchsia-900', 'border-l-4', 'border-rose-500', 'font-bold', 'text-white'] 
            : ['text-gray-300'];
        
        return [...baseClasses, ...activeClasses].join(' ');
    };
    
    const sidebarWidthClass = isCollapsed ? 'w-20' : 'w-64';

    return (
        <aside 
            style={HEADER_GRADIENT_STYLE}
            className={`
                h-full text-white flex flex-col shadow-xl sticky top-0
                transition-all duration-300 ease-in-out 
                ${sidebarWidthClass}
            `}
        >
            {/* ... (Header) ... */}
            <div className={`p-5 text-2xl font-extrabold text-rose-400 flex items-center justify-between transition-opacity duration-300 ${isCollapsed ? 'px-3 justify-center' : 'px-5'} border-b border-gray-700/50`}>
                
                {!isCollapsed && (
                    <span className="text-xl whitespace-nowrap">Admin Panel</span>
                )}
                
                <button 
                    onClick={toggleSidebar} 
                    className={`
                        p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10
                        ${isCollapsed ? 'mx-auto' : ''}
                    `}
                    title={isCollapsed ? "Mở rộng" : "Thu gọn"}
                >
                    <svg className={`w-6 h-6 transition-transform duration-300 ${isCollapsed ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                </button>
            </div>
            
            {/* Các liên kết điều hướng */}
            <nav className="flex-grow pt-4 overflow-y-auto">
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <li key={item.name}>
                            {/* ✅ SỬ DỤNG <button> VÀ onClick */}
                            <button 
                                onClick={() => onTabChange(item.tabKey)}
                                className={`${getLinkClass(item.tabKey)} w-full text-left flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                                title={item.name} 
                            >
                                <item.Icon className={`w-6 h-6 ${!isCollapsed ? 'mr-3' : ''} flex-shrink-0 text-rose-300`} />
                                
                                <span className={`
                                    transition-opacity duration-300 ease-in-out
                                    ${isCollapsed ? 'opacity-0 w-0 h-0 overflow-hidden' : 'opacity-100'}
                                `}>
                                    {item.name}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            
            
        </aside>
    );
}