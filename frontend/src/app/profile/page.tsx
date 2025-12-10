"use client";

import React, { useEffect, useState } from "react";
import Prism from "@/shared/ui/Prism";
import { FiArrowLeft, FiHeart } from "react-icons/fi";
import { useAlert } from "../components/CustomAlert";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type Tab = "profile" | "favorites" | "security";

type EventItem = {
  id: string;
  title: string;
  short_description?: string | null;
  image_url?: string | null;
  city?: string | null;
  start_date?: string | null;
};

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [avatar, setAvatar] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [about, setAbout] = useState("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [avatarDefaults] = useState<string[]>(["/def1.png", "/def2.png", "/def3.png", "/def4.png"]);
  const [myEventsCount, setMyEventsCount] = useState<number>(0);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<EventItem[]>([]);
  const { AlertComponent, showAlert } = useAlert();

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdStep, setPwdStep] = useState<"request" | "verify" | "reset">("request");
  const [pwdEmail, setPwdEmail] = useState("");
  const [pwdCode, setPwdCode] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdNewConfirm, setPwdNewConfirm] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Нет токена — авторизуйтесь заново.");
      router.replace("/auth");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Не удалось загрузить профиль");
        const data = await res.json();
        setFullName(data.full_name || "");
        setEmail(data.email || "");
        setCurrentEmail(data.email || "");
        setAbout(data.about || "");
        const favFromLS = JSON.parse(localStorage.getItem("favoriteEvents") || "[]");
        setFavorites(favFromLS);
        setFavoritesCount(favFromLS.length);
        const persistedDefault = localStorage.getItem("avatar_default");
        let initialAvatar = data.avatar_url || null;
        if (!initialAvatar) {
          const chosen = persistedDefault || avatarDefaults[Math.floor(Math.random() * avatarDefaults.length)];
          localStorage.setItem("avatar_default", chosen);
          initialAvatar = chosen;
        }
        setAvatar(initialAvatar);
      } catch (err: any) {
        const msg = err?.message || "Ошибка загрузки профиля";
        setError(msg);
        router.replace("/auth");
      }
    };

    fetchProfile();
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Количество посещённых событий
    const loadMyEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/events/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data: EventItem[] = await res.json();
        setMyEventsCount(data.length);
      } catch {
        setMyEventsCount(0);
      }
    };

    // Подтянуть избранные события по id
    const loadFavEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const all: EventItem[] = await res.json();
        const favIds = JSON.parse(localStorage.getItem("favoriteEvents") || "[]") as string[];
        const favList = all.filter((ev) => favIds.includes(ev.id));
        setFavoriteEvents(favList);
        setFavoritesCount(favList.length);
      } catch {
        setFavoriteEvents([]);
      }
    };

    loadMyEvents();
    loadFavEvents();
  }, [favorites]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Нет токена — авторизуйтесь заново.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          about,
          avatar_url: avatar,
        }),
      });
      if (!res.ok) throw new Error("Не удалось сохранить профиль");
      setSuccess("Профиль сохранён");
      showAlert("Профиль сохранён", "success");
    } catch (err: any) {
      setError(err?.message || "Ошибка сохранения профиля");
      showAlert(err?.message || "Ошибка сохранения профиля", "error");
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("access_token");
    if (!token) {
      const msg = "Нет токена — авторизуйтесь заново.";
      setError(msg);
      showAlert(msg, "error");
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_email: newEmail,
          password: emailPassword,
        }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.detail || "Не удалось сменить e-mail");
      }
      setEmail(newEmail);
      setCurrentEmail(newEmail);
      setShowEmailModal(false);
      setNewEmail("");
      setEmailPassword("");
      showAlert("E-mail успешно обновлён", "success");
    } catch (err: any) {
      const msg = err?.message || "Ошибка смены e-mail";
      setError(msg);
      showAlert(msg, "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePwdRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPwdLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pwdEmail }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.detail || "Не удалось отправить код");
      }
      setPwdStep("verify");
      showAlert("Код отправлен на почту", "success");
    } catch (err: any) {
      const msg = err?.message || "Не удалось отправить код";
      setError(msg);
      showAlert(msg, "error");
    } finally {
      setPwdLoading(false);
    }
  };

  const handlePwdVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPwdLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pwdEmail, token: pwdCode }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.detail || "Код неверный или истёк");
      }
      setPwdStep("reset");
      showAlert("Код подтверждён. Введите новый пароль.", "success");
    } catch (err: any) {
      const msg = err?.message || "Код неверный или истёк";
      setError(msg);
      showAlert(msg, "error");
    } finally {
      setPwdLoading(false);
    }
  };

  const handlePwdReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPwdLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pwdEmail,
          token: pwdCode,
          new_password: pwdNew,
          new_password_confirm: pwdNewConfirm,
        }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.detail || "Не удалось сменить пароль");
      }
      setShowPwdModal(false);
      setPwdStep("request");
      setPwdCode("");
      setPwdNew("");
      setPwdNewConfirm("");
      showAlert("Пароль обновлён", "success");
    } catch (err: any) {
      const msg = err?.message || "Не удалось сменить пароль";
      setError(msg);
      showAlert(msg, "error");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <AlertComponent />
      
      {/* Оптимизированный фон как в главной */}
      <div className="pointer-events-none fixed inset-0">
        <Prism 
          animationType="rotate" 
          suspendWhenOffscreen 
          noise={0.35} 
          scale={3.6}
          className="opacity-50"
        />
      </div>

      {/* Затемняющая плёнка как в главной */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black" />

      {/* Кнопка назад */}
      <button
        onClick={() => window.history.back()}
        className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 border border-gray-800 text-white hover:bg-black/80 transition"
      >
        <FiArrowLeft className="w-4 h-4" />
        Назад
      </button>

      <div className="relative z-10 flex justify-center px-4 py-8 md:py-12 min-h-screen">
        <div className="w-full max-w-5xl grid gap-5 md:gap-6 md:grid-cols-[250px,1fr]">
          {/* ЛЕВАЯ КОЛОНКА — ПРОФИЛЬ */}
          <aside className="bg-black/50 border border-gray-800 rounded-2xl backdrop-blur-xl p-5 md:p-6 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-700 flex items-center justify-center text-2xl md:text-3xl text-white border border-gray-600 overflow-hidden">
                {avatar ? (
                  <img src={avatar} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  "👤"
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-500 hover:bg-blue-400 cursor-pointer flex items-center justify-center border border-gray-700 shadow-lg">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setAvatar(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
                ✎
              </label>
            </div>

            <h2 className="text-base font-semibold text-center">{fullName || "Без имени"}</h2>
            <p className="text-xs text-gray-400 text-center">{email}</p>
            <a
              href="https://t.me/af1shanotify_bot"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-sky-500/70 to-purple-500/70 text-xs font-semibold text-white shadow-lg shadow-sky-500/30 hover:opacity-90 transition text-center"
            >
              Попробуйте нашего TG-бота
            </a>
            <div className="h-3" />
          </aside>

          {/* ПРАВАЯ КОЛОНКА */}
          <section className="bg-black/50 border border-gray-800 rounded-2xl backdrop-blur-xl p-5 md:p-6 text-sm">
            {/* Табы */}
            <div className="flex gap-4 md:gap-6 border-b border-gray-800 pb-2 mb-5 md:mb-6">
              <button
                className={`pb-2 border-b-2 text-sm ${
                  activeTab === "profile"
                    ? "border-blue-400 text-blue-300"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("profile")}
              >
                Профиль
              </button>
              <button
                className={`pb-2 border-b-2 text-sm ${
                  activeTab === "favorites"
                    ? "border-blue-400 text-blue-300"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("favorites")}
              >
                Избранное
              </button>
              <button
                className={`pb-2 border-b-2 text-sm ${
                  activeTab === "security"
                    ? "border-blue-400 text-blue-300"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("security")}
              >
                Безопасность
              </button>
            </div>

            {/* ========= ПРОФИЛЬ ========= */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-sm text-red-300">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-sm text-green-300">
                {success}
              </div>
            )}

            {activeTab === "profile" && (
              <form className="space-y-5 md:space-y-6" onSubmit={handleSaveProfile}>
                {/* Статистика */}
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  <div className="rounded-xl bg-black/40 p-3 md:p-4 text-center backdrop-blur-sm border border-gray-800">
                    <p className="text-xs text-gray-400">Посещено</p>
                    <p className="text-lg md:text-xl font-bold text-white">{myEventsCount}</p>
                  </div>
                  <div className="rounded-xl bg-black/40 p-3 md:p-4 text-center backdrop-blur-sm border border-gray-800">
                    <p className="text-xs text-gray-400">Избранное</p>
                    <p className="text-lg md:text-xl font-bold text-green-300">{favoritesCount}</p>
                  </div>
                  <div className="rounded-xl bg-black/40 p-3 md:p-4 text-center backdrop-blur-sm border border-gray-800">
                    <p className="text-xs text-gray-400">Регистрация</p>
                    <p className="text-lg md:text-xl font-bold text-gray-300">—</p>
                  </div>
                </div>

                {/* Поля профиля */}
                <div>
                  <label className="text-gray-300 text-xs">Отображаемое имя</label>
                  <input
                    className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 mt-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-xs">О себе</label>
                  <textarea
                    className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 mt-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                    rows={3}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                  />
                </div>

                {/* Сохранить профиль */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition font-semibold"
                  >
                    Сохранить профиль
                  </button>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-lg bg-red-900/40 hover:bg-red-900/60 border border-red-700 transition font-semibold"
                    onClick={() => {
                      localStorage.removeItem("access_token");
                      window.location.href = "/auth";
                    }}
                  >
                    Выйти
                  </button>
                </div>
              </form>
            )}

            {/* ========= ИЗБРАННОЕ ========= */}
            {activeTab === "favorites" && (
              <div className="space-y-4">
                {favoriteEvents.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-4">
                    У вас пока нет избранных событий
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {favoriteEvents.map((ev) => {
                      const isFav = favorites.includes(ev.id);
                      return (
                        <div
                          key={ev.id}
                          onClick={() => window.location.href = `/events/${ev.id}`}
                          className="rounded-xl border border-gray-800 bg-black/40 p-3 md:p-4 flex gap-3 cursor-pointer hover:border-blue-500/30 transition"
                        >
                          <div className="w-16 h-12 md:w-20 md:h-16 rounded-lg overflow-hidden bg-gray-800">
                            <img
                              src={ev.image_url || "/events.png"}
                              alt={ev.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs uppercase text-blue-300 mb-1">
                              {ev.city || "Город не указан"}
                            </div>
                            <div className="font-medium text-sm line-clamp-2">{ev.title}</div>
                            {ev.start_date && (
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(ev.start_date).toLocaleDateString("ru-RU")}
                              </div>
                            )}
                          </div>
                          <FiHeart className={`w-4 h-4 md:w-5 md:h-5 mt-1 ${isFav ? "text-pink-400 fill-pink-400" : "text-gray-400"}`} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========= БЕЗОПАСНОСТЬ ========= */}
            {activeTab === "security" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-black/40 border border-gray-800 space-y-3">
                  <p className="text-sm text-gray-300">Текущий e-mail</p>
                  <div className="flex items-center justify-between bg-black/60 border border-gray-700 rounded-lg px-3 py-2">
                    <span className="text-white font-medium truncate mr-2">{currentEmail || "—"}</span>
                    <button
                      className="text-blue-300 hover:text-blue-200 text-sm font-medium whitespace-nowrap"
                      onClick={() => {
                        setShowEmailModal(true);
                        setNewEmail(currentEmail);
                        setEmailPassword("");
                      }}
                    >
                      Сменить
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-gray-800 space-y-3">
                  <p className="text-sm text-gray-300">Пароль</p>
                  <button
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition font-semibold"
                    onClick={() => {
                      setShowPwdModal(true);
                      setPwdStep("request");
                      setPwdEmail(currentEmail);
                      setPwdCode("");
                      setPwdNew("");
                      setPwdNewConfirm("");
                    }}
                  >
                    Изменить пароль
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Модалка смены e-mail */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowEmailModal(false)} />
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl p-5 md:p-6 z-10">
            <h3 className="text-lg font-semibold mb-4">Смена e-mail</h3>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400">Новый e-mail</label>
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  type="email"
                  required
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Подтвердите паролем</label>
                <input
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  type="password"
                  required
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm hover:bg-gray-700 transition"
                  onClick={() => setShowEmailModal(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-semibold disabled:opacity-50 transition"
                >
                  {emailLoading ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка смены пароля по коду */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPwdModal(false)} />
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl p-5 md:p-6 z-10 space-y-4">
            <h3 className="text-lg font-semibold">Смена пароля</h3>

            {pwdStep === "request" && (
              <form onSubmit={handlePwdRequest} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400">E-mail</label>
                  <input
                    value={pwdEmail}
                    onChange={(e) => setPwdEmail(e.target.value)}
                    type="email"
                    required
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm hover:bg-gray-700 transition"
                    onClick={() => setShowPwdModal(false)}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-semibold disabled:opacity-50 transition"
                  >
                    {pwdLoading ? "Отправка..." : "Отправить код"}
                  </button>
                </div>
              </form>
            )}

            {pwdStep === "verify" && (
              <form onSubmit={handlePwdVerify} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400">Код из письма</label>
                  <input
                    value={pwdCode}
                    onChange={(e) => setPwdCode(e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm hover:bg-gray-700 transition"
                    onClick={() => setShowPwdModal(false)}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-semibold disabled:opacity-50 transition"
                  >
                    {pwdLoading ? "Проверка..." : "Подтвердить код"}
                  </button>
                </div>
              </form>
            )}

            {pwdStep === "reset" && (
              <form onSubmit={handlePwdReset} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400">Новый пароль</label>
                  <input
                    value={pwdNew}
                    onChange={(e) => setPwdNew(e.target.value)}
                    type="password"
                    required
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Повторите пароль</label>
                  <input
                    value={pwdNewConfirm}
                    onChange={(e) => setPwdNewConfirm(e.target.value)}
                    type="password"
                    required
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm hover:bg-gray-700 transition"
                    onClick={() => setShowPwdModal(false)}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-semibold disabled:opacity-50 transition"
                  >
                    {pwdLoading ? "Сохранение..." : "Сменить пароль"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default ProfilePage;
