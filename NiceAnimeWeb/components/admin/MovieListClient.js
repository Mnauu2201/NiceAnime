// components/admin/MovieListClient.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
// import Link from 'next/link'; // ✅ KHÔNG CẦN DÙNG LINK NỮA

export default function MovieListClient() {
    const [loading, setLoading] = useState(true);
    const [movies, setMovies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter(); // router không cần dùng nếu không chuyển hướng, nhưng giữ lại cũng không sao

    const fetchMovieTitles = async () => {
        setLoading(true);
        try {
            const moviesColRef = collection(db, 'movies');
            const q = query(moviesColRef, orderBy('title', 'asc'));
            const movieSnapshot = await getDocs(q);

            const titles = [];
            movieSnapshot.forEach((doc) => {
                const data = doc.data();
                titles.push({
                    id: doc.id,
                    title: data.title || 'Không tên',
                    slug: data.slug || '',
                });
            });

            setMovies(titles);
        } catch (error) {
            console.error("Lỗi khi tải danh sách phim: ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovieTitles();
    }, []);

    const filteredMovies = useMemo(() => {
        if (!searchTerm) {
            return movies;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return movies.filter(movie =>
            movie.title.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [movies, searchTerm]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // --- LOGIC XỬ LÝ CLICK ĐỂ SỬA PHIM ---
    // Vì bạn yêu cầu thẻ không có link, nếu sau này bạn muốn click để sửa phim
    // (nhưng không muốn dùng thẻ Link), bạn có thể dùng hàm này và gọi nó bằng onClick
    const handleEditMovieClick = (movieId) => {
        // Nếu bạn muốn mở trang sửa phim khi click, hãy mở comment đoạn này
        // router.push(`/admin/dashboard?id=${movieId}`);
        console.log(`Movie ID: ${movieId} clicked. No navigation performed as requested.`);
    };

    return (
        <div className="flex-1 p-8 bg-gray-800 min-h-screen">
            <h1 className="text-4xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                Danh sách Phim ({movies.length} phim)
            </h1>

            {/* THANH TÌM KIẾM */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên phim..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-150"
                />
            </div>

            {/* Hiển thị số lượng kết quả tìm kiếm */}
            {searchTerm && (
                <p className="text-sm text-gray-400 mb-4">
                    Tìm thấy **{filteredMovies.length}** kết quả.
                </p>
            )}

            {loading ? (
                <p className="text-rose-500 text-lg">Đang tải danh sách phim...</p>
            ) : (
                // HIỂN THỊ DANH SÁCH ĐÃ LỌC
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMovies.length > 0 ? (
                        filteredMovies.map((movie) => (
                            // ✅ THAY THẺ <Link> BẰNG THẺ <div>
                            <div
                                key={movie.id}
                                // Nếu muốn bật lại chức năng chỉnh sửa bằng click: onClick={() => handleEditMovieClick(movie.id)}
                                className="
                                    bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-700 block cursor-default
                                    transition-all duration-200 ease-out transform-gpu
                                "
                                style={{
                                    // Style mặc định
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
                                    transform: 'scale(1) translateY(0)',
                                }}
                                // Hiệu ứng NHẤC LÊN KHI HOVER
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.01) translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 12px 20px rgba(190, 24, 93, 0.3), 0 4px 8px rgba(0, 0, 0, 0.6)';
                                    e.currentTarget.style.borderColor = '#F43F5E'; // Màu hồng đậm khi hover
                                }}
                                // Trở lại trạng thái bình thường
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
                                    e.currentTarget.style.borderColor = '#374151'; // Màu xám mặc định
                                }}
                            >
                                <h3 className="text-xl text-white font-semibold truncate">
                                    {movie.title}
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">ID: {movie.id}</p>
                                <p className="text-xs text-gray-500">Slug: {movie.slug}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 text-lg col-span-full">
                            {searchTerm ? `Không tìm thấy phim nào khớp với từ khoá "${searchTerm}".` : "Hiện không có phim nào trong cơ sở dữ liệu."}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}