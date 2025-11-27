'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { slugify } from '@/lib/utils';

const formatDateTimeInput = (value) => {
    if (!value) return '';
    const date = value.seconds ? new Date(value.seconds * 1000) : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const parseDateTimeInput = (value) => {
    if (!value) return new Date();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function MovieDetailPage({ params }) {
    const { id: movieId } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [movie, setMovie] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        thumbnail: '',
        category: '',
        year: new Date().getFullYear(),
        description: '',
        totalEpisodes: 1,
        createdAt: ''
    });
    const [episodes, setEpisodes] = useState([]);
    const [episodesLoading, setEpisodesLoading] = useState(false);
    const [newEpisode, setNewEpisode] = useState({
        episodeNumber: '',
        title: '',
        videoUrl: '',
        createdAt: ''
    });
    const [savingMovie, setSavingMovie] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: 'success', visible: false });
    const notificationTimer = useRef(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, loading: false });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/admin/login');
                return;
            }
            await loadMovie();
        });

        return () => {
            unsubscribe();
            if (notificationTimer.current) {
                clearTimeout(notificationTimer.current);
            }
        };
    }, [router, movieId]);

    const loadMovie = async () => {
        setLoading(true);
        try {
            const movieDoc = await getDoc(doc(db, 'movies', movieId));
            if (!movieDoc.exists()) {
                showNotification('Không tìm thấy phim!', 'error');
                router.push('/admin/dashboard');
                return;
            }
            const movieData = movieDoc.data();
            setMovie({ id: movieDoc.id, ...movieData });

            // Tự động tạo slug nếu phim cũ chưa có slug
            if (!movieData.slug && movieData.title) {
                const slug = slugify(movieData.title);
                await updateDoc(doc(db, 'movies', movieId), { slug });
            }

            setFormData({
                title: movieData.title || '',
                thumbnail: movieData.thumbnail || '',
                category: movieData.category || 'Anime',
                year: movieData.year || new Date().getFullYear(),
                description: movieData.description || '',
                totalEpisodes: movieData.totalEpisodes || 1,
                createdAt: formatDateTimeInput(movieData.createdAt)
            });
            await loadEpisodes();
        } catch (error) {
            console.error('Error loading movie:', error);
            showNotification('Không thể tải phim: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadEpisodes = async () => {
        setEpisodesLoading(true);
        try {
            const episodesQuery = query(collection(db, 'episodes'), where('movieId', '==', movieId));
            const snapshot = await getDocs(episodesQuery);
            const list = snapshot.docs.map((docSnapshot) => {
                const data = docSnapshot.data();
                return {
                    id: docSnapshot.id,
                    ...data,
                    createdAtInput: formatDateTimeInput(data.createdAt)
                };
            }).sort((a, b) => a.episodeNumber - b.episodeNumber);
            setEpisodes(list);
        } catch (error) {
            console.error('Error loading episodes:', error);
            showNotification('Không thể tải danh sách tập: ' + error.message, 'error');
        } finally {
            setEpisodesLoading(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        if (notificationTimer.current) clearTimeout(notificationTimer.current);
        setNotification({ message, type, visible: true });
        notificationTimer.current = setTimeout(() => {
            setNotification((prev) => ({ ...prev, visible: false }));
        }, 4000);
    };

    const hideNotification = () => {
        if (notificationTimer.current) {
            clearTimeout(notificationTimer.current);
            notificationTimer.current = null;
        }
        setNotification((prev) => ({ ...prev, visible: false }));
    };

    const openConfirmModal = ({ title, message, onConfirm }) => {
        setConfirmModal({ open: true, title, message, onConfirm, loading: false });
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

    const handleUpdateMovie = async (e) => {
        e.preventDefault();
        setSavingMovie(true);
        try {
            const slug = slugify(formData.title);
            await updateDoc(doc(db, 'movies', movieId), {
                title: formData.title,
                slug: slug, // Tự động tạo slug khi cập nhật
                thumbnail: formData.thumbnail,
                category: formData.category,
                year: parseInt(formData.year) || new Date().getFullYear(),
                description: formData.description,
                totalEpisodes: parseInt(formData.totalEpisodes) || 1,
                createdAt: parseDateTimeInput(formData.createdAt)
            });
            showNotification('Đã cập nhật thông tin phim!', 'success');
            await loadMovie();
        } catch (error) {
            console.error('Error updating movie:', error);
            showNotification('Không thể cập nhật phim: ' + error.message, 'error');
        } finally {
            setSavingMovie(false);
        }
    };

    const handleEpisodeFieldChange = (episodeId, field, value) => {
        setEpisodes((prev) =>
            prev.map((episode) => (episode.id === episodeId ? { ...episode, [field]: value } : episode))
        );
    };

    const handleSaveEpisode = async (episodeId) => {
        const episode = episodes.find((ep) => ep.id === episodeId);
        if (!episode) return;
        try {
            await updateDoc(doc(db, 'episodes', episodeId), {
                episodeNumber: parseInt(episode.episodeNumber) || 1,
                title: episode.title,
                videoUrl: episode.videoUrl,
                createdAt: parseDateTimeInput(episode.createdAtInput),
                movieId
            });
            showNotification(`Đã cập nhật ${episode.title || `tập ${episode.episodeNumber}`}!`, 'success');
            await loadEpisodes();
        } catch (error) {
            console.error('Error updating episode:', error);
            showNotification('Không thể cập nhật tập: ' + error.message, 'error');
        }
    };

    const handleDeleteEpisode = async (episodeId, episodeLabel) => {
        openConfirmModal({
            title: `Xóa ${episodeLabel}?`,
            message: 'Thao tác này không thể hoàn tác.',
            onConfirm: async () => {
                await deleteDoc(doc(db, 'episodes', episodeId));
                showNotification('Đã xóa tập!', 'success');
                await loadEpisodes();
            }
        });
    };

    const handleAddEpisode = async (e) => {
        e.preventDefault();
        if (!newEpisode.videoUrl.trim()) {
            showNotification('Vui lòng nhập link video!', 'error');
            return;
        }

        try {
            const parsedEpisodeNumber =
                parseInt(newEpisode.episodeNumber) || episodes.length + 1;

            // Thêm document tập mới
            await addDoc(collection(db, 'episodes'), {
                movieId,
                episodeNumber: parsedEpisodeNumber,
                title: newEpisode.title || `Tập ${newEpisode.episodeNumber || episodes.length + 1}`,
                videoUrl: newEpisode.videoUrl,
                createdAt: parseDateTimeInput(newEpisode.createdAt),
            });

            // Tính lại tổng số tập mới
            const currentTotal = Number(movie?.totalEpisodes || 0);
            const newTotalEpisodes = Math.max(
                currentTotal,
                parsedEpisodeNumber,
                episodes.length + 1
            );

            // Cập nhật field totalEpisodes của phim
            await updateDoc(doc(db, 'movies', movieId), {
                totalEpisodes: newTotalEpisodes,
            });

            // Cập nhật state local trong admin cho đúng ngay lập tức
            setMovie((prev) =>
                prev ? { ...prev, totalEpisodes: newTotalEpisodes } : prev
            );
            setFormData((prev) => ({
                ...prev,
                totalEpisodes: newTotalEpisodes,
            }));

            showNotification('Đã thêm tập mới!', 'success');
            setNewEpisode({
                episodeNumber: '',
                title: '',
                videoUrl: '',
                createdAt: '',
            });
            await loadEpisodes();
        } catch (error) {
            console.error('Error adding episode:', error);
            showNotification('Không thể thêm tập: ' + error.message, 'error');
        }
    };

    const handleNewEpisodeNumberChange = (value) => {
        setNewEpisode((prev) => {
            const episodeNumber = value;

            // Nếu tiêu đề đang rỗng hoặc đang ở dạng "Tập ..." thì tự động cập nhật
            let title = prev.title;
            if (!title || title.startsWith('Tập ')) {
                title = episodeNumber ? `Tập ${episodeNumber}` : '';
            }

            return {
                ...prev,
                episodeNumber,
                title,
            };
        });
    };

    const handleDeleteMovie = () => {
        openConfirmModal({
            title: `Xóa phim "${movie?.title}"?`,
            message: 'Tất cả tập thuộc phim này sẽ bị xóa vĩnh viễn.',
            onConfirm: async () => {
                const episodesQuery = query(collection(db, 'episodes'), where('movieId', '==', movieId));
                const episodesSnapshot = await getDocs(episodesQuery);
                for (const docSnapshot of episodesSnapshot.docs) {
                    await deleteDoc(docSnapshot.ref);
                }
                await deleteDoc(doc(db, 'movies', movieId));
                showNotification('Đã xóa phim!', 'success');
                router.push('/admin/dashboard');
            }
        });
    };

    if (loading || !movie) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '2rem', position: 'relative' }}>
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
                        <p style={{ color: '#cbd5f5', marginBottom: '1.5rem', lineHeight: 1.5 }}>{confirmModal.message}</p>
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

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <button
                        onClick={() => {
                            // Lưu flag để biết đang quay lại từ trang sửa
                            sessionStorage.setItem('returningFromEdit', 'true');
                            router.push('/admin/dashboard');
                        }}
                        style={{
                            backgroundColor: '#1d4ed8',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        ← Quay lại Dashboard
                    </button>
                    <button
                        onClick={handleDeleteMovie}
                        style={{
                            backgroundColor: '#dc2626',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        🗑️ Xóa phim này
                    </button>
                </div>

                <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>{movie.title}</h1>
                    <form onSubmit={handleUpdateMovie} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Tên phim</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Thumbnail</label>
                                <input
                                    type="url"
                                    value={formData.thumbnail}
                                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Thể loại</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Năm</label>
                                <input
                                    type="number"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Tổng tập</label>
                                <input
                                    type="number"
                                    value={formData.totalEpisodes}
                                    onChange={(e) => setFormData({ ...formData, totalEpisodes: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Created At</label>
                                <input
                                    type="datetime-local"
                                    value={formData.createdAt}
                                    onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>Mô tả</label>
                            <textarea
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={savingMovie}
                            style={{
                                width: '100%',
                                backgroundColor: savingMovie ? '#6b7280' : '#0ea5e9',
                                color: 'white',
                                fontWeight: 'bold',
                                padding: '0.75rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                cursor: savingMovie ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {savingMovie ? 'Đang lưu...' : '💾 Lưu thay đổi phim'}
                        </button>
                    </form>
                </div>

                <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>📺 Danh sách tập</h2>
                        <span style={{ color: '#94a3b8' }}>{episodes.length} tập</span>
                    </div>

                    {episodesLoading ? (
                        <p>Đang tải danh sách tập...</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {episodes.length === 0 && <p style={{ color: '#94a3b8' }}>Chưa có tập nào.</p>}
                            {episodes.map((episode) => (
                                <div key={episode.id} style={{ backgroundColor: '#111827', padding: '1rem', borderRadius: '0.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1.5fr 1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            value={episode.episodeNumber}
                                            onChange={(e) => handleNewEpisodeNumberChange(e.target.value)}
                                            placeholder="Số tập"
                                            style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                        />
                                        <input
                                            type="text"
                                            value={episode.title}
                                            onChange={(e) => handleEpisodeFieldChange(episode.id, 'title', e.target.value)}
                                            placeholder="Tiêu đề"
                                            style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                        />
                                        <input
                                            type="url"
                                            value={episode.videoUrl}
                                            onChange={(e) => handleEpisodeFieldChange(episode.id, 'videoUrl', e.target.value)}
                                            placeholder="Video URL"
                                            style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                        />
                                        <input
                                            type="datetime-local"
                                            value={episode.createdAtInput}
                                            onChange={(e) => handleEpisodeFieldChange(episode.id, 'createdAtInput', e.target.value)}
                                            style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleSaveEpisode(episode.id)}
                                                style={{ flex: 1, backgroundColor: '#16a34a', border: 'none', borderRadius: '0.375rem', color: 'white', padding: '0.5rem', cursor: 'pointer' }}
                                            >
                                                💾 Lưu
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEpisode(episode.id, episode.title || `Tập ${episode.episodeNumber}`)}
                                                style={{ flex: 1, backgroundColor: '#dc2626', border: 'none', borderRadius: '0.375rem', color: 'white', padding: '0.5rem', cursor: 'pointer' }}
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleAddEpisode} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>➕ Thêm tập mới</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                            <input
                                type="number"
                                value={newEpisode.episodeNumber}
                                onChange={(e) => handleNewEpisodeNumberChange(e.target.value)}
                                placeholder="Số tập"
                                style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: '1px solid #4b5563' }}
                            />
                            <input
                                type="text"
                                value={newEpisode.title}
                                onChange={(e) => setNewEpisode({ ...newEpisode, title: e.target.value })}
                                placeholder="Tiêu đề"
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
                            style={{
                                backgroundColor: '#2563eb',
                                color: 'white',
                                fontWeight: 'bold',
                                padding: '0.75rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            ➕ Thêm tập
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

