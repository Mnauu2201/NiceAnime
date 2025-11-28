// frontend/app/contact/page.js
import StaticPageLayout from '@/components/StaticPageLayout';

export default function ContactPage() {
    return (
        <StaticPageLayout title="Liên Hệ Với NiceAnime">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>Gửi phản hồi cho chúng tôi</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                Ý kiến đóng góp của bạn là vô cùng quý giá để NiceAnime ngày càng hoàn thiện. Bạn có thể liên hệ với chúng tôi qua các kênh sau:
            </p>

            <ul style={{ listStyle: 'none', paddingLeft: '1rem', color: '#cbd5e1' }}>
                <li style={{ marginBottom: '0.75rem' }}>
                    <strong>📧 Email Hỗ Trợ:</strong> <a href="mailto:support@niceanime.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>support@niceanime.com</a>
                </li>
                <li style={{ marginBottom: '0.75rem' }}>
                    <strong>📢 Đề xuất nội dung:</strong> Sử dụng form (Đang phát triển) hoặc gửi trực tiếp qua email.
                </li>
                <li style={{ marginBottom: '0.75rem' }}>
                    <strong>💻 Lỗi kỹ thuật:</strong> Gửi kèm mô tả chi tiết lỗi và thiết bị bạn đang sử dụng.
                </li>
            </ul>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>Địa chỉ (Tham khảo)</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                Tầng 1, Tòa nhà Anime, Quận Vui Vẻ, Thành phố Tokyo. (Địa chỉ chỉ mang tính minh họa)
            </p>
        </StaticPageLayout>
    );
}