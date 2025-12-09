"use client";

import Prism from "@/components/Prism";

const HomePage = () => {
  return (
    <main className="relative min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white overflow-hidden">
      {/* Фоновая призма на весь экран */}
      <div className="pointer-events-none absolute inset-0">
        <Prism
          animationType="rotate"
          scale={3.6}
          suspendWhenOffscreen
          noise={0}
          // можно усилить синий ещё сильнее, если хочешь:
          // hueShift={-2.6}
          // colorFrequency={0.6}
        />
      </div>

      {/* Контент поверх */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3 px-4">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-300">
            my afisha
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Вдохновение начинается здесь
          </h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto">
            Добро пожаловать в афишу событий. Скоро здесь появятся концерты,
            выставки и многое другое.
          </p>
        </div>
      </div>
    </main>
  );
};

export default HomePage;
