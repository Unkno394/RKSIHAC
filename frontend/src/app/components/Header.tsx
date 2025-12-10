import React from 'react';

interface HeaderProps {
  isAuthed: boolean;
  setIsMenuOpen: (value: boolean) => void;
  isMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ isAuthed, setIsMenuOpen, isMenuOpen }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto max-w-6xl px-4 md:px-6 py-3 sm:py-4">
        <div className="glass-ios rounded-2xl border border-white/10 backdrop-blur-xl px-4 md:px-8 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          {/* ЛОГО (слева) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:block w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            <span className="text-lg md:text-xl font-semibold whitespace-nowrap max-[425px]:hidden">
              Афиша +
            </span>
          </div>

          {/* ПОИСК */}
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

          {/* ПРАВЫЙ БЛОК */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0 justify-end pr-1 sm:pr-2 h-full">
            <a
              href={isAuthed ? "/profile" : "/auth"}
              className="hidden md:inline-flex items-center text-white/80 hover:text-white transition-colors whitespace-nowrap text-sm md:text-base"
            >
              {isAuthed ? 'Профиль' : 'Вход'}
            </a>

            <a
              href="/my-events"
              className="
                hidden md:inline-flex items-center
                bg-white/10 backdrop-blur-sm px-4 md:px-6 py-2 rounded-full
                text-xs sm:text-sm font-medium hover:bg-white/20 transition whitespace-nowrap
              "
            >
              Мои события
            </a>

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
  );
};

export default Header;