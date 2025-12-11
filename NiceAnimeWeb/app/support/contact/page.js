// // frontend/app/contact/page.js
// import StaticPageLayout from '@/components/StaticPageLayout';

// export default function ContactPage() {
//     return (
//         <StaticPageLayout title="Liên Hệ Với NiceAnime">
//             <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>Gửi phản hồi cho chúng tôi</h2>
//             <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
//                 Ý kiến đóng góp của bạn là vô cùng quý giá để NiceAnime ngày càng hoàn thiện. Bạn có thể liên hệ với chúng tôi qua các kênh sau:
//             </p>

//             <ul style={{ listStyle: 'none', paddingLeft: '1rem', color: '#cbd5e1' }}>
//                 <li style={{ marginBottom: '0.75rem' }}>
//                     <strong>📧 Email Hỗ Trợ:</strong> <a href="mailto:wangahn.dev.0122xxx@gmail.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>wangahn.dev.0122xxx@gmail.com</a>
//                 </li>
//                 <li style={{ marginBottom: '0.75rem' }}>
//                     <strong>📢 Đề xuất nội dung:</strong> Sử dụng form (Đang phát triển) hoặc gửi trực tiếp qua email.
//                 </li>
//                 <li style={{ marginBottom: '0.75rem' }}>
//                     <strong>💻 Lỗi kỹ thuật:</strong> Gửi kèm mô tả chi tiết lỗi và thiết bị bạn đang sử dụng.
//                 </li>
//             </ul>

//             <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '1rem', marginBottom: '0.75rem' }}>Địa chỉ (Tham khảo)</h2>
//             <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
//                 Tầng Lửng, Số ?, Bồ Xuyên, Thành phố Thái Bình.
//             </p>
//         </StaticPageLayout>
//     );
// }

"use client";
import { useState } from 'react';
import StaticPageLayout from '@/components/StaticPageLayout';
import Link from 'next/link';

const TO_EMAIL = 'wangahn.dev.0122xxx@gmail.com';

// Component Form Liên Hệ
function ContactForm() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('');

        // --- BƯỚC 1: Xử lý Gửi Email (CẦN TÍCH HỢP BACKEND/API) ---
        // Trong dự án Next.js thực tế, bạn sẽ gửi dữ liệu này đến một API Route
        // Ví dụ: const response = await fetch('/api/contact', { method: 'POST', body: JSON.stringify(formData) });

        console.log('Dữ liệu form được gửi đi:', formData);

        // Mô phỏng quá trình gửi email thành công/thất bại
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Giả lập thành công
        if (formData.message.length > 10) {
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } else {
            setStatus('error');
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-gray-800/70 rounded-xl shadow-2xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white">Sử dụng Form để Liên hệ</h3>
            <p className="text-gray-400 text-sm">Vui lòng điền đầy đủ thông tin bên dưới. Chúng tôi sẽ phản hồi trong vòng 48 giờ.</p>

            {/* Input Tên và Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Họ và Tên"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Địa chỉ Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>

            {/* Input Chủ đề */}
            <Input
                label="Chủ đề"
                name="subject"
                type="text"
                value={formData.subject}
                onChange={handleChange}
                required
            />

            {/* Textarea Nội dung */}
            <div className="flex flex-col">
                <label htmlFor="message" className="mb-2 text-sm font-medium text-gray-300">Nội dung chi tiết</label>
                <textarea
                    id="message"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-none"
                    placeholder="Mô tả ý kiến đóng góp, lỗi kỹ thuật hoặc đề xuất nội dung..."
                ></textarea>
            </div>

            {/* Thông báo trạng thái */}
            {status === 'success' && (
                <div className="bg-green-600/20 text-green-400 p-3 rounded-lg border border-green-700 text-sm">
                    Gửi thành công! Cảm ơn bạn đã liên hệ, chúng tôi sẽ phản hồi sớm nhất.
                </div>
            )}
            {status === 'error' && (
                <div className="bg-red-600/20 text-red-400 p-3 rounded-lg border border-red-700 text-sm">
                    Có lỗi xảy ra trong quá trình gửi. Vui lòng thử lại hoặc gửi trực tiếp qua email.
                </div>
            )}

            {/* Nút Gửi */}
            <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-5 text-base font-medium text-center text-white rounded-lg transition duration-300 ${loading
                    ? 'bg-blue-600/50 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/50'
                    }`}
            >
                {loading ? 'Đang gửi...' : 'Gửi Phản hồi'}
            </button>
        </form>
    );
}

// Component Input tái sử dụng
function Input({ label, name, type, value, onChange, required }) {
    return (
        <div className="flex flex-col">
            <label htmlFor={name} className="mb-2 text-sm font-medium text-gray-300">{label}</label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
        </div>
    );
}

export default function ContactPage() {
    return (
        <StaticPageLayout title="Liên Hệ Với NiceAnime">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Phần thông tin liên hệ tĩnh */}
                <div>
                    <h2 className="text-3xl font-bold text-blue-400 mb-4">Gửi phản hồi cho chúng tôi</h2>
                    <p className="text-gray-300 mb-6 text-lg">
                        Ý kiến đóng góp của bạn là vô cùng quý giá để NiceAnime ngày càng hoàn thiện. Bạn có thể liên hệ với chúng tôi qua các kênh sau:
                    </p>

                    <ul className="list-none space-y-3 text-gray-300 pl-0">
                        <li className="flex items-center">
                            <strong className="w-40 text-gray-200">📧 Email Hỗ Trợ:</strong>
                            <Link href={`mailto:${TO_EMAIL}`} className="text-blue-400 hover:text-blue-300 transition duration-150 break-words">
                                {TO_EMAIL}
                            </Link>
                        </li>
                        <li className="flex items-start">
                            <strong className="w-48 text-gray-200">📢 Đề xuất nội dung:</strong>
                            <span className="flex-1">Sử dụng form bên dưới hoặc gửi mô tả chi tiết qua email.</span>
                        </li>
                        <li className="flex items-start">
                            <strong className="w-40 text-gray-200">💻 Lỗi kỹ thuật:</strong>
                            <span className="flex-1">Gửi kèm mô tả chi tiết lỗi và thiết bị bạn đang sử dụng để chúng tôi khắc phục nhanh nhất.</span>
                        </li>
                    </ul>
                </div>

                {/* Phần Form Gửi Email */}
                <ContactForm />

                {/* Địa chỉ tham khảo */}
                <div>
                    <h2 className="text-3xl font-bold text-blue-400 mb-4">Địa chỉ (Tham khảo)</h2>
                    <p className="text-gray-300 text-lg">
                        Tầng Lửng, Số ?, Bồ Xuyên, Thành phố Thái Bình.
                    </p>
                </div>
            </div>
        </StaticPageLayout>
    );
}