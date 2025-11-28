// frontend/components/StaticPageLayout.js
import Image from 'next/image';
import Link from 'next/link';

// Đường dẫn Image đã được sửa lại để khớp với cách bạn dùng trong các file page.js
const LOGO_SRC = "/NiceAnime-header.png";

export default function StaticPageLayout({ title, children }) {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#05060b', color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header - Giống như trang chi tiết phim */}
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
                            src={LOGO_SRC}
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
                        <Link
                            href="/"
                            style={{
                                backgroundColor: '#3b82f6',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                textDecoration: 'none',
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '0.875rem'
                            }}
                        >
                            ← Quay về trang chủ
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '7rem 1rem 3rem 1rem' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    marginBottom: '2rem',
                    textAlign: 'center',
                    background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 10px rgba(96, 165, 250, 0.3)'
                }}>
                    {title}
                </h1>

                {/* Content Box */}
                <div style={{
                    backgroundColor: '#1e293b',
                    padding: '2rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
                    lineHeight: '1.75'
                }}>
                    {children}
                </div>
            </main>

            {/* Footer - Giống như trang chi tiết phim */}
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
                                    src={LOGO_SRC}
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