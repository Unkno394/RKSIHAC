'use client';

import { useState, FormEvent } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export default function Modal({ email, onClose }: { email: string; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleConfirmEmail = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setConfirmError('');
    setInfoMessage('');

    const formData = new FormData(e.currentTarget);
    const code = formData.get('code') as string;

    try {
      const res = await fetch(`${API_URL}/auth/confirm-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!res.ok) {
        const msg = await res.json();
        setConfirmError(msg?.detail || 'Ошибка подтверждения');
        return;
      }

      setInfoMessage('Почта успешно подтверждена. Теперь можно войти.');
      onClose(); // Закрыть модалку
    } catch (err) {
      console.error(err);
      setConfirmError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fadeIn">
      <div className="bg-[#1a1a1a] p-8 rounded-2xl shadow-xl w-96 text-center transition-all ease-in-out transform">
        <h2 className="text-2xl text-white mb-4 font-semibold">Подтверждение почты</h2>
        <div className="mb-4">
          <form onSubmit={handleConfirmEmail}>
            <div className="mb-6">
              <input
                type="text"
                name="code"
                placeholder="Код из письма"
                required
                className="w-full px-6 py-3 border border-gray-600 rounded-md text-white bg-[#2d2d2d] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {confirmError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-md text-sm backdrop-blur-sm">
                {confirmError}
              </div>
            )}

            {infoMessage && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-100 rounded-md text-sm backdrop-blur-sm">
                {infoMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#0ea5e9] text-white rounded-md transition duration-300 hover:bg-[#4a2d77] disabled:bg-gray-300"
              disabled={isLoading}
            >
              {isLoading ? 'Проверка...' : 'Подтвердить почту'}
            </button>
          </form>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-gray-600 text-white rounded-md transition duration-300 hover:bg-gray-700"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
