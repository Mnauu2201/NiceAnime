'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function MovieDetail() {
    const params = useParams();
    const searchParams = useSearchParams();
    const [movie, setMovie] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [currentEpisode, setCurrentEpisode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingEpisodes, setLoadingEpisodes] = useState(true);
    const [suggestedMovies, setSuggestedMovies] = useState([]);

    useEffect(() => {
        loadMovie();
    }, []);

    useEffect(() => {
        if (movie) {
            loadEpisodes();
            loadSuggestedMovies();
        }
    }, [movie]);

    useEffect(() => {
        const ep = parseInt(searchParams.get('ep')) || 1;
        if (episodes.length > 0) {
            const episode = episodes.find(e => e.episodeNumber === ep);
            setCurrentEpisode(episode || episodes[0]);
        }
    }, [searchParams, episodes]);

    useEffect(() => {
        if (movie?.title) {
            document.title = `NiceAnime - ${movie.title}`;
        } else {
            document.title = "NiceAnime";
        }
    }, [movie]);

    const loadMovie = async () => {
        try {
            const moviesQuery = query(
                collection(db, 'movies'),
                where('slug', '==', params.id)
            );
            const snapshot = await getDocs(moviesQuery);

            if (!snapshot.empty) {
                const movieDoc = snapshot.docs[0];
                setMovie({ id: movieDoc.id, ...movieDoc.data() });
            } else {
                const docRef = doc(db, 'movies', params.id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setMovie({ id: docSnap.id, ...docSnap.data() });
                }
            }
        } catch (error) {
            console.error('Error loading movie:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadEpisodes = async () => {
        try {
            const episodesQuery = query(
                collection(db, 'episodes'),
                where('movieId', '==', movie.id),
                orderBy('episodeNumber', 'asc')
            );

            const querySnapshot = await getDocs(episodesQuery);
            const episodesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setEpisodes(episodesList);

            const ep = parseInt(searchParams.get('ep')) || 1;
            const episode = episodesList.find(e => e.episodeNumber === ep);
            setCurrentEpisode(episode || episodesList[0]);

        } catch (error) {
            console.error('Error loading episodes:', error);
        } finally {
            setLoadingEpisodes(false);
        }
    };

    const loadSuggestedMovies = async () => {
        try {
            // Lấy phim cùng thể loại - giới hạn 11 phim (sau khi loại bỏ phim hiện tại sẽ còn 10)
            // LƯU Ý: Nếu category là mảng, Firebase không hỗ trợ where('category', '==', ['cat1', 'cat2'])
            // Tạm thời chỉ lấy theo 'Anime' nếu category là mảng, hoặc lấy 10 phim mới nhất nếu không thể lọc
            const categoryFilter = Array.isArray(movie.category) && movie.category.length > 0
                ? 'Anime' // Giả định tạm thời nếu category là mảng
                : movie.category;

            let moviesQuery;

            if (categoryFilter) {
                moviesQuery = query(
                    collection(db, 'movies'),
                    where('category', '==', categoryFilter),
                    limit(11) // Lấy 11 phim để sau khi loại bỏ phim hiện tại còn 10
                );
            } else {
                moviesQuery = query(
                    collection(db, 'movies'),
                    orderBy('createdAt', 'desc'),
                    limit(11)
                );
            }

            const snapshot = await getDocs(moviesQuery);
            const moviesList = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Đảm bảo category ở đây cũng được định dạng lại thành chuỗi, cách nhau bởi ', '
                    category: Array.isArray(doc.data().category) ? doc.data().category.join(', ') : doc.data().category
                }))
                .filter(m => m.id !== movie.id) // Loại bỏ phim hiện tại
                .sort((a, b) => {
                    // Sort theo createdAt ở client side
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA;
                })
                .slice(0, 10); // Giới hạn tối đa 10 phim

            setSuggestedMovies(moviesList);
        } catch (error) {
            console.error('Error loading suggested movies:', error);
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
                justifyContent: 'center',
                flexDirection: 'column'
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid #334155',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>Đang tải phim...</p>
                <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    if (!movie) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#0f172a',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Không tìm thấy phim!</h2>
                <Link
                    href="/"
                    style={{
                        backgroundColor: '#3b82f6',
                        padding: '0.75rem 2rem',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        color: 'white',
                        fontWeight: '600'
                    }}
                >
                    ← Quay về trang chủ
                </Link>
            </div>
        );
    }

    // Xử lý category cho tiêu đề và phần thông tin chính
    const movieCategoryDisplay = Array.isArray(movie.category) ? movie.category.join(', ') : movie.category;


    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#05060b', color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                background: 'linear-gradient(-90deg, rgba(5,6,11,0.95) 0%, rgba(59,7,100,0.95) 60%, rgba(190,24,93,0.95) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
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
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <Image
                            src="/NiceAnime-header.png"
                            alt="NiceAnime Logo"
                            width={600}
                            height={180}
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
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>Đang xem:</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{movie.title}</p>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '7rem 1rem 2rem 1rem' }}>
                {/* Video Player */}
                <div style={{
                    marginBottom: '2rem',
                    backgroundColor: '#1e293b',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                }}>
                    {currentEpisode ? (
                        <>
                            <div style={{
                                position: 'relative',
                                paddingBottom: '56.25%',
                                height: 0,
                                overflow: 'hidden',
                                backgroundColor: '#000'
                            }}>
                                <iframe
                                    key={currentEpisode.episodeNumber}
                                    src={currentEpisode.videoUrl}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        border: 'none'
                                    }}
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                            </div>

                            <div style={{
                                padding: '1rem 1.5rem',
                                backgroundColor: '#334155',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '1rem'
                            }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                        {currentEpisode.title}
                                    </h2>
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.875rem', color: '#cbd5e1' }}>
                                        <span>📅 {movie.year}</span>
                                        {/* Hiển thị category đã được định dạng */}
                                        <span>🎭 {movieCategoryDisplay}</span>
                                        <span>📺 Tập {currentEpisode.episodeNumber}/{movie.totalEpisodes}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
                            {loadingEpisodes ? 'Đang tải tập phim...' : 'Không tìm thấy tập phim'}
                        </div>
                    )}
                </div>

                {/* Episodes List */}
                {episodes.length > 0 && (
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        boxShadow: '0 10px 15px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            marginBottom: '1rem',
                            color: '#60a5fa',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            📺 Danh sách tập Vietsub ({episodes.length} tập)
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                            gap: '0.75rem',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            padding: '0.5rem'
                        }}>
                            {episodes.map((episode) => {
                                const isCurrent = currentEpisode?.episodeNumber === episode.episodeNumber;
                                return (
                                    <Link
                                        key={episode.id}
                                        href={`/movie/${movie.slug || movie.id}?ep=${episode.episodeNumber}`}
                                        onClick={() => setCurrentEpisode(episode)}
                                        style={{
                                            backgroundColor: isCurrent ? '#3b82f6' : '#334155',
                                            color: 'white',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            textAlign: 'center',
                                            textDecoration: 'none',
                                            fontWeight: isCurrent ? 'bold' : '600',
                                            fontSize: '0.875rem',
                                            transition: 'all 0.3s',
                                            border: isCurrent ? '2px solid #60a5fa' : '2px solid transparent',
                                            cursor: 'pointer',
                                            display: 'block'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isCurrent) {
                                                e.currentTarget.style.backgroundColor = '#475569';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isCurrent) {
                                                e.currentTarget.style.backgroundColor = '#334155';
                                            }
                                        }}
                                    >
                                        {episode.episodeNumber}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Movie Info */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '300px 1fr',
                    gap: '2rem',
                    marginBottom: '3rem'
                }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 3' }}>
                        <Image
                            src={movie.thumbnail}
                            alt={movie.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            style={{
                                objectFit: 'cover',
                                borderRadius: '0.75rem',
                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                            }}
                            unoptimized
                        />
                    </div>

                    <div>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            marginBottom: '1.5rem',
                            background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            {movie.title}
                        </h1>

                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            marginBottom: '2rem',
                            flexWrap: 'wrap'
                        }}>
                            {/* ** [BẮT ĐẦU THAY ĐỔI] **: Xử lý hiển thị category riêng biệt */}
                            {
                                // Chuyển category thành mảng nếu là chuỗi, sau đó map ra các span riêng
                                (Array.isArray(movie.category)
                                    ? movie.category
                                    : (typeof movie.category === 'string'
                                        ? movie.category.split(',').map(c => c.trim())
                                        : []))
                                    .filter(c => c) // Lọc bỏ các giá trị rỗng
                                    .map((categoryItem, index) => (
                                        <span
                                            key={index}
                                            style={{
                                                backgroundColor: '#4c1d95', // Màu tím đậm hơn
                                                padding: '0.5rem 1rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {categoryItem}
                                        </span>
                                    ))
                            }
                            {/* ** [KẾT THÚC THAY ĐỔI] ** */}

                            <span style={{
                                backgroundColor: '#166534',
                                padding: '0.5rem 1rem',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                            }}>
                                {movie.year}
                            </span>
                            <span style={{
                                backgroundColor: '#7c2d12',
                                padding: '0.5rem 1rem',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                            }}>
                                {movie.totalEpisodes} tập
                            </span>
                        </div>

                        <div style={{
                            backgroundColor: '#1e293b',
                            padding: '1.5rem',
                            borderRadius: '0.75rem',
                            marginBottom: '1.5rem'
                        }}>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                marginBottom: '1rem',
                                color: '#60a5fa'
                            }}>
                                📖 Nội dung phim
                            </h3>
                            <p style={{
                                color: '#cbd5e1',
                                lineHeight: '1.75'
                            }}>
                                {movie.description || 'Chưa có mô tả cho phim này.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Suggested Movies */}
                {suggestedMovies.length > 0 && (
                    <div style={{ marginBottom: '3rem' }}>
                        <h2 style={{
                            fontSize: '1.75rem',
                            fontWeight: '700',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            🎬 Phim cùng thể loại: {movieCategoryDisplay}
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {suggestedMovies.map(suggestedMovie => {
                                const totalEpisodes = suggestedMovie.totalEpisodes || suggestedMovie.episodes?.length || 1;
                                const currentEp = suggestedMovie.currentEpisode || suggestedMovie.episodes?.length || totalEpisodes;

                                return (
                                    <Link
                                        href={`/movie/${suggestedMovie.slug || suggestedMovie.id}`}
                                        key={suggestedMovie.id}
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
                                                    src={suggestedMovie.thumbnail}
                                                    alt={suggestedMovie.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 240px"
                                                    style={{ objectFit: 'cover' }}
                                                    unoptimized
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
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                                zIndex: 5
                                            }}>
                                                {currentEp} / {totalEpisodes === '??' ? '??' : totalEpisodes}
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
                                                    {suggestedMovie.title}
                                                </h3>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    fontSize: '0.85rem',
                                                    color: '#cbd5e1',
                                                    flexWrap: 'wrap'
                                                }}>
                                                    <span>📅 {suggestedMovie.year}</span>
                                                    <span>•</span>
                                                    {/* Hiển thị category của phim gợi ý (đã được định dạng ở loadSuggestedMovies) */}
                                                    <span>🎭 {suggestedMovie.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
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
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Chính sách bảo mật</a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Điều khoản sử dụng</a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Giới thiệu</a></li>
                                <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Liên hệ</a></li>
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
        </div>
    );
}