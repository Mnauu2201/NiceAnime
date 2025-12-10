'use client';
import Image from 'next/image';
import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

// Danh sách Thể loại (đồng bộ với Admin)
const CATEGORIES = [
    "Anime", "Hành Động", "Phiêu Lưu", "Hài", "Hoạt Hình", "Giả Tưởng",
    "Kinh Dị", "Khoa Học Viễn Tưởng", "Tâm Lý", "Tình Cảm", "Gay Cấn",
    "Bí Ẩn", "Lãng Mạn", "Tài Liệu", "Hình Sự", "Gia Đình",
    "Chính Kịch", "Lịch Sử", "Chiến Tranh", "Nhạc", "Cổ Trang", "Miền Tây", "Phim 18+"
];

// Hàm slugify đơn giản (tái sử dụng từ lib/utils trong Admin)
const slugify = (text) => {
    if (!text) return '';
    return text.toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word characters (except dashes)
        .replace(/\-\-+/g, '-') // Replace multiple dashes with single dash
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
};

export default function Home() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterFormat, setFilterFormat] = useState(''); // '', 'Phim bộ', 'Phim lẻ'

    // State cho Category Dropdown và Filter Category
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState(''); // Category slug
    const dropdownRef = useRef(null); // Ref để đóng dropdown khi click ra ngoài

    const MOVIES_PER_PAGE = 20;

    useEffect(() => {
        loadMovies();
    }, []);

    useEffect(() => {
        document.title = "NiceAnime";
    }, []);

    // Xử lý click ngoài để đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadMovies = async () => {
        try {
            const moviesRef = collection(db, 'movies');
            const q = query(moviesRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const moviesList = querySnapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
                // Đảm bảo category là mảng các slug khi load.
                // Nếu category là string, chuyển nó thành [slugify(string)]
                category: Array.isArray(docSnap.data().category)
                    ? docSnap.data().category.map(c => slugify(c)) // đảm bảo cả mảng là slug
                    : [slugify(docSnap.data().category)].filter(Boolean), // chỉ lấy slug nếu có
                otherTitles: docSnap.data().otherTitles || ''
            }));

            setMovies(moviesList);
        } catch (error) {
            console.error('Error loading movies:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMovies = useMemo(() => {
        let currentMovies = movies;
        const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

        // 1. Lọc theo Tên (Search Term) - Kiểm tra cả title và otherTitles
        if (lowerCaseSearchTerm) {
            currentMovies = currentMovies.filter((movie) => {
                const titleMatch = movie.title?.toLowerCase().includes(lowerCaseSearchTerm);
                const otherTitlesMatch = movie.otherTitles?.toLowerCase().includes(lowerCaseSearchTerm);

                return titleMatch || otherTitlesMatch;
            });
        }

        // 2. Lọc theo Định dạng (Phim bộ / Phim lẻ)
        if (filterFormat) {
            currentMovies = currentMovies.filter((movie) => {
                const movieFormat = movie.format || 'Phim lẻ';
                return movieFormat === filterFormat;
            });
        }

        // ** [SỬA LỖI LỌC 1/2] **: 3. Lọc theo Thể loại (Category)
        if (filterCategory) {
            currentMovies = currentMovies.filter((movie) => {
                // movie.category là MẢNG các slug (ví dụ: ['lang-man', 'hai']).
                // filterCategory là slug đang được chọn (ví dụ: 'lang-man').
                // Chúng ta dùng .includes() để kiểm tra xem slug đã chọn có trong mảng category của phim không
                return movie.category && movie.category.includes(filterCategory);
            });
        }

        return currentMovies;
    }, [movies, searchTerm, filterFormat, filterCategory]); // Thêm filterCategory vào dependency

    // Lấy tên thể loại gốc từ slug
    const getCategoryNameFromSlug = (slug) => {
        if (!slug) return '';
        // Tìm tên gốc (Language Case) từ danh sách CATEGORIES
        const category = CATEGORIES.find(cat => slugify(cat) === slug);
        return category || slug.replace(/-/g, ' '); // Fallback nếu không tìm thấy
    };

    // Tính toán phân trang
    const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);
    const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
    const endIndex = startIndex + MOVIES_PER_PAGE;
    const paginatedMovies = filteredMovies.slice(startIndex, endIndex);

    // Reset về trang 1 khi search hoặc thay đổi filter
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterFormat, filterCategory]);

    const featuredMovie = movies[0];

    // Hàm xử lý khi nhấn nút lọc Format
    const handleFormatFilter = (format) => {
        if (filterFormat === format) {
            setFilterFormat('');
        } else {
            setFilterFormat(format);
        }
        // Khi lọc theo Format, xóa lọc theo Category để tránh xung đột
        setFilterCategory('');
        setIsCategoryDropdownOpen(false); // Đóng dropdown nếu đang mở
    };

    // Hàm xử lý khi chọn Thể loại
    const handleCategoryFilter = (categorySlug) => {
        setFilterCategory(categorySlug);
        setIsCategoryDropdownOpen(false); // Đóng dropdown sau khi chọn
        setFilterFormat(''); // Khi lọc theo Category, xóa lọc theo Format để tránh xung đột
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#0f172a',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #334155',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ fontSize: '1.125rem' }}>Đang tải phim...</p>
                </div>
                <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#05060b',
            color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* Header */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                background: 'linear-gradient(-90deg, rgba(5,6,11,0.95) 0%, rgba(59,7,100,0.95) 60%, rgba(190,24,93,0.95) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
            }}>
                <div style={{
                    maxWidth: '1300px',
                    margin: '0 auto',
                    padding: '0.35rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '72px'
                }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '0.75rem', overflow: 'visible', }}>
                        <Image
                            src="/NiceAnime-header.png"
                            alt="Phim Hay Logo"
                            width={240}
                            height={72}
                            priority
                            style={{
                                height: '72px',
                                width: 'auto',
                                objectFit: 'contain',
                                marginTop: '-6px',
                                marginBottom: '-6px',
                            }}
                        />
                    </Link>

                    {/* Menu và Dropdown Thể loại vào Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        paddingRight: '1rem',
                    }}>
                        {/* Link Giới thiệu */}
                        <Link href="/support/about" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600 }}>
                            Giới thiệu
                        </Link>

                        {/* Link Liên hệ */}
                        <Link href="/support/contact" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600 }}>
                            Liên hệ
                        </Link>

                        {/* Bộ lọc Định dạng (Mới) */}
                        <button
                            onClick={() => handleFormatFilter('Phim bộ')}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: filterFormat === 'Phim bộ' ? '#ea580c' : 'transparent', // Màu cam khi active
                                color: 'white',
                                border: filterFormat === 'Phim bộ' ? 'none' : '1px solid #94a3b8',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                transition: 'background-color 0.2s',
                            }}
                        >
                            Phim Bộ
                        </button>
                        <button
                            onClick={() => handleFormatFilter('Phim lẻ')}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: filterFormat === 'Phim lẻ' ? '#ef4444' : 'transparent', // Màu đỏ khi active
                                color: 'white',
                                border: filterFormat === 'Phim lẻ' ? 'none' : '1px solid #94a3b8',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                transition: 'background-color 0.2s',
                            }}
                        >
                            Phim Lẻ
                        </button>

                        {/* Dropdown Thể loại (Đã chỉnh sửa Multi-Column) */}
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                                style={{
                                    backgroundColor: filterCategory ? '#be185d' : 'transparent', // Màu hồng đậm khi active
                                    color: 'white',
                                    border: filterCategory ? 'none' : '1px solid #94a3b8',
                                    borderRadius: '0.375rem',
                                    padding: '0.5rem 1rem',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background-color 0.2s, border-color 0.2s'
                                }}
                            >
                                Thể loại {filterCategory ? `(${getCategoryNameFromSlug(filterCategory)})` : ''} {/* ** [SỬA LỖI HIỂN THỊ TÊN] ** */}
                                <span style={{ transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                            </button>
                            {isCategoryDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    backgroundColor: '#1f2937',
                                    border: '1px solid #4b5563',
                                    borderRadius: '0.375rem',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                                    zIndex: 20,

                                    // CSS Multi-Column để loại bỏ scrollbar ngang/dọc thừa
                                    width: '400px', // Chiều rộng cố định cho 2 cột
                                    padding: '0.5rem',
                                    columnCount: 2,
                                    columnGap: '10px',
                                    MozColumnCount: 2,
                                    MozColumnGap: '10px',
                                    WebkitColumnCount: 2,
                                    WebkitColumnGap: '10px',

                                }}>
                                    {/* Nút Xóa Lọc */}
                                    <div
                                        onClick={() => handleCategoryFilter('')}
                                        style={{
                                            padding: '0.5rem',
                                            color: filterCategory === '' ? '#facc15' : '#e5e7eb',
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            borderBottom: '1px solid #374151',
                                            marginBottom: '0.5rem',
                                            columnSpan: 'all',
                                            WebkitColumnSpan: 'all',
                                            MozColumnSpan: 'all',
                                        }}
                                    >
                                        Tất cả Thể loại
                                    </div>
                                    {CATEGORIES.map((cat) => {
                                        const catSlug = slugify(cat);
                                        return (
                                            <div
                                                key={catSlug}
                                                onClick={() => handleCategoryFilter(catSlug)}
                                                style={{
                                                    padding: '0.5rem',
                                                    color: filterCategory === catSlug ? '#3b82f6' : '#e5e7eb',
                                                    backgroundColor: filterCategory === catSlug ? '#374151' : 'transparent',
                                                    borderRadius: '0.25rem',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.1s',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    // Ngăn không cho mục bị cắt ngang giữa hai cột
                                                    breakInside: 'avoid-column',
                                                    WebkitColumnBreakInside: 'avoid',
                                                    MozColumnBreakInside: 'avoid',
                                                }}
                                                onMouseEnter={(e) => { if (filterCategory !== catSlug) e.currentTarget.style.backgroundColor = '#1f2937'; }}
                                                onMouseLeave={(e) => { if (filterCategory !== catSlug) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                            >
                                                {cat}
                                                {filterCategory === catSlug && <span style={{ color: '#3b82f6' }}>✓</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{
                        color: '#f5f5f5',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        Vietsub HD • Miễn phí • Cập nhật mỗi ngày
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{
                position: 'relative',
                minHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '3rem 1.5rem',
                overflow: 'hidden',
                backgroundColor: '#05060b',
                paddingTop: '6rem'
            }}>
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1 }}>
                    <video
                        src="/logobackground.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: 'blur(2px)',
                            transform: 'scale(1.05)',
                            opacity: 0.6
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(110deg, rgba(5,6,11,0.95) 0%, rgba(5,6,11,0.6) 50%, rgba(5,6,11,0.95) 100%)'
                    }} />
                </div>
                {!featuredMovie && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: '#05060b',
                        zIndex: 1
                    }} />
                )}
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 4vw, 4rem)',
                        fontWeight: 800,
                        lineHeight: 1.2,
                        maxWidth: '900px'
                    }}>
                        NiceAnime - Khám phá kho phim Vietsub chất lượng cao, cập nhật liên tục!
                    </h1>
                    <p style={{
                        fontSize: '1.125rem',
                        color: '#cbd5f5',
                        maxWidth: '720px',
                        lineHeight: 1.6
                    }}>
                        Xem phim hoàn toàn miễn phí với tốc độ tải nhanh, phụ đề rõ nét, hỗ trợ HD. Tìm kiếm bộ phim bạn yêu thích ngay bên dưới.
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{
                            flex: '1 1 320px',
                            backgroundColor: 'rgba(15,23,42,0.8)',
                            borderRadius: '999px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.5rem 1rem',
                            border: '1px solid rgba(148,163,184,0.3)'
                        }}>
                            <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>🔎</span>
                            <input
                                type="text"
                                placeholder="Nhập tên phim"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            color: '#94a3b8',
                            fontSize: '0.95rem'
                        }}>
                            <div>
                                📺 <strong>{movies.length}</strong> phim đang có
                            </div>
                            <div>
                                ⚡ Cập nhật hàng ngày
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Search Result */}
            <main style={{ maxWidth: '1300px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                            {searchTerm ? `Kết quả cho "${searchTerm}"` : '🔥 Phim mới cập nhật'}
                        </h2>
                        <p style={{ color: '#94a3b8' }}>
                            {filteredMovies.length} phim được tìm thấy
                            {!searchTerm && totalPages > 1 && ` • Trang ${currentPage}/${totalPages}`}
                            {/* Hiển thị trạng thái lọc */}
                            {(filterFormat || filterCategory) && (
                                <span style={{ marginLeft: '1rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                    (Lọc: {filterFormat || ''} {filterFormat && filterCategory ? ' + ' : ''} {filterCategory ? getCategoryNameFromSlug(filterCategory) : ''}) {/* ** [SỬA LỖI HIỂN THỊ TÊN] ** */}
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Nút Xóa Lọc Tổng thể */}
                    {(filterFormat || filterCategory) && (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <button
                                onClick={() => {
                                    setFilterFormat('');
                                    setFilterCategory('');
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'transparent',
                                    color: '#94a3b8',
                                    border: '1px solid #4b5563',
                                    borderRadius: '999px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                }}
                            >
                                Xóa Tất Cả Bộ Lọc
                            </button>
                        </div>
                    )}
                </div>

                {movies.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '5rem 2rem',
                        backgroundColor: '#111827',
                        borderRadius: '1rem',
                        border: '2px dashed #334155'
                    }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎥</div>
                        <p style={{ color: '#94a3b8', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600' }}>
                            Chưa có phim nào trong hệ thống
                        </p>
                        <p style={{ color: '#64748b' }}>
                            Vui lòng quay lại sau khi phim được cập nhật.
                        </p>
                    </div>
                ) : filteredMovies.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem 2rem',
                        backgroundColor: '#111827',
                        borderRadius: '1rem'
                    }}>
                        <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Không tìm thấy phim phù hợp.</p>
                        <p style={{ color: '#94a3b8' }}>Thử một từ khóa hoặc bộ lọc khác nhé!</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {paginatedMovies.map(movie => {
                            const totalEpisodes = movie.totalEpisodes || movie.episodes?.length || 1;
                            const currentEpisode = movie.currentEpisode || movie.episodes?.length || totalEpisodes;

                            const movieFormatRaw = movie.format || 'Phim lẻ';
                            const movieFormat = movieFormatRaw === 'Phim bộ' ? 'BỘ' : 'LẺ';
                            const formatColor = movieFormatRaw === 'Phim bộ' ? 'rgba(234, 88, 12, 0.95)' : 'rgba(239, 68, 68, 0.95)';

                            return (
                                <Link
                                    href={`/movie/${movie.slug || movie.id}`}
                                    key={movie.id}
                                    style={{ textDecoration: 'none', color: 'white' }}
                                >
                                    <div style={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: '1rem',
                                        boxShadow: '0 15px 25px rgba(0,0,0,0.45)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.3s, boxShadow 0.3s',
                                        backgroundColor: '#0f172a',
                                        minHeight: '360px'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-8px)';
                                            e.currentTarget.style.boxShadow = '0 25px 35px rgba(59, 130, 246, 0.35)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 15px 25px rgba(0,0,0,0.45)';
                                        }}
                                    >
                                        <div style={{ position: 'relative', width: '100%', height: '320px' }}>
                                            <Image
                                                src={movie.thumbnail}
                                                alt={movie.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 240px"
                                                style={{ objectFit: 'cover' }}
                                            />
                                        </div>
                                        {/* Badge Số tập (Top-Left) */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '0.75rem',
                                            left: '0.75rem',
                                            backgroundColor: 'rgba(59, 130, 246, 0.95)',
                                            color: 'white',
                                            padding: '0.35rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                            zIndex: 5
                                        }}>
                                            {currentEpisode} / {totalEpisodes === '??' ? '??' : totalEpisodes}
                                        </div>

                                        {/* Badge Định dạng (Top-Right) */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '0.75rem',
                                            right: '0.75rem',
                                            backgroundColor: formatColor,
                                            color: 'white',
                                            padding: '0.35rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                            zIndex: 5
                                        }}>
                                            {movieFormat}
                                        </div>

                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)'
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '0.75rem',
                                            left: '0.75rem',
                                            right: '0.75rem'
                                        }}>
                                            <h3 style={{
                                                fontWeight: '700',
                                                fontSize: '1.1rem',
                                                marginBottom: '0.35rem',
                                                lineHeight: 1.4
                                            }}>
                                                {movie.title}
                                            </h3>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.85rem',
                                                color: '#cbd5e1',
                                                flexWrap: 'wrap'
                                            }}>
                                                <span>📅 {movie.year}</span>
                                                <span>•</span>
                                                <span>
                                                    🎭 {Array.isArray(movie.category) ? movie.category.map(slug => getCategoryNameFromSlug(slug)).join(', ') : getCategoryNameFromSlug(movie.category || '')} {/* ** [SỬA LỖI HIỂN THỊ TÊN CATEGORY Ở THUMBNAIL] ** */}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Phân trang */}
                {!searchTerm && totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '3rem',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: currentPage === 1 ? '#374151' : '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                opacity: currentPage === 1 ? 0.5 : 1
                            }}
                        >
                            ← Trước
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 2 && page <= currentPage + 2)
                            ) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: currentPage === page ? '#3b82f6' : '#374151',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            minWidth: '40px'
                                        }}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (
                                page === currentPage - 3 ||
                                page === currentPage + 3
                            ) {
                                return (
                                    <span key={page} style={{ color: '#94a3b8', padding: '0 0.25rem' }}>
                                        ...
                                    </span>
                                );
                            }
                            return null;
                        })}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: currentPage === totalPages ? '#374151' : '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                opacity: currentPage === totalPages ? 0.5 : 1
                            }}
                        >
                            Sau →
                        </button>
                    </div>
                )}

            </main>

            {/* Footer */}
            <footer style={{
                backgroundColor: '#0a0d16',
                borderTop: '1px solid #1e293b',
                padding: '3rem 1.5rem 2rem',
            }}>
                <div style={{
                    maxWidth: '1300px',
                    margin: '0 auto',
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '3rem',
                        marginBottom: '3rem',
                    }}>
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '1rem'
                            }}>
                                <Image
                                    src="/NiceAnime-header.png"
                                    alt="NiceAnime Logo"
                                    width={120}
                                    height={36}
                                    style={{ height: '36px', width: 'auto' }}
                                />
                            </div>
                            <p style={{
                                color: '#94a3b8',
                                fontSize: '0.9rem',
                                lineHeight: '1.6',
                                marginBottom: '1rem'
                            }}>
                                NiceAnime là nền tảng xem phim anime miễn phí hàng đầu, nơi bạn có thể khám phá hàng ngàn bộ phim với phụ đề Vietsub chất lượng cao được cập nhật liên tục mỗi ngày.
                            </p>
                        </div>

                        <div>
                            <h3 style={{
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                marginBottom: '1rem'
                            }}>
                                Danh Mục
                            </h3>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem'
                            }}>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Anime Mới (Đang Cập Nhật)</a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Anime Hay (Đang Cập Nhật)</a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Anime Vietsub (Đang Cập Nhật)</a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Phim Kinh Dị (Đang Cập Nhật)</a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Anime HD (Đang Cập Nhật)</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 style={{
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                marginBottom: '1rem'
                            }}>
                                Thể Loại
                            </h3>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem'
                            }}>
                                {CATEGORIES.slice(0, 5).map(cat => (
                                    <li key={cat}>
                                        <a href={`#?category=${slugify(cat)}`} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>
                                            {cat}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 style={{
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                marginBottom: '1rem'
                            }}>
                                Hỗ Trợ
                            </h3>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem'
                            }}>
                                <li><a href="/support/privacy" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Chính sách bảo mật</a></li>
                                <li><a href="/support/terms" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Điều khoản sử dụng</a></li>
                                <li><a href="/support/about" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Giới thiệu</a></li>
                                <li><a href="/support/contact" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Liên hệ</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 style={{
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                marginBottom: '1rem'
                            }}>
                                Nguồn
                            </h3>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem'
                            }}>
                                <li><a href="https://phim.nguonc.com/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>https://phim.nguonc.com/</a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}></a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}></a></li>
                            </ul>
                        </div>
                    </div>

                    <div style={{
                        paddingTop: '2rem',
                        borderTop: '1px solid #1e293b',
                        textAlign: 'center'
                    }}>
                        <p style={{
                            color: '#64748b',
                            fontSize: '0.9rem',
                            marginBottom: '0.5rem'
                        }}>
                            Copyright © {new Date().getFullYear()} by NiceAnime - All rights reserved.
                        </p>
                        <p style={{
                            color: '#475569',
                            fontSize: '0.85rem'
                        }}>
                            Website made by Nguyen Quang Anh
                        </p>
                    </div>
                </div>
            </footer>

            <button
                onClick={() => {
                    let animationFrameId = null;
                    const scrollToTop = () => {
                        const currentPosition = window.pageYOffset;
                        if (currentPosition > 10) {
                            window.scrollTo(0, currentPosition - Math.max(currentPosition / 8, 10));
                            animationFrameId = requestAnimationFrame(scrollToTop);
                        } else {
                            window.scrollTo(0, 0);
                            if (animationFrameId) {
                                cancelAnimationFrame(animationFrameId);
                            }
                        }
                    };
                    scrollToTop();
                }}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: 'linear-gradient(-90deg, rgba(5,6,11,0.95) 0%, rgba(59,7,100,0.95) 60%, rgba(190,24,93,0.95) 100%)',
                    color: 'white',
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '1rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 16px rgba(37, 99, 235, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2), inset 0 2px 8px rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s',
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'perspective(100px) rotateX(5deg)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(-90deg, rgba(5,6,11,0.95) 0%, rgba(59,7,100,0.95) 60%, rgba(190,24,93,0.95) 100%)';
                    e.currentTarget.style.transform = 'perspective(100px) rotateX(5deg) translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(37, 99, 235, 0.6), inset 0 -2px 8px rgba(0, 0, 0, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(-90deg, rgba(5,6,11,0.95) 0%, rgba(59,7,100,0.95) 60%, rgba(190,24,93,0.95) 100%)';
                    e.currentTarget.style.transform = 'perspective(100px) rotateX(5deg)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2), inset 0 2px 8px rgba(255, 255, 255, 0.2)';
                }}
                onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'perspective(100px) rotateX(5deg) translateY(-2px) scale(0.95)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.4), inset 0 -1px 4px rgba(0, 0, 0, 0.3)';
                }}
                onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'perspective(100px) rotateX(5deg) translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(37, 99, 235, 0.6), inset 0 -2px 8px rgba(0, 0, 0, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.3)';
                }}
            >
                ▲
            </button>

        </div>
    );
}