"use client";

import React, { useEffect, useState, useRef } from "react";
import Prism from "@/shared/ui/Prism";
import { getAddressFromYandex, getLocationByIP } from "@/shared/lib/geocoder";
import Header from "./components/Header";
import CitySelector from "./components/CitySelector";
import CategorySelector from "./components/CategorySelector";
import { 
  FiCalendar, 
  FiUsers, 
  FiMapPin, 
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiStar,
  FiChevronRight
} from "react-icons/fi";

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
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  const closeMenu = () => setIsMenuOpen(false);
  const classifyCategories = (title: string, description: string) => {
    const text = `${title} ${description}`.toLowerCase();
    const hits = new Set<string>();

    const pushIf = (cat: string, keywords: string[]) => {
      if (keywords.some((k) => text.includes(k))) hits.add(cat);
    };

    pushIf("концерты", ["концерт", "music", "музыка", "группа", "dj", "оркестр", "live", "jam"]);
    pushIf("театр", ["театр", "постановка", "пьеса", "спектакл", "опер", "балет", "драма"]);
    pushIf("стендап", ["стендап", "standup", "комед", "юмор", "improv"]);
    pushIf("спорт", ["спорт", "футбол", "баскет", "хоккей", "турнир", "матч", "забег", "гонка"]);
    pushIf("кино", ["кино", "фильм", "сеанс", "показ", "premiere", "premier"]);
    pushIf("выставки", ["выставк", "галере", "art", "арт", "экспозиция", "музей"]);
    pushIf("фестивали", ["фестиваль", "fest", "ярмарка", "open air", "open-air"]);
    pushIf("детям", ["дет", "kid", "family", "семей", "мульт", "школь"]);
    pushIf("образование", ["лекци", "образован", "курс", "семинар", "мастер", "workshop", "тренинг"]);
    pushIf("экскурсии", ["экскурс", "tour", "прогулка", "путешеств", "гид", "trip"]);
    // митапы/встречи отнесём к образованию/комьюнити
    pushIf("образование", ["митап", "meetup", "community", "сообщество", "встреча"]);

    if (!hits.size) hits.add("прочее");
    return Array.from(hits);
  };

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
    max_participants?: number | null;
    participants: string[];
    payment_info?: string | null;
    price?: number;
  };

  type CardEvent = {
    id: string;
    title: string;
    date: string;
    time: string;
    startDate?: string;
    endDate?: string;
    city: string;
    category: string;
    categories?: string[];
    image: string;
    place: string;
    status?: string;
    maxParticipants?: number | null;
    participantsCount?: number;
    price?: number;
    shortDescription?: string;
    description?: string;
    isFull?: boolean;
    ratingAvg?: number;
    ratingCount?: number;
  };

  const [myEvents, setMyEvents] = useState<CardEvent[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<CardEvent[]>([]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  useEffect(() => {
    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const res = await fetch(`${API_URL}/auth/events`);
        if (!res.ok) throw new Error("Не удалось загрузить события");
        const data: ApiEvent[] = await res.json();
        const mapped: CardEvent[] = data.map((e) => {
          const rating = ratingsCache[e.id];
          const isFull = e.max_participants ? e.participants.length >= e.max_participants : false;
          const inferred = classifyCategories(e.title || "", e.description || e.short_description || "");
          const category = e.category && e.category !== "прочее" ? e.category : inferred[0] || "прочее";
          return {
            id: e.id,
            title: e.title,
            date: e.start_date ? formatDate(e.start_date) : "",
            time: e.start_date ? formatTime(e.start_date) : "",
            startDate: e.start_date,
            endDate: e.end_date,
            city: e.city || "Неизвестно",
            category,
            categories: inferred,
            image: e.image_url || "/events.png",
            place: e.short_description || e.description?.slice(0, 60) || "Событие",
            status: e.status,
            maxParticipants: e.max_participants ?? null,
            participantsCount: e.participants.length,
            price: e.price,
            shortDescription: e.short_description || "",
            description: e.description,
            isFull,
            ratingAvg: rating?.avg,
            ratingCount: rating?.count,
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

  // Периодический опрос для подхвата новых/изменённых событий (fallback, если WS не прислал)
  useEffect(() => {
    let stop = false;
    const controller = new AbortController();

    const refresh = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/events`, { signal: controller.signal });
        if (!res.ok) return;
        const data: ApiEvent[] = await res.json();
        if (stop) return;
        const mapped: CardEvent[] = data.map((e) => {
          const rating = ratingsCache[e.id];
          const isFull = e.max_participants ? e.participants.length >= e.max_participants : false;
          const inferred = classifyCategories(e.title || "", e.description || e.short_description || "");
          const category = e.category && e.category !== "прочее" ? e.category : inferred[0] || "прочее";
          return {
            id: e.id,
            title: e.title,
            date: e.start_date ? formatDate(e.start_date) : "",
            time: e.start_date ? formatTime(e.start_date) : "",
            startDate: e.start_date,
            endDate: e.end_date,
            city: e.city || "Неизвестно",
            category,
            categories: inferred,
            image: e.image_url || "/events.png",
            place: e.short_description || e.description?.slice(0, 60) || "Событие",
            status: e.status,
            maxParticipants: e.max_participants ?? null,
            participantsCount: e.participants.length,
            price: e.price,
            shortDescription: e.short_description || "",
            description: e.description,
            isFull,
            ratingAvg: rating?.avg,
            ratingCount: rating?.count,
          };
        });
        setEvents(mapped);
        const citiesFromEvents = mapped.map((e) => e.city).filter(Boolean);
        setAllCities((prev) => Array.from(new Set([...prev, ...citiesFromEvents])));
      } catch {
        /* ignore polling errors */
      }
    };

    const interval = setInterval(refresh, 15000);
    refresh();

    return () => {
      stop = true;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(
      /^http/,
      "ws"
    );
    const socket = new WebSocket(`${wsUrl}/ws/events`);

    socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "participant" && data.event_id) {
          setEvents((prev) =>
            prev.map((e) =>
              e.id === data.event_id
                ? {
                    ...e,
                    participantsCount:
                      data.action === "join"
                        ? (e.participantsCount || 0) + 1
                        : Math.max(0, (e.participantsCount || 0) - 1),
                    isFull:
                      e.maxParticipants != null
                        ? ((data.action === "join"
                            ? (e.participantsCount || 0) + 1
                            : Math.max(0, (e.participantsCount || 0) - 1)) >= (e.maxParticipants || 0))
                        : e.isFull,
                  }
                : e
            )
          );
        }
      } catch {
        /* ignore */
      }
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) {
        setIsAdmin(false);
        setMyEvents([]);
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
        const isAdminUser =
          data?.role === "ADMIN" || data?.email === "akimenkovaleria403@gmail.com";
        setIsAdmin(Boolean(isAdminUser));
      } catch (err) {
        console.error("Не удалось получить профиль", err);
        setIsAdmin(false);
      }
    };
    fetchProfile();
  }, [accessToken]);

  useEffect(() => {
    const loadMyEvents = async () => {
      if (!accessToken) {
        setMyEvents([]);
        setRecommendedEvents([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/events/my`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          setMyEvents([]);
          setRecommendedEvents([]);
          return;
        }
        const data: ApiEvent[] = await res.json();
        const mapped = data.map((e) => {
          const isFull = e.max_participants ? e.participants.length >= e.max_participants : false;
          const inferred = classifyCategories(e.title || "", e.description || e.short_description || "");
          const category = e.category && e.category !== "прочее" ? e.category : inferred[0] || "прочее";
          return {
            id: e.id,
            title: e.title,
            date: e.start_date ? formatDate(e.start_date) : "",
            time: e.start_date ? formatTime(e.start_date) : "",
            startDate: e.start_date,
            endDate: e.end_date,
            city: e.city || "Неизвестно",
            category,
            categories: inferred,
            image: e.image_url || "/events.png",
            place: e.short_description || e.description?.slice(0, 60) || "Событие",
            price: e.price,
            shortDescription: e.short_description || "",
            isFull
          };
        });
        setMyEvents(mapped);
      } catch {
        setMyEvents([]);
        setRecommendedEvents([]);
      }
    };
    loadMyEvents();
  }, [accessToken]);

  useEffect(() => {
    if (!events.length) {
      setRecommendedEvents([]);
      return;
    }

    const abort = new AbortController();

    const cityFilterLower = selectedCity ? selectedCity.toLowerCase() : "";
    const eventsInCity =
      cityFilterLower && events.some((ev) => ev.city.toLowerCase() === cityFilterLower)
        ? events.filter((ev) => ev.city.toLowerCase() === cityFilterLower)
        : events;

    const fallback = () => {
      if (!myEvents.length) return eventsInCity.slice(0, 5);
      const sortedMine = [...myEvents].sort((a, b) => {
        const da = a.startDate ? new Date(a.startDate).getTime() : 0;
        const db = b.startDate ? new Date(b.startDate).getTime() : 0;
        return db - da;
      });
      const lastFive = sortedMine.slice(0, 5);
      const scored: CardEvent[] = eventsInCity
        .filter((ev) => !lastFive.find((l) => l.id === ev.id))
        .map((ev) => {
          const relevance =
            (ev.categories?.includes(selectedCategory) ? 2 : 0) +
            (ev.city.toLowerCase() === selectedCity.toLowerCase() ? 1 : 0);
          return { ...ev, score: relevance };
        })
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      const top = scored.slice(0, 5);
      return top.length ? top : eventsInCity.slice(0, 5);
    };

    const run = async () => {
      try {
        const sortedMine = [...myEvents].sort((a, b) => {
          const da = a.startDate ? new Date(a.startDate).getTime() : 0;
          const db = b.startDate ? new Date(b.startDate).getTime() : 0;
          return db - da;
        });
        const lastFive = sortedMine.slice(0, 5);

        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lastEvents: lastFive,
            allEvents: eventsInCity,
            city: selectedCity,
            interests: selectedCategory,
          }),
          signal: abort.signal,
        });

        if (!res.ok) {
          setRecommendedEvents(fallback());
          return;
        }

        const json = await res.json();
        const ids: string[] = Array.isArray(json.event_ids) ? json.event_ids : [];
        if (!ids.length) {
          setRecommendedEvents(fallback());
          return;
        }

        const mapped = ids
          .map((id) => eventsInCity.find((ev) => ev.id === id))
          .filter(Boolean) as CardEvent[];
        setRecommendedEvents(mapped.length ? mapped.slice(0, 5) : fallback());
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setRecommendedEvents(fallback());
        }
      }
    };

    run();

    return () => abort.abort();
  }, [events, myEvents, selectedCategory, selectedCity]);

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

  const displayCityForEvents = allCities.includes(selectedCity) ? selectedCity : "";
  
  const filteredEvents = events.filter(event => {
    const cityMatch = displayCityForEvents
      ? (event.city.toLowerCase() === displayCityForEvents.toLowerCase() ||
         event.city.toLowerCase().includes(displayCityForEvents.toLowerCase()) ||
         displayCityForEvents.toLowerCase().includes(event.city.toLowerCase()))
      : true;
    const categoryPool = event.categories?.length ? event.categories : [event.category || "прочее"];
    const categoryMatch =
      selectedCategory === "прочее"
        ? categoryPool.some((c) => c === "прочее" || !c)
        : categoryPool.some((c) => c === selectedCategory);
    return cityMatch && categoryMatch;
  });

  // События только по категории (без учёта города)
  const categoryOnlyEvents = events.filter(event => {
    const pool = event.categories?.length ? event.categories : [event.category || "прочее"];
    return selectedCategory === "прочее"
      ? pool.some((c) => c === "прочее" || !c)
      : pool.some((c) => c === selectedCategory);
  });

  // Что показывать в блоке "События категории": сначала с учётом города, если есть, иначе все по категории
  const categoryEventsForDisplay = filteredEvents.length ? filteredEvents : categoryOnlyEvents;

  const getEventStatusColor = (status: string) => {
    if (status === "active") return "bg-green-900/30 text-green-300";
    if (status === "past") return "bg-gray-800 text-gray-300";
    if (status === "cancelled") return "bg-red-900/30 text-red-300";
    return "bg-gray-800 text-gray-300";
  };

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Оптимизированный фон */}
      <div className="pointer-events-none fixed inset-0">
        <Prism 
          animationType="rotate" 
          suspendWhenOffscreen 
          noise={0.35} 
          scale={3.6}
          className="opacity-50"
        />
      </div>

      {/* Затемняющая плёнка */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black" />

      {/* Хедер */}
      <Header isAuthed={isAuthed} setIsMenuOpen={setIsMenuOpen} isMenuOpen={isMenuOpen} />

      {/* Кнопка "Режим админа" */}
      {isAdmin && (
        <>
          <div className="hidden md:block xl:hidden">
            <a
              href="/admin"
              className="fixed top-20 right-6 z-[60] px-6 py-3 rounded-full bg-orange-500 font-medium text-sm text-white shadow-lg hover:bg-orange-400 transition-all duration-300"
            >
              Режим админа
            </a>
          </div>

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
            background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 20, 0.95) 50%, rgba(0, 0, 0, 0.95) 100%)"
          }}
        >
          <div
            className={`text-center space-y-6 transition-all duration-500 ${
              isFadingOut
                ? "opacity-0 translate-y-4 scale-95"
                : "opacity-100 translate-y-0 scale-100"
            }`}
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
        <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden">
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
            href="/my-events"
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
      
      {/* Основной контент */}
      <div className={`relative z-10 min-h-screen transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="pt-24 pb-16 md:pt-32 xl:pt-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Основной контейнер с фильтрами */}
            <div className="bg-black/50 border border-gray-800 rounded-3xl backdrop-blur-xl p-6 md:p-8 mb-8 relative">
              {/* Город */}
              <div className="relative" style={{ zIndex: 50 }}>
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
                categories={[
                  "концерты", "театр", "стендап", "спорт", "кино", 
                  "выставки", "фестивали", "детям", "образование", "экскурсии", "прочее"
                ]}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />

              {/* События выбранной категории (сразу под селекторами) */}
              {categoryEventsForDisplay.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-4">
                    События категории «{selectedCategory}»
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {categoryEventsForDisplay.map((event) => (
                      <div
                        key={`cat-top-${event.id}`}
                        className="group relative overflow-hidden rounded-2xl border border-gray-800 transition-all duration-300 hover:border-blue-500/30 bg-black/40"
                        onClick={() => (window.location.href = `/events/${event.id}`)}
                      >
                        <div className="h-36 overflow-hidden relative">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 text-xs font-medium text-blue-300">
                            {event.category}
                          </div>
                        </div>
                        <div className="p-5 space-y-3">
                          <h4 className="text-lg font-semibold line-clamp-2 group-hover:text-blue-300 transition-colors">
                            {event.title}
                          </h4>
                          <div className="text-sm text-gray-400">
                            {event.date} • {event.time}
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-300 pt-2 border-t border-gray-800">
                            <span>{event.city}</span>
                            <button className="px-3 py-1.5 rounded-lg bg-white/10 text-xs hover:bg-white/20 transition">
                              Подробнее
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Рекомендации */}
            {recommendedEvents.length > 0 && (
              <div className="mb-10 relative -z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Рекомендации для вас
                  </h2>
                  <FiStar className="w-6 h-6 text-yellow-400" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 -z-10">
                  {recommendedEvents.map((event) => (
                    <div
                      key={`rec-${event.id}`}
                      className="group relative overflow-hidden rounded-2xl border border-gray-800 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/50 bg-black/40 -z-10"
                      onClick={() => (window.location.href = `/events/${event.id}`)}
                    >
                      {/* Изображение события */}
                      <div className="h-44  overflow-hidden relative">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                        
                        {/* Категория */}
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-xs font-medium text-blue-300">
                          {event.category}
                        </div>
                        
                        {/* Рекомендовано */}
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-900/50 to-orange-900/50 text-xs font-medium text-yellow-300">
                          Рекомендовано
                        </div>
                      </div>

                      {/* Контент карточки */}
                      <div className="p-5 ">
                        <h3 className="text-lg -z-10 font-semibold mb-3 group-hover:text-blue-300 transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <FiCalendar className="w-4 h-4" />
                            <span>{event.date} • {event.time}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <FiMapPin className="w-4 h-4" />
                            <span>{event.city}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <FiUsers className="w-4 h-4" />
                            <span>
                              {event.participantsCount || 0} участников
                              {event.maxParticipants && ` / ${event.maxParticipants} мест`}
                              {event.isFull && " • Нет мест"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                          <div className="text-base font-semibold">
                            {event.price != null 
                              ? `${event.price.toLocaleString("ru-RU")} ₽`
                              : "Бесплатно"}
                          </div>
                          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-opacity text-sm font-medium">
                            Подробнее
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Новые события */}
            {events.length > 0 && (
              <div className="bg-black/50 border border-gray-800 rounded-3xl backdrop-blur-xl p-6 md:p-8 mb-10">
                <h3 className="text-2xl font-bold mb-6">Новые события</h3>
                
                <div className="overflow-x-auto -mx-2 pb-2">
                  <div className="flex gap-4 px-2">
                    {[...events]
                      .sort((a, b) => {
                        const da = a.startDate ? new Date(a.startDate).getTime() : 0;
                        const db = b.startDate ? new Date(b.startDate).getTime() : 0;
                        return db - da; // новые слева
                      })
                      .map((event) => (
                        <div
                          key={`new-${event.id}`}
                          onClick={() => (window.location.href = `/events/${event.id}`)}
                          className="group min-w-[240px] max-w-[280px] rounded-xl border border-gray-800 transition-all duration-300 hover:border-blue-500/30 bg-black/30 cursor-pointer"
                        >
                          <div className="p-4">
                            <span
                              className={`inline-flex mb-3 px-3 py-1 rounded-full text-xs uppercase tracking-wider font-medium ${
                                event.isFull ? "text-red-300 bg-red-900/30" : "text-blue-300 bg-blue-900/20"
                              }`}
                            >
                              {event.category || "Событие"}
                            </span>
                            
                      <h4 className="font-medium mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                        {event.title}
                      </h4>
                      {event.ratingAvg != null && (
                        <div className="flex items-center gap-1 text-xs text-yellow-300 mb-2">
                          <FiStar className="w-4 h-4" />
                          <span>{event.ratingAvg.toFixed(1)}</span>
                          {event.ratingCount ? <span className="text-white/50">({event.ratingCount})</span> : null}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <FiCalendar className="w-3 h-3" />
                        <span>{event.date}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-300">
                                {event.participantsCount || 0} участников
                              </span>
                              <button className="px-3 py-1.5 rounded-lg bg-white/10 text-xs hover:bg-white/20 transition">
                                Подробнее
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Кнопка "Мои события" для мобильных */}
      <a
        href="/my-events"
        className={`fixed bottom-6 right-6 md:hidden z-30 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 font-medium shadow-lg hover:shadow-xl transition-all duration-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        Мои события
      </a>
    </main>
  );
};

export default HomePage;
  const ratingsCache =
    typeof window !== "undefined"
      ? (JSON.parse(localStorage.getItem("eventRatings") || "{}") as Record<
          string,
          { avg: number; count: number }
        >)
      : {};
