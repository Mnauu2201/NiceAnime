// frontend/app/about/page.js
import StaticPageLayout from '@/components/StaticPageLayout';

export default function AboutPage() {
    return (
        <StaticPageLayout title="Giới Thiệu Về NiceAnime">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>Sứ mệnh của chúng tôi</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                NiceAnime được tạo ra với sứ mệnh trở thành điểm đến hàng đầu cho cộng đồng yêu thích Anime tại Việt Nam. Chúng tôi cam kết cung cấp một kho tàng Anime phong phú, chất lượng cao, có phụ đề Vietsub chi tiết và được cập nhật nhanh chóng nhất.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>Đội ngũ</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                Chúng tôi là một nhóm các nhà phát triển và những người hâm mộ Anime cuồng nhiệt, luôn nỗ lực cải thiện nền tảng để mang lại trải nghiệm xem phim tốt nhất cho bạn. Website được xây dựng và phát triển bởi Nguyen Quang Anh.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>Liên hệ</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                Nếu bạn có bất kỳ câu hỏi, đề xuất hoặc muốn đóng góp nội dung, vui lòng truy cập trang <a href="/contact" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Liên hệ</a> của chúng tôi.
            </p>
        </StaticPageLayout>
    );
}