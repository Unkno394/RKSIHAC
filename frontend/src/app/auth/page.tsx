// page.tsx
'use client';

import './auth.css';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginForm() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [registerError, setRegisterError] = useState<string>('');

  // состояние для глазиков
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);

  const router = useRouter();

  const handleRegisterClick = (): void => {
    setIsActive(true);
    setLoginError('');
    setRegisterError('');
  };

  const handleLoginClick = (): void => {
    setIsActive(false);
    setLoginError('');
    setRegisterError('');
  };

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // твоя логика логина
      // const res = await fetch('/api/login', {...});
      // if (!res.ok) throw new Error('Неверный логин или пароль');
      // router.push('/events');
    } catch (err: any) {
      setLoginError(err?.message || 'Ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setRegisterError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const display_name = formData.get('display_name') as string;

    try {
      // твоя логика регистрации
      // const res = await fetch('/api/register', {...});
      // if (!res.ok) throw new Error('Не удалось зарегистрироваться');
      // router.push('/events');
    } catch (err: any) {
      setRegisterError(err?.message || 'Ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-[#191538] relative">
      <div className="fixed inset-0 w-full h-full -z-10" />

      <div className={`form-container ${isActive ? 'active' : ''}`}>
        {/* ----------- ЛОГИН ----------- */}
        <div className="form-box login">
          <form onSubmit={handleLoginSubmit} className="w-full max-w-[400px]">
            <h1 style={{ fontSize: '36px', margin: '-10px 0 15px 0', color: 'white' }}>Вход</h1>

            {loginError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded text-sm backdrop-blur-sm">
                {loginError}
              </div>
            )}

            <div className="input-box">
              <input type="email" name="email" placeholder="Email" required />
              <i className="bx bxs-envelope" />
            </div>

<div className="input-box relative">
  <input
    type={showLoginPassword ? 'text' : 'password'}
    name="password"
    placeholder="Пароль"
    required
    className="pr-10"
  />
  <i className="bx bxs-lock-alt" />

  <button
    type="button"
    onClick={() => setShowLoginPassword((v) => !v)}
    className="absolute inset-y-0 right-3 flex items-center"
    style={{ color: '#000' }}
  >
    {showLoginPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
  </button>
</div>

            <button
              type="submit"
              className="glass-btn"
              style={{ width: '100%', height: '48px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Загрузка...' : 'Войти'}
            </button>
          </form>
        </div>

        {/* ----------- РЕГИСТРАЦИЯ ----------- */}
        <div className="form-box register">
          <form onSubmit={handleRegisterSubmit} className="w-full max-w-[400px]">
            <h1 style={{ fontSize: '36px', margin: '-10px 0 15px 0', color: 'white' }}>
              Регистрация
            </h1>

            {registerError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded text-sm backdrop-blur-sm">
                {registerError}
              </div>
            )}

            <div className="input-box">
              <input
                type="text"
                name="display_name"
                placeholder="Имя пользователя"
                required
              />
              <i className="bx bxs-user" />
            </div>

            <div className="input-box">
              <input type="email" name="email" placeholder="Email" required />
              <i className="bx bxs-envelope" />
            </div>

<div className="input-box relative">
  <input
    type={showRegisterPassword ? 'text' : 'password'}
    name="password"
    placeholder="Пароль"
    required
    className="pr-10"
  />
  <i className="bx bxs-lock-alt" />

  <button
    type="button"
    onClick={() => setShowRegisterPassword((v) => !v)}
    className="absolute inset-y-0 right-3 flex items-center"
    style={{ color: '#000' }}
  >
    {showRegisterPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
  </button>
</div>


            <button
              type="submit"
              className="glass-btn"
              style={{ width: '100%', height: '48px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>

        {/* ----------- ПАНЕЛИ ПЕРЕКЛЮЧЕНИЯ ----------- */}
        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1 style={{ fontSize: '36px', marginBottom: '15px' }}>Добро пожаловать!</h1>
            <p style={{ marginBottom: '20px' }}>Нет аккаунта?</p>
            <button
              className="glass-btn"
              onClick={handleRegisterClick}
              style={{ width: '160px', height: '46px' }}
              disabled={isLoading}
            >
              Регистрация
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1 style={{ fontSize: '36px', marginBottom: '15px' }}>С возвращением!</h1>
            <p style={{ marginBottom: '20px' }}>Уже есть аккаунт?</p>
            <button
              className="glass-btn"
              onClick={handleLoginClick}
              style={{ width: '160px', height: '46px' }}
              disabled={isLoading}
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
