'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error ra console để debug
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
            <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-red-500">⚠️ Có lỗi xảy ra!</h2>
                <p className="text-gray-300 mb-2">
                    <strong>Lỗi:</strong> {error.message}
                </p>
                {error.digest && (
                    <p className="text-gray-400 text-sm mb-4">
                        Mã lỗi: {error.digest}
                    </p>
                )}
                <button
                    onClick={reset}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    🔄 Thử lại
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    className="w-full mt-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                    🏠 Về trang chủ
                </button>
            </div>
        </div>
    );
}