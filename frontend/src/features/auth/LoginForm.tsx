'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { login } from '@/shared/api/auth';

interface LoginFormProps {
  onForgotPassword: () => void;
}

export const LoginForm = ({ onForgotPassword }: LoginFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const data = await login({ email, password });
      localStorage.setItem('access_token', data?.access_token);
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
      <h1 style={{ fontSize: '36px', margin: '-10px 0 15px 0', color: 'white' }}>Вход</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded text-sm backdrop-blur-sm">
          {error}
        </div>
      )}

      <div className="input-box">
        <input type="email" name="email" placeholder="Email" required />
        <i className="bx bxs-envelope" />
      </div>

      <div className="input-box relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Пароль"
          required
          className="pr-10"
        />
        <i className="bx bxs-lock-alt" />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute inset-y-0 right-3 flex items-center"
          style={{ color: '#000' }}
        >
          {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>

      <div className="text-right mb-2">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-indigo-200 hover:text-white underline"
        >
          Забыли пароль?
        </button>
      </div>

      <button
        type="submit"
        className="glass-btn"
        style={{ width: '100%', height: '48px' }}
        disabled={loading}
      >
        {loading ? 'Загрузка...' : 'Войти'}
      </button>
    </form>
  );
};
