'use client';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

export default function Home() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    // ** [THAY ĐỔI MỚI 1/3] **: Thêm state cho bộ lọc định dạng (Phim bộ / Phim lẻ)
    const [filterFormat, setFilterFormat] = useState(''); // '', 'Phim bộ', 'Phim lẻ'

    const MOVIES_PER_PAGE = 20;

    useEffect(() => {
        loadMovies();
    }, []);

    useEffect(() => {
        document.title = "NiceAnime";
    }, []);

    const loadMovies = async () => {
        try {
            // Lấy tối đa 20 phim mới nhất theo createdAt
            const moviesRef = collection(db, 'movies');
            const q = query(moviesRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const moviesList = querySnapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                // Đảm bảo category là mảng khi load
                ...docSnap.data(),
                category: Array.isArray(docSnap.data().category) ? docSnap.data().category : [docSnap.data().category].filter(Boolean)
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

        // Lọc theo Tên (Search Term)
        if (searchTerm.trim()) {
            currentMovies = currentMovies.filter((movie) =>
                movie.title?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // ** [THAY ĐỔI MỚI 2/3] **: Lọc theo Định dạng (Phim bộ / Phim lẻ)
        if (filterFormat) {
            currentMovies = currentMovies.filter((movie) => {
                // Sử dụng default 'Phim lẻ' cho các phim cũ chưa có trường format
                const movieFormat = movie.format || 'Phim lẻ';
                return movieFormat === filterFormat;
            });
        }

        return currentMovies;
    }, [movies, searchTerm, filterFormat]); // Thêm filterFormat vào dependency

    // Tính toán phân trang
    const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);
    const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
    const endIndex = startIndex + MOVIES_PER_PAGE;
    const paginatedMovies = filteredMovies.slice(startIndex, endIndex);

    // Reset về trang 1 khi search hoặc thay đổi filter
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterFormat]); // Thêm filterFormat vào dependency

    const featuredMovie = movies[0];

    // Hàm xử lý khi nhấn nút lọc
    const handleFormatFilter = (format) => {
        // Nếu nhấn nút đang chọn, reset về trạng thái 'tất cả' ('')
        if (filterFormat === format) {
            setFilterFormat('');
        } else {
            setFilterFormat(format);
        }
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
                                // maxWidth: 'none',
                                objectFit: 'contain',
                                marginTop: '-6px',
                                marginBottom: '-6px',
                            }}
                        />
                    </Link>
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
                        </p>
                    </div>

                    {/* ** [THAY ĐỔI MỚI 3/3] **: Thêm nút lọc Phim bộ/Phim lẻ */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* <span style={{ fontSize: '1rem', fontWeight: '600', color: '#94a3b8' }}>Lọc theo:</span> */}
                        <button
                            onClick={() => handleFormatFilter('Phim bộ')}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: filterFormat === 'Phim bộ' ? '#ea580c' : '#374151', // Màu cam khi active
                                color: 'white',
                                border: 'none',
                                borderRadius: '999px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
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
                                backgroundColor: filterFormat === 'Phim lẻ' ? '#ef4444' : '#374151', // Màu đỏ khi active
                                color: 'white',
                                border: 'none',
                                borderRadius: '999px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                transition: 'background-color 0.2s',
                            }}
                        >
                            Phim Lẻ
                        </button>
                        {filterFormat && (
                            <button
                                onClick={() => setFilterFormat('')}
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
                                Xóa Lọc
                            </button>
                        )}
                    </div>
                    {/* ** [KẾT THÚC THAY ĐỔI] ** */}
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
                        <p style={{ color: '#94a3b8' }}>Thử một từ khóa khác nhé!</p>
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

                            // Định dạng Phim bộ/Phim lẻ (dùng lại logic đã thêm ở bước trước)
                            const movieFormatRaw = movie.format || 'Phim lẻ';
                            const movieFormat = movieFormatRaw === 'Phim bộ' ? 'BỘ' : 'LẺ';
                            const formatColor = movieFormatRaw === 'Phim bộ' ? 'rgba(234, 88, 12, 0.95)' : 'rgba(239, 68, 68, 0.95)'; // Cam cho Bộ, Đỏ cho Lẻ

                            return (
                                <Link
                                    // href={`/movie/${movie.id}`}
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
                                            backgroundColor: formatColor, // Dùng màu đã xác định
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
                                                {/* ** START FIX: Phân cách các thể loại bằng dấu phẩy và khoảng trắng ** */}
                                                <span>
                                                    🎭 {Array.isArray(movie.category) ? movie.category.join(', ') : movie.category}
                                                </span>
                                                {/* ** END FIX ** */}
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
                            // Hiển thị trang đầu, cuối, và các trang xung quanh trang hiện tại
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
                        // Thay đổi cấu trúc lưới để chứa 5 cột (hoặc 4 cột nếu cần)
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
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Hành Động (Đang Cập Nhật)</a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Phiêu Lưu (Đang Cập Nhật)</a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Hài Hước (Đang Cập Nhật)</a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Lãng Mạn (Đang Cập Nhật)</a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Học Đường (Đang Cập Nhật)</a></li>
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

                        {/* ** [THÊM MỚI] Cột Hợp Tác ** */}
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
                        {/* ** [KẾT THÚC THÊM MỚI] ** */}
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