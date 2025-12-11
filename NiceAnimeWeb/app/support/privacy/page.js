// frontend/app/privacy/page.js
// Giả sử StaticPageLayout nằm trong @/components
import StaticPageLayout from '@/components/StaticPageLayout';

export default function PrivacyPolicyPage() {
    return (
        <StaticPageLayout title="Chính Sách Bảo Mật">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>1. Mục đích thu thập thông tin</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                NiceAnime cam kết bảo mật thông tin cá nhân của bạn. Chúng tôi chỉ thu thập thông tin cơ bản (ví dụ: email/tên người dùng nếu bạn đăng ký) nhằm mục đích cung cấp và cải thiện dịch vụ, cũng như thông báo về các cập nhật mới.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>2. Sử dụng Cookies</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                Chúng tôi sử dụng Cookies để lưu trữ các tùy chọn xem phim của bạn, duy trì phiên đăng nhập (nếu có) và phân tích lưu lượng truy cập nhằm tối ưu hóa trải nghiệm người dùng.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>3. Bảo mật dữ liệu</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn để bảo vệ thông tin cá nhân khỏi truy cập, sử dụng hoặc tiết lộ trái phép. Tuy nhiên, không có phương thức truyền tải nào qua Internet là an toàn tuyệt đối.
            </p>

            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '2rem', fontStyle: 'italic' }}>
                Chính sách này có thể được cập nhật theo thời gian. Vui lòng kiểm tra định kỳ để biết các thay đổi.
            </p>
        </StaticPageLayout>
    );
}