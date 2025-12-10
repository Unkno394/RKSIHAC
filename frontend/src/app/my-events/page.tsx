"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  FiCalendar, 
  FiUsers, 
  FiMapPin, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle,
  FiChevronDown,
  FiAlertCircle,
  FiInfo,
  FiFilter,
  FiEye,
  FiShare2,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiLoader,
  FiArrowLeft,
  FiStar,
  FiMessageSquare
} from "react-icons/fi";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Event {
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
  organizer_id?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  is_confirmed?: boolean; // Для текущего пользователя
}

interface UserParticipant {
  user_id: string;
  event_id: string;
  is_confirmed: boolean;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

const MyEventsPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"my" | "active" | "upcoming" | "past">("my");
  const [events, setEvents] = useState<Event[]>([]);
  const [myConfirmedEvents, setMyConfirmedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>("date");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const computeStatus = (start: string, end: string) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date(now.toDateString());
    const startDay = new Date(startDate.toDateString());
    const endDay = new Date(endDate.toDateString());
    if (endDay < today) return "past";
    if (startDay > today) return "upcoming";
    return "active";
  };

  // Проверка авторизации
  useEffect(() => {
    const t = localStorage.getItem("access_token");
    setToken(t);
    
    if (!t) {
      setError("Войдите, чтобы увидеть ваши события");
      router.push("/auth");
      setLoading(false);
      return;
    }
    fetchUserProfile(t);
  }, [router]);

  // Загрузка профиля пользователя
  const fetchUserProfile = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Не удалось загрузить профиль");
      
      const user = await res.json();
      setCurrentUser(user);
      loadEvents(token, user.id);
    } catch (err) {
      setError("Ошибка загрузки профиля");
      setLoading(false);
    }
  };

  // Загрузка событий пользователя
  const loadEvents = async (token: string, userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // 1) Подгружаем все события
      const allRes = await fetch(`${API_URL}/auth/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!allRes.ok) throw new Error("Не удалось загрузить события");
      const allEvents: Event[] = (await allRes.json()).filter(
        (e: any) => e.status !== "rejected" && e.status !== "declined"
      );
      const mappedAll = allEvents.map(ev => ({
        ...ev,
        status: computeStatus(ev.start_date, ev.end_date),
      }));
      setEvents(mappedAll);

      // 2) Пытаемся получить только мои (если эндпоинт недоступен, фильтруем локально)
      let myMapped: Event[] | null = null;
      try {
        const myEventsRes = await fetch(`${API_URL}/auth/events/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (myEventsRes.status === 401) {
          throw new Error("Войдите, чтобы увидеть ваши события");
        }
        if (myEventsRes.ok) {
          const myEvents: Event[] = (await myEventsRes.json()).filter(
            (e: any) => e.status !== "rejected" && e.status !== "declined"
          );
          myMapped = myEvents.map(ev => ({
            ...ev,
            status: computeStatus(ev.start_date, ev.end_date),
          }));
        }
      } catch (e) {
        // глушим, упадём на fallback
      }

      if (myMapped) {
        setMyConfirmedEvents(myMapped);
      } else {
        // fallback: берём из общего списка по участникам
        const mine = mappedAll.filter(ev => ev.participants.includes(userId));
        setMyConfirmedEvents(mine);
      }
      
    } catch (err: any) {
      setError(err?.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация событий по вкладкам
  const getFilteredEvents = () => {
    if (!currentUser) return [];
    
    switch (activeTab) {
      case "active":
        // Мои активные события (текущий день)
        return myConfirmedEvents
          .filter(event => event.status === "active" && !event.is_deleted)
          .sort(sortEvents);

      case "upcoming":
        // Мои предстоящие события (будущие даты)
        return myConfirmedEvents
          .filter(event => event.status === "upcoming" && !event.is_deleted)
          .sort(sortEvents);
      
      case "past":
        // Мои прошедшие события
        return myConfirmedEvents
          .filter(event => event.status === "past" && !event.is_deleted)
          .sort(sortEvents);
      
      case "my":
      default:
        // Все мои события
        return myConfirmedEvents
          .filter(event => !event.is_deleted)
          .sort(sortEvents);
    }
  };

  // Сортировка событий
  const sortEvents = (a: Event, b: Event) => {
    switch (sortBy) {
      case "date":
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      case "participants":
        return b.participants.length - a.participants.length;
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  };

  // Обработчик сортировки
  const handleSortChange = (value: string) => {
    setSortBy(value);
    setShowSortDropdown(false);
  };

  // Закрытие dropdown по клику вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // Форматирование времени
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };
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
                    participants:
                      data.action === "join"
                        ? [...e.participants, data.user_id].filter(Boolean)
                        : e.participants.filter((id) => id !== data.user_id),
                  }
                : e
            )
          );
          setMyConfirmedEvents((prev) =>
            prev.map((e) =>
              e.id === data.event_id
                ? {
                    ...e,
                    participants:
                      data.action === "join"
                        ? [...e.participants, data.user_id].filter(Boolean)
                        : e.participants.filter((id) => id !== data.user_id),
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

  // Получение статуса события для отображения
  const getEventStatus = (event: Event) => {
    if (event.status === "active") return { text: "Активное", color: "bg-green-900/30 text-green-300" };
    if (event.status === "past") return { text: "Прошедшее", color: "bg-gray-800 text-gray-300" };
    if (event.status === "cancelled") return { text: "Отменено", color: "bg-red-900/30 text-red-300" };
    if (event.is_deleted) return { text: "Удалено", color: "bg-red-900/30 text-red-300" };
    return { text: "Неизвестно", color: "bg-gray-800 text-gray-300" };
  };

  // Проверка, является ли пользователь участником события
  const isParticipant = (event: Event) => {
    if (!currentUser) return false;
    return event.participants.includes(currentUser.id);
  };

  // Обновление событий
  const refreshEvents = () => {
    if (token && currentUser) {
      loadEvents(token, currentUser.id);
    }
  };

  // Удаление участия в событии
  const handleLeaveEvent = async (eventId: string) => {
    if (!token || !currentUser) return;
    
    if (!confirm("Вы уверены, что хотите покинуть это событие?")) return;
    
    try {
      const res = await fetch(`${API_URL}/auth/events/${eventId}/leave`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      
      if (!res.ok) throw new Error("Не удалось покинуть событие");
      
      refreshEvents();
    } catch (err) {
      alert("Ошибка при выходе из события");
    }
  };

  // Получение изображения события
  const getEventImage = (event: Event) => {
    return event.image_url || "/events.png";
  };

  if (loading) {
    return (
      <main className="relative min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white overflow-hidden">
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-gray-700 text-white hover:bg-black/80 transition"
          >
            <FiArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
          <FiLoader className="animate-spin w-12 h-12 text-blue-500 mb-4" />
          <p className="text-lg font-medium">Загрузка событий...</p>
          <p className="text-sm text-gray-400 mt-2">Пожалуйста, подождите</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white overflow-hidden">
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-gray-700 text-white hover:bg-black/80 transition"
          >
            <FiArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
          <FiAlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-lg font-medium text-white">{error}</p>
          <button
            onClick={() => router.push("/auth")}
            className="mt-6 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-opacity"
          >
            Войти в аккаунт
          </button>
        </div>
      </main>
    );
  }

  const filteredEvents = getFilteredEvents();

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white overflow-hidden">
      {/* Кнопка "Назад" */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-gray-700 text-white hover:bg-black/80 transition"
        >
          <FiArrowLeft className="w-4 h-4" />
          Назад
        </button>
      </div>

      {/* Основной контент */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 pt-20 pb-20">
          {/* Хедер */}
          <header className="glass-ios border border-gray-700 backdrop-blur-xl p-8 rounded-2xl mb-8 bg-gray-900/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Мои события
                </h1>
                <p className="text-gray-400 text-sm mt-2">
                  Управляйте своими мероприятиями и участвуйте в новых событиях
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={refreshEvents}
                  className="px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <FiLoader className="w-4 h-4" />
                  Обновить
                </button>
                
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <FiEye className="w-4 h-4" />
                  Найти события
                </button>
              </div>
            </div>
          </header>

          {/* Вкладки и фильтры */}
          <div className="glass-ios border border-gray-700 backdrop-blur-xl rounded-2xl overflow-hidden mb-8">
            <div className="p-6">
              {/* Вкладки */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  className={`px-6 py-3 rounded-lg transition-all duration-300 ${activeTab === "my" 
                    ? "bg-gradient-to-r from-blue-900/40 to-blue-800/40 border border-blue-700 shadow-lg shadow-blue-900/15" 
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"}`}
                  onClick={() => setActiveTab("my")}
                >
                  <span className={`font-medium ${activeTab === "my" ? "text-blue-300" : "text-gray-400"}`}>
                    Мои события
                  </span>
                </button>
                
                <button
                  className={`px-6 py-3 rounded-lg transition-all duration-300 ${activeTab === "active" 
                    ? "bg-gradient-to-r from-blue-900/40 to-blue-800/40 border border-blue-700 shadow-lg shadow-blue-900/15" 
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"}`}
                  onClick={() => setActiveTab("active")}
                >
                  <span className={`font-medium ${activeTab === "active" ? "text-blue-300" : "text-gray-400"}`}>
                    Активные события
                  </span>
                </button>

                <button
                  className={`px-6 py-3 rounded-lg transition-all duration-300 ${activeTab === "upcoming" 
                    ? "bg-gradient-to-r from-blue-900/40 to-blue-800/40 border border-blue-700 shadow-lg shadow-blue-900/15" 
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"}`}
                  onClick={() => setActiveTab("upcoming")}
                >
                  <span className={`font-medium ${activeTab === "upcoming" ? "text-blue-300" : "text-gray-400"}`}>
                    Предстоящие
                  </span>
                </button>
                
                <button
                  className={`px-6 py-3 rounded-lg transition-all duration-300 ${activeTab === "past" 
                    ? "bg-gradient-to-r from-blue-900/40 to-blue-800/40 border border-blue-700 shadow-lg shadow-blue-900/15" 
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"}`}
                  onClick={() => setActiveTab("past")}
                >
                  <span className={`font-medium ${activeTab === "past" ? "text-blue-300" : "text-gray-400"}`}>
                    Прошедшие события
                  </span>
                </button>
              </div>
              
              {/* Информация о вкладке */}
              <div className="mb-6">
                <p className="text-gray-400 text-sm">
                  {activeTab === "my" && "События, в которых вы подтвердили участие"}
                  {activeTab === "active" && "События, которые идут сегодня"}
                  {activeTab === "upcoming" && "События, которые будут в будущем"}
                  {activeTab === "past" && "События, которые уже прошли"}
                </p>
              </div>
              
              {/* Сортировка */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <FiFilter className="w-4 h-4" />
                  <span>Сортировка:</span>
                </div>
                
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <span>
                      {sortBy === "date" && "По дате"}
                      {sortBy === "participants" && "По участникам"}
                      {sortBy === "title" && "По названию"}
                    </span>
                    <FiChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
                  </button>
                  
                  {showSortDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50">
                      <button
                        onClick={() => handleSortChange("date")}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors flex items-center justify-between ${
                          sortBy === "date" ? "bg-blue-900/30" : ""
                        }`}
                      >
                        <span className="text-white">По дате</span>
                        {sortBy === "date" && <FiCheckCircle className="w-4 h-4 text-blue-400" />}
                      </button>
                      
                      <button
                        onClick={() => handleSortChange("participants")}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors flex items-center justify-between ${
                          sortBy === "participants" ? "bg-blue-900/30" : ""
                        }`}
                      >
                        <span className="text-white">По участникам</span>
                        {sortBy === "participants" && <FiCheckCircle className="w-4 h-4 text-blue-400" />}
                      </button>
                      
                      <button
                        onClick={() => handleSortChange("title")}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors flex items-center justify-between ${
                          sortBy === "title" ? "bg-blue-900/30" : ""
                        }`}
                      >
                        <span className="text-white">По названию</span>
                        {sortBy === "title" && <FiCheckCircle className="w-4 h-4 text-blue-400" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Список событий */}
          {filteredEvents.length === 0 ? (
            <div className="glass-ios border border-gray-700 backdrop-blur-xl rounded-2xl p-12 text-center">
              <FiCalendar className="w-20 h-20 mx-auto mb-6 text-gray-600" />
              <h3 className="text-2xl font-bold mb-3">
                {activeTab === "my" && "У вас нет подтвержденных событий"}
                {activeTab === "active" && "Нет активных событий"}
                {activeTab === "upcoming" && "Нет предстоящих событий"}
                {activeTab === "past" && "Нет прошедших событий"}
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                {activeTab === "my" && "Присоединяйтесь к событиям, чтобы они появились здесь"}
                {activeTab === "active" && "В данный момент нет активных событий"}
                {activeTab === "upcoming" && "Предстоящих событий пока нет"}
                {activeTab === "past" && "Прошедших событий пока нет в базе"}
              </p>
              {activeTab === "my" && (
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-opacity"
                >
                  Найти события
                </button>
              )}
              {activeTab === "active" && (
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-opacity"
                >
                  Посмотреть предстоящие
                </button>
              )}
              {activeTab === "upcoming" && (
                <button
                  onClick={() => setActiveTab("my")}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-opacity"
                >
                  Все мои события
                </button>
              )}
              {activeTab === "past" && (
                <button
                  onClick={() => setActiveTab("my")}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-opacity"
                >
                  Вернуться к событиям
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const status = getEventStatus(event);
                const isUserParticipant = isParticipant(event);
                const isFull = event.max_participants 
                  ? event.participants.length >= event.max_participants 
                  : false;
                
                return (
                  <div
                    key={event.id}
                    className="group relative overflow-hidden rounded-2xl border border-gray-700 backdrop-blur-sm transition-all duration-300 hover:border-blue-700/50 hover:shadow-2xl hover:shadow-blue-900/20"
                    onMouseEnter={() => setHoveredEventId(event.id)}
                    onMouseLeave={() => setHoveredEventId(null)}
                  >
                    {/* Изображение события */}
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={getEventImage(event)} 
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Накладки на изображении */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      {/* Статус в углу */}
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </div>
                      
                      {/* Категория */}
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-medium text-blue-300">
                        {event.category || "Событие"}
                      </div>
                    </div>

                    {/* Контент карточки */}
                    <div className="p-5">
                      {/* Заголовок */}
                      <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-300 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      
                      {/* Краткое описание */}
                      {event.short_description && (
                        <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                          {event.short_description}
                        </p>
                      )}
                      
                      {/* Детали события */}
                      <div className="space-y-3 mb-4">
                        {/* Даты */}
                        <div className="flex items-center gap-2 text-sm">
                          <FiCalendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">
                            {formatDate(event.start_date)} • {formatTime(event.start_date)}
                          </span>
                        </div>
                        
                        {/* Город */}
                        <div className="flex items-center gap-2 text-sm">
                          <FiMapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{event.city}</span>
                        </div>
                        
                        {/* Участники */}
                        <div className="flex items-center gap-2 text-sm">
                          <FiUsers className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">
                            {event.participants.length} участников
                            {event.max_participants && ` / ${event.max_participants} мест`}
                            {isFull && " • Нет мест"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Кнопки действий */}
                      <div className="flex gap-2 pt-4 border-t border-gray-800">
                        <button
                          onClick={() => router.push(`/events/${event.id}`)}
                          className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <FiEye className="w-4 h-4" />
                          Подробнее
                        </button>
                        
                        {activeTab === "my" && isUserParticipant && (
                          <button
                            onClick={() => handleLeaveEvent(event.id)}
                            className="px-4 py-2.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center gap-2"
                            title="Покинуть событие"
                          >
                            <FiXCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {activeTab === "active" && !isUserParticipant && !isFull && (
                          <button
                            onClick={() => router.push(`/events/${event.id}`)}
                            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-opacity text-sm font-medium flex items-center gap-2"
                          >
                            <FiCheckCircle className="w-4 h-4" />
                            Участвовать
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Всплывающая подсказка при наведении */}
                    {hoveredEventId === event.id && (
                      <div className="absolute inset-x-4 bottom-full mb-2 z-50">
                        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-2xl max-w-xs">
                          <div className="text-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Организатор:</span>
                              <span className="text-blue-300">
                                {event.organizer_id ? "Организатор" : "Система"}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Окончание:</span>
                              <span className="text-gray-300">
                                {formatDate(event.end_date)} • {formatTime(event.end_date)}
                              </span>
                            </div>
                            
                            {event.payment_info && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">Оплата:</span>
                                <span className="text-green-300">
                                  {event.payment_info}
                                </span>
                              </div>
                            )}
                            
                            {event.description && (
                              <div className="mt-2 pt-2 border-t border-gray-800">
                                <p className="text-gray-300 text-xs line-clamp-3">
                                  {event.description}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Стрелочка */}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                            <div className="w-4 h-4 bg-gray-900 border-r border-b border-gray-700 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Статистика */}
          {filteredEvents.length > 0 && (
            <div className="mt-8 glass-ios border border-gray-700 backdrop-blur-xl rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-blue-300 mb-2">
                    {filteredEvents.filter(e => e.status === "active").length}
                  </div>
                  <div className="text-sm text-gray-400">Активных событий</div>
                </div>
                
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-purple-300 mb-2">
                    {filteredEvents.reduce((sum, e) => sum + e.participants.length, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Всего участников</div>
                </div>
                
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-green-300 mb-2">
                    {filteredEvents.filter(e => isParticipant(e)).length}
                  </div>
                  <div className="text-sm text-gray-400">Ваших участий</div>
                </div>
              </div>
            </div>
          )}

          {/* Информационный блок */}
          <div className="mt-8 glass-ios border border-gray-700 backdrop-blur-xl rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <FiInfo className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Как это работает?</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    {activeTab === "my" && "Здесь отображаются события, в которых вы подтвердили участие"}
                    {activeTab === "active" && "Все активные события доступны для участия"}
                    {activeTab === "past" && "Прошедшие события остаются в истории"}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                
                
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <FiEye className="w-4 h-4" />
                  Все события
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MyEventsPage;
