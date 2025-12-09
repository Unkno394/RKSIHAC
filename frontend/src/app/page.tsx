"use client";

import React, { useEffect, useState, useRef } from "react";
import Prism from "@/components/Prism";
import { getAddressFromYandex, getLocationByIP } from "@/components/geocoder";

const HomePage: React.FC = () => {
  const [showIntro, setShowIntro] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("концерты");
  const [selectedCity, setSelectedCity] = useState<string>("Ростов");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // Состояния для геолокации
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'not_tried' | 'detecting' | 'success' | 'failed'>('not_tried');
  const [allCities, setAllCities] = useState<string[]>([
    "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
    "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов",
    "Уфа", "Красноярск", "Пермь", "Воронеж", "Волгоград"
  ]);
  
  // Реф для дропдауна
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  const categories = [
    "концерты", "театр", "стендап", "спорт", "кино", 
    "выставки", "фестивали", "детям", "образование", "экскурсии"
  ];

  const events = [
    {
      id: 1,
      title: "ROCK FEST 2025",
      date: "15 марта 2025",
      time: "19:00",
      place: "Стадион Динамо",
      city: "Ростов",
      price: 2500,
      category: "концерты",
      image: "https://images.unsplash.com/photo-1501281668745-f6f2616ba0a5?w=400&h=250&fit=crop"
    },
    {
      id: 2,
      title: "Щелкунчик",
      date: "20 марта 2025",
      time: "18:30",
      place: "Ростовский театр драмы",
      city: "Ростов",
      price: 1800,
      category: "театр",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=250&fit=crop"
    },
    {
      id: 3,
      title: "Стендап от Иванова",
      date: "12 апреля 2025",
      time: "20:00",
      place: "Comedy Club",
      city: "Ростов",
      price: 1200,
      category: "стендап",
      image: "https://images.unsplash.com/photo-1558008258-3256797b43f3?w-400&h=250&fit=crop"
    },
    {
      id: 4,
      title: "ФК Ростов - Спартак",
      date: "17 мая 2025",
      time: "16:00",
      place: "Ростов Арена",
      city: "Ростов",
      price: 3000,
      category: "спорт",
      image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&h=250&fit=crop"
    },
    {
      id: 5,
      title: "Премьера: Зимние грёзы",
      date: "14 июня 2025",
      time: "21:00",
      place: "Кинотеатр Плаза",
      city: "Ростов",
      price: 800,
      category: "кино",
      image: "https://images.unsplash.com/photo-1489599809516-9827b6d1cf13?w=400&h=250&fit=crop"
    },
    {
      id: 6,
      title: "Джазовый вечер",
      date: "18 июля 2025",
      time: "20:30",
      place: "Jazz Cafe",
      city: "Ростов",
      price: 1500,
      category: "концерты",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=250&fit=crop"
    },
    {
      id: 7,
      title: "Выставка Современного Искусства",
      date: "5 августа 2025",
      time: "10:00",
      place: "Галерея Искусств",
      city: "Ростов",
      price: 500,
      category: "выставки",
      image: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=250&fit=crop"
    },
    {
      id: 8,
      title: "Фестиваль Еды 2025",
      date: "22 сентября 2025",
      time: "12:00",
      place: "Парк Горького",
      city: "Ростов",
      price: 1000,
      category: "фестивали",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop"
    },
    {
      id: 9,
      title: "Детский спектакль: Алиса в Стране Чудес",
      date: "30 октября 2025",
      time: "15:00",
      place: "Театр Кукол",
      city: "Ростов",
      price: 700,
      category: "детям",
      image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=250&fit=crop"
    },
    {
      id: 10,
      title: "Мастер-класс по Фотографии",
      date: "11 ноября 2025",
      time: "14:00",
      place: "Арт-пространство",
      city: "Ростов",
      price: 1200,
      category: "образование",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=250&fit=crop"
    },
    {
      id: 11,
      title: "Ночная экскурсия по городу",
      date: "25 декабря 2025",
      time: "22:00",
      place: "Исторический центр",
      city: "Ростов",
      price: 900,
      category: "экскурсии",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop"
    },
    {
      id: 12,
      title: "Балет: Лебединое озеро",
      date: "8 января 2025",
      time: "19:30",
      place: "Театр Оперы и Балета",
      city: "Ростов",
      price: 2200,
      category: "театр",
      image: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&h=250&fit=crop"
    }
  ];

  // Функция для извлечения города из адреса
  const extractCityFromAddress = (address: string): string => {
    console.log("Извлекаем город из адреса:", address);
    
    // Разбиваем адрес на части
    const parts = address.split(',').map(part => part.trim());
    
    // Ищем город в разных частях адреса
    // Обычно город находится в начале или середине адреса
    for (let i = 0; i < Math.min(parts.length, 3); i++) {
      const part = parts[i];
      
      // Пропускаем мелкие части типа "ул.", "пр.", "д."
      if (part.length < 3 || 
          part.includes('ул.') || 
          part.includes('пр.') || 
          part.includes('д.') ||
          part.includes('улица') ||
          part.includes('проспект')) {
        continue;
      }
      
      // Если часть выглядит как город (начинается с заглавной, не число и т.д.)
      if (part.length > 2 && part[0] === part[0].toUpperCase()) {
        console.log("Найден возможный город:", part);
        return part;
      }
    }
    
    // Если не нашли город в начале, попробуем найти в любой части
    for (const part of parts) {
      if (part.length > 2 && part[0] === part[0].toUpperCase() && 
          !part.includes('ул.') && !part.includes('пр.') && !part.includes('д.')) {
        console.log("Найден город в другой части адреса:", part);
        return part;
      }
    }
    
    // Если ничего не нашли, возвращаем первую значимую часть
    for (const part of parts) {
      if (part.length > 2) {
        return part;
      }
    }
    
    return "Неизвестный город";
  };

  // ПРОСТАЯ ФУНКЦИЯ ОПРЕДЕЛЕНИЯ МЕСТОПОЛОЖЕНИЯ
  const detectUserLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError(null);
    setLocationStatus('detecting');
    setShowCityDropdown(true);

    console.log("Начинаем определение местоположения...");

    let detectedCity = "Ростов"; // Значение по умолчанию
    let detectionMethod = "default";

    try {
      // 1. Сначала пробуем браузерную геолокацию
      if (navigator.geolocation) {
        console.log("Браузерная геолокация доступна");
        
        const geoResult = await new Promise<string | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              console.log("Получили координаты от браузера:", position.coords);
              const { latitude, longitude } = position.coords;
              
              try {
                // Получаем адрес из координат
                console.log("Запрашиваем адрес у Яндекс...");
                const address = await getAddressFromYandex(latitude, longitude);
                console.log("Полный адрес от Яндекс:", address);
                
                // Извлекаем город из адреса
                const city = extractCityFromAddress(address);
                console.log("Извлеченный город:", city);
                
                resolve(city);
              } catch (error) {
                console.error("Ошибка геокодирования:", error);
                resolve(null);
              }
            },
            (error) => {
              console.warn("Браузерная геолокация не сработала:", error);
              resolve(null);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 0
            }
          );
        });

        if (geoResult && geoResult !== "Неизвестный город") {
          detectedCity = geoResult;
          detectionMethod = "geolocation";
        }
      }

      // 2. Если геолокация не сработала, пробуем IP
      if (detectionMethod === "default") {
        console.log("Пробуем определить по IP...");
        try {
          const location = await getLocationByIP();
          if (location && location.city && location.city !== "Неизвестно") {
            console.log("Получили локацию по IP:", location);
            detectedCity = location.city;
            detectionMethod = "ip";
          }
        } catch (ipError) {
          console.error("Ошибка IP-геолокации:", ipError);
        }
      }

      // 3. Обновляем состояние
      console.log("Итоговый город:", detectedCity, "Метод:", detectionMethod);
      
      setSelectedCity(detectedCity);
      
      // Добавляем город в список, если его там нет
      if (!allCities.includes(detectedCity)) {
        setAllCities(prev => [detectedCity, ...prev]);
      }
      
      // Сохраняем в localStorage
      localStorage.setItem('userCity', detectedCity);
      localStorage.setItem('userDetectionMethod', detectionMethod);
      
      if (detectionMethod !== "default") {
        setLocationStatus('success');
        setLocationError(null);
      } else {
        setLocationStatus('failed');
        setLocationError("Не удалось определить местоположение. Установлен Ростов по умолчанию.");
      }

    } catch (error) {
      console.error("Общая ошибка определения местоположения:", error);
      setSelectedCity("Ростов");
      setLocationStatus('failed');
      setLocationError("Ошибка определения. Установлен Ростов по умолчанию.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Обработчик клика вне дропдауна
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cityDropdownRef.current && 
        !cityDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // При загрузке проверяем сохраненный город
  useEffect(() => {
    const savedCity = localStorage.getItem('userCity');
    const savedMethod = localStorage.getItem('userDetectionMethod');
    setIsAuthed(Boolean(localStorage.getItem('access_token')));
    
    if (savedCity) {
      setSelectedCity(savedCity);
      if (savedMethod === 'geolocation' || savedMethod === 'ip') {
        setLocationStatus('success');
      }
      
      // Добавляем сохраненный город в список, если его там нет
      if (!allCities.includes(savedCity)) {
        setAllCities(prev => [savedCity, ...prev]);
      }
    } else {
      // Если нет сохраненного, ставим Ростов по умолчанию
      setSelectedCity("Ростов");
      setLocationStatus('not_tried');
    }
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem("hasSeenIntro");
    if (!seen) {
      setShowIntro(true);
    } else {
      setShowContent(true);
    }
  }, []);

  useEffect(() => {
    if (!showIntro) return;

    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2700);

    const hideTimer = setTimeout(() => {
      setShowIntro(false);
      setShowContent(true);
      localStorage.setItem("hasSeenIntro", "true");
    }, 3200);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(hideTimer);
    };
  }, [showIntro]);

  const closeMenu = () => setIsMenuOpen(false);

  // Для отображения событий - используем Ростов как дефолт, если город не российский
  const displayCityForEvents = allCities.includes(selectedCity) ? selectedCity : "Ростов";
  
  const filteredEvents = events.filter(event => 
    event.category === selectedCategory && 
    event.city === displayCityForEvents
  );

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white overflow-hidden">
      {/* Фоновая призма на весь экран - ВСЕГДА ВИДНА */}
      <div className="pointer-events-none absolute inset-0">
        <Prism animationType="rotate" scale={3.6} suspendWhenOffscreen noise={0} />
      </div>

      {/* ХЕДЕР ВСЕГДА ВИДЕН */}
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
                href="/events"
                className="
                  hidden md:inline-flex items-center
                  bg-white/10 backdrop-blur-sm px-4 md:px-6 py-2 rounded-full
                  text-xs sm:text-sm font-medium hover:bg-white/20 transition whitespace-nowrap
                "
              >
                Мои события
              </a>

              <a
                href="/my-tickets"
                className="hidden md:inline-flex items-center text-white/80 hover:text-white transition-colors whitespace-nowrap text-sm md:text-base ml-2"
              >
                Мои билеты
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

      {/* Интро текст с плавным исчезновением - ПЕРЕКРЫВАЕТ ВСЁ, КРОМЕ ХЕДЕРА И ПРИЗМЫ */}
      {showIntro && (
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center transition-all duration-500 ${
            isFadingOut ? "opacity-0" : "opacity-100"
          }`}
          style={{
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            background: "linear-gradient(to bottom, rgba(2, 6, 23, 0.85) 0%, rgba(15, 23, 42, 0.85) 50%, rgba(2, 6, 23, 0.85) 100%)"
          }}
        >
          <div
            className={`text-center space-y-6 transition-all duration-500 ${
              isFadingOut
                ? "opacity-0 translate-y-4 scale-95"
                : "opacity-100 translate-y-0 scale-100"
            }`}
            style={{
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <p className="text-sm uppercase tracking-[0.4em] text-slate-300">
              my afisha
            </p>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Вдохновение начинается здесь
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Добро пожаловать в афишу событий. Скоро здесь появятся концерты,
              выставки и многое другое.
            </p>
          </div>
        </div>
      )}

      {/* Мобильное меню */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden">
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
          <a
            href="/my-tickets"
            onClick={closeMenu}
            className="text-lg font-medium px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15"
          >
            Мои билеты
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

      {/* ОСНОВНОЙ КОНТЕНТ - ПЛАВНО ПОЯВЛЯЕТСЯ ПОСЛЕ ИНТРО */}
      {showCityDropdown && (
        <div
          className="fixed inset-0  z-40"
          onClick={() => setShowCityDropdown(false)}
        />
      )}
      <div className={`relative z-10 min-h-screen pt-28 pb-20 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="mx-auto max-w-6xl px-4">
          {/* Прозрачная херня типа как в поиске - посередине */}
          <div className="glass-ios border  border-white/10 backdrop-blur-xl p-6 mb-8 w-full" style={{ borderRadius: '8px' }}>
            {/* Город - сверху */}
            <div className="mb-6 " >
              <div className=" relative" ref={cityDropdownRef}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 ">
                  <div className=" inline-block">
                    <button
                      onClick={() => setShowCityDropdown(!showCityDropdown)}
                      className="flex  items-center justify-between glass-ios px-4 py-3 border border-white/20 backdrop-blur-md hover:bg-white/15 transition-all"
                      style={{ borderRadius: '8px' }}
                      disabled={isDetectingLocation}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5  h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-medium text-white  whitespace-nowrap">
                          {isDetectingLocation ? (
                            <span className="flex items-center gap-2">
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                              Определяем...
                            </span>
                          ) : (
                            selectedCity
                          )}
                        </span>
                      </div>
                      <svg 
                        className={`w-4 h-4 shrink-0  transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showCityDropdown && (
                      <div
                        className="absolute bg-black/90 top-full left-0 glass-ios border border-white/20 backdrop-blur-xl z-50 shadow-lg mt-1 custom-scrollbar overflow-y-auto"
                        style={{
                          borderRadius: '8px',
                          maxHeight: '60vh',
                          minWidth: '180px',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={detectUserLocation}
                          disabled={isDetectingLocation}
                          className="block w-full text-left px-4 py-3 hover:bg-white/10 transition-all border-b border-white/10 flex items-center gap-2"
                        >
                          {isDetectingLocation ? (
                            <>
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                              <span>Определяем местоположение...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Определить мое местоположение</span>
                            </>
                          )}
                        </button>

                        {locationStatus === 'success' && (
                          <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20">
                            <div className="text-xs text-green-300 font-medium">
                              ✓ Местоположение определено: {selectedCity}
                            </div>
                          </div>
                        )}

                        {locationError && (
                          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
                            <div className="text-xs text-red-300">
                              {locationError}
                            </div>
                          </div>
                        )}

                        <div className="px-4 py-2 bg-blue-500/5 border-b border-blue-500/10">
                          <div className="text-xs text-white/70">
                            {allCities.length > 15 ? "Последние и популярные города:" : "Выберите город:"}
                          </div>
                        </div>

                        {allCities.map(city => (
                          <button
                            key={city}
                            onClick={() => {
                              setSelectedCity(city);
                              setShowCityDropdown(false);
                              localStorage.setItem('userCity', city);
                              setLocationStatus('not_tried');
                              setLocationError(null);
                            }}
                            className="block w-full text-left px-4 py-3 hover:bg-white/10 transition-all border-b border-white/10 last:border-b-0 whitespace-nowrap"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-medium ${selectedCity === city ? 'text-blue-300' : 'text-white/90'}`}>
                                {city}
                                {city === "Ростов" && " (по умолчанию)"}
                              </span>
                              {selectedCity === city && (
                                <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

{/* Close the dropdown if clicked outside */}
{showCityDropdown && (
  <div 
    className="fixed inset-0 z-40"
    onClick={() => setShowCityDropdown(false)} // Close the menu if clicked outside
  />
)}

                  </div>
                  
                  {/* Индикатор статуса */}
                  {locationStatus === 'success' && !showCityDropdown && (
                    <div className="text-sm text-green-300 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Ваш город: {selectedCity}
                    </div>
                  )}
                  
                  {locationStatus === 'failed' && !showCityDropdown && (
                    <div className="text-sm text-yellow-300 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.196 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Ростов по умолчанию
                    </div>
                  )}
                </div>
                
                {locationError && !showCityDropdown && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="text-sm text-red-300 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.196 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      {locationError}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Категории */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Категории событий</h2>
              <div className="flex flex-wrap gap-3">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`
                      px-4 py-2 rounded-md text-sm font-medium transition
                      ${selectedCategory === category 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' 
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                      }
                    `}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Рекомендации - заголовок */}
            <div className="mb-3">
              <div className="relative inline-block ml-auto">
                <h2 className="text-2xl font-bold">Рекомендации для вас</h2>
                <span className="text-sm text-white/60">
                  {displayCityForEvents === "Ростов" && selectedCity !== "Ростов" 
                    ? `В Ростове (ваш город ${selectedCity} не в базе)`
                    : `В ${displayCityForEvents.toLowerCase()}`
                  }, {categories.find(c => c === selectedCategory)}
                </span>
              </div>
            </div>
          </div>

          {/* Карточки с событиями */}
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <div 
                  key={event.id} 
                  onClick={() => (window.location.href = '/events')}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 cursor-pointer"
                >
                  {/* Изображение события */}
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 rounded-full bg-black/70 text-xs font-medium">
                        {event.price.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>

                  {/* Контент карточки */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase tracking-wider text-blue-400 font-medium">
                        {event.category}
                      </span>
                      <span className="text-xs text-white/60">
                        {event.city}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-300 transition-colors">
                      {event.title}
                    </h3>
                    
                    <p className="text-sm text-white/70 mb-4">
                      {event.place}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="text-white/90">{event.date}</div>
                        <div className="text-white/60">в {event.time}</div>
                      </div>
                      
                      <button className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-sm font-medium hover:opacity-90 transition-opacity">
                        Купить билет
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <div className="text-white/40 text-lg mb-2">😕</div>
                <h3 className="text-xl font-semibold mb-2">Событий не найдено</h3>
                <p className="text-white/60">
                  {displayCityForEvents === "Ростов" && selectedCity !== "Ростов" 
                    ? `В Ростове нет событий в категории "${selectedCategory}" (ваш город ${selectedCity} не в базе)`
                    : `В городе ${displayCityForEvents} нет событий в категории "${selectedCategory}"`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Ещё рекомендации */}
          <div className="glass-ios border border-white/10 backdrop-blur-xl p-6 mb-8" style={{ borderRadius: '8px' }}>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Популярное в 2025
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {events.slice(0, 4).map(event => (
                <div 
                  key={`popular-${event.id}`} 
                  onClick={() => (window.location.href = '/events')}
                  className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-blue-500/30 transition hover:bg-white/10 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-xs uppercase tracking-wider text-sky-400 font-medium">
                      {event.category}
                    </span>
                    <span className="text-xs font-semibold">{event.price.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <h4 className="font-medium mb-2 line-clamp-2">{event.title}</h4>
                  <p className="text-xs text-white/60 mb-4">{event.date}</p>
                  <button className="w-full py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition">
                    Подробнее
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка "Мои билеты" для мобильных - тоже плавно появляется */}
      <a
        href="/my-tickets"
        className={`fixed bottom-6 right-6 md:hidden z-30 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 font-medium shadow-lg hover:shadow-xl transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        Мои билеты
      </a>
    </main>
  );
};

export default HomePage;
