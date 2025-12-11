// frontend/app/terms/page.js
import StaticPageLayout from '@/components/StaticPageLayout';

export default function TermsOfServicePage() {
    return (
        <StaticPageLayout title="Điều Khoản Sử Dụng">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>1. Chấp nhận điều khoản</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                Bằng cách truy cập hoặc sử dụng dịch vụ của NiceAnime, bạn đồng ý chịu ràng buộc bởi các Điều khoản này. Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản, bạn không nên truy cập hoặc sử dụng dịch vụ.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>2. Nội dung</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                Tất cả nội dung trên NiceAnime chỉ dành cho mục đích giải trí và cá nhân. Chúng tôi không chịu trách nhiệm về tính chính xác, bản quyền, hoặc tính hợp pháp của nội dung.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>3. Hành vi bị cấm</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
                Nghiêm cấm mọi hành vi sao chép, phân phối lại, hoặc sử dụng dịch vụ cho mục đích thương mại mà không có sự cho phép bằng văn bản từ NiceAnime.
            </p>

            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '2rem', fontStyle: 'italic' }}>
                NiceAnime có quyền chấm dứt hoặc đình chỉ quyền truy cập của bạn mà không cần thông báo trước, vì bất kỳ lý do nào.
            </p>
        </StaticPageLayout>
    );
}