'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            const response = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                throw new Error('Không thể tạo phiên bảo mật');
            }

            router.push('/admin/dashboard');
        } catch (err) {
            setError('Email hoặc mật khẩu không đúng!');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#111827'
        }}>
            <div style={{
                backgroundColor: '#1f2937',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px rgba(0,0,0,0.3)',
                width: '100%',
                maxWidth: '28rem'
            }}>
                <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                }}>
                    🎬 Admin Login
                </h1>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                backgroundColor: '#374151',
                                color: 'white',
                                border: '1px solid #4b5563',
                                outline: 'none'
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: '#d1d5db', marginBottom: '0.5rem' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                backgroundColor: '#374151',
                                color: 'white',
                                border: '1px solid #4b5563',
                                outline: 'none'
                            }}
                            required
                        />
                    </div>

                    {error && (
                        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            backgroundColor: loading ? '#4b5563' : '#2563eb',
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
}