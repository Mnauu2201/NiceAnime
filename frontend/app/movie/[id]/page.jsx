// 'use client';
// import Image from 'next/image';
// import { useState, useEffect } from 'react';
// import { db } from '@/lib/firebase';
// import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
// import { useParams, useSearchParams } from 'next/navigation';
// import Link from 'next/link';

// export default function MovieDetail() {
//     const params = useParams();
//     const searchParams = useSearchParams();
//     const [movie, setMovie] = useState(null);
//     const [episodes, setEpisodes] = useState([]);
//     const [currentEpisode, setCurrentEpisode] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [loadingEpisodes, setLoadingEpisodes] = useState(true);
//     const [suggestedMovies, setSuggestedMovies] = useState([]);

//     useEffect(() => {
//         loadMovie();
//     }, []);

//     useEffect(() => {
//         if (movie) {
//             loadEpisodes();
//             loadSuggestedMovies();
//         }
//     }, [movie]);

//     useEffect(() => {
//         const ep = parseInt(searchParams.get('ep')) || 1;
//         if (episodes.length > 0) {
//             const episode = episodes.find(e => e.episodeNumber === ep);
//             setCurrentEpisode(episode || episodes[0]);
//         }
//     }, [searchParams, episodes]);

//     useEffect(() => {
//         if (movie?.title) {
//             document.title = `NiceAnime - ${movie.title}`;
//         } else {
//             document.title = "NiceAnime";
//         }
//     }, [movie]);

//     const loadMovie = async () => {
//         try {
//             const moviesQuery = query(
//                 collection(db, 'movies'),
//                 where('slug', '==', params.id)
//             );
//             const snapshot = await getDocs(moviesQuery);

//             if (!snapshot.empty) {
//                 const movieDoc = snapshot.docs[0];
//                 setMovie({ id: movieDoc.id, ...movieDoc.data() });
//             } else {
//                 const docRef = doc(db, 'movies', params.id);
//                 const docSnap = await getDoc(docRef);
//                 if (docSnap.exists()) {
//                     setMovie({ id: docSnap.id, ...docSnap.data() });
//                 }
//             }
//         } catch (error) {
//             console.error('Error loading movie:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const loadEpisodes = async () => {
//         try {
//             const episodesQuery = query(
//                 collection(db, 'episodes'),
//                 where('movieId', '==', movie.id),
//                 orderBy('episodeNumber', 'asc')
//             );

//             const querySnapshot = await getDocs(episodesQuery);
//             const episodesList = querySnapshot.docs.map(doc => ({
//                 id: doc.id,
//                 ...doc.data()
//             }));

//             setEpisodes(episodesList);

//             const ep = parseInt(searchParams.get('ep')) || 1;
//             const episode = episodesList.find(e => e.episodeNumber === ep);
//             setCurrentEpisode(episode || episodesList[0]);

//         } catch (error) {
//             console.error('Error loading episodes:', error);
//         } finally {
//             setLoadingEpisodes(false);
//         }
//     };

//     const loadSuggestedMovies = async () => {
//         if (!movie) return; // Đảm bảo dữ liệu phim đã được load
//         try {
//             // Chuẩn hóa category thành mảng để lọc
//             const categories = Array.isArray(movie.category)
//                 ? movie.category
//                 : (typeof movie.category === 'string'
//                     ? movie.category.split(',').map(c => c.trim()).filter(c => c)
//                     : []);

//             // Lọc theo thể loại đầu tiên hoặc 'Anime' nếu không có
//             const categoryFilter = categories.length > 0 ? categories[0] : 'Anime';

//             let moviesQuery;

//             if (categoryFilter) {
//                 // Sửa: Lọc bằng array-contains và sắp xếp theo createdAt
//                 // LƯU Ý: ĐÃ SỬA LẠI THÀNH array-contains VÀ CÓ orderBy ĐỂ SỬ DỤNG CHỈ MỤC BẠN VỪA TẠO
//                 moviesQuery = query(
//                     collection(db, 'movies'),
//                     where('category', 'array-contains', categoryFilter),
//                     orderBy('createdAt', 'desc'), // Cần thiết khi dùng where và limit
//                     limit(11) // Lấy 11 phim để sau khi loại bỏ phim hiện tại còn 10
//                 );
//             } else {
//                 moviesQuery = query(
//                     collection(db, 'movies'),
//                     orderBy('createdAt', 'desc'),
//                     limit(11)
//                 );
//             }

//             const snapshot = await getDocs(moviesQuery);
//             const moviesList = snapshot.docs
//                 .map(doc => ({
//                     id: doc.id,
//                     ...doc.data(),
//                     // Đảm bảo category ở đây cũng được định dạng lại thành chuỗi, cách nhau bởi ', '
//                     category: Array.isArray(doc.data().category) ? doc.data().category.join(', ') : doc.data().category
//                 }))
//                 .filter(m => m.id !== movie.id) // Loại bỏ phim hiện tại
//                 .sort((a, b) => {
//                     // Sort theo createdAt ở client side
//                     const timeA = a.createdAt?.seconds || 0;
//                     const timeB = b.createdAt?.seconds || 0;
//                     return timeB - timeA;
//                 })
//                 .slice(0, 10); // Giới hạn tối đa 10 phim

//             setSuggestedMovies(moviesList);
//         } catch (error) {
//             console.error('Error loading suggested movies:', error);
//         }
//     };

//     if (loading) {
//         return (
//             <div style={{
//                 minHeight: '100vh',
//                 backgroundColor: '#0f172a',
//                 color: 'white',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexDirection: 'column'
//             }}>
//                 <div style={{
//                     width: '50px',
//                     height: '50px',
//                     border: '4px solid #334155',
//                     borderTop: '4px solid #3b82f6',
//                     borderRadius: '50%',
//                     animation: 'spin 1s linear infinite'
//                 }}></div>
//                 <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>Đang tải phim...</p>
//                 <style jsx>{`
//           @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//           }
//         `}</style>
//             </div>
//         );
//     }

//     if (!movie) {
//         return (
//             <div style={{
//                 minHeight: '100vh',
//                 backgroundColor: '#0f172a',
//                 color: 'white',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexDirection: 'column'
//             }}>
//                 <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
//                 <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Oh no! Không tìm thấy phim!</h2>
//                 <Link
//                     href="/"
//                     style={{
//                         backgroundColor: '#3b82f6',
//                         padding: '0.75rem 2rem',
//                         borderRadius: '0.5rem',
//                         textDecoration: 'none',
//                         color: 'white',
//                         fontWeight: '600'
//                     }}
//                 >
//                     ← Quay về trang chủ
//                 </Link>
//             </div>
//         );
//     }

//     // Xử lý category cho tiêu đề và phần thông tin chính
//     const movieCategoryDisplay = Array.isArray(movie.category) ? movie.category.join(', ') : movie.category;


//     return (
//         <div style={{ minHeight: '100vh', backgroundColor: '#05060b', color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}>
//             <header style={{
//                 position: 'fixed',
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 zIndex: 50,
//                 background: 'linear-gradient(-90deg, rgba(5,6,11,0.95) 0%, rgba(59,7,100,0.95) 60%, rgba(190,24,93,0.95) 100%)',
//                 borderBottom: '1px solid rgba(255,255,255,0.08)',
//                 backdropFilter: 'blur(10px)',
//                 boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
//             }}>
//                 <div style={{
//                     maxWidth: '1300px',
//                     margin: '0 auto',
//                     padding: '0.35rem 1.5rem',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'space-between',
//                     minHeight: '72px'
//                 }}>
//                     <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
//                         <Image
//                             src="/NiceAnime-header.png"
//                             alt="NiceAnime Logo"
//                             width={600}
//                             height={180}
//                             priority
//                             style={{
//                                 height: '72px',
//                                 width: 'auto',
//                                 objectFit: 'contain',
//                                 marginTop: '-6px',
//                                 marginBottom: '-6px',
//                             }}
//                         />
//                     </Link>
//                     <div style={{ textAlign: 'right' }}>
//                         <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>Đang xem:</p>
//                         <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{movie.title}</p>
//                     </div>
//                 </div>
//             </header>

//             <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '7rem 1rem 2rem 1rem' }}>
//                 {/* Video Player */}
//                 <div style={{
//                     marginBottom: '2rem',
//                     backgroundColor: '#1e293b',
//                     borderRadius: '0.75rem',
//                     overflow: 'hidden',
//                     boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
//                 }}>
//                     {currentEpisode ? (
//                         <>
//                             <div style={{
//                                 position: 'relative',
//                                 paddingBottom: '56.25%',
//                                 height: 0,
//                                 overflow: 'hidden',
//                                 backgroundColor: '#000'
//                             }}>
//                                 <iframe
//                                     key={currentEpisode.episodeNumber}
//                                     src={currentEpisode.videoUrl}
//                                     style={{
//                                         position: 'absolute',
//                                         top: 0,
//                                         left: 0,
//                                         width: '100%',
//                                         height: '100%',
//                                         border: 'none'
//                                     }}
//                                     allowFullScreen
//                                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"

//                                     sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
//                                      referrerPolicy="no-referrer-when-downgrade"
//                                      loading="lazy"
//                                 />
//                             </div>

//                             <div style={{
//                                 padding: '1rem 1.5rem',
//                                 backgroundColor: '#334155',
//                                 display: 'flex',
//                                 justifyContent: 'space-between',
//                                 alignItems: 'center',
//                                 flexWrap: 'wrap',
//                                 gap: '1rem'
//                             }}>
//                                 <div>
//                                     <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
//                                         {currentEpisode.title}
//                                     </h2>
//                                     <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.875rem', color: '#cbd5e1' }}>
//                                         <span>📅 {movie.year}</span>
//                                         {/* Hiển thị category đã được định dạng */}
//                                         <span>🎭 {movieCategoryDisplay}</span>
//                                         <span>📺 Tập {currentEpisode.episodeNumber}/{movie.totalEpisodes}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </>
//                     ) : (
//                         <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
//                             {loadingEpisodes ? 'Đang tải tập phim...' : 'Không tìm thấy tập phim'}
//                         </div>
//                     )}
//                 </div>

//                 {/* Episodes List */}
//                 {episodes.length > 0 && (
//                     <div style={{
//                         backgroundColor: '#1e293b',
//                         borderRadius: '0.75rem',
//                         padding: '1.5rem',
//                         marginBottom: '2rem',
//                         boxShadow: '0 10px 15px rgba(0,0,0,0.3)'
//                     }}>
//                         <h3 style={{
//                             fontSize: '1.5rem',
//                             fontWeight: 'bold',
//                             marginBottom: '1rem',
//                             color: '#60a5fa',
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '0.5rem'
//                         }}>
//                             📺 Danh sách tập Vietsub ({episodes.length} tập)
//                         </h3>

//                         <div style={{
//                             display: 'grid',
//                             gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
//                             gap: '0.75rem',
//                             maxHeight: '400px',
//                             overflowY: 'auto',
//                             padding: '0.5rem'
//                         }}>
//                             {episodes.map((episode) => {
//                                 const isCurrent = currentEpisode?.episodeNumber === episode.episodeNumber;
//                                 return (
//                                     <Link
//                                         key={episode.id}
//                                         href={`/movie/${movie.slug || movie.id}?ep=${episode.episodeNumber}`}
//                                         onClick={() => setCurrentEpisode(episode)}
//                                         style={{
//                                             backgroundColor: isCurrent ? '#3b82f6' : '#334155',
//                                             color: 'white',
//                                             padding: '0.75rem',
//                                             borderRadius: '0.5rem',
//                                             textAlign: 'center',
//                                             textDecoration: 'none',
//                                             fontWeight: isCurrent ? 'bold' : '600',
//                                             fontSize: '0.875rem',
//                                             transition: 'all 0.3s',
//                                             border: isCurrent ? '2px solid #60a5fa' : '2px solid transparent',
//                                             cursor: 'pointer',
//                                             display: 'block'
//                                         }}
//                                         onMouseEnter={(e) => {
//                                             if (!isCurrent) {
//                                                 e.currentTarget.style.backgroundColor = '#475569';
//                                             }
//                                         }}
//                                         onMouseLeave={(e) => {
//                                             if (!isCurrent) {
//                                                 e.currentTarget.style.backgroundColor = '#334155';
//                                             }
//                                         }}
//                                     >
//                                         {episode.episodeNumber}
//                                     </Link>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 )}

//                 {/* Movie Info */}
//                 <div style={{
//                     display: 'grid',
//                     gridTemplateColumns: '300px 1fr',
//                     gap: '2rem',
//                     marginBottom: '3rem'
//                 }}>
//                     <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 3' }}>
//                         <Image
//                             src={movie.thumbnail}
//                             alt={movie.title}
//                             fill
//                             sizes="(max-width: 768px) 100vw, 300px"
//                             style={{
//                                 objectFit: 'cover',
//                                 borderRadius: '0.75rem',
//                                 boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
//                             }}
//                             unoptimized
//                         />
//                     </div>

//                     <div>
//                         <h1 style={{
//                             fontSize: '2.5rem',
//                             fontWeight: 'bold',
//                             marginBottom: '1.5rem',
//                             background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
//                             WebkitBackgroundClip: 'text',
//                             WebkitTextFillColor: 'transparent'
//                         }}>
//                             {movie.title}
//                         </h1>

//                         <div style={{
//                             display: 'flex',
//                             gap: '0.75rem',
//                             marginBottom: '2rem',
//                             flexWrap: 'wrap'
//                         }}>
//                             {/* Xử lý hiển thị category riêng biệt */}
//                             {
//                                 // Chuyển category thành mảng nếu là chuỗi, sau đó map ra các span riêng
//                                 (Array.isArray(movie.category)
//                                     ? movie.category
//                                     : (typeof movie.category === 'string'
//                                         ? movie.category.split(',').map(c => c.trim())
//                                         : []))
//                                     .filter(c => c) // Lọc bỏ các giá trị rỗng
//                                     .map((categoryItem, index) => (
//                                         <span
//                                             key={index}
//                                             style={{
//                                                 backgroundColor: '#4c1d95', // Màu tím đậm hơn
//                                                 padding: '0.5rem 1rem',
//                                                 borderRadius: '9999px',
//                                                 fontSize: '0.875rem',
//                                                 fontWeight: '600',
//                                                 whiteSpace: 'nowrap'
//                                             }}
//                                         >
//                                             {categoryItem}
//                                         </span>
//                                     ))
//                             }

//                             <span style={{
//                                 backgroundColor: '#166534',
//                                 padding: '0.5rem 1rem',
//                                 borderRadius: '9999px',
//                                 fontSize: '0.875rem',
//                                 fontWeight: '600'
//                             }}>
//                                 {movie.year}
//                             </span>
//                             <span style={{
//                                 backgroundColor: '#7c2d12',
//                                 padding: '0.5rem 1rem',
//                                 borderRadius: '9999px',
//                                 fontSize: '0.875rem',
//                                 fontWeight: '600'
//                             }}>
//                                 {movie.totalEpisodes} tập
//                             </span>
//                         </div>

//                         <div style={{
//                             backgroundColor: '#1e293b',
//                             padding: '1.5rem',
//                             borderRadius: '0.75rem',
//                             marginBottom: '1.5rem'
//                         }}>
//                             <h3 style={{
//                                 fontSize: '1.25rem',
//                                 fontWeight: 'bold',
//                                 marginBottom: '1rem',
//                                 color: '#60a5fa'
//                             }}>
//                                 📖 Nội dung phim
//                             </h3>
//                             <p style={{
//                                 color: '#cbd5e1',
//                                 lineHeight: '1.75'
//                             }}>
//                                 {movie.description || 'Chưa có mô tả cho phim này.'}
//                             </p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Suggested Movies */}
//                 {suggestedMovies.length > 0 && (
//                     <div style={{ marginBottom: '3rem' }}>
//                         <h2 style={{
//                             fontSize: '1.75rem',
//                             fontWeight: '700',
//                             marginBottom: '1.5rem',
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '0.5rem'
//                         }}>
//                             🎬 Phim cùng thể loại: {movieCategoryDisplay}
//                         </h2>

//                         <div style={{
//                             display: 'grid',
//                             gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
//                             gap: '1.5rem'
//                         }}>
//                             {suggestedMovies.map(suggestedMovie => {

//                                 // ** [LOGIC ĐÃ SỬA LẠI HOÀN TOÀN] Tính toán 2 trạng thái **
//                                 const totalEpisodes = suggestedMovie.totalEpisodes || 1;
//                                 const currentEpisodeCount = suggestedMovie.episodes?.length || 1;
//                                 // Kiểm tra nếu tổng tập lớn hơn 1 hoặc bằng '??' (chưa rõ) thì là Phim Bộ
//                                 const isMovieSeries = totalEpisodes > 1 || suggestedMovie.totalEpisodes === '??';

//                                 // 1. Logic góc trái (Trạng thái tập: 11/11 hoặc X/Y)
//                                 let episodeStatusText;
//                                 let episodeStatusColor = '#3b82f6'; // Mặc định xanh dương

//                                 if (isMovieSeries) {
//                                     // Phim Bộ:
//                                     // totalEpisodes là một chuỗi '??' hoặc số tập hiện có nhỏ hơn tổng tập đã đặt
//                                     if (suggestedMovie.totalEpisodes === '??' || currentEpisodeCount < totalEpisodes) {
//                                         episodeStatusText = `${currentEpisodeCount}/${totalEpisodes}`;
//                                         episodeStatusColor = '#f59e0b'; // Màu vàng cho trạng thái Đang cập nhật
//                                     } else {
//                                         // Đã hoàn thành (currentEpisodeCount >= totalEpisodes): Hiển thị TỔNG SỐ TẬP / TỔNG SỐ TẬP
//                                         episodeStatusText = `${totalEpisodes}/${totalEpisodes}`; // Ví dụ: 200/200
//                                         episodeStatusColor = '#10b981'; // Màu xanh lá cho trạng thái Hoàn thành
//                                     }
//                                 } else {
//                                     // Phim Lẻ: Hiển thị 1/1
//                                     episodeStatusText = '1/1';
//                                     episodeStatusColor = '#ef4444'; // Màu đỏ cho Phim Lẻ
//                                 }

//                                 // 2. Logic góc phải (Loại phim: Phim Lẻ/Bộ)
//                                 let typeStatusText = isMovieSeries ? 'Phim Bộ' : 'Phim Lẻ';
//                                 let typeStatusColor = isMovieSeries ? '#3b82f6' : '#ef4444'; // Xanh dương cho Bộ, Đỏ cho Lẻ
//                                 // ** [KẾT THÚC LOGIC ĐÃ SỬA LẠI HOÀN TOÀN] **

//                                 return (
//                                     <Link
//                                         href={`/movie/${suggestedMovie.slug || suggestedMovie.id}`}
//                                         key={suggestedMovie.id}
//                                         style={{ textDecoration: 'none', color: 'white' }}
//                                     >
//                                         <div style={{
//                                             position: 'relative',
//                                             overflow: 'hidden',
//                                             borderRadius: '1rem',
//                                             boxShadow: '0 15px 25px rgba(0,0,0,0.45)',
//                                             cursor: 'pointer',
//                                             transition: 'transform 0.3s, boxShadow 0.3s',
//                                             backgroundColor: '#0f172a',
//                                             minHeight: '360px'
//                                         }}
//                                             onMouseEnter={(e) => {
//                                                 e.currentTarget.style.transform = 'translateY(-8px)';
//                                                 e.currentTarget.style.boxShadow = '0 25px 35px rgba(59, 130, 246, 0.35)';
//                                             }}
//                                             onMouseLeave={(e) => {
//                                                 e.currentTarget.style.transform = 'translateY(0)';
//                                                 e.currentTarget.style.boxShadow = '0 15px 25px rgba(0,0,0,0.45)';
//                                             }}
//                                         >
//                                             <div style={{ position: 'relative', width: '100%', height: '320px' }}>
//                                                 <Image
//                                                     src={suggestedMovie.thumbnail}
//                                                     alt={suggestedMovie.title}
//                                                     fill
//                                                     sizes="(max-width: 768px) 100vw, 240px"
//                                                     style={{ objectFit: 'cover' }}
//                                                     unoptimized
//                                                 />
//                                             </div>

//                                             {/* ** GÓC TRÊN BÊN TRÁI: Trạng thái tập (11/11, 1/1, 1/200) ** */}
//                                             <div style={{
//                                                 position: 'absolute',
//                                                 top: '0.75rem',
//                                                 left: '0.75rem',
//                                                 backgroundColor: episodeStatusColor, // Màu động (Xanh lá, Vàng, Đỏ)
//                                                 color: 'white',
//                                                 padding: '0.35rem 0.75rem',
//                                                 borderRadius: '999px',
//                                                 fontSize: '0.85rem',
//                                                 fontWeight: 'bold',
//                                                 boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
//                                                 zIndex: 5
//                                             }}>
//                                                 {episodeStatusText}
//                                             </div>

//                                             {/* ** GÓC TRÊN BÊN PHẢI: Loại Phim (Phim Lẻ/Bộ) ** */}
//                                             <div style={{
//                                                 position: 'absolute',
//                                                 top: '0.75rem',
//                                                 right: '0.75rem',
//                                                 backgroundColor: typeStatusColor, // Xanh dương hoặc Đỏ
//                                                 color: 'white',
//                                                 padding: '0.35rem 0.75rem',
//                                                 borderRadius: '999px',
//                                                 fontSize: '0.85rem',
//                                                 fontWeight: 'bold',
//                                                 boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
//                                                 zIndex: 5
//                                             }}>
//                                                 {typeStatusText}
//                                             </div>
//                                             {/* ** KẾT THÚC CÁC THẺ TRẠNG THÁI ** */}

//                                             <div style={{
//                                                 position: 'absolute',
//                                                 inset: 0,
//                                                 background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)'
//                                             }} />
//                                             <div style={{
//                                                 position: 'absolute',
//                                                 bottom: '0.75rem',
//                                                 left: '0.75rem',
//                                                 right: '0.75rem'
//                                             }}>
//                                                 <h3 style={{
//                                                     fontWeight: '700',
//                                                     fontSize: '1.1rem',
//                                                     marginBottom: '0.35rem',
//                                                     lineHeight: 1.4
//                                                 }}>
//                                                     {suggestedMovie.title}
//                                                 </h3>
//                                                 <div style={{
//                                                     display: 'flex',
//                                                     alignItems: 'center',
//                                                     gap: '0.5rem',
//                                                     fontSize: '0.85rem',
//                                                     color: '#cbd5e1',
//                                                     flexWrap: 'wrap'
//                                                 }}>
//                                                     <span>📅 {suggestedMovie.year}</span>
//                                                     <span></span>
//                                                     <span>🎭 {suggestedMovie.category}</span>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </Link>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 )}
//             </main>

//             {/* Footer */}
//             <footer style={{
//                 backgroundColor: '#0a0d16',
//                 borderTop: '1px solid #1e293b',
//                 padding: '3rem 1.5rem 2rem',
//             }}>
//                 <div style={{
//                     maxWidth: '1300px',
//                     margin: '0 auto',
//                 }}>
//                     <div style={{
//                         display: 'grid',
//                         // Thay đổi cấu trúc lưới để chứa 5 cột (hoặc 4 cột nếu cần)
//                         gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
//                         gap: '3rem',
//                         marginBottom: '3rem',
//                     }}>
//                         <div>
//                             <div style={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '0.5rem',
//                                 marginBottom: '1rem'
//                             }}>
//                                 <Image
//                                     src="/NiceAnime-header.png"
//                                     alt="NiceAnime Logo"
//                                     width={120}
//                                     height={36}
//                                     style={{ height: '36px', width: 'auto' }}
//                                 />
//                             </div>
//                             <p style={{
//                                 color: '#94a3b8',
//                                 fontSize: '0.9rem',
//                                 lineHeight: '1.6',
//                                 marginBottom: '1rem'
//                             }}>
//                                 NiceAnime là nền tảng xem phim anime miễn phí hàng đầu, nơi bạn có thể khám phá hàng ngàn bộ phim với phụ đề Vietsub chất lượng cao được cập nhật liên tục mỗi ngày.
//                             </p>
//                         </div>

//                         <div>
//                             <h3 style={{
//                                 color: 'white',
//                                 fontSize: '1.1rem',
//                                 fontWeight: '700',
//                                 marginBottom: '1rem'
//                             }}>
//                                 Danh Mục
//                             </h3>
//                             <ul style={{
//                                 listStyle: 'none',
//                                 padding: 0,
//                                 margin: 0,
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 gap: '0.75rem'
//                             }}>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Anime Mới (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Anime Hay (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Anime Vietsub (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Phim Kinh Dị (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Anime HD (Đang Cập Nhật)</a></li>
//                             </ul>
//                         </div>

//                         <div>
//                             <h3 style={{
//                                 color: 'white',
//                                 fontSize: '1.1rem',
//                                 fontWeight: '700',
//                                 marginBottom: '1rem'
//                             }}>
//                                 Thể Loại
//                             </h3>
//                             <ul style={{
//                                 listStyle: 'none',
//                                 padding: 0,
//                                 margin: 0,
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 gap: '0.75rem'
//                             }}>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Hành Động (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Phiêu Lưu (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Hài Hước (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Lãng Mạn (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Học Đường (Đang Cập Nhật)</a></li>
//                             </ul>
//                         </div>

//                         <div>
//                             <h3 style={{
//                                 color: 'white',
//                                 fontSize: '1.1rem',
//                                 fontWeight: '700',
//                                 marginBottom: '1rem'
//                             }}>
//                                 Hỗ Trợ
//                             </h3>
//                             <ul style={{
//                                 listStyle: 'none',
//                                 padding: 0,
//                                 margin: 0,
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 gap: '0.75rem'
//                             }}>
//                                 <li><a href="/support/privacy" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Chính sách bảo mật</a></li>
//                                 <li><a href="/support/terms" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Điều khoản sử dụng</a></li>
//                                 <li><a href="/support/about" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Giới thiệu</a></li>
//                                 <li><a href="/support/contact" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Liên hệ</a></li>
//                             </ul>
//                         </div>

//                         {/* ** [THÊM MỚI] Cột Hợp Tác ** */}
//                         <div>
//                             <h3 style={{
//                                 color: 'white',
//                                 fontSize: '1.1rem',
//                                 fontWeight: '700',
//                                 marginBottom: '1rem'
//                             }}>
//                                 Nguồn
//                             </h3>
//                             <ul style={{
//                                 listStyle: 'none',
//                                 padding: 0,
//                                 margin: 0,
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 gap: '0.75rem'
//                             }}>
//                                 <li><a href="https://phim.nguonc.com/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>https://phim.nguonc.com/</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}></a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}></a></li>
//                             </ul>
//                         </div>
//                         {/* ** [KẾT THÚC THÊM MỚI] ** */}
//                     </div>

//                     <div style={{
//                         paddingTop: '2rem',
//                         borderTop: '1px solid #1e293b',
//                         textAlign: 'center'
//                     }}>
//                         <p style={{
//                             color: '#64748b',
//                             fontSize: '0.9rem',
//                             marginBottom: '0.5rem'
//                         }}>
//                             Copyright © {new Date().getFullYear()} by NiceAnime - All rights reserved.
//                         </p>
//                         <p style={{
//                             color: '#475569',
//                             fontSize: '0.85rem'
//                         }}>
//                             Website made by Nguyen Quang Anh
//                         </p>
//                     </div>
//                 </div>
//             </footer>
//         </div>
//     );
// }







// 'use client';
// import Image from 'next/image';
// import { useState, useEffect, useMemo, useCallback } from 'react';
// import { db } from '@/lib/firebase';
// import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
// import { useParams, useSearchParams } from 'next/navigation';
// import Link from 'next/link';

// export default function MovieDetail() {
//     const params = useParams();
//     const searchParams = useSearchParams();
//     const [movie, setMovie] = useState(null);
//     const [episodes, setEpisodes] = useState([]);
//     const [currentEpisode, setCurrentEpisode] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [loadingEpisodes, setLoadingEpisodes] = useState(true);
//     const [suggestedMovies, setSuggestedMovies] = useState([]);
//     const [isChangingEpisode, setIsChangingEpisode] = useState(false);

//     // Load movie data
//     useEffect(() => {
//         loadMovie();
//     }, []);

//     // Load episodes when movie is loaded
//     useEffect(() => {
//         if (movie) {
//             loadEpisodes();
//         }
//     }, [movie]);

//     // Handle episode change from URL
//     useEffect(() => {
//         const ep = parseInt(searchParams.get('ep')) || 1;
//         if (episodes.length > 0) {
//             const episode = episodes.find(e => e.episodeNumber === ep);
//             setCurrentEpisode(episode || episodes[0]);
//         }
//     }, [searchParams, episodes]);

//     // Update page title and meta tags
//     useEffect(() => {
//         if (movie?.title) {
//             const pageTitle = `${movie.title} - Xem phim ${movie.title} Vietsub HD | NiceAnime`;
//             document.title = pageTitle;

//             // Update meta description
//             const metaDescription = document.querySelector('meta[name="description"]');
//             if (metaDescription) {
//                 const description = movie.description
//                     ? `Xem phim ${movie.title} (${movie.year}) Vietsub HD miễn phí. ${movie.description.substring(0, 150)}...`
//                     : `Xem phim ${movie.title} (${movie.year}) Vietsub HD miễn phí trên NiceAnime`;
//                 metaDescription.setAttribute('content', description);
//             } else {
//                 const newMeta = document.createElement('meta');
//                 newMeta.name = 'description';
//                 newMeta.content = `Xem phim ${movie.title} (${movie.year}) Vietsub HD miễn phí trên NiceAnime`;
//                 document.head.appendChild(newMeta);
//             }

//             // Update Open Graph tags
//             updateOrCreateMetaTag('property', 'og:title', movie.title);
//             updateOrCreateMetaTag('property', 'og:description', movie.description?.substring(0, 200) || `Xem ${movie.title} Vietsub HD`);
//             updateOrCreateMetaTag('property', 'og:image', movie.thumbnail);
//             updateOrCreateMetaTag('property', 'og:type', 'video.movie');

//             // Twitter Card
//             updateOrCreateMetaTag('name', 'twitter:card', 'summary_large_image');
//             updateOrCreateMetaTag('name', 'twitter:title', movie.title);
//             updateOrCreateMetaTag('name', 'twitter:image', movie.thumbnail);
//         } else {
//             document.title = "NiceAnime - Xem Anime Vietsub HD miễn phí";
//         }
//     }, [movie]);

//     // Lazy load suggested movies with Intersection Observer
//     useEffect(() => {
//         if (!movie) return;

//         const observer = new IntersectionObserver(
//             (entries) => {
//                 if (entries[0].isIntersecting && suggestedMovies.length === 0) {
//                     loadSuggestedMovies();
//                 }
//             },
//             { threshold: 0.1, rootMargin: '100px' }
//         );

//         const suggestedSection = document.getElementById('suggested-movies');
//         if (suggestedSection) {
//             observer.observe(suggestedSection);
//         }

//         return () => observer.disconnect();
//     }, [movie, suggestedMovies.length]);

//     // Helper function to update or create meta tags
//     const updateOrCreateMetaTag = (attrName, attrValue, content) => {
//         let metaTag = document.querySelector(`meta[${attrName}="${attrValue}"]`);
//         if (metaTag) {
//             metaTag.setAttribute('content', content);
//         } else {
//             metaTag = document.createElement('meta');
//             metaTag.setAttribute(attrName, attrValue);
//             metaTag.setAttribute('content', content);
//             document.head.appendChild(metaTag);
//         }
//     };

//     const loadMovie = async () => {
//         try {
//             const moviesQuery = query(
//                 collection(db, 'movies'),
//                 where('slug', '==', params.id)
//             );
//             const snapshot = await getDocs(moviesQuery);

//             if (!snapshot.empty) {
//                 const movieDoc = snapshot.docs[0];
//                 setMovie({ id: movieDoc.id, ...movieDoc.data() });
//             } else {
//                 const docRef = doc(db, 'movies', params.id);
//                 const docSnap = await getDoc(docRef);
//                 if (docSnap.exists()) {
//                     setMovie({ id: docSnap.id, ...docSnap.data() });
//                 }
//             }
//         } catch (error) {
//             console.error('Error loading movie:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const loadEpisodes = async () => {
//         try {
//             const episodesQuery = query(
//                 collection(db, 'episodes'),
//                 where('movieId', '==', movie.id),
//                 orderBy('episodeNumber', 'asc')
//             );

//             const querySnapshot = await getDocs(episodesQuery);
//             const episodesList = querySnapshot.docs.map(doc => ({
//                 id: doc.id,
//                 episodeNumber: doc.data().episodeNumber,
//                 title: doc.data().title,
//                 videoUrl: doc.data().videoUrl
//             }));

//             setEpisodes(episodesList);

//             const ep = parseInt(searchParams.get('ep')) || 1;
//             const episode = episodesList.find(e => e.episodeNumber === ep);
//             setCurrentEpisode(episode || episodesList[0]);

//         } catch (error) {
//             console.error('Error loading episodes:', error);
//         } finally {
//             setLoadingEpisodes(false);
//         }
//     };

//     const loadSuggestedMovies = async () => {
//         if (!movie) return;
//         try {
//             const categories = Array.isArray(movie.category)
//                 ? movie.category
//                 : (typeof movie.category === 'string'
//                     ? movie.category.split(',').map(c => c.trim()).filter(c => c)
//                     : []);

//             const categoryFilter = categories.length > 0 ? categories[0] : 'Anime';

//             const moviesQuery = query(
//                 collection(db, 'movies'),
//                 where('category', 'array-contains', categoryFilter),
//                 orderBy('createdAt', 'desc'),
//                 limit(11)
//             );

//             const snapshot = await getDocs(moviesQuery);

//             // Optimize: Only get necessary fields and process once
//             const moviesList = snapshot.docs
//                 .map(doc => {
//                     const data = doc.data();
//                     return {
//                         id: doc.id,
//                         title: data.title,
//                         thumbnail: data.thumbnail,
//                         slug: data.slug,
//                         year: data.year,
//                         totalEpisodes: data.totalEpisodes,
//                         category: Array.isArray(data.category)
//                             ? data.category.join(', ')
//                             : data.category,
//                         episodes: data.episodes || [],
//                         createdAt: data.createdAt
//                     };
//                 })
//                 .filter(m => m.id !== movie.id)
//                 .slice(0, 10);

//             setSuggestedMovies(moviesList);
//         } catch (error) {
//             console.error('Error loading suggested movies:', error);
//         }
//     };

//     // Debounced episode change handler
//     const handleEpisodeChange = useCallback((episode) => {
//         if (isChangingEpisode) return;
//         setIsChangingEpisode(true);
//         setCurrentEpisode(episode);
//         setTimeout(() => setIsChangingEpisode(false), 500);
//     }, [isChangingEpisode]);

//     // Memoize category display
//     const movieCategoryDisplay = useMemo(() =>
//         Array.isArray(movie?.category)
//             ? movie.category.join(', ')
//             : movie?.category || '',
//         [movie?.category]
//     );

//     // Memoize category array for badges
//     const categoryArray = useMemo(() => {
//         if (!movie?.category) return [];
//         return Array.isArray(movie.category)
//             ? movie.category
//             : movie.category.split(',').map(c => c.trim()).filter(c => c);
//     }, [movie?.category]);

//     // Schema markup for SEO
//     const schemaMarkup = useMemo(() => {
//         if (!movie) return null;
//         return {
//             "@context": "https://schema.org",
//             "@type": "Movie",
//             "name": movie.title,
//             "image": movie.thumbnail,
//             "dateCreated": movie.year,
//             "description": movie.description,
//             "genre": movieCategoryDisplay,
//             "numberOfEpisodes": movie.totalEpisodes
//         };
//     }, [movie, movieCategoryDisplay]);

//     if (loading) {
//         return (
//             <div style={{
//                 minHeight: '100vh',
//                 backgroundColor: '#0f172a',
//                 color: 'white',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexDirection: 'column'
//             }}>
//                 <div style={{
//                     width: '50px',
//                     height: '50px',
//                     border: '4px solid #334155',
//                     borderTop: '4px solid #3b82f6',
//                     borderRadius: '50%',
//                     animation: 'spin 1s linear infinite'
//                 }}></div>
//                 <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>Đang tải phim...</p>
//                 <style jsx>{`
//                     @keyframes spin {
//                         0% { transform: rotate(0deg); }
//                         100% { transform: rotate(360deg); }
//                     }
//                 `}</style>
//             </div>
//         );
//     }

//     if (!movie) {
//         return (
//             <div style={{
//                 minHeight: '100vh',
//                 backgroundColor: '#0f172a',
//                 color: 'white',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexDirection: 'column'
//             }}>
//                 <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
//                 <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Oh no! Không tìm thấy phim!</h2>
//                 <Link
//                     href="/"
//                     style={{
//                         backgroundColor: '#3b82f6',
//                         padding: '0.75rem 2rem',
//                         borderRadius: '0.5rem',
//                         textDecoration: 'none',
//                         color: 'white',
//                         fontWeight: '600'
//                     }}
//                 >
//                     ← Quay về trang chủ
//                 </Link>
//             </div>
//         );
//     }

//     return (
//         <div style={{ minHeight: '100vh', backgroundColor: '#05060b', color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}>
//             {/* Schema Markup for SEO */}
//             {schemaMarkup && (
//                 <script
//                     type="application/ld+json"
//                     dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
//                 />
//             )}

//             <header style={{
//                 position: 'fixed',
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 zIndex: 50,
//                 background: 'linear-gradient(-90deg, rgba(5,6,11,0.95) 0%, rgba(59,7,100,0.95) 60%, rgba(190,24,93,0.95) 100%)',
//                 borderBottom: '1px solid rgba(255,255,255,0.08)',
//                 backdropFilter: 'blur(10px)',
//                 boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
//             }}>
//                 <div style={{
//                     maxWidth: '1300px',
//                     margin: '0 auto',
//                     padding: '0.35rem 1.5rem',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'space-between',
//                     minHeight: '72px'
//                 }}>
//                     <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
//                         <Image
//                             src="/NiceAnime-header.png"
//                             alt="NiceAnime - Xem Anime Vietsub HD"
//                             width={240}
//                             height={72}
//                             priority
//                             style={{
//                                 height: '72px',
//                                 width: 'auto',
//                                 objectFit: 'contain',
//                                 marginTop: '-6px',
//                                 marginBottom: '-6px',
//                             }}
//                         />
//                     </Link>
//                     <div style={{ textAlign: 'right' }}>
//                         <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>Đang xem:</p>
//                         <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{movie.title}</p>
//                     </div>
//                 </div>
//             </header>

//             <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '7rem 1rem 2rem 1rem' }}>
//                 {/* Video Player */}
//                 <div style={{
//                     marginBottom: '2rem',
//                     backgroundColor: '#1e293b',
//                     borderRadius: '0.75rem',
//                     overflow: 'hidden',
//                     boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
//                 }}>
//                     {currentEpisode ? (
//                         <>
//                             <div style={{
//                                 position: 'relative',
//                                 paddingBottom: '56.25%',
//                                 height: 0,
//                                 overflow: 'hidden',
//                                 backgroundColor: '#000'
//                             }}>

//                                 <iframe
//                                     key={currentEpisode.episodeNumber}
//                                     src={currentEpisode.videoUrl}
//                                     style={{
//                                         position: 'absolute',
//                                         top: 0,
//                                         left: 0,
//                                         width: '100%',
//                                         height: '100%',
//                                         border: 'none'
//                                     }}
//                                     allowFullScreen
//                                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"

//                                     sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
//                                     referrerPolicy="no-referrer-when-downgrade"
//                                     loading="lazy"

//                                     title={`${movie.title} - Tập ${currentEpisode.episodeNumber}`}
//                                 />
//                             </div>

//                             <div style={{
//                                 padding: '1rem 1.5rem',
//                                 backgroundColor: '#334155',
//                                 display: 'flex',
//                                 justifyContent: 'space-between',
//                                 alignItems: 'center',
//                                 flexWrap: 'wrap',
//                                 gap: '1rem'
//                             }}>
//                                 <div>
//                                     <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', margin: 0 }}>
//                                         {currentEpisode.title}
//                                     </h1>
//                                     <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.875rem', color: '#cbd5e1' }}>
//                                         <span>📅 {movie.year}</span>
//                                         <span>🎭 {movieCategoryDisplay}</span>
//                                         <span>📺 Tập {currentEpisode.episodeNumber}/{movie.totalEpisodes}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </>
//                     ) : (
//                         <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
//                             {loadingEpisodes ? (
//                                 <>
//                                     <div style={{
//                                         width: '40px',
//                                         height: '40px',
//                                         border: '4px solid #334155',
//                                         borderTop: '4px solid #3b82f6',
//                                         borderRadius: '50%',
//                                         animation: 'spin 1s linear infinite',
//                                         margin: '0 auto 1rem'
//                                     }}></div>
//                                     <p>Đang tải tập phim...</p>
//                                 </>
//                             ) : 'Không tìm thấy tập phim'}
//                         </div>
//                     )}
//                 </div>

//                 {/* Episodes List */}
//                 {episodes.length > 0 && (
//                     <div style={{
//                         backgroundColor: '#1e293b',
//                         borderRadius: '0.75rem',
//                         padding: '1.5rem',
//                         marginBottom: '2rem',
//                         boxShadow: '0 10px 15px rgba(0,0,0,0.3)'
//                     }}>
//                         <h2 style={{
//                             fontSize: '1.5rem',
//                             fontWeight: 'bold',
//                             marginBottom: '1rem',
//                             color: '#60a5fa',
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '0.5rem',
//                             margin: '0 0 1rem 0'
//                         }}>
//                             📺 Danh sách tập Vietsub ({episodes.length} tập)
//                         </h2>

//                         <div style={{
//                             display: 'grid',
//                             gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
//                             gap: '0.75rem',
//                             maxHeight: '400px',
//                             overflowY: 'auto',
//                             padding: '0.5rem'
//                         }}>
//                             {episodes.map((episode) => {
//                                 const isCurrent = currentEpisode?.episodeNumber === episode.episodeNumber;
//                                 return (
//                                     <Link
//                                         key={episode.id}
//                                         href={`/movie/${movie.slug || movie.id}?ep=${episode.episodeNumber}`}
//                                         onClick={(e) => {
//                                             e.preventDefault();
//                                             handleEpisodeChange(episode);
//                                             window.history.pushState(null, '', `?ep=${episode.episodeNumber}`);
//                                         }}
//                                         style={{
//                                             backgroundColor: isCurrent ? '#3b82f6' : '#334155',
//                                             color: 'white',
//                                             padding: '0.75rem',
//                                             borderRadius: '0.5rem',
//                                             textAlign: 'center',
//                                             textDecoration: 'none',
//                                             fontWeight: isCurrent ? 'bold' : '600',
//                                             fontSize: '0.875rem',
//                                             transition: 'all 0.3s',
//                                             border: isCurrent ? '2px solid #60a5fa' : '2px solid transparent',
//                                             cursor: isChangingEpisode ? 'wait' : 'pointer',
//                                             opacity: isChangingEpisode ? 0.6 : 1,
//                                             display: 'block'
//                                         }}
//                                         onMouseEnter={(e) => {
//                                             if (!isCurrent && !isChangingEpisode) {
//                                                 e.currentTarget.style.backgroundColor = '#475569';
//                                             }
//                                         }}
//                                         onMouseLeave={(e) => {
//                                             if (!isCurrent) {
//                                                 e.currentTarget.style.backgroundColor = '#334155';
//                                             }
//                                         }}
//                                         aria-label={`Xem tập ${episode.episodeNumber}`}
//                                         aria-current={isCurrent ? 'page' : undefined}
//                                     >
//                                         {episode.episodeNumber}
//                                     </Link>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 )}

//                 {/* Movie Info */}
//                 <div style={{
//                     display: 'grid',
//                     gridTemplateColumns: '300px 1fr',
//                     gap: '2rem',
//                     marginBottom: '3rem'
//                 }}>
//                     <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 3' }}>
//                         <Image
//                             src={movie.thumbnail}
//                             alt={`${movie.title} - Poster phim`}
//                             fill
//                             sizes="(max-width: 768px) 100vw, 300px"
//                             style={{
//                                 objectFit: 'cover',
//                                 borderRadius: '0.75rem',
//                                 boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
//                             }}
//                             priority
//                         />
//                     </div>

//                     <div>
//                         <h1 style={{
//                             fontSize: '2.5rem',
//                             fontWeight: 'bold',
//                             marginBottom: '1.5rem',
//                             background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
//                             WebkitBackgroundClip: 'text',
//                             WebkitTextFillColor: 'transparent',
//                             margin: '0 0 1.5rem 0'
//                         }}>
//                             {movie.title}
//                         </h1>

//                         <div style={{
//                             display: 'flex',
//                             gap: '0.75rem',
//                             marginBottom: '2rem',
//                             flexWrap: 'wrap'
//                         }}>
//                             {categoryArray.map((categoryItem, index) => (
//                                 <span
//                                     key={index}
//                                     style={{
//                                         backgroundColor: '#4c1d95',
//                                         padding: '0.5rem 1rem',
//                                         borderRadius: '9999px',
//                                         fontSize: '0.875rem',
//                                         fontWeight: '600',
//                                         whiteSpace: 'nowrap'
//                                     }}
//                                 >
//                                     {categoryItem}
//                                 </span>
//                             ))}

//                             <span style={{
//                                 backgroundColor: '#166534',
//                                 padding: '0.5rem 1rem',
//                                 borderRadius: '9999px',
//                                 fontSize: '0.875rem',
//                                 fontWeight: '600'
//                             }}>
//                                 {movie.year}
//                             </span>
//                             <span style={{
//                                 backgroundColor: '#7c2d12',
//                                 padding: '0.5rem 1rem',
//                                 borderRadius: '9999px',
//                                 fontSize: '0.875rem',
//                                 fontWeight: '600'
//                             }}>
//                                 {movie.totalEpisodes} tập
//                             </span>
//                         </div>

//                         <div style={{
//                             backgroundColor: '#1e293b',
//                             padding: '1.5rem',
//                             borderRadius: '0.75rem',
//                             marginBottom: '1.5rem'
//                         }}>
//                             <h3 style={{
//                                 fontSize: '1.25rem',
//                                 fontWeight: 'bold',
//                                 marginBottom: '1rem',
//                                 color: '#60a5fa',
//                                 margin: '0 0 1rem 0'
//                             }}>
//                                 📖 Nội dung phim
//                             </h3>
//                             <p style={{
//                                 color: '#cbd5e1',
//                                 lineHeight: '1.75',
//                                 margin: 0
//                             }}>
//                                 {movie.description || 'Chưa có mô tả cho phim này.'}
//                             </p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Suggested Movies - Lazy Loaded */}
//                 <div id="suggested-movies" style={{ marginBottom: '3rem', minHeight: '400px' }}>
//                     {suggestedMovies.length > 0 ? (
//                         <>
//                             <h2 style={{
//                                 fontSize: '1.75rem',
//                                 fontWeight: '700',
//                                 marginBottom: '1.5rem',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '0.5rem',
//                                 margin: '0 0 1.5rem 0'
//                             }}>
//                                 🎬 Phim cùng thể loại: {movieCategoryDisplay}
//                             </h2>

//                             <div style={{
//                                 display: 'grid',
//                                 gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
//                                 gap: '1.5rem'
//                             }}>
//                                 {suggestedMovies.map(suggestedMovie => {
//                                     const totalEpisodes = suggestedMovie.totalEpisodes || 1;
//                                     const currentEpisodeCount = suggestedMovie.episodes?.length || 1;
//                                     const isMovieSeries = totalEpisodes > 1 || suggestedMovie.totalEpisodes === '??';

//                                     let episodeStatusText;
//                                     let episodeStatusColor = '#3b82f6';

//                                     if (isMovieSeries) {
//                                         if (suggestedMovie.totalEpisodes === '??' || currentEpisodeCount < totalEpisodes) {
//                                             episodeStatusText = `${currentEpisodeCount}/${totalEpisodes}`;
//                                             episodeStatusColor = '#f59e0b';
//                                         } else {
//                                             episodeStatusText = `${totalEpisodes}/${totalEpisodes}`;
//                                             episodeStatusColor = '#10b981';
//                                         }
//                                     } else {
//                                         episodeStatusText = '1/1';
//                                         episodeStatusColor = '#ef4444';
//                                     }

//                                     let typeStatusText = isMovieSeries ? 'Phim Bộ' : 'Phim Lẻ';
//                                     let typeStatusColor = isMovieSeries ? '#3b82f6' : '#ef4444';

//                                     return (
//                                         <Link
//                                             href={`/movie/${suggestedMovie.slug || suggestedMovie.id}`}
//                                             key={suggestedMovie.id}
//                                             style={{ textDecoration: 'none', color: 'white' }}
//                                         >
//                                             <div style={{
//                                                 position: 'relative',
//                                                 overflow: 'hidden',
//                                                 borderRadius: '1rem',
//                                                 boxShadow: '0 15px 25px rgba(0,0,0,0.45)',
//                                                 cursor: 'pointer',
//                                                 transition: 'transform 0.3s, boxShadow 0.3s',
//                                                 backgroundColor: '#0f172a',
//                                                 minHeight: '360px'
//                                             }}
//                                                 onMouseEnter={(e) => {
//                                                     e.currentTarget.style.transform = 'translateY(-8px)';
//                                                     e.currentTarget.style.boxShadow = '0 25px 35px rgba(59, 130, 246, 0.35)';
//                                                 }}
//                                                 onMouseLeave={(e) => {
//                                                     e.currentTarget.style.transform = 'translateY(0)';
//                                                     e.currentTarget.style.boxShadow = '0 15px 25px rgba(0,0,0,0.45)';
//                                                 }}
//                                             >
//                                                 <div style={{ position: 'relative', width: '100%', height: '320px' }}>
//                                                     <Image
//                                                         src={suggestedMovie.thumbnail}
//                                                         alt={`${suggestedMovie.title} - Poster`}
//                                                         fill
//                                                         sizes="(max-width: 768px) 100vw, 240px"
//                                                         style={{ objectFit: 'cover' }}
//                                                         loading="lazy"
//                                                     />
//                                                 </div>

//                                                 <div style={{
//                                                     position: 'absolute',
//                                                     top: '0.75rem',
//                                                     left: '0.75rem',
//                                                     backgroundColor: episodeStatusColor,
//                                                     color: 'white',
//                                                     padding: '0.35rem 0.75rem',
//                                                     borderRadius: '999px',
//                                                     fontSize: '0.85rem',
//                                                     fontWeight: 'bold',
//                                                     boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
//                                                     zIndex: 5
//                                                 }}>
//                                                     {episodeStatusText}
//                                                 </div>

//                                                 <div style={{
//                                                     position: 'absolute',
//                                                     top: '0.75rem',
//                                                     right: '0.75rem',
//                                                     backgroundColor: typeStatusColor,
//                                                     color: 'white',
//                                                     padding: '0.35rem 0.75rem',
//                                                     borderRadius: '999px',
//                                                     fontSize: '0.85rem',
//                                                     fontWeight: 'bold',
//                                                     boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
//                                                     zIndex: 5
//                                                 }}>
//                                                     {typeStatusText}
//                                                 </div>

//                                                 <div style={{
//                                                     position: 'absolute',
//                                                     inset: 0,
//                                                     background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)'
//                                                 }} />
//                                                 <div style={{
//                                                     position: 'absolute',
//                                                     bottom: '0.75rem',
//                                                     left: '0.75rem',
//                                                     right: '0.75rem'
//                                                 }}>
//                                                     <h3 style={{
//                                                         fontWeight: '700',
//                                                         fontSize: '1.1rem',
//                                                         marginBottom: '0.35rem',
//                                                         lineHeight: 1.4,
//                                                         margin: '0 0 0.35rem 0'
//                                                     }}>
//                                                         {suggestedMovie.title}
//                                                     </h3>
//                                                     <div style={{
//                                                         display: 'flex',
//                                                         alignItems: 'center',
//                                                         gap: '0.5rem',
//                                                         fontSize: '0.85rem',
//                                                         color: '#cbd5e1',
//                                                         flexWrap: 'wrap'
//                                                     }}>
//                                                         <span>📅 {suggestedMovie.year}</span>
//                                                         <span>•</span>
//                                                         <span>🎭 {suggestedMovie.category}</span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </Link>
//                                     );
//                                 })}
//                             </div>
//                         </>
//                     ) : (
//                         <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
//                             <div style={{
//                                 width: '40px',
//                                 height: '40px',
//                                 border: '4px solid #334155',
//                                 borderTop: '4px solid #3b82f6',
//                                 borderRadius: '50%',
//                                 animation: 'spin 1s linear infinite',
//                                 margin: '0 auto 1rem'
//                             }}></div>
//                             <p>Đang tải phim gợi ý...</p>
//                         </div>
//                     )}
//                 </div>
//             </main>

//             {/* Footer */}
//             <footer style={{
//                 backgroundColor: '#0a0d16',
//                 borderTop: '1px solid #1e293b',
//                 padding: '3rem 1.5rem 2rem',
//             }}>
//                 <div style={{
//                     maxWidth: '1300px',
//                     margin: '0 auto',
//                 }}>
//                     <div style={{
//                         display: 'grid',
//                         gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
//                         gap: '3rem',
//                         marginBottom: '3rem',
//                     }}>
//                         <div>
//                             <div style={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '0.5rem',
//                                 marginBottom: '1rem'
//                             }}>
//                                 <Image
//                                     src="/NiceAnime-header.png"
//                                     alt="NiceAnime Logo"
//                                     width={120}
//                                     height={36}
//                                     style={{ height: '36px', width: 'auto' }}
//                                 />
//                             </div>
//                             <p style={{
//                                 color: '#94a3b8',
//                                 fontSize: '0.9rem',
//                                 lineHeight: '1.6',
//                                 marginBottom: '1rem',
//                                 margin: '0 0 1rem 0'
//                             }}>
//                                 NiceAnime là nền tảng xem phim anime miễn phí hàng đầu, nơi bạn có thể khám phá hàng ngàn bộ phim với phụ đề Vietsub chất lượng cao được cập nhật liên tục mỗi ngày.
//                             </p>
//                         </div>

//                         <div>
//                             <h3 style={{
//                                 color: 'white',
//                                 fontSize: '1.1rem',
//                                 fontWeight: '700',
//                                 marginBottom: '1rem',
//                                 margin: '0 0 1rem 0'
//                             }}>
//                                 Danh Mục
//                             </h3>
//                             <ul style={{
//                                 listStyle: 'none',
//                                 padding: 0,
//                                 margin: 0,
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 gap: '0.75rem'
//                             }}>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Anime Mới (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Anime Hay (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Anime Vietsub (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Phim Kinh Dị (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Anime HD (Đang Cập Nhật)</a></li>
//                             </ul>
//                         </div>

//                         <div>
//                             <h3 style={{
//                                 color: 'white',
//                                 fontSize: '1.1rem',
//                                 fontWeight: '700',
//                                 marginBottom: '1rem',
//                                 margin: '0 0 1rem 0'
//                             }}>
//                                 Thể Loại
//                             </h3>
//                             <ul style={{
//                                 listStyle: 'none',
//                                 padding: 0,
//                                 margin: 0,
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 gap: '0.75rem'
//                             }}>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Hành Động (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Phiêu Lưu (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Hài Hước (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Lãng Mạn (Đang Cập Nhật)</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Học Đường (Đang Cập Nhật)</a></li>
//                             </ul>
//                         </div>

//                         <div>
//                             <h3 style={{
//                                 color: 'white',
//                                 fontSize: '1.1rem',
//                                 fontWeight: '700',
//                                 marginBottom: '1rem',
//                                 margin: '0 0 1rem 0'
//                             }}>
//                                 Hỗ Trợ
//                             </h3>
//                             <ul style={{
//                                 listStyle: 'none',
//                                 padding: 0,
//                                 margin: 0,
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 gap: '0.75rem'
//                             }}>
//                                 <li><a href="/support/privacy" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Chính sách bảo mật</a></li>
//                                 <li><a href="/support/terms" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Điều khoản sử dụng</a></li>
//                                 <li><a href="/support/about" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Giới thiệu</a></li>
//                                 <li><a href="/support/contact" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Liên hệ</a></li>
//                             </ul>
//                         </div>

//                         <div>
//                             <h3 style={{
//                                 color: 'white',
//                                 fontSize: '1.1rem',
//                                 fontWeight: '700',
//                                 marginBottom: '1rem',
//                                 margin: '0 0 1rem 0'
//                             }}>
//                                 Nguồn
//                             </h3>
//                             <ul style={{
//                                 listStyle: 'none',
//                                 padding: 0,
//                                 margin: 0,
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 gap: '0.75rem'
//                             }}>
//                                 <li><a href="https://phim.nguonc.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>phim.nguonc.com</a></li>
//                             </ul>
//                         </div>
//                     </div>

//                     <div style={{
//                         paddingTop: '2rem',
//                         borderTop: '1px solid #1e293b',
//                         textAlign: 'center'
//                     }}>
//                         <p style={{
//                             color: '#64748b',
//                             fontSize: '0.9rem',
//                             marginBottom: '0.5rem',
//                             margin: '0 0 0.5rem 0'
//                         }}>
//                             Copyright © {new Date().getFullYear()} by NiceAnime - All rights reserved.
//                         </p>
//                         <p style={{
//                             color: '#475569',
//                             fontSize: '0.85rem',
//                             margin: 0
//                         }}>
//                             Website made by Nguyen Quang Anh
//                         </p>
//                     </div>
//                 </div>
//             </footer>
//         </div>
//     );
// }




// 'use client';
// import Image from 'next/image';
// import { useState, useEffect, useMemo, useCallback, memo } from 'react';
// import { db } from '@/lib/firebase';
// import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
// import { useParams, useSearchParams } from 'next/navigation';
// import Link from 'next/link';
// import dynamic from 'next/dynamic';

// // Lazy load các component không quan trọng
// const SuggestedMovies = dynamic(() => import('./SuggestedMovies'), {
//     loading: () => <SuggestedMoviesLoader />,
//     ssr: false
// });

// // Loading skeleton cho suggested movies
// function SuggestedMoviesLoader() {
//     return (
//         <div style={{ marginBottom: '3rem' }}>
//             <div style={{
//                 height: '2rem',
//                 width: '300px',
//                 backgroundColor: '#1e293b',
//                 borderRadius: '0.5rem',
//                 marginBottom: '1.5rem'
//             }}></div>
//             <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
//                 gap: '1.5rem'
//             }}>
//                 {[...Array(10)].map((_, i) => (
//                     <div key={i} style={{
//                         height: '360px',
//                         backgroundColor: '#1e293b',
//                         borderRadius: '1rem',
//                         animation: 'pulse 2s infinite'
//                     }}></div>
//                 ))}
//             </div>
//         </div>
//     );
// }

// // Memoized Episode Button Component
// const EpisodeButton = memo(({ episode, isCurrent, movieSlug, movieId, onClick, isChanging }) => (
//     <Link
//         href={`/movie/${movieSlug || movieId}?ep=${episode.episodeNumber}`}
//         onClick={(e) => {
//             e.preventDefault();
//             onClick(episode);
//         }}
//         prefetch={false}
//         style={{
//             backgroundColor: isCurrent ? '#3b82f6' : '#334155',
//             color: 'white',
//             padding: '0.75rem',
//             borderRadius: '0.5rem',
//             textAlign: 'center',
//             textDecoration: 'none',
//             fontWeight: isCurrent ? 'bold' : '600',
//             fontSize: '0.875rem',
//             transition: 'all 0.2s',
//             border: isCurrent ? '2px solid #60a5fa' : '2px solid transparent',
//             cursor: isChanging ? 'wait' : 'pointer',
//             opacity: isChanging ? 0.6 : 1,
//             display: 'block'
//         }}
//         onMouseEnter={(e) => {
//             if (!isCurrent && !isChanging) {
//                 e.currentTarget.style.backgroundColor = '#475569';
//                 e.currentTarget.style.transform = 'scale(1.05)';
//             }
//         }}
//         onMouseLeave={(e) => {
//             if (!isCurrent) {
//                 e.currentTarget.style.backgroundColor = '#334155';
//                 e.currentTarget.style.transform = 'scale(1)';
//             }
//         }}
//         aria-label={`Xem tập ${episode.episodeNumber}`}
//         aria-current={isCurrent ? 'page' : undefined}
//     >
//         {episode.episodeNumber}
//     </Link>
// ));
// EpisodeButton.displayName = 'EpisodeButton';

// export default function MovieDetail() {
//     const params = useParams();
//     const searchParams = useSearchParams();
//     const [movie, setMovie] = useState(null);
//     const [episodes, setEpisodes] = useState([]);
//     const [currentEpisode, setCurrentEpisode] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [loadingEpisodes, setLoadingEpisodes] = useState(true);
//     const [isChangingEpisode, setIsChangingEpisode] = useState(false);

//     // Load movie data với error handling
//     const loadMovie = useCallback(async () => {
//         try {
//             // Try slug first
//             const moviesQuery = query(
//                 collection(db, 'movies'),
//                 where('slug', '==', params.id),
//                 limit(1)
//             );
//             const snapshot = await getDocs(moviesQuery);

//             if (!snapshot.empty) {
//                 const movieDoc = snapshot.docs[0];
//                 setMovie({ id: movieDoc.id, ...movieDoc.data() });
//             } else {
//                 // Fallback to document ID
//                 const docRef = doc(db, 'movies', params.id);
//                 const docSnap = await getDoc(docRef);
//                 if (docSnap.exists()) {
//                     setMovie({ id: docSnap.id, ...docSnap.data() });
//                 }
//             }
//         } catch (error) {
//             console.error('Error loading movie:', error);
//         } finally {
//             setLoading(false);
//         }
//     }, [params.id]);

//     // Load episodes - chỉ lấy fields cần thiết
//     const loadEpisodes = useCallback(async () => {
//         if (!movie?.id) return;

//         try {
//             const episodesQuery = query(
//                 collection(db, 'episodes'),
//                 where('movieId', '==', movie.id),
//                 orderBy('episodeNumber', 'asc')
//             );

//             const querySnapshot = await getDocs(episodesQuery);

//             // Chỉ lấy fields cần thiết để giảm memory
//             const episodesList = querySnapshot.docs.map(doc => ({
//                 id: doc.id,
//                 episodeNumber: doc.data().episodeNumber,
//                 title: doc.data().title,
//                 videoUrl: doc.data().videoUrl
//             }));

//             setEpisodes(episodesList);

//             // Set current episode
//             const ep = parseInt(searchParams.get('ep')) || 1;
//             const episode = episodesList.find(e => e.episodeNumber === ep);
//             setCurrentEpisode(episode || episodesList[0]);

//         } catch (error) {
//             console.error('Error loading episodes:', error);
//         } finally {
//             setLoadingEpisodes(false);
//         }
//     }, [movie?.id, searchParams]);

//     // Initial load
//     useEffect(() => {
//         loadMovie();
//     }, [loadMovie]);

//     // Load episodes when movie is ready
//     useEffect(() => {
//         if (movie) {
//             loadEpisodes();
//         }
//     }, [movie, loadEpisodes]);

//     // Handle URL episode change
//     useEffect(() => {
//         const ep = parseInt(searchParams.get('ep')) || 1;
//         if (episodes.length > 0) {
//             const episode = episodes.find(e => e.episodeNumber === ep);
//             if (episode && episode.id !== currentEpisode?.id) {
//                 setCurrentEpisode(episode);
//             }
//         }
//     }, [searchParams, episodes, currentEpisode?.id]);

//     // Update meta tags và structured data
//     useEffect(() => {
//         if (!movie) return;

//         const pageTitle = `${movie.title} - Xem phim ${movie.title} Vietsub HD | NiceAnime`;
//         document.title = pageTitle;

//         // Update meta tags
//         const updateMeta = (selector, content) => {
//             let meta = document.querySelector(selector);
//             if (meta) {
//                 meta.setAttribute('content', content);
//             } else {
//                 meta = document.createElement('meta');
//                 const [attr, value] = selector.match(/\[(.*?)="(.*?)"\]/).slice(1);
//                 meta.setAttribute(attr, value);
//                 meta.setAttribute('content', content);
//                 document.head.appendChild(meta);
//             }
//         };

//         const description = movie.description
//             ? `Xem phim ${movie.title} (${movie.year}) Vietsub HD miễn phí. ${movie.description.substring(0, 150)}...`
//             : `Xem phim ${movie.title} (${movie.year}) Vietsub HD miễn phí trên NiceAnime`;

//         updateMeta('meta[name="description"]', description);
//         updateMeta('meta[property="og:title"]', movie.title);
//         updateMeta('meta[property="og:description"]', description);
//         updateMeta('meta[property="og:image"]', movie.thumbnail);
//         updateMeta('meta[property="og:type"]', 'video.movie');
//         updateMeta('meta[name="twitter:card"]', 'summary_large_image');
//         updateMeta('meta[name="twitter:title"]', movie.title);
//         updateMeta('meta[name="twitter:image"]', movie.thumbnail);

//         // Add structured data
//         const script = document.createElement('script');
//         script.type = 'application/ld+json';
//         script.text = JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "Movie",
//             "name": movie.title,
//             "image": movie.thumbnail,
//             "dateCreated": movie.year,
//             "description": movie.description || `Xem ${movie.title} Vietsub HD`,
//             "genre": Array.isArray(movie.category) ? movie.category.join(', ') : movie.category,
//             "numberOfEpisodes": movie.totalEpisodes
//         });
//         document.head.appendChild(script);

//         return () => {
//             document.head.removeChild(script);
//         };
//     }, [movie]);

//     // Debounced episode change
//     const handleEpisodeChange = useCallback((episode) => {
//         if (isChangingEpisode || episode.id === currentEpisode?.id) return;

//         setIsChangingEpisode(true);
//         setCurrentEpisode(episode);

//         // Update URL without reload
//         window.history.pushState(
//             null,
//             '',
//             `?ep=${episode.episodeNumber}`
//         );

//         setTimeout(() => setIsChangingEpisode(false), 300);
//     }, [isChangingEpisode, currentEpisode?.id]);

//     // Memoized values
//     const movieCategoryDisplay = useMemo(() =>
//         Array.isArray(movie?.category)
//             ? movie.category.join(', ')
//             : movie?.category || '',
//         [movie?.category]
//     );

//     const categoryArray = useMemo(() => {
//         if (!movie?.category) return [];
//         return Array.isArray(movie.category)
//             ? movie.category
//             : movie.category.split(',').map(c => c.trim()).filter(c => c);
//     }, [movie?.category]);

//     // Loading state
//     if (loading) {
//         return (
//             <div style={{
//                 minHeight: '100vh',
//                 backgroundColor: '#0f172a',
//                 color: 'white',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexDirection: 'column'
//             }}>
//                 <div style={{
//                     width: '50px',
//                     height: '50px',
//                     border: '4px solid #334155',
//                     borderTop: '4px solid #3b82f6',
//                     borderRadius: '50%',
//                     animation: 'spin 1s linear infinite'
//                 }}></div>
//                 <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>Đang tải phim...</p>
//                 <style jsx>{`
//                     @keyframes spin {
//                         0% { transform: rotate(0deg); }
//                         100% { transform: rotate(360deg); }
//                     }
//                 `}</style>
//             </div>
//         );
//     }

//     // Not found state
//     if (!movie) {
//         return (
//             <div style={{
//                 minHeight: '100vh',
//                 backgroundColor: '#0f172a',
//                 color: 'white',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexDirection: 'column'
//             }}>
//                 <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
//                 <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Oh no! Không tìm thấy phim!</h2>
//                 <Link
//                     href="/"
//                     style={{
//                         backgroundColor: '#3b82f6',
//                         padding: '0.75rem 2rem',
//                         borderRadius: '0.5rem',
//                         textDecoration: 'none',
//                         color: 'white',
//                         fontWeight: '600'
//                     }}
//                 >
//                     ← Quay về trang chủ
//                 </Link>
//             </div>
//         );
//     }

//     return (
//         <div style={{ minHeight: '100vh', backgroundColor: '#05060b', color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}>
//             {/* Header */}
//             <header style={{
//                 position: 'fixed',
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 zIndex: 50,
//                 background: 'linear-gradient(-90deg, rgba(5,6,11,0.95) 0%, rgba(59,7,100,0.95) 60%, rgba(190,24,93,0.95) 100%)',
//                 borderBottom: '1px solid rgba(255,255,255,0.08)',
//                 backdropFilter: 'blur(10px)',
//                 boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
//             }}>
//                 <div style={{
//                     maxWidth: '1300px',
//                     margin: '0 auto',
//                     padding: '0.35rem 1.5rem',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'space-between',
//                     minHeight: '72px'
//                 }}>
//                     <Link href="/" prefetch={false} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
//                         <Image
//                             src="/NiceAnime-header.png"
//                             alt="NiceAnime - Xem Anime Vietsub HD"
//                             width={240}
//                             height={72}
//                             priority
//                             quality={85}
//                             style={{
//                                 height: '72px',
//                                 width: 'auto',
//                                 objectFit: 'contain',
//                             }}
//                         />
//                     </Link>
//                     <div style={{ textAlign: 'right' }}>
//                         <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>Đang xem:</p>
//                         <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{movie.title}</p>
//                     </div>
//                 </div>
//             </header>

//             <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '7rem 1rem 2rem 1rem' }}>
//                 {/* Video Player */}
//                 <div style={{
//                     marginBottom: '2rem',
//                     backgroundColor: '#1e293b',
//                     borderRadius: '0.75rem',
//                     overflow: 'hidden',
//                     boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
//                 }}>
//                     {currentEpisode ? (
//                         <>
//                             <div style={{
//                                 position: 'relative',
//                                 paddingBottom: '56.25%',
//                                 height: 0,
//                                 overflow: 'hidden',
//                                 backgroundColor: '#000'
//                             }}>
//                                 <iframe
//                                     key={currentEpisode.episodeNumber}
//                                     src={currentEpisode.videoUrl}
//                                     style={{
//                                         position: 'absolute',
//                                         top: 0,
//                                         left: 0,
//                                         width: '100%',
//                                         height: '100%',
//                                         border: 'none'
//                                     }}
//                                     allowFullScreen
//                                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                                     sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
//                                     referrerPolicy="no-referrer-when-downgrade"
//                                     loading="eager"
//                                     title={`${movie.title} - Tập ${currentEpisode.episodeNumber}`}
//                                 />
//                             </div>

//                             <div style={{
//                                 padding: '1rem 1.5rem',
//                                 backgroundColor: '#334155',
//                                 display: 'flex',
//                                 justifyContent: 'space-between',
//                                 alignItems: 'center',
//                                 flexWrap: 'wrap',
//                                 gap: '1rem'
//                             }}>
//                                 <div>
//                                     <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
//                                         {currentEpisode.title}
//                                     </h1>
//                                     <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.875rem', color: '#cbd5e1' }}>
//                                         <span>📅 {movie.year}</span>
//                                         <span>🎭 {movieCategoryDisplay}</span>
//                                         <span>📺 Tập {currentEpisode.episodeNumber}/{movie.totalEpisodes}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </>
//                     ) : (
//                         <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
//                             {loadingEpisodes ? (
//                                 <>
//                                     <div style={{
//                                         width: '40px',
//                                         height: '40px',
//                                         border: '4px solid #334155',
//                                         borderTop: '4px solid #3b82f6',
//                                         borderRadius: '50%',
//                                         animation: 'spin 1s linear infinite',
//                                         margin: '0 auto 1rem'
//                                     }}></div>
//                                     <p>Đang tải tập phim...</p>
//                                 </>
//                             ) : 'Không tìm thấy tập phim'}
//                         </div>
//                     )}
//                 </div>

//                 {/* Episodes List */}
//                 {episodes.length > 0 && (
//                     <div style={{
//                         backgroundColor: '#1e293b',
//                         borderRadius: '0.75rem',
//                         padding: '1.5rem',
//                         marginBottom: '2rem',
//                         boxShadow: '0 10px 15px rgba(0,0,0,0.3)'
//                     }}>
//                         <h2 style={{
//                             fontSize: '1.5rem',
//                             fontWeight: 'bold',
//                             color: '#60a5fa',
//                             margin: '0 0 1rem 0'
//                         }}>
//                             📺 Danh sách tập Vietsub ({episodes.length} tập)
//                         </h2>

//                         <div style={{
//                             display: 'grid',
//                             gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
//                             gap: '0.75rem',
//                             maxHeight: '400px',
//                             overflowY: 'auto',
//                             padding: '0.5rem'
//                         }}>
//                             {episodes.map((episode) => (
//                                 <EpisodeButton
//                                     key={episode.id}
//                                     episode={episode}
//                                     isCurrent={currentEpisode?.episodeNumber === episode.episodeNumber}
//                                     movieSlug={movie.slug}
//                                     movieId={movie.id}
//                                     onClick={handleEpisodeChange}
//                                     isChanging={isChangingEpisode}
//                                 />
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {/* Movie Info */}
//                 <div style={{
//                     display: 'grid',
//                     gridTemplateColumns: '300px 1fr',
//                     gap: '2rem',
//                     marginBottom: '3rem'
//                 }}>
//                     <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 3' }}>
//                         <Image
//                             src={movie.thumbnail}
//                             alt={`${movie.title} - Poster phim`}
//                             fill
//                             sizes="(max-width: 768px) 100vw, 300px"
//                             style={{
//                                 objectFit: 'cover',
//                                 borderRadius: '0.75rem',
//                                 boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
//                             }}
//                             priority
//                             quality={85}
//                         />
//                     </div>

//                     <div>
//                         <h1 style={{
//                             fontSize: '2.5rem',
//                             fontWeight: 'bold',
//                             background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
//                             WebkitBackgroundClip: 'text',
//                             WebkitTextFillColor: 'transparent',
//                             margin: '0 0 1.5rem 0'
//                         }}>
//                             {movie.title}
//                         </h1>

//                         <div style={{
//                             display: 'flex',
//                             gap: '0.75rem',
//                             marginBottom: '2rem',
//                             flexWrap: 'wrap'
//                         }}>
//                             {categoryArray.map((categoryItem, index) => (
//                                 <span
//                                     key={index}
//                                     style={{
//                                         backgroundColor: '#4c1d95',
//                                         padding: '0.5rem 1rem',
//                                         borderRadius: '9999px',
//                                         fontSize: '0.875rem',
//                                         fontWeight: '600',
//                                         whiteSpace: 'nowrap'
//                                     }}
//                                 >
//                                     {categoryItem}
//                                 </span>
//                             ))}

//                             <span style={{
//                                 backgroundColor: '#166534',
//                                 padding: '0.5rem 1rem',
//                                 borderRadius: '9999px',
//                                 fontSize: '0.875rem',
//                                 fontWeight: '600'
//                             }}>
//                                 {movie.year}
//                             </span>
//                             <span style={{
//                                 backgroundColor: '#7c2d12',
//                                 padding: '0.5rem 1rem',
//                                 borderRadius: '9999px',
//                                 fontSize: '0.875rem',
//                                 fontWeight: '600'
//                             }}>
//                                 {movie.totalEpisodes} tập
//                             </span>
//                         </div>

//                         <div style={{
//                             backgroundColor: '#1e293b',
//                             padding: '1.5rem',
//                             borderRadius: '0.75rem'
//                         }}>
//                             <h3 style={{
//                                 fontSize: '1.25rem',
//                                 fontWeight: 'bold',
//                                 color: '#60a5fa',
//                                 margin: '0 0 1rem 0'
//                             }}>
//                                 📖 Nội dung phim
//                             </h3>
//                             <p style={{
//                                 color: '#cbd5e1',
//                                 lineHeight: '1.75',
//                                 margin: 0
//                             }}>
//                                 {movie.description || 'Chưa có mô tả cho phim này.'}
//                             </p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Lazy loaded Suggested Movies */}
//                 <SuggestedMovies
//                     movieId={movie.id}
//                     movieCategory={movie.category}
//                     movieCategoryDisplay={movieCategoryDisplay}
//                 />
//             </main>

//             {/* Footer */}
//             <footer style={{
//                 backgroundColor: '#0a0d16',
//                 borderTop: '1px solid #1e293b',
//                 padding: '3rem 1.5rem 2rem',
//             }}>
//                 <div style={{
//                     maxWidth: '1300px',
//                     margin: '0 auto',
//                 }}>
//                     <div style={{
//                         display: 'grid',
//                         gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
//                         gap: '3rem',
//                         marginBottom: '3rem',
//                     }}>
//                         <div>
//                             <div style={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '0.5rem',
//                                 marginBottom: '1rem'
//                             }}>
//                                 <Image
//                                     src="/NiceAnime-header.png"
//                                     alt="NiceAnime Logo"
//                                     width={120}
//                                     height={36}
//                                     style={{ height: '36px', width: 'auto' }}
//                                     loading="lazy"
//                                 />
//                             </div>
//                             <p style={{
//                                 color: '#94a3b8',
//                                 fontSize: '0.9rem',
//                                 lineHeight: '1.6',
//                                 margin: '0 0 1rem 0'
//                             }}>
//                                 NiceAnime là nền tảng xem phim anime miễn phí hàng đầu, nơi bạn có thể khám phá hàng ngàn bộ phim với phụ đề Vietsub chất lượng cao được cập nhật liên tục mỗi ngày.
//                             </p>
//                         </div>

//                         <div>
//                             <h3 style={{
//                                 color: 'white',
//                                 fontSize: '1.1rem',
//                                 fontWeight: '700',
//                                 margin: '0 0 1rem 0'
//                             }}>
//                                 Danh Mục
//                             </h3>
//                             <ul style={{
//                                 listStyle: 'none',
//                                 padding: 0,
//                                 margin: 0,
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 gap: '0.75rem'
//                             }}>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Anime Mới</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Anime Hay</a></li>
//                                 <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Anime Vietsub</a></li>
//                             </ul>
//                         </div>

//                         <div>
//                             <h3 style={{
//                                 color: 'white',
//                                 fontSize: '1.1rem',
//                                 fontWeight: '700',
//                                 margin: '0 0 1rem 0'
//                             }}>
//                                 Hỗ Trợ
//                             </h3>
//                             <ul style={{
//                                 listStyle: 'none',
//                                 padding: 0,
//                                 margin: 0,
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 gap: '0.75rem'
//                             }}>
//                                 <li><a href="/support/privacy" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Chính sách bảo mật</a></li>
//                                 <li><a href="/support/terms" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Điều khoản sử dụng</a></li>
//                                 <li><a href="/support/about" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Giới thiệu</a></li>
//                             </ul>
//                         </div>

//                         <div>
//                             <h3 style={{
//                                 color: 'white',
//                                 fontSize: '1.1rem',
//                                 fontWeight: '700',
//                                 margin: '0 0 1rem 0'
//                             }}>
//                                 Nguồn
//                             </h3>
//                             <ul style={{
//                                 listStyle: 'none',
//                                 padding: 0,
//                                 margin: 0
//                             }}>
//                                 <li><a href="https://phim.nguonc.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>phim.nguonc.com</a></li>
//                             </ul>
//                         </div>
//                     </div>

//                     <div style={{
//                         paddingTop: '2rem',
//                         borderTop: '1px solid #1e293b',
//                         textAlign: 'center'
//                     }}>
//                         <p style={{
//                             color: '#64748b',
//                             fontSize: '0.9rem',
//                             margin: '0 0 0.5rem 0'
//                         }}>
//                             Copyright © {new Date().getFullYear()} by NiceAnime - All rights reserved.
//                         </p>
//                         <p style={{
//                             color: '#475569',
//                             fontSize: '0.85rem',
//                             margin: 0
//                         }}>
//                             Website made by Nguyen Quang Anh
//                         </p>
//                     </div>
//                 </div>
//             </footer>

//             <style jsx>{`
//                 @keyframes spin {
//                     0% { transform: rotate(0deg); }
//                     100% { transform: rotate(360deg); }
//                 }
//                 @keyframes pulse {
//                     0%, 100% { opacity: 1; }
//                     50% { opacity: 0.5; }
//                 }
//             `}</style>
//         </div>
//     );
// }







'use client';
import Image from 'next/image';
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Memoized Episode Button
const EpisodeButton = memo(({ episode, isCurrent, movieSlug, movieId, onClick, isChanging }) => (
    <Link
        href={`/movie/${movieSlug || movieId}?ep=${episode.episodeNumber}`}
        onClick={(e) => {
            e.preventDefault();
            onClick(episode);
        }}
        prefetch={false}
        style={{
            backgroundColor: isCurrent ? '#3b82f6' : '#334155',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            textDecoration: 'none',
            fontWeight: isCurrent ? 'bold' : '600',
            fontSize: '0.875rem',
            transition: 'background-color 0.2s, transform 0.2s',
            border: isCurrent ? '2px solid #60a5fa' : '2px solid transparent',
            cursor: isChanging ? 'wait' : 'pointer',
            opacity: isChanging ? 0.6 : 1,
            display: 'block',
        }}
        onMouseEnter={(e) => {
            if (!isCurrent && !isChanging) {
                e.currentTarget.style.backgroundColor = '#475569';
                e.currentTarget.style.transform = 'scale(1.05)';
            }
        }}
        onMouseLeave={(e) => {
            if (!isCurrent) {
                e.currentTarget.style.backgroundColor = '#334155';
                e.currentTarget.style.transform = 'scale(1)';
            }
        }}
    >
        {episode.episodeNumber}
    </Link>
));
EpisodeButton.displayName = 'EpisodeButton';

// Memoized Movie Card
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
                transition: 'transform 0.3s',
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
});
MovieCard.displayName = 'MovieCard';

export default function MovieDetail() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [movie, setMovie] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [currentEpisode, setCurrentEpisode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingEpisodes, setLoadingEpisodes] = useState(true);
    const [suggestedMovies, setSuggestedMovies] = useState([]);
    const [isChangingEpisode, setIsChangingEpisode] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);

    // Load movie và episodes song song
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                // Load movie
                const moviesQuery = query(
                    collection(db, 'movies'),
                    where('slug', '==', params.id),
                    limit(1)
                );
                const snapshot = await getDocs(moviesQuery);

                let movieData = null;
                if (!snapshot.empty) {
                    const movieDoc = snapshot.docs[0];
                    movieData = { id: movieDoc.id, ...movieDoc.data() };
                } else {
                    const docRef = doc(db, 'movies', params.id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        movieData = { id: docSnap.id, ...docSnap.data() };
                    }
                }

                if (!isMounted) return;

                if (movieData) {
                    setMovie(movieData);

                    // Load episodes và suggested movies song song
                    const [episodesSnapshot, suggestedSnapshot] = await Promise.all([
                        getDocs(query(
                            collection(db, 'episodes'),
                            where('movieId', '==', movieData.id),
                            orderBy('episodeNumber', 'asc')
                        )),
                        (async () => {
                            const categories = Array.isArray(movieData.category)
                                ? movieData.category
                                : (typeof movieData.category === 'string'
                                    ? movieData.category.split(',').map(c => c.trim()).filter(c => c)
                                    : []);
                            
                            const categoryFilter = categories.length > 0 ? categories[0] : 'Anime';
                            
                            return getDocs(query(
                                collection(db, 'movies'),
                                where('category', 'array-contains', categoryFilter),
                                orderBy('createdAt', 'desc'),
                                limit(11)
                            ));
                        })()
                    ]);

                    if (!isMounted) return;

                    // Process episodes
                    const episodesList = episodesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        episodeNumber: doc.data().episodeNumber,
                        title: doc.data().title,
                        videoUrl: doc.data().videoUrl
                    }));
                    setEpisodes(episodesList);
                    setLoadingEpisodes(false);

                    // Set current episode
                    const ep = parseInt(searchParams.get('ep')) || 1;
                    const episode = episodesList.find(e => e.episodeNumber === ep);
                    setCurrentEpisode(episode || episodesList[0]);

                    // Process suggested movies
                    const moviesList = suggestedSnapshot.docs
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
                        .filter(m => m.id !== movieData.id)
                        .slice(0, 10);
                    setSuggestedMovies(moviesList);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [params.id, searchParams]);

    // Update meta tags
    useEffect(() => {
        if (!movie) return;

        const pageTitle = `${movie.title} - Xem phim ${movie.title} Vietsub HD | NiceAnime`;
        document.title = pageTitle;

        const updateMeta = (selector, content) => {
            let meta = document.querySelector(selector);
            if (meta) {
                meta.setAttribute('content', content);
            } else {
                meta = document.createElement('meta');
                const match = selector.match(/\[(.*?)="(.*?)"\]/);
                if (match) {
                    meta.setAttribute(match[1], match[2]);
                    meta.setAttribute('content', content);
                    document.head.appendChild(meta);
                }
            }
        };

        const description = movie.description
            ? `Xem phim ${movie.title} (${movie.year}) Vietsub HD miễn phí. ${movie.description.substring(0, 150)}...`
            : `Xem phim ${movie.title} (${movie.year}) Vietsub HD miễn phí trên NiceAnime`;

        updateMeta('meta[name="description"]', description);
        updateMeta('meta[property="og:title"]', movie.title);
        updateMeta('meta[property="og:description"]', description);
        updateMeta('meta[property="og:image"]', movie.thumbnail);
    }, [movie]);

    // Handle episode change
    const handleEpisodeChange = useCallback((episode) => {
        if (isChangingEpisode || episode.id === currentEpisode?.id) return;
        
        setIsChangingEpisode(true);
        setIframeLoaded(false);
        setCurrentEpisode(episode);
        
        router.push(`?ep=${episode.episodeNumber}`, { scroll: false });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        setTimeout(() => setIsChangingEpisode(false), 500);
    }, [isChangingEpisode, currentEpisode?.id, router]);

    // Memoized values
    const movieCategoryDisplay = useMemo(() =>
        Array.isArray(movie?.category)
            ? movie.category.join(', ')
            : movie?.category || '',
        [movie?.category]
    );

    const categoryArray = useMemo(() => {
        if (!movie?.category) return [];
        return Array.isArray(movie.category)
            ? movie.category
            : movie.category.split(',').map(c => c.trim()).filter(c => c);
    }, [movie?.category]);

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
                <p style={{ marginTop: '1rem' }}>Đang tải phim...</p>
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
                <Link href="/" style={{
                    backgroundColor: '#3b82f6',
                    padding: '0.75rem 2rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: 'white',
                    fontWeight: '600'
                }}>← Quay về trang chủ</Link>
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
                    <Link href="/" prefetch={false} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <Image
                            src="/NiceAnime-header.png"
                            alt="NiceAnime"
                            width={240}
                            height={72}
                            priority
                            quality={85}
                            style={{ height: '72px', width: 'auto', objectFit: 'contain' }}
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
                                {!iframeLoaded && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 10
                                    }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            border: '4px solid #334155',
                                            borderTop: '4px solid #3b82f6',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }}></div>
                                    </div>
                                )}
                                
                                <iframe
                                    key={currentEpisode.episodeNumber}
                                    src={currentEpisode.videoUrl}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                        opacity: iframeLoaded ? 1 : 0,
                                        transition: 'opacity 0.3s'
                                    }}
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    loading="eager"
                                    title={`${movie.title} - Tập ${currentEpisode.episodeNumber}`}
                                    onLoad={() => setIframeLoaded(true)}
                                />
                            </div>

                            <div style={{
                                padding: '1rem 1.5rem',
                                backgroundColor: '#334155'
                            }}>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                                    {currentEpisode.title}
                                </h1>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#cbd5e1' }}>
                                    <span>📅 {movie.year}</span>
                                    <span>🎭 {movieCategoryDisplay}</span>
                                    <span>📺 Tập {currentEpisode.episodeNumber}/{movie.totalEpisodes}</span>
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
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#60a5fa',
                            margin: '0 0 1rem 0'
                        }}>
                            📺 Danh sách tập Vietsub ({episodes.length} tập)
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                            gap: '0.75rem',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            padding: '0.5rem'
                        }}>
                            {episodes.map((episode) => (
                                <EpisodeButton
                                    key={episode.id}
                                    episode={episode}
                                    isCurrent={currentEpisode?.episodeNumber === episode.episodeNumber}
                                    movieSlug={movie.slug}
                                    movieId={movie.id}
                                    onClick={handleEpisodeChange}
                                    isChanging={isChangingEpisode}
                                />
                            ))}
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
                            alt={`${movie.title} - Poster`}
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            style={{
                                objectFit: 'cover',
                                borderRadius: '0.75rem',
                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                            }}
                            priority
                            quality={85}
                        />
                    </div>

                    <div>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            margin: '0 0 1.5rem 0'
                        }}>
                            {movie.title}
                        </h1>

                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                            {categoryArray.map((cat, idx) => (
                                <span key={idx} style={{
                                    backgroundColor: '#4c1d95',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.875rem',
                                    fontWeight: '600'
                                }}>{cat}</span>
                            ))}
                            <span style={{
                                backgroundColor: '#166534',
                                padding: '0.5rem 1rem',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                            }}>{movie.year}</span>
                            <span style={{
                                backgroundColor: '#7c2d12',
                                padding: '0.5rem 1rem',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                            }}>{movie.totalEpisodes} tập</span>
                        </div>

                        <div style={{
                            backgroundColor: '#1e293b',
                            padding: '1.5rem',
                            borderRadius: '0.75rem'
                        }}>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                color: '#60a5fa',
                                margin: '0 0 1rem 0'
                            }}>📖 Nội dung phim</h3>
                            <p style={{
                                color: '#cbd5e1',
                                lineHeight: '1.75',
                                margin: 0
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
                            margin: '0 0 1.5rem 0'
                        }}>
                            🎬 Phim cùng thể loại: {movieCategoryDisplay}
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {suggestedMovies.map(movie => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </div>
                    </div>
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

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}