'use client';

import { FormEvent, useState } from 'react';
import {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from '@/shared/api/auth';

interface ResetPasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordModal = ({ onClose, onSuccess }: ResetPasswordModalProps) => {
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get('email') as string;
    try {
      await forgotPassword(formEmail);
      setEmail(formEmail);
      setMessage('Письмо с кодом отправлено. Проверьте почту.');
      setStep('verify');
    } catch (err: any) {
      setError(err?.message || 'Не удалось отправить письмо');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const formData = new FormData(e.currentTarget);
    const formToken = formData.get('code') as string;
    try {
      await verifyResetCode(email, formToken);
      setMessage('Код подтверждён. Введите новый пароль.');
      setToken(formToken);
      setStep('reset');
    } catch (err: any) {
      setError(err?.message || 'Неверный или истёкший код');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const formData = new FormData(e.currentTarget);
    const new_password = formData.get('new_password') as string;
    const new_password_confirm = formData.get('new_password_confirm') as string;
    try {
      await resetPassword({ email, token, new_password, new_password_confirm });
      setMessage('Пароль успешно обновлён. Можно войти.');
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Не удалось сбросить пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fadeIn">
      <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-lg w-[360px] text-center">
        <h2 className="text-2xl text-white mb-4">
          {step === 'request' ? 'Восстановление пароля' : 'Сбросить пароль'}
        </h2>

        {message && (
          <div className="mb-3 p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 rounded text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-3 p-2 bg-red-500/20 border border-red-500/40 text-red-200 rounded text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={
            step === 'request'
              ? handleForgotSubmit
              : step === 'verify'
              ? handleVerifySubmit
              : handleResetSubmit
          }
          className="space-y-3 text-left"
        >
          <div className="input-box">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              defaultValue={email}
              disabled={step !== 'request'}
              onChange={e => setEmail(e.target.value)}
            />
            <i className="bx bxs-envelope" />
          </div>

          {step !== 'request' && (
            <div className="input-box">
              <input
                type="text"
                name="code"
                placeholder="Код из письма"
                required
                disabled={step === 'reset'}
                defaultValue={token}
              />
              <i className="bx bxs-key" />
            </div>
          )}

          {step === 'reset' && (
            <>
              <div className="input-box">
                <input
                  type="password"
                  name="new_password"
                  placeholder="Новый пароль"
                  required
                />
                <i className="bx bxs-lock-alt" />
              </div>
              <div className="input-box">
                <input
                  type="password"
                  name="new_password_confirm"
                  placeholder="Подтвердите пароль"
                  required
                />
                <i className="bx bxs-lock-alt" />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-[#191538] text-white rounded-md hover:bg-[#4a2d77] disabled:bg-gray-500"
            disabled={loading}
          >
            {step === 'request'
              ? loading ? 'Отправка...' : 'Отправить код'
              : step === 'verify'
              ? loading ? 'Проверка...' : 'Подтвердить код'
              : loading ? 'Сброс...' : 'Сбросить пароль'}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
