'use client';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, query, where, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [movies, setMovies] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: 'success', visible: false });
    const notificationTimer = useRef(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, loading: false });
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    // ** MỚI: State cho phân trang **
    const [currentPage, setCurrentPage] = useState(1);
    const MOVIES_PER_PAGE = 20;

    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const CATEGORIES = [
        "Anime", "Hành Động", "Phiêu Lưu", "Hài", "Hoạt Hình", "Giả Tưởng",
        "Kinh Dị", "Khoa Học Viễn Tưởng", "Tâm Lý", "Tình Cảm", "Gay Cấn",
        "Bí Ẩn", "Lãng Mạn", "Tài Liệu", "Hình Sự", "Gia Đình",
        "Chính Kịch", "Lịch Sử", "Chiến Tranh", "Nhạc", "Cổ Trang", "Miền Tây", "Phim 18+"
    ];

    const [formData, setFormData] = useState({
        title: '',
        thumbnail: '',
        category: ['Anime'],
        year: new Date().getFullYear(),
        description: '',
        format: 'Phim lẻ',
        totalEpisodes: 1,
        // 🌟 THAY ĐỔI: Thêm trường Tên Khác/Phụ
        otherTitles: ''
    });

    const [episodes, setEpisodes] = useState([
        { episodeNumber: 1, title: 'Tập 1', videoUrl: '' }
    ]);

    const loadMovies = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'movies'));
            const moviesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                category: Array.isArray(doc.data().category) ? doc.data().category : [doc.data().category].filter(Boolean),
                format: doc.data().format || 'Phim lẻ',
                // Đảm bảo trường này tồn tại khi load
                otherTitles: doc.data().otherTitles || ''
            }));
            setMovies(moviesList);
        } catch (error) {
            console.error('Error loading movies:', error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                loadMovies();
            } else {
                router.push('/admin/login');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsCategoryDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownRef]);

    const showNotification = (message, type = 'success') => {
        if (notificationTimer.current) {
            clearTimeout(notificationTimer.current);
        }
        setNotification({ message, type, visible: true });
        notificationTimer.current = setTimeout(() => {
            setNotification((prev) => ({ ...prev, visible: false }));
            notificationTimer.current = null;
        }, 4000);
    };

    const hideNotification = () => {
        if (notificationTimer.current) {
            clearTimeout(notificationTimer.current);
            notificationTimer.current = null;
        }
        setNotification((prev) => ({ ...prev, visible: false }));
    };

    useEffect(() => {
        return () => {
            if (notificationTimer.current) {
                clearTimeout(notificationTimer.current);
                notificationTimer.current = null;
            }
        };
    }, []);

    const handleTotalEpisodesChange = (total) => {
        const newTotal = parseInt(total) || 1;
        setFormData({ ...formData, totalEpisodes: newTotal });

        const newEpisodes = [];
        for (let i = 1; i <= newTotal; i++) {
            const existing = episodes.find(ep => ep.episodeNumber === i);
            newEpisodes.push(existing || {
                episodeNumber: i,
                title: `Tập ${i}`,
                videoUrl: ''
            });
        }
        setEpisodes(newEpisodes);
    };

    const handleEpisodeChange = (index, field, value) => {
        const newEpisodes = [...episodes];
        newEpisodes[index][field] = value;
        setEpisodes(newEpisodes);
    };

    const handleCategoryChange = (value, isChecked) => {
        setFormData((prevFormData) => {
            if (isChecked) {
                return {
                    ...prevFormData,
                    category: [...prevFormData.category, value],
                };
            } else {
                return {
                    ...prevFormData,
                    category: prevFormData.category.filter((cat) => cat !== value),
                };
            }
        });
    };

    const handleAddMovie = async (e) => {
        e.preventDefault();

        const invalidEpisodes = episodes.filter(ep => !ep.videoUrl.trim());
        if (invalidEpisodes.length > 0) {
            showNotification(`Vui lòng điền link video cho tất cả ${formData.totalEpisodes} tập!`, 'error');
            return;
        }

        if (!Array.isArray(formData.category) || formData.category.length === 0) {
            showNotification('Vui lòng chọn ít nhất một thể loại!', 'error');
            return;
        }

        setUploading(true);

        try {
            const slug = slugify(formData.title);
            const movieRef = await addDoc(collection(db, 'movies'), {
                title: formData.title,
                slug: slug,
                thumbnail: formData.thumbnail,
                category: formData.category,
                year: formData.year,
                description: formData.description,
                format: formData.format,
                totalEpisodes: formData.totalEpisodes,
                // 🌟 THAY ĐỔI: Lưu otherTitles vào Firebase
                otherTitles: formData.otherTitles.trim(),
                createdAt: new Date()
            });

            console.log('Movie created with ID:', movieRef.id);

            const batch = writeBatch(db);
            const episodesRef = collection(db, 'episodes');

            episodes.forEach((episode) => {
                const episodeDocRef = doc(episodesRef);
                batch.set(episodeDocRef, {
                    movieId: movieRef.id,
                    episodeNumber: episode.episodeNumber,
                    title: episode.title,
                    videoUrl: episode.videoUrl,
                    createdAt: new Date()
                });
            });

            await batch.commit();

            console.log(`Created ${episodes.length} episodes for movie ${movieRef.id}`);
            showNotification(`Thêm phim "${formData.title}" với ${formData.totalEpisodes} tập thành công!`, 'success');

            // 🌟 THAY ĐỔI: Reset state bao gồm otherTitles
            setFormData({
                title: '',
                thumbnail: '',
                category: ['Anime'],
                year: new Date().getFullYear(),
                description: '',
                format: 'Phim lẻ',
                totalEpisodes: 1,
                otherTitles: ''
            });
            setEpisodes([{ episodeNumber: 1, title: 'Tập 1', videoUrl: '' }]);

            loadMovies();
        } catch (error) {
            console.error('Error adding movie:', error);
            showNotification('Lỗi khi thêm phim: ' + error.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteMovie = async (movieId, movieTitle) => {
        try {
            const episodesQuery = query(collection(db, 'episodes'), where('movieId', '==', movieId));
            const episodesSnapshot = await getDocs(episodesQuery);

            const batch = writeBatch(db);

            episodesSnapshot.docs.forEach((docSnapshot) => {
                batch.delete(docSnapshot.ref);
            });

            batch.delete(doc(db, 'movies', movieId));

            await batch.commit();

            showNotification(`Đã xóa phim "${movieTitle}" và ${episodesSnapshot.size} tập!`, 'success');
            loadMovies();
        } catch (error) {
            console.error('Error deleting movie:', error);
            showNotification('Lỗi khi xóa phim: ' + error.message, 'error');
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        await fetch('/api/auth/session', { method: 'DELETE' });
        router.push('/admin/login');
    };

    const openConfirmModal = ({ title, message, onConfirm }) => {
        setConfirmModal({
            open: true,
            title,
            message,
            onConfirm,
            loading: false
        });
    };

    const closeConfirmModal = () => {
        setConfirmModal((prev) => ({ ...prev, open: false, loading: false }));
    };

    const handleConfirmAction = async () => {
        if (!confirmModal.onConfirm) {
            closeConfirmModal();
            return;
        }
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
            await confirmModal.onConfirm();
        } finally {
            closeConfirmModal();
        }
    };

    const goToMovieDetail = (movieId) => {
        sessionStorage.setItem('adminDashboardScroll', window.scrollY.toString());
        router.push(`/admin/movie/${movieId}`);
    };

    useEffect(() => {
        const returningFromEdit = sessionStorage.getItem('returningFromEdit');
        const savedScroll = sessionStorage.getItem('adminDashboardScroll');

        if (returningFromEdit && savedScroll) {
            setTimeout(() => {
                window.scrollTo({
                    top: parseInt(savedScroll, 10),
                    behavior: 'instant'
                });
                sessionStorage.removeItem('adminDashboardScroll');
                sessionStorage.removeItem('returningFromEdit');
            }, 300);
        }
    }, [movies, loading]);

    // 🌟 THAY ĐỔI: Logic lọc phim mới, kiểm tra cả Tên chính và Tên phụ/Từ khóa
    const filteredMovies = movies.filter((movie) => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        const titleMatch = movie.title?.toLowerCase().includes(lowerCaseSearchTerm);

        // Chuyển otherTitles thành chữ thường để tìm kiếm
        const otherTitlesMatch = movie.otherTitles?.toLowerCase().includes(lowerCaseSearchTerm);

        // Phim được tìm thấy nếu khớp với tên chính HOẶC tên phụ
        return titleMatch || otherTitlesMatch;
    });
    // Kết thúc logic lọc phim mới

    // ** MỚI: Tính toán phân trang **
    const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);
    const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
    const endIndex = startIndex + MOVIES_PER_PAGE;
    const currentMovies = filteredMovies.slice(startIndex, endIndex);

    // ** MỚI: Reset về trang 1 khi search **
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // ** MỚI: Hàm chuyển trang **
    const goToPage = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ** MỚI: Component Pagination **
    const PaginationControls = () => {
        if (totalPages <= 1) return null;

        const pageNumbers = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '2rem',
                flexWrap: 'wrap'
            }}>
                {/* First Page */}
                <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        backgroundColor: currentPage === 1 ? '#4b5563' : '#374151',
                        color: currentPage === 1 ? '#9ca3af' : 'white',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    ««
                </button>

                {/* Previous Page */}
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        backgroundColor: currentPage === 1 ? '#4b5563' : '#374151',
                        color: currentPage === 1 ? '#9ca3af' : 'white',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    «
                </button>

                {/* Page Numbers */}
                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => goToPage(1)}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                backgroundColor: '#374151',
                                color: 'white',
                                cursor: 'pointer',
                                minWidth: '2.5rem'
                            }}
                        >
                            1
                        </button>
                        {startPage > 2 && <span style={{ color: '#9ca3af' }}>...</span>}
                    </>
                )}

                {pageNumbers.map((page) => (
                    <button
                        key={page}
                        onClick={() => goToPage(page)}
                        style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            backgroundColor: currentPage === page ? '#3b82f6' : '#374151',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: currentPage === page ? 'bold' : 'normal',
                            minWidth: '2.5rem'
                        }}
                    >
                        {page}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span style={{ color: '#9ca3af' }}>...</span>}
                        <button
                            onClick={() => goToPage(totalPages)}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                backgroundColor: '#374151',
                                color: 'white',
                                cursor: 'pointer',
                                minWidth: '2.5rem'
                            }}
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                {/* Next Page */}
                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        backgroundColor: currentPage === totalPages ? '#4b5563' : '#374151',
                        color: currentPage === totalPages ? '#9ca3af' : 'white',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    »
                </button>

                {/* Last Page */}
                <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        backgroundColor: currentPage === totalPages ? '#4b5563' : '#374151',
                        color: currentPage === totalPages ? '#9ca3af' : 'white',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    »»
                </button>

                {/* Page Info */}
                <span style={{
                    color: '#9ca3af',
                    fontSize: '0.875rem',
                    marginLeft: '1rem'
                }}>
                    Trang {currentPage} / {totalPages}
                </span>
            </div>
        );
    };

    const getCategoryDisplay = () => {
        if (!Array.isArray(formData.category) || formData.category.length === 0) {
            return "Chọn thể loại...";
        }
        if (formData.category.length === 1) {
            return formData.category[0];
        }
        return `${formData.category.length} thể loại đã chọn`;
    };

    if (loading) {
        return <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p>Loading...</p>
        </div>;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '2rem', position: 'relative' }}>
            {notification.visible && (
                <div
                    onClick={hideNotification}
                    style={{
                        position: 'fixed',
                        top: '1rem',
                        right: '1rem',
                        backgroundColor: notification.type === 'success' ? '#16a34a' : '#dc2626',
                        color: 'white',
                        padding: '1rem 1.25rem',
                        borderRadius: '0.5rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                        minWidth: '240px',
                        cursor: 'pointer',
                        zIndex: 100
                    }}
                >
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                        {notification.type === 'success' ? 'Thành công' : 'Lỗi'}
                    </strong>
                    <span>{notification.message}</span>
                </div>
            )}
            {confirmModal.open && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 150
                }}>
                    <div style={{
                        backgroundColor: '#1f2937',
                        padding: '1.75rem',
                        borderRadius: '0.75rem',
                        width: '100%',
                        maxWidth: '480px',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{confirmModal.title}</h3>
                        <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.5 }}>{confirmModal.message}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                onClick={closeConfirmModal}
                                style={{
                                    backgroundColor: '#4b5563',
                                    padding: '0.5rem 1.25rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                style={{
                                    backgroundColor: '#dc2626',
                                    padding: '0.5rem 1.25rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    color: 'white',
                                    cursor: confirmModal.loading ? 'not-allowed' : 'pointer',
                                    opacity: confirmModal.loading ? 0.7 : 1
                                }}
                                disabled={confirmModal.loading}
                            >
                                {confirmModal.loading ? 'Đang xử lý...' : 'Đồng ý'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div style={{ maxWidth: '1536px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold' }}>🎬 Admin Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        style={{
                            backgroundColor: '#dc2626',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Đăng xuất
                    </button>
                </div>

                {/* Info Box */}
                <div style={{
                    backgroundColor: '#1e40af',
                    padding: '1rem 1.5rem',
                    borderRadius: '0.5rem',
                    marginBottom: '2rem',
                    border: '1px solid #3b82f6'
                }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5' }}>
                        💡 <strong>Cấu trúc Firebase tối ưu:</strong><br />
                        • Collection <code style={{ backgroundColor: '#1e293b', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>movies</code>: Lưu thông tin cơ bản phim (Category là **Mảng**)<br />
                        • Collection <code style={{ backgroundColor: '#1e293b', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>episodes</code>: Mỗi tập là 1 document riêng → Tiết kiệm băng thông & nhanh hơn!
                    </p>
                </div>

                {/* Add Movie Form - Giữ nguyên form thêm phim */}
                <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>➕ Thêm Phim Mới</h2>

                    <form onSubmit={handleAddMovie}>
                        {/* Tên phim và Link Thumbnail */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Tên phim *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="One Piece"
                                    style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                    required
                                    disabled={uploading}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Link Thumbnail *</label>
                                <input
                                    type="url"
                                    value={formData.thumbnail}
                                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                                    placeholder="https://animehay.ai/wp-content/uploads/..."
                                    style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                    required
                                    disabled={uploading}
                                />
                            </div>
                        </div>

                        {/* 🌟 THAY ĐỔI: Thêm trường Tên Khác/Từ khóa */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Tên Khác/Từ khóa (Ngăn cách bằng dấu phẩy)</label>
                            <input
                                type="text"
                                value={formData.otherTitles}
                                onChange={(e) => setFormData({ ...formData, otherTitles: e.target.value })}
                                placeholder="Attack on Titan, AoT, SnK"
                                style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                disabled={uploading}
                            />
                        </div>

                        {/* Thể loại, Định dạng, Năm, Tổng số tập */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div ref={dropdownRef} style={{ position: 'relative' }}>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Thể loại (Có thể chọn nhiều) *</label>
                                <div
                                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.375rem',
                                        backgroundColor: '#374151',
                                        color: formData.category.length === 0 ? '#9ca3af' : 'white',
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
                                                onClick={() => handleCategoryChange(cat, !formData.category.includes(cat))}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '0.3rem 0.5rem',
                                                    borderRadius: '0.25rem',
                                                    cursor: 'pointer',
                                                    backgroundColor: formData.category.includes(cat) ? '#3b82f6' : 'transparent',
                                                    color: 'white',
                                                    transition: 'background-color 0.1s',
                                                }}
                                            >
                                                <span style={{
                                                    marginRight: '0.5rem',
                                                    color: 'white',
                                                    minWidth: '1rem'
                                                }}>
                                                    {formData.category.includes(cat) ? '✓' : ''}
                                                </span>
                                                <span style={{ flex: 1 }}>{cat}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Định dạng phim *</label>
                                <select
                                    value={formData.format}
                                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                    required
                                    disabled={uploading}
                                >
                                    <option value="Phim lẻ">Phim lẻ</option>
                                    <option value="Phim bộ">Phim bộ</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Năm</label>
                                <input
                                    type="number"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                    style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                    disabled={uploading}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Tổng số tập *</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10000"
                                    value={formData.totalEpisodes}
                                    onChange={(e) => handleTotalEpisodesChange(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                    required
                                    disabled={uploading}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Mô tả</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                placeholder="One Piece là bộ anime huyền thoại..."
                                style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                disabled={uploading}
                            />
                        </div>

                        <div style={{
                            backgroundColor: '#374151',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            maxHeight: '400px',
                            overflowY: 'auto'
                        }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#60a5fa' }}>
                                📺 Danh sách {formData.totalEpisodes} tập
                            </h3>

                            {episodes.map((episode, index) => (
                                <div key={index} style={{
                                    backgroundColor: '#1f2937',
                                    padding: '1rem',
                                    borderRadius: '0.375rem',
                                    marginBottom: '0.75rem'
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 2fr', gap: '0.75rem', alignItems: 'center' }}>
                                        <div style={{
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                            padding: '0.5rem',
                                            borderRadius: '0.375rem',
                                            textAlign: 'center',
                                            fontWeight: 'bold'
                                        }}>
                                            {episode.episodeNumber}
                                        </div>

                                        <input
                                            type="text"
                                            value={episode.title}
                                            onChange={(e) => handleEpisodeChange(index, 'title', e.target.value)}
                                            placeholder={`Tập ${episode.episodeNumber}`}
                                            style={{
                                                padding: '0.5rem',
                                                borderRadius: '0.375rem',
                                                backgroundColor: '#4b5563',
                                                color: 'white',
                                                border: '1px solid #6b7280'
                                            }}
                                            disabled={uploading}
                                        />

                                        <input
                                            type="url"
                                            value={episode.videoUrl}
                                            onChange={(e) => handleEpisodeChange(index, 'videoUrl', e.target.value)}
                                            placeholder="https://embed18.streamc.xyz/embed.php?hash=..."
                                            style={{
                                                padding: '0.5rem',
                                                borderRadius: '0.375rem',
                                                backgroundColor: '#4b5563',
                                                color: 'white',
                                                border: '1px solid #6b7280'
                                            }}
                                            required
                                            disabled={uploading}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            style={{
                                width: '100%',
                                backgroundColor: uploading ? '#6b7280' : '#2563eb',
                                color: 'white',
                                fontWeight: 'bold',
                                padding: '0.75rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                fontSize: '1.125rem'
                            }}
                        >
                            {uploading ? '⏳ Đang tải lên Firebase...' : `➕ Thêm Phim (${formData.totalEpisodes} tập)`}
                        </button>
                    </form>
                </div>

                {/* Movies List with Pagination */}
                <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                            📋 Danh Sách Phim ({filteredMovies.length} phim)
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: '#374151',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #4b5563',
                            minWidth: '300px'
                        }}>
                            <span style={{ fontSize: '1.125rem' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm phim theo tên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'white',
                                    fontSize: '0.875rem'
                                }}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#9ca3af',
                                        cursor: 'pointer',
                                        fontSize: '1.125rem',
                                        padding: '0.25rem'
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ** MỚI: Hiển thị thông tin phân trang ** */}
                    {filteredMovies.length > 0 && (
                        <div style={{
                            backgroundColor: '#374151',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.375rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ color: '#d1d5db', fontSize: '0.875rem' }}>
                                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredMovies.length)} của {filteredMovies.length} phim
                            </span>
                            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                Trang {currentPage} / {totalPages}
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {currentMovies.length === 0 && searchTerm ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem 2rem',
                                backgroundColor: '#374151',
                                borderRadius: '0.5rem',
                                color: '#9ca3af'
                            }}>
                                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Không tìm thấy phim nào.</p>
                                <p style={{ fontSize: '0.875rem' }}>Thử tìm kiếm với từ khóa khác.</p>
                            </div>
                        ) : (
                            currentMovies.map(movie => (
                                <div key={movie.id} style={{
                                    backgroundColor: '#374151',
                                    padding: '1rem',
                                    borderRadius: '0.375rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ position: 'relative' }}>
                                            <img
                                                src={movie.thumbnail}
                                                alt={movie.title}
                                                style={{
                                                    width: '6rem',
                                                    height: '9rem',
                                                    objectFit: 'cover',
                                                    borderRadius: '0.375rem'
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: '0.25rem',
                                                left: '0.25rem',
                                                backgroundColor: '#3b82f6',
                                                color: 'white',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold'
                                            }}>
                                                {movie.totalEpisodes} tập
                                            </div>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{movie.title}</h3>
                                            {/* Hiển thị Tên Khác/Từ khóa nếu có */}
                                            {movie.otherTitles && (
                                                <p style={{ color: '#60a5fa', fontSize: '0.875rem', fontStyle: 'italic', marginBottom: '0.25rem' }}>
                                                    Tên khác: {movie.otherTitles}
                                                </p>
                                            )}
                                            <p style={{ color: '#9ca3af', marginBottom: '0.25rem' }}>
                                                <strong>Định dạng:</strong> {movie.format || 'N/A'} •
                                                <strong> Thể loại:</strong> {Array.isArray(movie.category) ? movie.category.join(', ') : movie.category} • {movie.year} • {movie.totalEpisodes} tập
                                            </p>
                                            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: '1.4' }}>
                                                {movie.description?.substring(0, 150)}...
                                            </p>
                                            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                                ID: {movie.id}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => goToMovieDetail(movie.id)}
                                            style={{
                                                backgroundColor: '#0ea5e9',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.375rem',
                                                border: 'none',
                                                color: 'white',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            ✏️ Cập Nhật
                                        </button>
                                        <button
                                            onClick={() => openConfirmModal({
                                                title: `Xóa phim "${movie.title}"?`,
                                                message: 'Thao tác này sẽ xóa toàn bộ tập của phim này và không thể hoàn tác.',
                                                onConfirm: () => handleDeleteMovie(movie.id, movie.title)
                                            })}
                                            style={{
                                                backgroundColor: '#dc2626',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.375rem',
                                                border: 'none',
                                                color: 'white',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            🗑️ Xóa
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {movies.length === 0 && (
                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>
                                Chưa có phim nào. Hãy thêm phim đầu tiên!
                            </p>
                        )}
                    </div>

                    {/* ** MỚI: Hiển thị Pagination Controls ** */}
                    <PaginationControls />
                </div>
            </div>

            {/* Scroll to Top Button */}
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