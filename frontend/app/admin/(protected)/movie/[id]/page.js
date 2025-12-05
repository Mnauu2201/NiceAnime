'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where, orderBy, writeBatch } from 'firebase/firestore';
import { slugify } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import SuggestedMoviesSection from '@/app/movie/[id]/SuggestedMoviesSection';
import dynamic from 'next/dynamic';

// Danh sách Thể loại
const CATEGORIES = [
    "Anime", "Hành Động", "Phiêu Lưu", "Hài", "Hoạt Hình", "Giả Tưởng",
    "Kinh Dị", "Khoa Học Viễn Tưởng", "Tâm Lý", "Tình Cảm", "Gay Cấn",
    "Bí Ẩn", "Lãng Mạn", "Tài Liệu", "Hình Sự", "Gia Đình",
    "Chính Kịch", "Lịch Sử", "Chiến Tranh"
];

const formatDateTimeInput = (value) => {
    if (!value) return '';
    const date = value.seconds ? new Date(value.seconds * 1000) : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

// Dynamic imports
const Player = dynamic(() => import('../../../../../components/EmbedPlayer'), {
    ssr: false,
    loading: () => (
        <div style={{
            minHeight: '350px',
            backgroundColor: '#0f172a',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#cbd5e1',
            fontSize: '1.25rem'
        }}>
            Đang tải trình phát video...
        </div>
    ),
});

const SuggestedMovies = dynamic(() => import('@/app/movie/[id]/SuggestedMoviesSection'), {
    ssr: false,
    loading: () => (
        <div style={{ margin: '3rem 0', textAlign: 'center', color: '#64748b' }}>
            Đang tải phần đề xuất...
        </div>
    )
});

// Toast Component
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: bgColor,
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            zIndex: 9999,
            minWidth: '300px',
            maxWidth: '500px',
            animation: 'slideIn 0.3s ease-out'
        }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{icon}</span>
            <span style={{ flex: 1, fontSize: '0.95rem' }}>{message}</span>
            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '0',
                    lineHeight: '1'
                }}
            >
                ×
            </button>
        </div>
    );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                padding: '2rem',
                borderRadius: '0.75rem',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                animation: 'scaleIn 0.2s ease-out'
            }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#f1f5f9' }}>
                    Xác nhận
                </h3>
                <p style={{ margin: '0 0 1.5rem 0', color: '#cbd5e1', lineHeight: '1.6' }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            backgroundColor: '#475569',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.95rem'
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.95rem'
                        }}
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function MovieDetail() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState(null);
    const [movie, setMovie] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [currentEpisode, setCurrentEpisode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [movieCategoryDisplay, setMovieCategoryDisplay] = useState('');
    const [showSuggested, setShowSuggested] = useState(false);
    const movieRef = useRef(null);

    // Toast states
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState(null);

    // ** MỚI: State cho Form chỉnh sửa thông tin phim **
    const [isEditingMovie, setIsEditingMovie] = useState(false);
    const [editMovieData, setEditMovieData] = useState({
        title: '',
        thumbnail: '',
        category: [],
        year: new Date().getFullYear(),
        description: '',
        format: 'Phim lẻ'
    });
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // State cho Form thêm tập
    const [newEpisode, setNewEpisode] = useState({
        episodeNumber: 1,
        videoUrl: '',
        createdAt: formatDateTimeInput(new Date())
    });

    // Toast helper functions
    const showToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const showConfirm = (message) => {
        return new Promise((resolve) => {
            setConfirmModal({
                message,
                onConfirm: () => {
                    setConfirmModal(null);
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmModal(null);
                    resolve(false);
                }
            });
        });
    };

    // Authentication Check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.push('/admin/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Load Movie Data
    useEffect(() => {
        if (!params.id) return;
        const loadMovie = async () => {
            try {
                const docRef = doc(db, 'movies', params.id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const movieData = { id: docSnap.id, ...docSnap.data() };
                    // Đảm bảo category là mảng
                    if (!Array.isArray(movieData.category)) {
                        movieData.category = [movieData.category].filter(Boolean);
                    }
                    setMovie(movieData);

                    // Khởi tạo editMovieData
                    setEditMovieData({
                        title: movieData.title || '',
                        thumbnail: movieData.thumbnail || '',
                        category: movieData.category || [],
                        year: movieData.year || new Date().getFullYear(),
                        description: movieData.description || '',
                        format: movieData.format || 'Phim lẻ'
                    });
                } else {
                    router.push('/admin');
                }
            } catch (error) {
                console.error("Lỗi tải phim: ", error);
                showToast('Lỗi khi tải dữ liệu phim', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadMovie();
    }, [params.id, router]);

    // Load Episodes
    useEffect(() => {
        if (!movie) return;
        const loadEpisodes = async () => {
            try {
                const episodesQuery = query(
                    collection(db, 'episodes'),
                    where('movieId', '==', movie.id),
                    orderBy('episodeNumber', 'asc')
                );
                const querySnapshot = await getDocs(episodesQuery);
                const episodesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEpisodes(episodesData);

                const ep = parseInt(searchParams.get('ep')) || 1;
                const episode = episodesData.find(e => e.episodeNumber === ep);
                setCurrentEpisode(episode || episodesData[0]);

                setNewEpisode(prev => ({ ...prev, episodeNumber: episodesData.length + 1 }));

            } catch (error) {
                console.error("Lỗi tải tập phim: ", error);
                showToast('Lỗi khi tải danh sách tập phim', 'error');
            }
        };
        loadEpisodes();
    }, [movie, searchParams]);

    // Update Current Episode based on URL
    useEffect(() => {
        const ep = parseInt(searchParams.get('ep')) || 1;
        if (episodes.length > 0) {
            const episode = episodes.find(e => e.episodeNumber === ep);
            setCurrentEpisode(episode || episodes[0]);
        }
    }, [episodes, searchParams]);

    // Cập nhật tên thể loại hiển thị
    useEffect(() => {
        if (movie) {
            const display = movie.category.map(cat => CATEGORIES.find(c => slugify(c) === cat) || cat).join(', ');
            setMovieCategoryDisplay(display);
        }
    }, [movie]);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Intersection Observer cho Suggested Movies
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !showSuggested) {
                    setShowSuggested(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        if (movieRef.current) {
            const triggerElement = document.getElementById('suggested-trigger');
            if (triggerElement) {
                observer.observe(triggerElement);
            }
        }
        return () => {
            const triggerElement = document.getElementById('suggested-trigger');
            if (triggerElement) {
                observer.unobserve(triggerElement);
            }
        };
    }, [showSuggested]);

    // ** MỚI: Hàm xử lý category checkbox **
    const handleCategoryChange = (value, isChecked) => {
        setEditMovieData((prevData) => {
            if (isChecked) {
                return {
                    ...prevData,
                    category: [...prevData.category, value],
                };
            } else {
                return {
                    ...prevData,
                    category: prevData.category.filter((cat) => cat !== value),
                };
            }
        });
    };

    // ** MỚI: Hàm hiển thị category đã chọn **
    const getCategoryDisplay = () => {
        if (!Array.isArray(editMovieData.category) || editMovieData.category.length === 0) {
            return "Chọn thể loại...";
        }
        if (editMovieData.category.length === 1) {
            return editMovieData.category[0];
        }
        return `${editMovieData.category.length} thể loại đã chọn`;
    };

    // ** MỚI: Hàm lưu thông tin phim **
    const handleSaveMovieInfo = async (e) => {
        e.preventDefault();

        if (!editMovieData.title.trim()) {
            showToast('Tên phim không được để trống', 'error');
            return;
        }

        if (!editMovieData.thumbnail.trim()) {
            showToast('Link thumbnail không được để trống', 'error');
            return;
        }

        if (editMovieData.category.length === 0) {
            showToast('Vui lòng chọn ít nhất một thể loại', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const movieDocRef = doc(db, 'movies', movie.id);
            await updateDoc(movieDocRef, {
                title: editMovieData.title,
                thumbnail: editMovieData.thumbnail,
                category: editMovieData.category,
                year: editMovieData.year,
                description: editMovieData.description,
                format: editMovieData.format,
                slug: slugify(editMovieData.title)
            });

            // Cập nhật state movie
            setMovie(prev => ({
                ...prev,
                ...editMovieData,
                slug: slugify(editMovieData.title)
            }));

            showToast('Cập nhật thông tin phim thành công!', 'success');
            setIsEditingMovie(false);
        } catch (error) {
            console.error("Lỗi khi cập nhật phim: ", error);
            showToast('Lỗi khi cập nhật thông tin phim', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ** MỚI: Hàm hủy chỉnh sửa **
    const handleCancelEdit = () => {
        // Reset về dữ liệu gốc
        setEditMovieData({
            title: movie.title || '',
            thumbnail: movie.thumbnail || '',
            category: movie.category || [],
            year: movie.year || new Date().getFullYear(),
            description: movie.description || '',
            format: movie.format || 'Phim lẻ'
        });
        setIsEditingMovie(false);
        setIsCategoryDropdownOpen(false);
    };

    // [THÊM TẬP PHIM MỚI]
    const handleAddEpisode = async (e) => {
        e.preventDefault();
        if (!newEpisode.videoUrl || !newEpisode.episodeNumber) {
            showToast('Vui lòng điền đầy đủ thông tin', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const docRef = await addDoc(collection(db, 'episodes'), {
                ...newEpisode,
                movieId: movie.id,
                createdAt: new Date(newEpisode.createdAt)
            });

            const addedEpisode = {
                id: docRef.id,
                ...newEpisode,
                movieId: movie.id,
                createdAt: new Date(newEpisode.createdAt)
            };
            setEpisodes(prev => [...prev, addedEpisode].sort((a, b) => a.episodeNumber - b.episodeNumber));
            setNewEpisode({ ...newEpisode, episodeNumber: newEpisode.episodeNumber + 1, videoUrl: '' });

            await updateDoc(doc(db, 'movies', movie.id), {
                totalEpisodes: newEpisode.episodeNumber
            });

            showToast('Thêm tập phim thành công!', 'success');

        } catch (error) {
            console.error("Lỗi khi thêm tập phim: ", error);
            showToast('Lỗi khi thêm tập phim', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // [XOÁ TẬP PHIM]
    const handleDeleteEpisode = async (episodeId, episodeNumber) => {
        const confirmed = await showConfirm(`Bạn có chắc chắn muốn xóa tập ${episodeNumber}?`);
        if (!confirmed) return;

        try {
            await deleteDoc(doc(db, 'episodes', episodeId));
            setEpisodes(prev => prev.filter(e => e.id !== episodeId));
            showToast(`Đã xóa tập ${episodeNumber} thành công!`, 'success');
        } catch (error) {
            console.error("Lỗi khi xóa tập phim: ", error);
            showToast('Lỗi khi xóa tập phim', 'error');
        }
    };

    // [XOÁ PHIM]
    const handleDeleteMovie = async () => {
        const confirmed = await showConfirm(
            `CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ phim "${movie.title}" và ${episodes.length} tập phim liên quan không? Hành động này không thể hoàn tác!`
        );
        if (!confirmed) return;

        try {
            const batch = writeBatch(db);
            episodes.forEach(ep => {
                const epRef = doc(db, 'episodes', ep.id);
                batch.delete(epRef);
            });
            await batch.commit();

            await deleteDoc(doc(db, 'movies', movie.id));

            showToast(`Phim "${movie.title}" đã được xóa thành công!`, 'success');

            setTimeout(() => {
                router.push('/admin');
            }, 1500);
        } catch (error) {
            console.error("Lỗi khi xóa phim: ", error);
            showToast('Lỗi khi xóa phim', 'error');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0a0d16', color: 'white' }}>
                <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #1e293b', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    if (!movie) return null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0d16', color: 'white' }}>
            {/* Toast Container */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
                {toasts.map((toast, index) => (
                    <div key={toast.id} style={{ marginBottom: index > 0 ? '10px' : '0' }}>
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => removeToast(toast.id)}
                        />
                    </div>
                ))}
            </div>

            {/* Confirm Modal */}
            {confirmModal && (
                <ConfirmModal
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={confirmModal.onCancel}
                />
            )}

            <main ref={movieRef} style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
                <Link href="/admin/dashboard" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
                    ← Quay lại Dashboard
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                        {movie.title}
                    </h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setIsEditingMovie(!isEditingMovie)}
                            style={{
                                backgroundColor: isEditingMovie ? '#64748b' : '#0ea5e9',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {isEditingMovie ? '❌ Hủy' : '✏️ Sửa Thông Tin'}
                        </button>
                        <button
                            onClick={handleDeleteMovie}
                            style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            🗑️ Xóa Phim
                        </button>
                    </div>
                </div>

                {/* ** MỚI: Form chỉnh sửa thông tin phim ** */}
                {isEditingMovie && (
                    <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: 0, marginBottom: '1rem' }}>
                            ✏️ Chỉnh Sửa Thông Tin Phim
                        </h2>
                        <form onSubmit={handleSaveMovieInfo}>
                            {/* Tên phim & Thumbnail */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Tên phim *</label>
                                    <input
                                        type="text"
                                        value={editMovieData.title}
                                        onChange={(e) => setEditMovieData({ ...editMovieData, title: e.target.value })}
                                        placeholder="One Piece"
                                        style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Link Thumbnail *</label>
                                    <input
                                        type="url"
                                        value={editMovieData.thumbnail}
                                        onChange={(e) => setEditMovieData({ ...editMovieData, thumbnail: e.target.value })}
                                        placeholder="https://..."
                                        style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Category, Format, Năm */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                {/* Category Dropdown */}
                                <div ref={dropdownRef} style={{ position: 'relative' }}>
                                    <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Thể loại (Có thể chọn nhiều) *</label>
                                    <div
                                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '0.375rem',
                                            backgroundColor: '#374151',
                                            color: editMovieData.category.length === 0 ? '#9ca3af' : 'white',
                                            border: '1px solid #4b5563',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span>{getCategoryDisplay()}</span>
                                        <span style={{
                                            transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s',
                                        }}>
                                            ▼
                                        </span>
                                    </div>

                                    {isCategoryDropdownOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            marginTop: '0.25rem',
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #4b5563',
                                            borderRadius: '0.375rem',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                            zIndex: 10,
                                            maxHeight: '250px',
                                            overflowY: 'auto',
                                            padding: '0.5rem',
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(2, 1fr)',
                                            gap: '0.5rem'
                                        }}>
                                            {CATEGORIES.map((cat) => (
                                                <div
                                                    key={cat}
                                                    onClick={() => handleCategoryChange(cat, !editMovieData.category.includes(cat))}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '0.3rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        cursor: 'pointer',
                                                        backgroundColor: editMovieData.category.includes(cat) ? '#3b82f6' : 'transparent',
                                                        color: 'white',
                                                        transition: 'background-color 0.1s',
                                                    }}
                                                >
                                                    <span style={{
                                                        marginRight: '0.5rem',
                                                        color: 'white',
                                                        minWidth: '1rem'
                                                    }}>
                                                        {editMovieData.category.includes(cat) ? '✓' : ''}
                                                    </span>
                                                    <span style={{ flex: 1 }}>{cat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Format */}
                                <div>
                                    <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Định dạng phim *</label>
                                    <select
                                        value={editMovieData.format}
                                        onChange={(e) => setEditMovieData({ ...editMovieData, format: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                        required
                                    >
                                        <option value="Phim lẻ">Phim lẻ</option>
                                        <option value="Phim bộ">Phim bộ</option>
                                    </select>
                                </div>

                                {/* Năm */}
                                <div>
                                    <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Năm</label>
                                    <input
                                        type="number"
                                        value={editMovieData.year}
                                        onChange={(e) => setEditMovieData({ ...editMovieData, year: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Mô tả</label>
                                <textarea
                                    value={editMovieData.description}
                                    onChange={(e) => setEditMovieData({ ...editMovieData, description: e.target.value })}
                                    rows="4"
                                    placeholder="Mô tả về phim..."
                                    style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563', resize: 'vertical' }}
                                />
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    style={{
                                        backgroundColor: '#64748b',
                                        color: 'white',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '0.5rem',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ❌ Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    style={{
                                        backgroundColor: isSaving ? '#60a5fa' : '#10b981',
                                        color: 'white',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '0.5rem',
                                        border: 'none',
                                        cursor: isSaving ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {isSaving ? '⏳ Đang lưu...' : '💾 Lưu Thay Đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* PLAYER VÀ LIST TẬP PHIM */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>
                    {/* KHU VỰC PHÁT VIDEO */}
                    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '0.75rem', paddingBottom: '56.25%', height: 0 }}>
                        {currentEpisode?.videoUrl ? (
                            <Player
                                videoUrl={currentEpisode.videoUrl}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            />
                        ) : (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#1e293b', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#cbd5e1', fontSize: '1.25rem' }}>
                                Vui lòng chọn tập phim hoặc thêm tập mới.
                            </div>
                        )}
                    </div>

                    {/* LIST TẬP PHIM */}
                    <div style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', backgroundColor: '#1e293b', padding: '1rem', borderRadius: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: 0, marginBottom: '1rem' }}>
                            Danh sách Tập ({episodes.length} tập)
                        </h3>
                        {episodes.map((ep) => (
                            <div key={ep.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem',
                                marginBottom: '0.5rem',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                backgroundColor: currentEpisode?.id === ep.id ? '#3b82f6' : 'transparent',
                                color: currentEpisode?.id === ep.id ? 'white' : '#cbd5e1',
                                border: '1px solid #374151'
                            }}
                                onClick={() => router.push(`?ep=${ep.episodeNumber}`, { scroll: false })}
                            >
                                <span>Tập {ep.episodeNumber}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteEpisode(ep.id, ep.episodeNumber); }}
                                    style={{
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Xóa
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* THÔNG TIN VÀ FORM THÊM TẬP */}
                <div style={{ marginTop: '2rem' }}>
                    {!isEditingMovie && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                Thông tin chi tiết
                            </h2>
                            <p style={{ color: '#cbd5e1', lineHeight: '1.75', margin: 0 }}>
                                Thể loại: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{movieCategoryDisplay}</span>
                            </p>
                            <p style={{ color: '#cbd5e1', lineHeight: '1.75', margin: 0 }}>
                                Định dạng: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{movie.format || 'N/A'}</span>
                            </p>
                            <p style={{ color: '#cbd5e1', lineHeight: '1.75', margin: 0 }}>
                                Tổng số tập: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{movie.totalEpisodes || episodes.length}</span>
                            </p>
                            <p style={{ color: '#cbd5e1', lineHeight: '1.75', margin: 0 }}>
                                {movie.description || 'Chưa có mô tả cho phim này.'}
                            </p>
                        </div>
                    )}

                    <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: 0, marginBottom: '1rem' }}>
                            Thêm Tập Phim Mới
                        </h2>
                        <form onSubmit={handleAddEpisode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 3fr 1.5fr', gap: '1rem' }}>
                                <input
                                    type="number"
                                    value={newEpisode.episodeNumber}
                                    onChange={(e) => setNewEpisode({ ...newEpisode, episodeNumber: parseInt(e.target.value) || 1 })}
                                    placeholder="Số tập"
                                    required
                                    style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                />
                                <input
                                    type="url"
                                    value={newEpisode.videoUrl}
                                    onChange={(e) => setNewEpisode({ ...newEpisode, videoUrl: e.target.value })}
                                    placeholder="Video URL"
                                    required
                                    style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                />
                                <input
                                    type="datetime-local"
                                    value={newEpisode.createdAt}
                                    onChange={(e) => setNewEpisode({ ...newEpisode, createdAt: e.target.value })}
                                    style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                style={{
                                    backgroundColor: isSaving ? '#60a5fa' : '#2563eb',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    cursor: isSaving ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isSaving ? 'Đang thêm...' : '➕ Thêm tập'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Trigger */}
                <div id="suggested-trigger" style={{ height: '1px', marginTop: '3rem' }}></div>

                {/* Suggested Movies */}
                {showSuggested && movie && (
                    <SuggestedMovies
                        movieId={movie.id}
                        movieCategory={movie.category}
                        movieCategoryDisplay={movieCategoryDisplay}
                    />
                )}
            </main>

            <footer style={{
                backgroundColor: '#0a0d16',
                borderTop: '1px solid #1e293b',
                padding: '2rem 1.5rem',
                textAlign: 'center'
            }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                    Copyright © {new Date().getFullYear()} by NiceAnime
                </p>
            </footer>

            <style jsx global>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}