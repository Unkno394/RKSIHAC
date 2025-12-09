"use client";

import { useState } from "react";
import LightRays from "@/components/LightRays";

type TicketType = "entry" | "table" | "vip";

interface Ticket {
  id: number;
  type: TicketType;
  title: string;
  description: string;
  price: number;
  includes: string[];
}

const event = {
  title: "VEGAS NIGHT PARTY",
  date: "21 февраля 2025",
  time: "22:00",
  place: "VEGAS LOUNGE BAR",
  city: "Санкт-Петербург",
  address: "Невский проспект, 15",
};

const tickets: Ticket[] = [
  {
    id: 1,
    type: "entry",
    title: "Входной билет",
    description: "Стандартный вход на мероприятие",
    price: 700,
    includes: ["Вход на вечер", "Доступ к основному залу"],
  },
  {
    id: 2,
    type: "table",
    title: "Бронь стола",
    description: "Комфортное место у сцены",
    price: 3000,
    includes: ["Стол до 4 человек", "Обслуживание", "Приоритетная посадка"],
  },
  {
    id: 3,
    type: "vip",
    title: "VIP-зона",
    description: "Максимальный комфорт и атмосфера",
    price: 7000,
    includes: [
      "Отдельная VIP-зона",
      "Личный официант",
      "Приветственный напиток",
    ],
  },
];

export default function EventPage() {
  const [ticketCounts, setTicketCounts] = useState<Record<number, number>>(
    () => Object.fromEntries(tickets.map((t) => [t.id, 0]))
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleChangeCount = (id: number, delta: number) => {
    setTicketCounts((prev) => {
      const current = prev[id] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const total = tickets.reduce(
    (sum, t) => sum + t.price * (ticketCounts[t.id] ?? 0),
    0
  );

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <main className="relative min-h-screen w-full bg-[#020616] text-slate-50 overflow-hidden">
      {/* фон с лучами */}
      <div className="pointer-events-none absolute inset-0">
        <LightRays
          className="opacity-70"
          raysOrigin="top-center"
          raysColor="#4fd1ff"
          raysSpeed={0.6}
          lightSpread={1.2}
          rayLength={4}
          fadeDistance={1.4}
          saturation={1.1}
          followMouse
          mouseInfluence={0.25}
          noiseAmount={0.08}
          distortion={0.05}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.32)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.25)_0,_transparent_60%)]" />
      </div>

      {/* ХЕДЕР В СТЕКЛЯННОМ КОМПОНЕНТЕ — ВСЁ ВНУТРИ */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <nav className="mx-auto max-w-6xl px-4 md:px-6 py-3 sm:py-4">
          <div className="glass-ios rounded-2xl border border-white/10 backdrop-blur-xl px-4 md:px-8 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
            {/* ЛОГО (слева) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* иконка скрывается при <=768px */}
              <div className="hidden md:block w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
              <span className="text-lg md:text-xl font-semibold whitespace-nowrap max-[425px]:hidden">
                Афиша +
              </span>
            </div>

            {/* ПОИСК — АДАПТИВНЫЙ, ПРОЦЕНТНЫЙ, НЕ ВЫХОДИТ ИЗ ХЕДЕРА */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 w-full max-w-[520px] mx-auto sm:mx-0">
                <div className="flex items-center gap-3 w-full glass-ios px-4 md:px-5 py-2 rounded-full border border-white/10 backdrop-blur-md transition-all hover:bg-white/10">
                  <svg
                    className="w-5 h-5 text-white/80 shrink-0 max-[425px]:w-4 max-[425px]:h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                    />
                  </svg>

                  <input
                    type="text"
                    placeholder="Поиск"
                    className="
                      bg-transparent
                      outline-none
                      text-white placeholder-white/60
                      w-full
                      text-sm sm:text-base
                      max-[425px]:text-sm max-[425px]:placeholder:text-xs
                    "
                  />
                </div>
              </div>
            </div>

            {/* ПРАВЫЙ БЛОК — ПРИЖАТ К ПРАВОМУ КРАЮ, ВЫСОТА = ХЕДЕРУ */}
            <div className="flex items-center gap-3 md:gap-4 shrink-0 justify-end pr-1 sm:pr-2 h-full">
              {/* На >=768px: показываем Вход/Мои события */}
              <a
                href="/auth"
                className="hidden md:inline-flex items-center text-white/80 hover:text-white transition-colors whitespace-nowrap text-sm md:text-base"
              >
                Вход
              </a>

              <a
                href="/events"
                className="
                  hidden md:inline-flex items-center
                  bg-white/10 backdrop-blur-sm px-4 md:px-6 py-2 rounded-full
                  text-xs sm:text-sm font-medium hover:bg-white/20 transition whitespace-nowrap
                "
              >
                Мои события
              </a>

              {/* На <768px: только бургер БЕЗ КРУГА */}
              <button
                type="button"
                onClick={() => setIsMenuOpen((v) => !v)}
                className="
                  inline-flex md:hidden items-center justify-center
                  h-full px-1
                "
                aria-label="Меню"
              >
                <span className="relative block w-6 h-4">
                  <span
                    className={`absolute left-0 right-0 h-[2px] rounded-full bg-white transition-transform ${
                      isMenuOpen
                        ? "top-1/2 -translate-y-1/2 rotate-45"
                        : "top-0 translate-y-0"
                    }`}
                  />
                  <span
                    className={`absolute left-0 right-0 h-[2px] rounded-full bg-white transition-opacity ${
                      isMenuOpen ? "opacity-0" : "opacity-100 top-1/2 -translate-y-1/2"
                    }`}
                  />
                  <span
                    className={`absolute left-0 right-0 h-[2px] rounded-full bg-white transition-transform ${
                      isMenuOpen
                        ? "top-1/2 -translate-y-1/2 -rotate-45"
                        : "bottom-0 translate-y-0"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Мобильное меню (для бургеров <768) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden">
          <a
            href="/auth"
            onClick={closeMenu}
            className="text-lg font-medium px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15"
          >
            Вход
          </a>
          <a
            href="/events"
            onClick={closeMenu}
            className="text-lg font-medium px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15"
          >
            Мои события
          </a>
          <button
            type="button"
            onClick={closeMenu}
            className="mt-4 text-sm text-white/60 underline underline-offset-4"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* контент под фиксированным хедером */}
      <div
        className="
          relative z-10 mx-auto w-full
          max-w-5xl
          px-4
          pt-28 pb-6
          sm:pt-32 sm:pb-10
          md:pt-36
        "
      >
        {/* карточка события */}
        <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 sm:p-6 backdrop-blur-xl shadow-[0_0_35px_rgba(15,23,42,0.9)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-400/70 mb-2">
                {event.city}
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-wide text-slate-50">
                {event.title}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                {event.place} · {event.address}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {event.date} · начало в {event.time}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full bg-emerald-500/15 border border-emerald-400/40 px-3 py-1 text-xs font-medium text-emerald-200">
                Свободно мест: достаточно
              </span>
              <span className="text-[11px] text-slate-400">
                18+ • dress code welcome
              </span>
            </div>
          </div>
        </section>

        {/* билеты */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
            Выберите билеты
          </h2>

          <div className="space-y-3">
            {tickets.map((ticket) => {
              const count = ticketCounts[ticket.id] ?? 0;
              return (
                <div
                  key={ticket.id}
                  className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3.5 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4"
                >
                  <div className="absolute inset-0 pointer-events-none opacity-60">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22)_0,_transparent_55%)]" />
                  </div>

                  <div className="relative flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex rounded-full border border-sky-400/50 bg-sky-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-sky-200">
                        {ticket.type === "entry"
                          ? "Вход"
                          : ticket.type === "table"
                          ? "Стол"
                          : "VIP"}
                      </span>
                      {ticket.type === "vip" && (
                        <span className="text-[10px] text-amber-300/90 uppercase tracking-[0.18em]">
                          limited
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-50">
                      {ticket.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {ticket.description}
                    </p>
                    <ul className="mt-1.5 flex flex-wrap gap-2">
                      {ticket.includes.map((item, i) => (
                        <li
                          key={i}
                          className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700/70"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="relative flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-sky-200 tabular-nums">
                        {ticket.price.toLocaleString("ru-RU")} ₽
                      </p>
                      <p className="text-[11px] text-slate-400">за единицу</p>
                    </div>

                    {/* КНОПКИ - / + */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleChangeCount(ticket.id, -1)}
                        disabled={count === 0}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center text-base font-semibold transition
                          ${
                            count === 0
                              ? "border-slate-700 bg-slate-900/60 text-slate-500 cursor-not-allowed"
                              : "border-sky-400/70 bg-sky-500/10 text-sky-100 hover:bg-sky-400/30 hover:border-sky-300/90 active:scale-95"
                          }`}
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium tabular-nums text-slate-50">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleChangeCount(ticket.id, 1)}
                        className="w-9 h-9 rounded-full border border-sky-400/70 bg-sky-500/10 text-sky-100 text-base font-semibold flex items-center justify-center hover:bg-sky-400/30 hover:border-sky-300/90 active:scale-95 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* нижняя панель с итогом */}
        <footer className="sticky bottom-0 mt-6 -mx-4 px-4 pb-4 pt-3 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent backdrop-blur-md">
          <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800/90 bg-slate-950/90 px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_18px_40px_rgba(15,23,42,0.95)]">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                Итого
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-semibold text-sky-200 tabular-nums">
                  {total.toLocaleString("ru-RU")} ₽
                </span>
                <span className="text-[11px] text-slate-400">
                  выбрано билетов:{" "}
                  {Object.values(ticketCounts).reduce(
                    (sum, v) => sum + (v ?? 0),
                    0
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/70 bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-slate-50 shadow-[0_0_28px_rgba(56,189,248,0.9)] hover:brightness-110 hover:shadow-[0_0_40px_rgba(56,189,248,1)] active:scale-95 transition"
            >
              Перейти к оформлению
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
