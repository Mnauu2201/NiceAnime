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
                ...docSnap.data(),
            }));

            setMovies(moviesList);
        } catch (error) {
            console.error('Error loading movies:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMovies = useMemo(() => {
        if (!searchTerm.trim()) return movies;
        return movies.filter((movie) =>
            movie.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [movies, searchTerm]);

    // Tính toán phân trang
    const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);
    const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
    const endIndex = startIndex + MOVIES_PER_PAGE;
    const paginatedMovies = filteredMovies.slice(startIndex, endIndex);

    // Reset về trang 1 khi search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const featuredMovie = movies[0];

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
            {/* <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                background: 'rgba(5,6,11,0.85)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{
                    maxWidth: '1300px',
                    margin: '0 auto',
                    padding: '0.75rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <Image
                            src="/NiceAnime-header.png"
                            alt="Phim Hay Logo"
                            width={800} //160
                            height={320} // 48
                            priority
                            style={{ height: '120px', width: 'auto', maxWidth: 'none' }}
                        />
                    </Link>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        Vietsub HD • Miễn phí • Cập nhật mỗi ngày
                    </div>
                </div>
            </header> */

                <header style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: 'linear-gradient(-90deg, rgba(5,6,11,0.95) 0%, rgba(59,7,100,0.95) 60%, rgba(190,24,93,0.95) 100%)', /* Đã thay đổi thành -90deg */
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
                                width={600}
                                height={180}
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
            }

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                            {searchTerm ? `Kết quả cho "${searchTerm}"` : '🔥 Phim mới cập nhật'}
                        </h2>
                        <p style={{ color: '#94a3b8' }}>
                            {filteredMovies.length} phim được tìm thấy
                            {!searchTerm && totalPages > 1 && ` • Trang ${currentPage}/${totalPages}`}
                        </p>
                    </div>
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
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                        }}>
                                            {currentEpisode} / {totalEpisodes === '??' ? '??' : totalEpisodes}
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
                                                <span>🎭 {movie.category}</span>
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
                backgroundColor: '#05060b',
                borderTop: '1px solid #1e293b',
                padding: '2rem 1rem',
                textAlign: 'center',
            }}>
                <p style={{ color: '#64748b' }}>
                    {/* © 2025 Phim Hay - Xem phim miễn phí • Made with ❤️ */}
                    Copyright © {new Date().getFullYear()} by NiceAnime • Website made by Nguyen Quang Anh
                </p>
            </footer>
        </div>
    );
}