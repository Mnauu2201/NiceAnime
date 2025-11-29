// frontend/app/about/page.js
import StaticPageLayout from '@/components/StaticPageLayout';
import Link from 'next/link';
// Import các icon từ react-icons (ví dụ: Font Awesome)
import { FaTwitter, FaGithub, FaLinkedin, FaTelegram } from 'react-icons/fa'; // Hoặc các icon khác bạn thích

// Thay thế bằng thông tin của bạn
const MY_AVATAR_URL = '/images/nguyen_quang_anh_avatar.png'; // Đảm bảo avatar có nền trong suốt hoặc phù hợp
const MY_NAME = 'Nguyễn Quang Anh';
const MY_HANDLE = 'wangahn.dev.0122xxx@gmail.com'; // Hoặc tên miền/handle cá nhân của bạn

export default function AboutPage() {
    return (
        <StaticPageLayout title="Giới Thiệu Về NiceAnime">
            {/* Main content container for the About page */}
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* 1. Phần Giới Thiệu Cá Nhân - Tái tạo phong cách ảnh 1 */}
                <div className="bg-gray-800 p-8 rounded-xl shadow-lg mb-12"> {/* Background box */}
                    <div className="flex items-center space-x-6 mb-8">
                        {/* Avatar */}
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500 flex-shrink-0">
                            <img
                                src={'/Me.png'}
                                alt={MY_NAME}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Tên và Handle */}
                        <div>
                            <h2 className="text-3xl font-bold text-white leading-tight">{MY_NAME}</h2>
                            <p className="text-blue-400 text-lg">{MY_HANDLE} ↗</p> {/* Thêm icon mũi tên nếu muốn */}
                        </div>
                    </div>

                    {/* Mô tả cá nhân */}
                    <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                        Đang thất nghiệp rảnh rỗi sinh nông nổi. Đây là website xem phim cá nhân tự tay tôi xây dựng.
                        Tôi sẽ cố gắng cập nhật thật nhiều phim nhất có thể. Thắc mắc hay cần khiếu nại gì xin hãy gửi email tới địa chỉ bên trên
                        hoặc truy cập Social có để bên dưới.
                        <br /><br />
                        Đang xây dựng website xem phim tại <b><Link href="https://niceanime.net" target="_blank" className="text-blue-500 hover:underline">NiceAnime</Link></b>
                    </p>

                    {/* Các icon mạng xã hội/công việc */}
                    <div className="flex space-x-6 text-gray-400 text-3xl">
                        <Link href="https://x.com/wangahn_devxxx" target="_blank" className="hover:text-blue-400 transition">
                            <FaTwitter />
                        </Link>
                        <Link href="https://github.com/Mnauu2201" target="_blank" className="hover:text-blue-400 transition">
                            <FaGithub />
                        </Link>
                        <Link href="https://t.me/@wwangh_ahn" target="_blank" className="hover:text-blue-400 transition">
                            <FaTelegram />
                        </Link>
                        {/* Bạn có thể thêm các icon khác như Figma, Dribbble nếu cần */}
                    </div>
                </div>

                {/* --- Phần nội dung cũ (Sứ mệnh, Đội ngũ, Liên hệ) --- */}
                {/* Giữ lại nhưng điều chỉnh class để đồng bộ style */}
                <hr className="my-12 border-gray-700" />

                <h2 className="text-3xl font-bold text-blue-400 mt-8 mb-4">Sứ mệnh của NiceAnime</h2>
                <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                    NiceAnime được tạo ra với sứ mệnh trở thành điểm đến hàng đầu cho cộng đồng yêu thích Anime tại Việt Nam. Chúng tôi cam kết cung cấp một kho tàng Anime phong phú, chất lượng cao, có phụ đề Vietsub chi tiết và được cập nhật nhanh chóng nhất.
                </p>

                <h2 className="text-3xl font-bold text-blue-400 mt-8 mb-4">Về Đội ngũ Phát triển</h2>
                <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                    Website được xây dựng và phát triển bởi cá nhân tôi, <b><i>{MY_NAME}</i></b>, với sự hỗ trợ từ cộng đồng. Tôi luôn nỗ lực cải thiện nền tảng để mang lại trải nghiệm xem phim tốt nhất cho bạn.
                </p>

                <h2 className="text-3xl font-bold text-blue-400 mt-8 mb-4">Liên hệ & Hợp tác</h2>
                <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                    Nếu bạn có bất kỳ câu hỏi, đề xuất hoặc muốn đóng góp nội dung, vui lòng truy cập trang
                    <Link href="/support/contact" className="text-blue-500 hover:text-blue-400 underline ml-1">Liên hệ</Link> của chúng tôi.
                </p>
            </div>
        </StaticPageLayout>
    );
}