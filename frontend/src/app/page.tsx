"use client";

import React, { useEffect, useState, useRef } from "react";
import Prism from "@/shared/ui/Prism";
import { getAddressFromYandex, getLocationByIP } from "@/shared/lib/geocoder";
import Header from "./components/Header";
import CitySelector from "./components/CitySelector";
import CategorySelector from "./components/CategorySelector";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const HomePage: React.FC = () => {
  const [showIntro, setShowIntro] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("концерты");
  const [selectedCity, setSelectedCity] = useState<string>("Ростов");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'not_tried' | 'detecting' | 'success' | 'failed'>('not_tried');
  const [allCities, setAllCities] = useState<string[]>([
    "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
    "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов",
    "Уфа", "Красноярск", "Пермь", "Воронеж", "Волгоград"
  ]);
  const [events, setEvents] = useState<CardEvent[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setIsMenuOpen(false);

  const categories = [
    "концерты", "театр", "стендап", "спорт", "кино", 
    "выставки", "фестивали", "детям", "образование", "экскурсии", "прочее"
  ];

  type ApiEvent = {
    id: string;
    title: string;
    short_description?: string | null;
    description: string;
    start_date: string;
    end_date: string;
    image_url: string;
    city: string;
    status: string;
    category?: string;
  };

  type CardEvent = {
    id: string;
    title: string;
    date: string;
    time: string;
    city: string;
    category: string;
    image: string;
    place: string;
    price?: number;
  };

  const extractCityFromAddress = (address: string): string => {
    console.log("Извлекаем город из адреса:", address);
    
    const parts = address.split(',').map(part => part.trim());
    
    for (let i = 0; i < Math.min(parts.length, 3); i++) {
      const part = parts[i];
      
      if (part.length < 3 || 
          part.includes('ул.') || 
          part.includes('пр.') || 
          part.includes('д.') ||
          part.includes('улица') ||
          part.includes('проспект')) {
        continue;
      }
      
      if (part.length > 2 && part[0] === part[0].toUpperCase()) {
        console.log("Найден возможный город:", part);
        return part;
      }
    }
    
    for (const part of parts) {
      if (part.length > 2 && part[0] === part[0].toUpperCase() && 
          !part.includes('ул.') && !part.includes('пр.') && !part.includes('д.')) {
        console.log("Найден город в другой части адреса:", part);
        return part;
      }
    }
    
    for (const part of parts) {
      if (part.length > 2) {
        return part;
      }
    }
    
    return "Неизвестный город";
  };

  const detectUserLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError(null);
    setLocationStatus('detecting');
    setShowCityDropdown(true);

    console.log("Начинаем определение местоположения...");

    let detectedCity = "Ростов";
    let detectionMethod = "default";

    try {
      if (navigator.geolocation) {
        console.log("Браузерная геолокация доступна");
        
        const geoResult = await new Promise<string | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              console.log("Получили координаты от браузера:", position.coords);
              const { latitude, longitude } = position.coords;
              
              try {
                console.log("Запрашиваем адрес у Яндекс...");
                const address = await getAddressFromYandex(latitude, longitude);
                console.log("Полный адрес от Яндекс:", address);
                
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

      console.log("Итоговый город:", detectedCity, "Метод:", detectionMethod);
      
      setSelectedCity(detectedCity);
      
      if (!allCities.includes(detectedCity)) {
        setAllCities(prev => [detectedCity, ...prev]);
      }
      
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

  useEffect(() => {
    const savedCity = localStorage.getItem('userCity');
    const savedMethod = localStorage.getItem('userDetectionMethod');
    const token = localStorage.getItem('access_token');
    setAccessToken(token);
    setIsAuthed(Boolean(token));
    
    if (savedCity) {
      setSelectedCity(savedCity);
      if (savedMethod === 'geolocation' || savedMethod === 'ip') {
        setLocationStatus('success');
      }
      
      if (!allCities.includes(savedCity)) {
        setAllCities(prev => [savedCity, ...prev]);
      }
    } else {
      setSelectedCity("Ростов");
      setLocationStatus('not_tried');
    }
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const res = await fetch(`${API_URL}/auth/events`);
        if (!res.ok) throw new Error("Не удалось загрузить события");
        const data: ApiEvent[] = await res.json();
        const mapped: CardEvent[] = data.map((e) => {
          const dateObj = e.start_date ? new Date(e.start_date) : null;
          return {
            id: e.id,
            title: e.title,
            date: dateObj ? dateObj.toLocaleDateString("ru-RU") : "",
            time: dateObj ? dateObj.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "",
            city: e.city || "Неизвестно",
            category: e.category || "прочее",
            image: e.image_url || "https://images.unsplash.com/photo-1501281668745-f6f2616ba0a5?w=400&h=250&fit=crop",
            place: e.short_description || e.description?.slice(0, 60) || "Событие",
          };
        });
        setEvents(mapped);
        const citiesFromEvents = mapped.map((e) => e.city).filter(Boolean);
        setAllCities((prev) => Array.from(new Set([...prev, ...citiesFromEvents])));
      } catch (err: any) {
        setEventsError(err?.message || "Ошибка загрузки событий");
      } finally {
        setEventsLoading(false);
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) {
        setIsAdmin(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          setIsAdmin(false);
          return;
        }
        const data = await res.json();
        setIsAdmin(data?.role === "ADMIN");
      } catch (err) {
        console.error("Не удалось получить профиль", err);
        setIsAdmin(false);
      }
    };
    fetchProfile();
  }, [accessToken]);

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

  const displayCityForEvents = allCities.includes(selectedCity) ? selectedCity : "Ростов";
  
  const filteredEvents = events.filter(event => {
    const cityMatch = event.city.toLowerCase() === displayCityForEvents.toLowerCase();
    const categoryMatch = !event.category || event.category === selectedCategory || selectedCategory === "прочее";
    return cityMatch && categoryMatch;
  });

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white overflow-hidden">
      {/* Фоновая призма */}
      <div className="pointer-events-none absolute inset-0">
        <Prism animationType="rotate" scale={3.6} suspendWhenOffscreen noise={0} />
      </div>

      {/* Хедер */}
      <Header isAuthed={isAuthed} setIsMenuOpen={setIsMenuOpen} isMenuOpen={isMenuOpen} />

      {/* Кнопка "Режим админа" для экранов 768px-1459px (под хедером, ниже) */}
      {isAdmin && (
        <>
          {/* Кнопка "Режим админа" для экранов 768px-1459px (под хедером, ниже) */}
          <div className="hidden md:block xl:hidden">
            <a
              href="/admin"
              className="fixed top-20 right-6 z-[60] px-6 py-3 rounded-full bg-orange-500 font-medium text-sm text-white shadow-lg hover:bg-orange-400 transition-all duration-300"
            >
              Режим админа
            </a>
          </div>

          {/* Кнопка "Режим админа" для экранов 1460px+ (рядом с хедером) */}
          <div className="hidden xl:block">
            <a
              href="/admin"
              className="fixed top-6 right-6 z-[60] px-6 py-3 rounded-full bg-orange-500 font-medium text-sm text-white shadow-lg hover:bg-orange-400 transition-all duration-300"
            >
              Режим админа
            </a>
          </div>
        </>
      )}

      {/* Интро */}
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
          {isAdmin && (
            <a
              href="/admin"
              onClick={closeMenu}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-orange-500 text-white text-sm font-medium shadow-lg hover:scale-105 transition"
              aria-label="Режим админа"
            >
              Режим админа
            </a>
          )}
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
      <div className={`relative z-10 min-h-screen transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Разные отступы сверху для разных экранов */}
        <div className="pt-28 pb-20 md:pt-[160px] xl:pt-28">
          <div className="mx-auto max-w-6xl px-4">
            {/* Прозрачный контейнер */}
            <div className="glass-ios border border-white/10 backdrop-blur-xl p-6 mb-8 w-full" style={{ borderRadius: '8px' }}>
              {/* Город */}
            <div className="relative z-30">
              <CitySelector
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                allCities={allCities}
                isDetectingLocation={isDetectingLocation}
                detectUserLocation={detectUserLocation}
                showCityDropdown={showCityDropdown}
                setShowCityDropdown={setShowCityDropdown}
                locationStatus={locationStatus}
                locationError={locationError}
              />
            </div>

              {/* Категории */}
              <CategorySelector
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />

              {/* Рекомендации */}
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

<div className="mb-12 relative -z-10">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventsLoading && (
                  <div className="col-span-full text-center text-white/70 py-6">Загрузка событий...</div>
                )}
                {eventsError && (
                  <div className="col-span-full text-center text-red-300 py-4">{eventsError}</div>
                )}
                {!eventsLoading && !eventsError && filteredEvents.map(event => (
                  <div 
                    key={event.id} 
                    onClick={() => (window.location.href = `/events/${event.id}`)}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 cursor-pointer"
                  >
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={event.image} 
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

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
                        {event.place || "Событие"}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <div className="text-white/90">{event.date}</div>
                          <div className="text-white/60">{event.time ? `в ${event.time}` : ""}</div>
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

            {/* Популярное */}
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
      </div>

      {/* Кнопка "Мои билеты" для мобильных */}
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
