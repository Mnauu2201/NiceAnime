'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
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

    useEffect(() => {
        loadMovie();
    }, []);

    useEffect(() => {
        if (movie) {
            loadEpisodes();
        }
    }, [movie]);

    useEffect(() => {
        const ep = parseInt(searchParams.get('ep')) || 1;
        if (episodes.length > 0) {
            const episode = episodes.find(e => e.episodeNumber === ep);
            setCurrentEpisode(episode || episodes[0]);
        }
    }, [searchParams, episodes]);

    const loadMovie = async () => {
        try {
            const docRef = doc(db, 'movies', params.id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setMovie({ id: docSnap.id, ...docSnap.data() });
            }
        } catch (error) {
            console.error('Error loading movie:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadEpisodes = async () => {
        try {
            // Query episodes collection WHERE movieId = params.id
            const episodesQuery = query(
                collection(db, 'episodes'),
                where('movieId', '==', params.id),
                orderBy('episodeNumber', 'asc')
            );

            const querySnapshot = await getDocs(episodesQuery);
            const episodesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setEpisodes(episodesList);

            // Set current episode
            const ep = parseInt(searchParams.get('ep')) || 1;
            const episode = episodesList.find(e => e.episodeNumber === ep);
            setCurrentEpisode(episode || episodesList[0]);

        } catch (error) {
            console.error('Error loading episodes:', error);
        } finally {
            setLoadingEpisodes(false);
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

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#05060b', color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                background: 'rgba(5,6,11,0.9)',
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
                            src="/NiceAnime.png"
                            alt="Phim Hay Logo"
                            width={160}
                            height={48}
                            priority
                            style={{ height: '48px', width: 'auto' }}
                        />
                    </Link>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Đang xem:</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{movie.title}</p>
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
                                        <span>🎭 {movie.category}</span>
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
                                        href={`/movie/${movie.id}?ep=${episode.episodeNumber}`}
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
                    gap: '2rem'
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
                            <span style={{
                                backgroundColor: '#1e40af',
                                padding: '0.5rem 1rem',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                            }}>
                                {movie.category}
                            </span>
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
            </main>
        </div>
    );
}