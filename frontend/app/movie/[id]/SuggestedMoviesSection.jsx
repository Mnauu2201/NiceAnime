// FILE: app/movie/[id]/SuggestedMoviesSection.jsx
'use client';
import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Memoized Movie Card với shouldComponentUpdate tùy chỉnh
const MovieCard = memo(({ movie }) => {
    const totalEpisodes = movie.totalEpisodes || 1;
    const currentEpisodeCount = movie.episodes?.length || 1;
    const isMovieSeries = totalEpisodes > 1 || movie.totalEpisodes === '??';

    let episodeStatusText, episodeStatusColor;
    if (isMovieSeries) {
        if (movie.totalEpisodes === '??' || currentEpisodeCount < totalEpisodes) {
            episodeStatusText = `${currentEpisodeCount}/${totalEpisodes}`;
            episodeStatusColor = '#f59e0b';
        } else {
            episodeStatusText = `${totalEpisodes}/${totalEpisodes}`;
            episodeStatusColor = '#10b981';
        }
    } else {
        episodeStatusText = '1/1';
        episodeStatusColor = '#ef4444';
    }

    const typeStatusText = isMovieSeries ? 'Phim Bộ' : 'Phim Lẻ';
    const typeStatusColor = isMovieSeries ? '#3b82f6' : '#ef4444';

    return (
        <Link href={`/movie/${movie.slug || movie.id}`} prefetch={false} style={{ textDecoration: 'none', color: 'white' }}>
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '1rem',
                boxShadow: '0 15px 25px rgba(0,0,0,0.45)',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                backgroundColor: '#0f172a',
                minHeight: '360px',
                willChange: 'transform'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 25px 35px rgba(59, 130, 246, 0.35)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 15px 25px rgba(0,0,0,0.45)';
            }}>
                <div style={{ position: 'relative', width: '100%', height: '320px' }}>
                    <Image
                        src={movie.thumbnail}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 240px"
                        style={{ objectFit: 'cover' }}
                        loading="lazy"
                        quality={75}
                    />
                </div>
                <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    left: '0.75rem',
                    backgroundColor: episodeStatusColor,
                    color: 'white',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    zIndex: 5
                }}>{episodeStatusText}</div>
                <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    backgroundColor: typeStatusColor,
                    color: 'white',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    zIndex: 5
                }}>{typeStatusText}</div>
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
                        margin: '0 0 0.35rem 0',
                        lineHeight: 1.4
                    }}>{movie.title}</h3>
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        color: '#cbd5e1'
                    }}>
                        <span>📅 {movie.year}</span>
                        <span>•</span>
                        <span>🎭 {movie.category}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}, (prevProps, nextProps) => {
    return prevProps.movie.id === nextProps.movie.id;
});
MovieCard.displayName = 'MovieCard';

export default function SuggestedMoviesSection({ movieId, movieCategory, movieCategoryDisplay }) {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();

        // Delay loading để ưu tiên nội dung chính
        const timer = setTimeout(async () => {
            try {
                const categories = Array.isArray(movieCategory)
                    ? movieCategory
                    : (typeof movieCategory === 'string'
                        ? movieCategory.split(',').map(c => c.trim()).filter(c => c)
                        : []);

                const categoryFilter = categories.length > 0 ? categories[0] : 'Anime';

                const moviesQuery = query(
                    collection(db, 'movies'),
                    where('category', 'array-contains', categoryFilter),
                    orderBy('createdAt', 'desc'),
                    limit(11)
                );

                const snapshot = await getDocs(moviesQuery);

                if (!isMounted || abortController.signal.aborted) return;

                const moviesList = snapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            title: data.title,
                            thumbnail: data.thumbnail,
                            slug: data.slug,
                            year: data.year,
                            totalEpisodes: data.totalEpisodes,
                            category: Array.isArray(data.category)
                                ? data.category.join(', ')
                                : data.category,
                            episodes: data.episodes || [],
                        };
                    })
                    .filter(m => m.id !== movieId)
                    .slice(0, 10);

                setMovies(moviesList);
                setLoading(false);
            } catch (error) {
                console.error('Error loading suggested movies:', error);
                if (isMounted) setLoading(false);
            }
        }, 500); // Delay 500ms để ưu tiên nội dung chính

        return () => {
            isMounted = false;
            abortController.abort();
            clearTimeout(timer);
        };
    }, [movieId, movieCategory]);

    if (loading) {
        return (
            <div style={{ marginBottom: '3rem' }}>
                <div style={{
                    height: '2rem',
                    width: '300px',
                    backgroundColor: '#1e293b',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem',
                    animation: 'pulse 2s infinite'
                }}></div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} style={{
                            height: '360px',
                            backgroundColor: '#1e293b',
                            borderRadius: '1rem',
                            animation: 'pulse 2s infinite'
                        }}></div>
                    ))}
                </div>
            </div>
        );
    }

    if (movies.length === 0) return null;

    return (
        <div style={{ marginBottom: '3rem', contentVisibility: 'auto', containIntrinsicSize: '800px 600px' }}>
            <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                margin: '0 0 1.5rem 0'
            }}>
                🎬 Phim cùng thể loại: {movieCategoryDisplay}
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1.5rem'
            }}>
                {movies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}
            </div>
        </div>
    );
}
