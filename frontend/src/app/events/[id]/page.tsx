"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiMapPin, 
  FiUsers, 
  FiCheckCircle, 
  FiXCircle,
  FiClock,
  FiShare2,
  FiDownload,
  FiInfo,
  FiAlertCircle,
  FiLoader,
  FiStar,
  FiMessageSquare,
  FiChevronRight,
  FiCreditCard,
  FiUser,
  FiHome,
  FiTag,
  FiEye,
  FiCopy,
  FiLink,
  FiHeart,
  FiBookmark,
  FiTrendingUp,
  FiAward,
  FiGlobe,
  FiMail,
  FiBell,
  FiSettings,
  FiLogOut
} from "react-icons/fi";
import LightRays from "@/shared/ui/LightRays";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type EventDto = {
  id: string;
  title: string;
  short_description?: string | null;
  description: string;
  start_date: string;
  end_date: string;
  image_url: string;
  city: string;
  payment_info?: string | null;
  max_participants?: number | null;
  status: string;
  participants: string[];
  category?: string;
  organizer_id?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
};

type ProfileDto = { 
  id: string; 
  email: string; 
  full_name: string; 
  role: string;
  avatar_url?: string;
};

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string | undefined;

  const [event, setEvent] = useState<EventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [participants, setParticipants] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [allEvents, setAllEvents] = useState<EventDto[]>([]);
  const [similarEvents, setSimilarEvents] = useState<EventDto[]>([]);

  const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // Загрузка профиля пользователя
  useEffect(() => {
    const loadProfile = async () => {
      if (!accessToken) {
        setProfile(null);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Не удалось получить профиль", err);
      }
    };
    loadProfile();
  }, [accessToken]);

  // Загружаем все события (для блока "Похожие")
  useEffect(() => {
    const loadAll = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/events`);
        if (!res.ok) return;
        const data: EventDto[] = await res.json();
        setAllEvents(data);
      } catch {
        setAllEvents([]);
      }
    };
    loadAll();
  }, []);

  // Загрузка события
  useEffect(() => {
    if (!eventId) return;
    
    const loadEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/auth/events/${eventId}`);
        if (!res.ok) throw new Error("Событие не найдено");
        
        const data: EventDto = await res.json();
        setEvent({
          ...data,
          image_url: data.image_url || "/events.png",
        });
        setParticipantsCount(data.participants?.length || 0);
        
        if (profile && data.participants?.includes(profile.id)) {
          setIsParticipating(true);
        }
        const favIds = JSON.parse(localStorage.getItem("favoriteEvents") || "[]") as string[];
        setIsFavorite(favIds.includes(data.id));
        
        // Загрузка информации об участниках
        if (data.participants?.length > 0) {
          try {
            const participantsRes = await fetch(`${API_URL}/auth/events/${eventId}/participants`, {
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
            });
            
            if (participantsRes.ok) {
              const participantsData = await participantsRes.json();
              setParticipants(participantsData.slice(0, 10));
            }
          } catch (err) {
            console.error("Не удалось загрузить участников", err);
          }
        }
      } catch (err: any) {
        setError(err?.message || "Не удалось загрузить событие");
      } finally {
        setLoading(false);
      }
    };
    
    loadEvent();
  }, [eventId, profile?.id]);

  // WebSocket обновления участников для карточки события
  useEffect(() => {
    if (!eventId) return;
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(
      /^http/,
      "ws"
    );
    const socket = new WebSocket(`${wsUrl}/ws/events`);
    socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "participant" && data.event_id === eventId) {
          setParticipantsCount((prev) =>
            data.action === "join" ? prev + 1 : Math.max(0, prev - 1)
          );
          if (profile?.id) {
            if (data.action === "join" && data.user_id === profile.id) {
              setIsParticipating(true);
            }
            if (data.action === "leave" && data.user_id === profile.id) {
              setIsParticipating(false);
            }
          }
        }
      } catch {
        /* ignore */
      }
    };
    return () => socket.close();
  }, [eventId, profile?.id]);

  const status = useMemo(() => {
    if (!event) return "loading";
    const now = new Date();
    const today = new Date(now.toDateString());
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const startDay = new Date(start.toDateString());
    const endDay = new Date(end.toDateString());
    if (endDay < today) return "past";
    if (startDay > today) return "upcoming";
    return "active";
  }, [event]);

  const isFull = useMemo(() => {
    if (!event?.max_participants) return false;
    return participantsCount >= event.max_participants;
  }, [event?.max_participants, participantsCount]);

  const statusLabel = {
    active: "Активное",
    upcoming: "Предстоящее",
    past: "Прошедшее",
    loading: "Загрузка...",
  }[status];

  const statusColor =
    status === "past"
      ? "bg-red-900/30 text-red-300 border-red-700"
      : status === "upcoming"
      ? "bg-blue-900/30 text-blue-300 border-blue-700"
      : "bg-green-900/30 text-green-300 border-green-700";

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('ru-RU', options);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleJoin = async () => {
    if (!profile) {
      router.push("/auth");
      return;
    }
    if (isFull && !isParticipating) {
      alert("Достигнут максимальный лимит участников");
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/events/${eventId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.detail || "Не удалось подтвердить участие");
      }
      
      const updated: EventDto = await res.json();
      setEvent(updated);
      setParticipantsCount(updated.participants.length);
      setIsParticipating(true);
      
      // Обновляем список участников
      const participantsRes = await fetch(`${API_URL}/auth/events/${eventId}/participants`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });
      
      if (participantsRes.ok) {
        const participantsData = await participantsRes.json();
        setParticipants(participantsData.slice(0, 10));
      }
      
    } catch (err: any) {
      alert(err?.message || "Ошибка подтверждения участия");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!profile) {
      router.push("/auth");
      return;
    }
    
    const ok = confirm("Вы уверены, что хотите отменить участие?");
    if (!ok) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/events/${eventId}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.detail || "Не удалось отменить участие");
      }
      
      const updated: EventDto = await res.json();
      setEvent(updated);
      setParticipantsCount(updated.participants.length);
      setIsParticipating(false);
      
      // Обновляем список участников
      const participantsRes = await fetch(`${API_URL}/auth/events/${eventId}/participants`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });
      
      if (participantsRes.ok) {
        const participantsData = await participantsRes.json();
        setParticipants(participantsData.slice(0, 10));
      }
      
    } catch (err: any) {
      alert(err?.message || "Ошибка отмены участия");
    } finally {
      setActionLoading(false);
    }
  };

  const shareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'Событие',
        text: event?.short_description || '',
        url: window.location.href,
      });
    } else {
      setShowShareModal(true);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Ссылка скопирована в буфер обмена!');
    setShowShareModal(false);
  };

  const canConfirm = (status === "active" || status === "upcoming") && !isParticipating && !isFull;
  const canCancel = isParticipating && status !== "past";

  const toggleFavorite = () => {
    const favIds = new Set<string>(JSON.parse(localStorage.getItem("favoriteEvents") || "[]"));
    if (isFavorite) {
      favIds.delete(event?.id || "");
    } else if (event?.id) {
      favIds.add(event.id);
    }
    localStorage.setItem("favoriteEvents", JSON.stringify([...favIds]));
    setIsFavorite(!isFavorite);
  };

  const getFallbackImage = () => {
    if (event?.image_url) return event.image_url;
    
    const categoryImages: Record<string, string> = {
      "концерты": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop",
      "театр": "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=500&fit=crop",
      "стендап": "https://images.unsplash.com/photo-1567593810070-7a5c0925344e?w=800&h=500&fit=crop",
      "спорт": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=500&fit=crop",
      "кино": "https://images.unsplash.com/photo-1489599809516-9827b6d1cf13?w=800&h=500&fit=crop",
      "выставки": "https://images.unsplash.com/photo-1567593810070-7a5c0925344e?w=800&h=500&fit=crop",
      "фестивали": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=500&fit=crop",
      "детям": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=500&fit=crop",
      "образование": "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=500&fit=crop",
      "экскурсии": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=500&fit=crop"
    };
    
    return categoryImages[event?.category || "прочее"] || 
           "https://images.unsplash.com/photo-1501281668745-f6f2616ba0a5?w=800&h=500&fit=crop";
  };

  useEffect(() => {
    if (!event || !allEvents.length) {
      setSimilarEvents([]);
      return;
    }
    const sameCity = allEvents.filter(
      (ev) => ev.id !== event.id && ev.city?.toLowerCase() === event.city?.toLowerCase()
    );
    const sameCat = sameCity.filter(
      (ev) => ev.category && event.category && ev.category.toLowerCase() === event.category.toLowerCase()
    );
    const picked = (sameCat.length ? sameCat : sameCity).slice(0, 3);
    setSimilarEvents(picked);
  }, [event, allEvents]);

  if (loading) {
    return (
      <main className="relative min-h-screen w-full bg-[#020616] text-slate-50 overflow-hidden">
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
          <p className="text-lg font-medium">Загрузка события...</p>
          <p className="text-sm text-gray-400 mt-2">Пожалуйста, подождите</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative min-h-screen w-full bg-[#020616] text-slate-50 overflow-hidden">
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
          <h3 className="text-xl font-bold mb-2">{error}</h3>
          <p className="text-gray-400 mb-6">Не удалось загрузить событие</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-opacity"
          >
            На главную
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full bg-[#020616] text-slate-50 overflow-hidden">
      {/* Фон - LightRays */}
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

      {/* Кнопка "На главную" */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-gray-700 text-white hover:bg-black/80 transition"
        >
          <FiHome className="w-4 h-4" />
          Главная
        </button>
      </div>

      {/* Основной контент */}
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-20">
          {/* Хедер события */}
          {event && (
            <div className="glass-ios border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden mb-8">
              {/* Изображение события */}
              <div className="relative h-64 md:h-80 overflow-hidden">
                <img
                  src={getFallbackImage()}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                
                {/* Статусы */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                  <button
                    onClick={toggleFavorite}
                    className="p-2 rounded-full bg-black/60 border border-white/10 hover:border-pink-400/60 transition"
                    aria-label="Избранное"
                  >
                    <FiHeart className={`w-5 h-5 ${isFavorite ? "text-pink-400 fill-pink-400" : "text-white"}`} />
                  </button>
                  <span className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 ${statusColor}`}>
                    {status === "active" && <FiTrendingUp className="w-4 h-4" />}
                    {status === "upcoming" && <FiClock className="w-4 h-4" />}
                    {status === "past" && <FiCheckCircle className="w-4 h-4" />}
                    {statusLabel}
                  </span>
                  
                  {isFull && !isParticipating && (
                    <span className="px-4 py-2 rounded-full border border-red-500/50 bg-red-900/30 text-red-300 text-sm font-semibold flex items-center gap-2">
                      <FiAlertCircle className="w-4 h-4" />
                      Нет мест
                    </span>
                  )}
                </div>
                
                {/* Категория */}
                {event.category && (
                  <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-sm font-medium text-blue-300 flex items-center gap-2">
                    <FiTag className="w-4 h-4" />
                    {event.category}
                  </div>
                )}
                
                {/* Заголовок */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">{event.title}</h1>
                  {event.short_description && (
                    <p className="text-lg text-white/80 max-w-3xl">{event.short_description}</p>
                  )}
                </div>
              </div>
              
              {/* Информация и кнопки */}
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Левая колонка - информация */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Основная информация */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="glass-ios border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <FiCalendar className="w-5 h-5 text-blue-400" />
                          <h3 className="font-semibold">Даты</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-white/60">Начало:</span>
                            <span className="font-medium">{formatDateTime(event.start_date)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/60">Окончание:</span>
                            <span className="font-medium">{formatDateTime(event.end_date)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="glass-ios border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <FiMapPin className="w-5 h-5 text-blue-400" />
                          <h3 className="font-semibold">Место</h3>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Город:</span>
                          <span className="font-medium text-lg">{event.city}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Участники */}
                    <div className="glass-ios border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <FiUsers className="w-5 h-5 text-blue-400" />
                          <h3 className="font-semibold">Участники</h3>
                        </div>
                        <span className="text-2xl font-bold text-blue-300 flex items-center gap-2">
                          <FiUsers className="w-6 h-6" />
                          {participantsCount}
                          {event.max_participants ? `/${event.max_participants}` : ""}
                        </span>
                      </div>
                      
                      {participants.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {participants.slice(0, 5).map((participant, index) => (
                            <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                              {participant.user?.avatar_url ? (
                                <img 
                                  src={participant.user.avatar_url} 
                                  alt={participant.user.full_name}
                                  className="w-6 h-6 rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                  <FiUser className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <span className="text-sm">{participant.user?.full_name || "Участник"}</span>
                            </div>
                          ))}
                          {participantsCount > 5 && (
                            <div className="px-3 py-2 rounded-lg bg-white/5 text-sm flex items-center gap-1">
                              <FiUsers className="w-4 h-4" />
                              +{participantsCount - 5} участников
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Статус пользователя */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2">
                          {isParticipating ? (
                            <>
                              <FiCheckCircle className="w-5 h-5 text-green-400" />
                              <span className="font-medium text-green-300">Вы участвуете</span>
                            </>
                          ) : (
                            <>
                              <FiAlertCircle className="w-5 h-5 text-yellow-400" />
                              <span className="font-medium text-yellow-300">Вы не участвуете</span>
                            </>
                          )}
                        </div>
                        
                        {event.max_participants && (
                          <div className="text-sm text-white/60 flex items-center gap-1">
                            <FiInfo className="w-4 h-4" />
                            Осталось мест: {Math.max(0, event.max_participants - participantsCount)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Описание */}
                    <div className="glass-ios border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <FiMessageSquare className="w-5 h-5 text-blue-400" />
                        <h3 className="font-semibold">Описание события</h3>
                      </div>
                      <p className="text-white/80 leading-relaxed whitespace-pre-line">
                        {event.description}
                      </p>
                    </div>

                  </div>
                  
                  {/* Правая колонка - действия */}
                  <div className="space-y-6">
                    {/* Статус и кнопки */}
                    <div className="glass-ios border border-white/10 rounded-xl p-5">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FiAward className="w-5 h-5 text-blue-400" />
                        Участие в событии
                      </h3>
                      
                      <div className="space-y-4">
                        {actionLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <FiLoader className="animate-spin w-6 h-6 text-blue-500" />
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={handleJoin}
                              disabled={!canConfirm}
                              className={`w-full py-3 rounded-lg text-sm font-semibold border transition flex items-center justify-center gap-2 ${
                                canConfirm
                                  ? "bg-gradient-to-r from-blue-500 to-purple-500 border-transparent text-white hover:opacity-90"
                                  : "bg-white/5 border-white/10 text-white/50 cursor-not-allowed"
                              }`}
                            >
                              <FiCheckCircle className="w-4 h-4" />
                              {profile ? "Подтвердить участие" : "Войти для участия"}
                            </button>
                            
                            <button
                              onClick={handleCancel}
                              disabled={!canCancel}
                              className={`w-full py-3 rounded-lg text-sm font-semibold border transition flex items-center justify-center gap-2 ${
                                canCancel
                                  ? "border-red-500/50 bg-red-900/30 text-red-300 hover:bg-red-900/50"
                                  : "bg-white/5 border-white/10 text-white/50 cursor-not-allowed"
                              }`}
                            >
                              <FiXCircle className="w-4 h-4" />
                              Отменить участие
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={shareEvent}
                          className="w-full py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <FiShare2 className="w-4 h-4" />
                          Поделиться
                        </button>
                        
                        <button
                          onClick={() => router.push("/my-events")}
                          className="w-full py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <FiEye className="w-4 h-4" />
                          Мои события
                        </button>
                      </div>
                    </div>
                    
                    {/* Информация об оплате */}
                    {event.payment_info && (
                      <div className="glass-ios border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <FiCreditCard className="w-5 h-5 text-green-400" />
                          <h3 className="font-semibold">Оплата</h3>
                        </div>
                        <p className="text-sm text-white/80 bg-white/5 p-3 rounded-lg">
                          {event.payment_info}
                        </p>
                      </div>
                    )}
                    
                    {/* Организатор */}
                    {event.organizer_id && (
                      <div className="glass-ios border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <FiUser className="w-5 h-5 text-purple-400" />
                          <h3 className="font-semibold">Организатор</h3>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <FiUser className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">ID: {event.organizer_id.slice(0, 8)}...</p>
                            <p className="text-xs text-white/60">Организатор события</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Дополнительная информация */}
                    <div className="glass-ios border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <FiInfo className="w-5 h-5 text-blue-400" />
                        <h3 className="font-semibold">Дополнительно</h3>
                      </div>
                      <div className="space-y-2 text-sm text-white/60">
                        <div className="flex items-center justify-between">
                          <span>Создано:</span>
                          <span>{formatDate(event.created_at)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Обновлено:</span>
                          <span>{formatDate(event.updated_at)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Статус:</span>
                          <span className={`px-2 py-1 rounded text-xs ${statusColor}`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Информационный блок */}
          <div className="glass-ios border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-700/20 flex items-center justify-center">
                  <FiBell className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h4 className="font-semibold">Уведомления</h4>
                  <p className="text-sm text-white/60 mt-1">Получайте напоминания о событии</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <FiDownload className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h4 className="font-semibold">Билеты</h4>
                  <p className="text-sm text-white/60 mt-1">Скачайте билет после подтверждения</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500/20 to-teal-500/20 flex items-center justify-center">
                  <FiHeart className="w-6 h-6 text-green-300" />
                </div>
                <div>
                  <h4 className="font-semibold">Избранное</h4>
                  <p className="text-sm text-white/60 mt-1">Сохраняйте интересные события</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для шаринга */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          />
          
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FiShare2 className="w-5 h-5" />
                  Поделиться событием
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiXCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                  <FiLink className="w-5 h-5 text-blue-400" />
                  <div className="flex-1 truncate text-sm">{window.location.href}</div>
                  <button
                    onClick={copyShareLink}
                    className="px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors flex items-center gap-2 text-sm"
                  >
                    <FiCopy className="w-4 h-4" />
                    Копировать
                  </button>
                </div>
                
                <div className="text-sm text-white/60">
                  Скопируйте ссылку и поделитесь с друзьями!
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
