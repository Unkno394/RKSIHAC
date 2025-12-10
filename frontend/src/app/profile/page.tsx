"use client";

import React, { useEffect, useState } from "react";
import Prism from "@/shared/ui/Prism";
import { FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type Tab = "profile" | "security";

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [avatar, setAvatar] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [about, setAbout] = useState("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [avatarDefaults] = useState<string[]>(["/def1.png", "/def2.png", "/def3.png", "/def4.png"]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Нет токена — авторизуйтесь заново.");
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
        const persistedDefault = localStorage.getItem("avatar_default");
        let initialAvatar = data.avatar_url || null;
        if (!initialAvatar) {
          const chosen = persistedDefault || avatarDefaults[Math.floor(Math.random() * avatarDefaults.length)];
          localStorage.setItem("avatar_default", chosen);
          initialAvatar = chosen;
        }
        setAvatar(initialAvatar);
      } catch (err: any) {
        setError(err?.message || "Ошибка загрузки профиля");
      }
    };

    fetchProfile();
  }, []);

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
    } catch (err: any) {
      setError(err?.message || "Ошибка сохранения профиля");
    }
  };

  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showRepeatPwd, setShowRepeatPwd] = useState(false);

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white overflow-hidden">
      <button
        onClick={() => window.history.back()}
        className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 transition"
      >
        <FiArrowLeft className="w-4 h-4" />
        Назад
      </button>
      {/* Фоновая призма */}
      <div className="pointer-events-none absolute inset-0">
        <Prism animationType="rotate" suspendWhenOffscreen noise={0.35} scale={3.6} />
      </div>

      {/* Затемняющая плёнка */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-10 flex justify-center px-4 py-10 min-h-screen">
        <div className="w-full max-w-5xl grid gap-6 md:grid-cols-[260px,1fr]">
          {/* ЛЕВАЯ КОЛОНКА — ПРОФИЛЬ */}
          <aside className="bg-white/10 border border-white/20 rounded-3xl backdrop-blur-2xl p-6 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full bg-slate-200/90 flex items-center justify-center text-3xl text-slate-800 border shadow-xl overflow-hidden">
                {avatar ? (
                  <img src={avatar} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  "Упс"
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-400 cursor-pointer flex items-center justify-center border shadow-xl">
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

            <h2 className="text-base font-semibold">{fullName || "Без имени"}</h2>
            <p className="text-xs text-slate-300 mb-5">{email}</p>
          </aside>

          {/* ПРАВАЯ КОЛОНКА */}
          <section className="bg-white/10 border border-white/20 rounded-3xl backdrop-blur-2xl p-6 text-sm">
            {/* Табы */}
            <div className="flex gap-6 border-b border-white/20 pb-2 mb-6">
              <button
                className={`pb-2 border-b-2 text-sm ${
                  activeTab === "profile"
                    ? "border-sky-400 text-sky-200"
                    : "border-transparent text-slate-300 hover:text-white"
                }`}
                onClick={() => setActiveTab("profile")}
              >
                Профиль
              </button>
              <button
                className={`pb-2 border-b-2 text-sm ${
                  activeTab === "security"
                    ? "border-sky-400 text-sky-200"
                    : "border-transparent text-slate-300 hover:text-white"
                }`}
                onClick={() => setActiveTab("security")}
              >
                Пароль и e-mail
              </button>
            </div>

            {/* ========= ПРОФИЛЬ ========= */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded text-sm text-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded text-sm text-emerald-100">
                {success}
              </div>
            )}

            {activeTab === "profile" && (
              <form className="space-y-6" onSubmit={handleSaveProfile}>
                {/* Статистика */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-xl">
                    <p className="text-xs text-slate-200">Создано</p>
                    <p className="text-xl font-bold">32</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-xl">
                    <p className="text-xs text-slate-200">Будущие</p>
                    <p className="text-xl font-bold text-emerald-300">5</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-xl">
                    <p className="text-xs text-slate-200">Архив</p>
                    <p className="text-xl font-bold">18</p>
                  </div>
                </div>

                {/* Поля профиля */}
                <div className="grid grid-cols-2 gap-4">
                  
                  <div>
                    <label className="text-slate-200 text-xs">Отображаемое имя</label>
                    <input
                      className="w-full bg-white/10 border border-white/25 rounded-lg px-3 py-2 mt-1 text-sm"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-200 text-xs">О себе</label>
                  <textarea
                    className="w-full bg-white/10 border border-white/25 rounded-lg px-3 py-2 mt-1 text-sm"
                    rows={3}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
            
                </div>

                {/* Сохранить профиль */}
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="rounded-xl bg-sky-500/90 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/40 hover:bg-sky-400 transition"
                  >
                    Сохранить профиль
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="rounded-xl bg-red-500/90 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/40 hover:bg-red-400 transition"
                    onClick={() => {
                      localStorage.removeItem("access_token");
                      window.location.href = "/auth";
                    }}
                  >
                    Выйти из профиля 
                  </button>
                </div>
              </form>
            )}

            {/* ========= SECURITY ========= */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Смена email */}
                <form className="bg-white/5 border border-white/15 p-4 rounded-2xl space-y-4">
                  <h3 className="text-slate-200 font-semibold">Смена e-mail</h3>

                  <div>
                    <label className="text-slate-200 text-xs">Текущий e-mail</label>
                    <input
                      className="w-full bg-white/5 border border-white/25 rounded-lg px-3 py-2 mt-1 text-slate-400 text-sm"
                      value={currentEmail}
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-200 text-xs">Новый e-mail</label>
                      <input className="w-full bg-white/10 border border-white/25 rounded-lg px-3 py-2 mt-1 text-sm" />
                    </div>
                    <div>
                      <label className="text-slate-200 text-xs">Повтори e-mail</label>
                      <input className="w-full bg-white/10 border border-white/25 rounded-lg px-3 py-2 mt-1 text-sm" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-xl bg-sky-500/90 px-6 py-2 text-sm text-white shadow-lg shadow-sky-500/40 hover:bg-sky-400 transition"
                    >
                      Обновить e-mail
                    </button>
                  </div>
                </form>

                {/* Смена пароля */}
                <form className="bg-white/5 border border-white/15 p-4 rounded-2xl space-y-4">
                  <h3 className="text-slate-200 font-semibold">Смена пароля</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Текущий пароль */}
                    <div>
                      <label className="text-slate-200 text-xs">Текущий пароль</label>
                      <div className="relative mt-1">
                        <input
                          className="w-full bg-white/10 border border-white/25 rounded-lg px-3 py-2 pr-10 text-sm"
                          type={showCurrentPwd ? "text" : "password"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPwd((v) => !v)}
                          className="absolute inset-y-0 right-2 flex items-center text-slate-300 hover:text-white"
                        >
                          {showCurrentPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Новый пароль */}
                    <div>
                      <label className="text-slate-200 text-xs">Новый пароль</label>
                      <div className="relative mt-1">
                        <input
                          className="w-full bg-white/10 border border-white/25 rounded-lg px-3 py-2 pr-10 text-sm"
                          type={showNewPwd ? "text" : "password"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd((v) => !v)}
                          className="absolute inset-y-0 right-2 flex items-center text-slate-300 hover:text-white"
                        >
                          {showNewPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Повтори пароль */}
                    <div>
                      <label className="text-slate-200 text-xs">Повтори пароль</label>
                      <div className="relative mt-1">
                        <input
                          className="w-full bg-white/10 border border-white/25 rounded-lg px-3 py-2 pr-10 text-sm"
                          type={showRepeatPwd ? "text" : "password"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRepeatPwd((v) => !v)}
                          className="absolute inset-y-0 right-2 flex items-center text-slate-300 hover:text-white"
                        >
                          {showRepeatPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-xl bg-sky-500/90 px-6 py-2 text-sm text-white shadow-lg shadow-sky-500/40 hover:bg-sky-400 transition"
                    >
                      Обновить пароль
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
