// FILE: app/components/Header.jsx
import Image from 'next/image';
import Link from 'next/link';

export default function Header({ title }) {
  return (
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
            quality={90}
            style={{ height: '72px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>
        
        {/* Hiển thị title nếu có (cho trang chi tiết phim) */}
        {title && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>Đang xem:</p>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{title}</p>
          </div>
        )}
      </div>
    </header>
  );
}

// FILE: app/components/Footer.jsx
export default function Footer() {
  return (
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
  );
}

// ===== SỬ DỤNG TRONG CÁC TRANG =====

// FILE: app/page.jsx (Trang chủ)
import Header from './components/Header';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#05060b', color: 'white' }}>
      <Header />  {/* ← Import Header */}
      
      <main style={{ paddingTop: '7rem' }}>
        {/* Nội dung trang chủ */}
      </main>
      
      <Footer />  {/* ← Import Footer */}
    </div>
  );
}

// FILE: app/movie/[id]/page.jsx (Trang chi tiết phim)
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function MovieDetail() {
  const [movie, setMovie] = useState(null);
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#05060b', color: 'white' }}>
      <Header title={movie?.title} />  {/* ← Truyền title vào */}
      
      <main style={{ paddingTop: '7rem' }}>
        {/* Video player, episodes, ... */}
      </main>
      
      <Footer />
    </div>
  );
}