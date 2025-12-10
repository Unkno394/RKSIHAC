"use client";

import axios, { AxiosInstance } from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { 
  FiUsers, 
  FiCalendar, 
  FiEdit, 
  FiTrash2, 
  FiKey, 
  FiSearch, 
  FiX, 
  FiPlus, 
  FiFilter,
  FiChevronDown,
  FiMapPin,
  FiCheck,
  FiAlertCircle,
  FiLoader,
  FiEye,
  FiBarChart2,
  FiCheckCircle,
  FiXCircle,
  FiUserPlus,
  FiRefreshCw,
  FiGlobe,
  FiArrowLeft
} from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at?: string;
  is_active: boolean;
  is_deleted: boolean;
  avatar_url?: string | null;
}

interface Event {
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
  is_deleted: boolean;
}

interface City {
  name: string;
  subject: string;
  district: string;
  population: number;
  coords: {
    lat: number;
    lon: number;
  };
}

interface UserFilters {
  full_name?: string;
  role?: string;
  status_filter?: string;
  date_from?: string;
  date_to?: string;
}

interface EventFormState {
  title: string;
  short_description?: string;
  description: string;
  start_date: string;
  end_date: string;
  image_url: string;
  city: string;
  payment_info?: string;
  max_participants?: number | null;
  participant_ids: string;
  status?: string;
}

const getFallbackAvatar = (id: string) => {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  const idx = (sum % 4) + 1;
  return `/def${idx}.png`;
};

const useApi = (token: string | null): AxiosInstance => {
  return useMemo(() => {
    return axios.create({
      baseURL: API_URL,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [token]);
};

// Упрощенный CitySelector для админки
const AdminCitySelector: React.FC<{
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  disabled?: boolean;
}> = ({ selectedCity, setSelectedCity, disabled = false }) => {
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Загрузка списка городов при открытии меню
  useEffect(() => {
    const fetchCities = async () => {
      if (showCityDropdown && cities.length === 0) {
        setLoading(true);
        try {
          const response = await fetch("/russian-cities.json");
          const data: City[] = await response.json();
          setCities(data.sort((a, b) => b.population - a.population)); // Сортировка по населению
        } catch (error) {
          console.error("Error loading cities:", error);
          setApiError("Ошибка при загрузке данных городов.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchCities();
  }, [showCityDropdown]);

  // Фильтрация городов
  const filteredCities = searchQuery
    ? cities.filter(city =>
        city.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : cities.slice(0, 20);

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setShowCityDropdown(false);
    setSearchQuery("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Закрытие по клику вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        menuRef.current && 
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowCityDropdown(false);
        setSearchQuery("");
      }
    };

    if (showCityDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCityDropdown]);

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Здесь можно добавить логику определения города по координатам
          alert("Определение местоположения включено. Город будет определен автоматически.");
        },
        () => {
          alert("Не удалось определить местоположение. Разрешите доступ к геолокации.");
        }
      );
    } else {
      alert("Геолокация не поддерживается вашим браузером.");
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative w-full" ref={dropdownRef}>
        <button
          onClick={() => !disabled && setShowCityDropdown(!showCityDropdown)}
          disabled={disabled}
          className={`flex items-center justify-between gap-3 w-full px-4 py-3 rounded-lg bg-white/5 border ${
            disabled ? "border-white/5 text-white/40" : "border-white/10 hover:bg-white/10"
          } transition-all duration-200 group`}
        >
          <div className="flex items-center gap-3">
            <FiMapPin className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <div className="text-left">
              <div className="text-sm text-white/60 font-normal">Город</div>
              <div className="font-medium text-white">
                {selectedCity || "Выберите город"}
              </div>
            </div>
          </div>
          <FiChevronDown className={`w-4 h-4 text-white/60 transition-transform ${
            showCityDropdown ? "rotate-180" : ""
          }`} />
        </button>

        {/* Выпадающее меню */}
        {showCityDropdown && (
          <div
            ref={menuRef}
            className="absolute top-full left-0 mt-2 w-full bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-[9999] max-h-[400px] overflow-hidden"
          >
            {/* Заголовок и поиск */}
            <div className="p-4 border-b border-white/10 bg-slate-800/90">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Выберите город</h3>
                <button
                  onClick={() => setShowCityDropdown(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiX className="w-4 h-4 text-white/60" />
                </button>
              </div>
              
              {/* Кнопка определения местоположения */}
              <button
                onClick={handleDetectLocation}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 border border-blue-500/30 rounded-xl transition-all duration-300 mb-3"
              >
                <FiGlobe className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-white">Определить местоположение</span>
              </button>
              
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  placeholder="Поиск города..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-700/60 border border-white/15 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Список городов */}
            <div className="overflow-y-auto max-h-[300px] custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <FiLoader className="animate-spin w-6 h-6 text-blue-500 mb-3" />
                  <p className="text-white/60">Загрузка городов...</p>
                </div>
              ) : apiError ? (
                <div className="p-4 text-center">
                  <FiAlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-white/70">{apiError}</p>
                </div>
              ) : filteredCities.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-white/40 text-2xl mb-3">🏙️</div>
                  <h4 className="font-medium text-white mb-1">Город не найден</h4>
                  <p className="text-sm text-white/60">Попробуйте изменить запрос</p>
                </div>
              ) : (
                <div className="p-2">
                  {!searchQuery && (
                    <div className="px-4 py-2">
                      <div className="text-xs font-medium text-white/50 uppercase tracking-wider">
                        Популярные города
                      </div>
                    </div>
                  )}
                  
                  {filteredCities.map((city, idx) => (
                    <button
                      key={`${city.name}-${city.subject || ""}-${idx}`}
                      onClick={() => handleCitySelect(city.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg mx-1 mb-1 transition-all duration-200 hover:bg-white/10 ${
                        selectedCity === city.name ? "bg-blue-500/20 border border-blue-500/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
                          <FiMapPin className="w-4 h-4 text-white/70" />
                        </div>
                        <span className="font-medium text-white">{city.name}</span>
                      </div>
                      {selectedCity === city.name && (
                        <FiCheck className="w-4 h-4 text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

type ModalState = {
  mode: "create" | "edit" | "delete" | "reset";
  type: "user" | "event";
  data?: any;
  onSuccess?: () => void;
};

const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const api = useApi(token);
  const [activeTab, setActiveTab] = useState<"users" | "events">("users");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    setToken(t);
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) return;
      try {
        const res = await api.get("/auth/profile");
        setCurrentUserId(res.data?.id || null);
      } catch {
        setCurrentUserId(null);
      }
    };
    fetchMe();
  }, [token, api]);

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-b from-[#050914] via-[#081226] to-[#02040a] text-white overflow-hidden">
      <button
        onClick={() => window.history.back()}
        className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 transition"
      >
        <FiArrowLeft className="w-4 h-4" />
        Назад
      </button>
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 pt-6">
          {/* Хедер */}
          <header className="glass-ios border border-sky-500/25 backdrop-blur-xl p-6 rounded-2xl mb-6 bg-slate-900/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Администрирование
                </h1>
                <p className="text-white/60 text-sm mt-1">Управление платформой My Afisha</p>
              </div>
              
              <div className="flex gap-2 p-1 bg-sky-500/10 rounded-xl border border-sky-500/25">
                <button
                  className={`px-6 py-2 rounded-lg transition-all duration-300 ${activeTab === "users" 
                    ? "bg-gradient-to-r from-sky-500/30 to-blue-700/30 border border-sky-400/40 shadow-lg shadow-sky-500/15" 
                    : "hover:bg-white/10"}`}
                  onClick={() => setActiveTab("users")}
                >
                  <span className={`font-medium ${activeTab === "users" ? "text-blue-300" : "text-white/70"}`}>
                    Пользователи
                  </span>
                </button>
                <button
                  className={`px-6 py-2 rounded-lg transition-all duration-300 ${activeTab === "events" 
                    ? "bg-gradient-to-r from-sky-500/30 to-blue-700/30 border border-sky-400/40 shadow-lg shadow-sky-500/15" 
                    : "hover:bg-white/10"}`}
                  onClick={() => setActiveTab("events")}
                >
                  <span className={`font-medium ${activeTab === "events" ? "text-blue-300" : "text-white/70"}`}>
                    События
                  </span>
                </button>
              </div>
            </div>
          </header>

          {/* Основной контент */}
          <div className="glass-ios border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
            {activeTab === "users" ? (
              <UsersBlock api={api} disabled={!token} currentUserId={currentUserId} setModal={setModal} />
            ) : (
              <EventsBlock api={api} disabled={!token} setModal={setModal} />
            )}
          </div>
        </div>

        {/* Модальное окно */}
        {modal && (
          <Modal modal={modal} onClose={() => setModal(null)} api={api} />
        )}
      </div>
    </main>
  );
};

const UsersBlock: React.FC<{ 
  api: AxiosInstance; 
  disabled: boolean; 
  currentUserId: string | null;
  setModal: (modal: ModalState | null) => void;
}> = ({
  api,
  disabled,
  currentUserId,
  setModal
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters & { date_from?: string; date_to?: string }>({});
  const [stats, setStats] = useState({
    active: 0,
    admins: 0,
    newThisMonth: 0,
    blocked: 0
  });

  const loadUsers = async () => {
    if (disabled) return;
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filters.full_name) params.full_name = filters.full_name;
      if (filters.role) params.role = filters.role;
      if (filters.status_filter) params.status_filter = filters.status_filter;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      const res = await api.get<User[]>("/auth/admin/users", { params });
      setUsers(res.data);
      
      // Расчет статистики
      const activeUsers = res.data.filter(u => u.is_active && !u.is_deleted).length;
      const admins = res.data.filter(u => u.role === "ADMIN").length;
      const blocked = res.data.filter(u => u.is_deleted).length;
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const newThisMonth = res.data.filter(u => 
        u.created_at && new Date(u.created_at) > oneMonthAgo
      ).length;
      
      setStats({ active: activeUsers, admins, newThisMonth, blocked });
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!disabled) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, disabled]);

  return (
    <section className="p-6 space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-blue-400" />
            Управление пользователями
          </h2>
          <p className="text-white/60 text-sm">Всего пользователей: {users.length}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setModal({ mode: "create", type: "user", onSuccess: loadUsers })}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-700 hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <FiUserPlus className="w-4 h-4" />
            Добавить пользователя
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-ios border border-sky-500/15 bg-slate-900/50 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Активных</p>
              <p className="text-xl font-bold">{stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-ios border border-sky-500/15 bg-slate-900/50 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Администраторов</p>
              <p className="text-xl font-bold">{stats.admins}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-ios border border-sky-500/15 bg-slate-900/50 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <FiUserPlus className="w-5 h-5 text-green-300" />
            </div>
            <div>
              <p className="text-white/60 text-sm">За месяц</p>
              <p className="text-xl font-bold">+{stats.newThisMonth}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-ios border border-sky-500/15 bg-slate-900/50 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <FiXCircle className="w-5 h-5 text-red-300" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Заблокировано</p>
              <p className="text-xl font-bold">{stats.blocked}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="glass-ios border border-sky-500/15 bg-slate-900/50 p-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              value={filters.full_name || ""}
              onChange={(e) => setFilters((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="Поиск по ФИО..."
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          
          <select
            value={filters.role || ""}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">Все роли</option>
            <option value="USER">Пользователь</option>
            <option value="ADMIN">Администратор</option>
          </select>
          
          <select
            value={filters.status_filter || ""}
            onChange={(e) => setFilters((f) => ({ ...f, status_filter: e.target.value }))}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">Все</option>
            <option value="active">Активные</option>
            <option value="deleted">Удалённые</option>
          </select>
          
          <button
            onClick={() => setFilters({})}
            className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
          >
            <FiFilter className="w-4 h-4" />
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Таблица пользователей */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10">
          <p className="text-red-300 text-sm flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FiLoader className="animate-spin w-8 h-8 text-blue-500 mb-3" />
          <p className="text-white/60">Загрузка пользователей...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-sky-500/15 bg-slate-900/50">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Пользователь</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Email</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Роль</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Статус</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Дата регистрации</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar_url || getFallbackAvatar(user.id)}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-white/10 bg-white/5"
                      />
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/70">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.role === "ADMIN" 
                        ? "bg-purple-500/20 text-purple-300" 
                        : "bg-white/10 text-white/70"
                    }`}>
                      {user.role === "ADMIN" ? "Администратор" : "Пользователь"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.is_deleted 
                        ? "bg-red-500/20 text-red-300" 
                        : user.is_active
                        ? "bg-green-500/20 text-green-300"
                        : "bg-yellow-500/20 text-yellow-300"
                    }`}>
                      {user.is_deleted ? "Удалён" : user.is_active ? "Активен" : "Не активен"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/70">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal({ mode: "edit", type: "user", data: user, onSuccess: loadUsers })}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                        disabled={currentUserId === user.id}
                        title="Редактировать"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setModal({ mode: "reset", type: "user", data: user, onSuccess: loadUsers })}
                        className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                        title="Сбросить пароль"
                      >
                        <FiKey className="w-4 h-4" />
                      </button>
                      {user.is_deleted ? (
                        <button
                          onClick={() => setModal({ mode: "edit", type: "user", data: { ...user, restore: true }, onSuccess: loadUsers })}
                          className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                          title="Восстановить"
                        >
                          <FiCheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setModal({ mode: "delete", type: "user", data: user, onSuccess: loadUsers })}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                          disabled={currentUserId === user.id}
                          title="Удалить"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-white/60" colSpan={6}>
                    <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <h3 className="text-lg font-semibold mb-2">Пользователи не найдены</h3>
                    <p className="text-white/60">Попробуйте изменить параметры поиска</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const EventsBlock: React.FC<{ 
  api: AxiosInstance; 
  disabled: boolean;
  setModal: (modal: ModalState | null) => void;
}> = ({ api, disabled, setModal }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadEvents = async () => {
    if (disabled) return;
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<Event[]>("/auth/events", { params });
      setEvents(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Не удалось загрузить события");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!disabled) {
      loadEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, disabled]);

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.short_description && event.short_description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    active: events.filter(e => e.status === "active").length,
    upcoming: events.filter(e => e.status === "upcoming").length,
    past: events.filter(e => e.status === "past").length,
    totalParticipants: events.reduce((acc, e) => acc + e.participants.length, 0)
  };

  return (
    <section className="p-6 space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FiCalendar className="w-5 h-5 text-blue-400" />
            Управление событиями
          </h2>
          <p className="text-white/60 text-sm">Всего событий: {events.length}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input 
              type="text" 
              placeholder="Поиск событий..." 
              className="pl-10 pr-3 py-2.5 rounded-lg bg-slate-900/60 border border-sky-500/20 text-white placeholder-white/40 focus:outline-none focus:border-sky-500/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setModal({ mode: "create", type: "event", onSuccess: loadEvents })}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-700 hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Создать событие
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-ios border border-sky-500/15 bg-slate-900/50 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-green-300" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Активных</p>
              <p className="text-xl font-bold">{stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-ios border border-sky-500/15 bg-slate-900/50 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Предстоящих</p>
              <p className="text-xl font-bold">{stats.upcoming}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-ios border border-sky-500/15 bg-slate-900/50 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Прошедших</p>
              <p className="text-xl font-bold">{stats.past}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-ios border border-sky-500/15 bg-slate-900/50 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Участников</p>
              <p className="text-xl font-bold">{stats.totalParticipants}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="glass-ios border border-sky-500/15 bg-slate-900/50 p-4 rounded-xl">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-slate-900/60 border border-sky-500/20 text-white focus:outline-none focus:border-sky-500/60"
          >
            <option value="">Все статусы</option>
            <option value="active">Активные</option>
            <option value="upcoming">Предстоящие</option>
            <option value="past">Прошедшие</option>
          </select>
          
          <button 
            onClick={loadEvents} 
            className="px-4 py-2.5 rounded-lg bg-slate-900/60 border border-sky-500/20 hover:bg-slate-900/80 transition-colors flex items-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Обновить
          </button>
        </div>
      </div>

      {/* Список событий */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10">
          <p className="text-red-300 text-sm flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FiLoader className="animate-spin w-8 h-8 text-blue-500 mb-3" />
          <p className="text-white/60">Загрузка событий...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredEvents.map((event) => (
            <div key={event.id} className="glass-ios border border-white/10 p-5 rounded-xl space-y-4 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                  <p className="text-white/60 text-sm mb-3 line-clamp-2">{event.short_description}</p>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                      <FiMapPin className="w-4 h-4" />
                      {event.city || "—"}
                    </span>
                    <span>•</span>
                    <span>{event.participants.length} участников</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  event.status === "active" 
                    ? "bg-green-500/20 text-green-300" 
                    : event.status === "upcoming"
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-white/10 text-white/70"
                }`}>
                  {event.status === "active" ? "Активно" : 
                   event.status === "upcoming" ? "Предстоящее" : "Прошедшее"}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="text-white/60">
                  <div>Начало: {new Date(event.start_date).toLocaleDateString()}</div>
                  <div>Конец: {new Date(event.end_date).toLocaleDateString()}</div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setModal({ mode: "edit", type: "event", data: event, onSuccess: loadEvents })}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                    title="Редактировать"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setModal({ mode: "delete", type: "event", data: event, onSuccess: loadEvents })}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                    title="Удалить"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                    title="Статистика"
                  >
                    <FiBarChart2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredEvents.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <FiCalendar className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-semibold mb-2">События не найдены</h3>
              <p className="text-white/60">Попробуйте изменить параметры поиска или создайте новое событие</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const Modal: React.FC<{ 
  modal: ModalState; 
  onClose: () => void;
  api: AxiosInstance;
}> = ({ modal, onClose, api }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ full_name: "", email: "", role: "USER", password: "", password_confirm: "" });
  const [confirmCode, setConfirmCode] = useState("");
  const [form, setForm] = useState<EventFormState>({
    title: "",
    short_description: "",
    description: "",
    start_date: "",
    end_date: "",
    image_url: "",
    city: "",
    payment_info: "",
    max_participants: null,
    participant_ids: "",
    status: "active",
  });
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (modal.mode === "edit" && modal.data) {
      if (modal.type === "event") {
        setForm({
          title: modal.data.title,
          short_description: modal.data.short_description || "",
          description: modal.data.description,
          start_date: modal.data.start_date.substring(0, 16),
          end_date: modal.data.end_date.substring(0, 16),
          image_url: modal.data.image_url,
          city: modal.data.city,
          payment_info: modal.data.payment_info || "",
          max_participants: modal.data.max_participants || null,
          participant_ids: modal.data.participants.join(","),
          status: modal.data.status,
        });
      } else if (modal.type === "user") {
        setUserForm({
          full_name: modal.data.full_name,
          email: modal.data.email,
          role: modal.data.role,
          password: "",
          password_confirm: "",
        });
      }
    } else if (modal.mode === "create" && modal.type === "user") {
      setUserForm({ full_name: "", email: "", role: "USER", password: "", password_confirm: "" });
    }
  }, [modal]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      if (modal.type === "user") {
        if (modal.mode === "edit" && modal.data) {
          await api.put(`/auth/admin/users/${modal.data.id}`, {
            full_name: userForm.full_name,
            role: modal.data.role,
          });
          if (modal.data.restore) {
            await api.post(`/auth/admin/users/${modal.data.id}/restore`);
          }
        } else if (modal.mode === "reset" && modal.data) {
          await api.post(`/auth/admin/users/${modal.data.id}/reset-password`, {
            new_password: newPassword,
          });
        } else if (modal.mode === "delete" && modal.data) {
          await api.delete(`/auth/admin/users/${modal.data.id}`);
        } else if (modal.mode === "create") {
          await api.post("/auth/register", {
            full_name: userForm.full_name,
            email: userForm.email,
            password: userForm.password,
            password_confirm: userForm.password_confirm,
          });
          // Если есть код, подтверждаем email, чтобы активировать пользователя
          if (confirmCode.trim()) {
            await api.post("/auth/confirm-email", { email: userForm.email, code: confirmCode.trim() });
          }
          // Если выбрана роль ADMIN, обновляем роль после регистрации
          if (userForm.role === "ADMIN") {
            try {
              const res = await api.get("/auth/admin/users", { params: { full_name: userForm.full_name } });
              const created = res.data?.find((u: any) => u.email === userForm.email);
              if (created) {
                await api.put(`/auth/admin/users/${created.id}`, { role: "ADMIN", full_name: created.full_name });
              }
            } catch (e) {
              /* ignore */
            }
          }
        }
      } else if (modal.type === "event") {
        if (modal.mode === "create") {
          const payload = {
            ...form,
            max_participants: form.max_participants ? Number(form.max_participants) : null,
            participant_ids: form.participant_ids
              ? form.participant_ids.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
          };
          await api.post("/auth/events", payload);
        } else if (modal.mode === "edit" && modal.data) {
          const payload = {
            ...form,
            max_participants: form.max_participants ? Number(form.max_participants) : null,
            participant_ids: form.participant_ids
              ? form.participant_ids.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
          };
          await api.put(`/auth/events/${modal.data.id}`, payload);
        } else if (modal.mode === "delete" && modal.data) {
          await api.delete(`/auth/events/${modal.data.id}`);
        }
      }

      modal.onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (modal.type === "user") {
      switch (modal.mode) {
        case "edit": return "Редактировать пользователя";
        case "reset": return "Сбросить пароль";
        case "delete": return "Удалить пользователя";
        case "create": return "Добавить пользователя";
      }
    } else {
      switch (modal.mode) {
        case "edit": return "Редактировать событие";
        case "delete": return "Удалить событие";
        case "create": return "Создать событие";
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-indigo-500/30 rounded-2xl shadow-2xl shadow-black/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 mb-6">
              <p className="text-red-300 text-sm flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          {modal.mode === "delete" ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-300">
                  Вы собираетесь удалить {modal.type === "user" ? "пользователя" : "событие"}: 
                  <strong> {modal.type === "user" ? modal.data?.full_name : modal.data?.title}</strong>
                </p>
                <p className="text-sm text-white/60 mt-2">
                  Это действие нельзя отменить. Все данные будут удалены.
                </p>
              </div>
            </div>
          ) : modal.mode === "reset" ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  Пароль будет сброшен для пользователя: <strong>{modal.data?.full_name}</strong>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Новый пароль</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                  placeholder="Введите новый пароль"
                />
              </div>
            </div>
          ) : modal.mode === "create" && modal.type === "user" ? (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">ФИО</label>
                  <input
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm((f) => ({ ...f, full_name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="ФИО"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Роль</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="USER">Пользователь</option>
                    <option value="ADMIN">Администратор</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Пароль</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="Пароль"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Повтор пароля</label>
                  <input
                    type="password"
                    value={userForm.password_confirm}
                    onChange={(e) => setUserForm((f) => ({ ...f, password_confirm: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="Повторите пароль"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Код подтверждения (из письма)</label>
                  <input
                    type="text"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="Введите код, если хотите активировать сразу"
                  />
                  <p className="text-xs text-white/50 mt-1">Код придёт на указанный email.</p>
                </div>
              </div>
            </div>
          ) : modal.type === "event" ? (
            <div className="grid gap-4">
              <input
                name="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Название события"
                className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
              />
              
              <input
                name="short_description"
                value={form.short_description}
                onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
                placeholder="Краткое описание"
                className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
              />
              
              <textarea
                name="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Полное описание"
                className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                rows={3}
              />
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Начало</label>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Конец</label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Город</label>
                <AdminCitySelector
                  selectedCity={form.city}
                  setSelectedCity={(city) => setForm((f) => ({ ...f, city }))}
                />
              </div>
              
              <input
                name="image_url"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="URL изображения"
                className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
              />
              
              <textarea
                name="payment_info"
                value={form.payment_info}
                onChange={(e) => setForm((f) => ({ ...f, payment_info: e.target.value }))}
                placeholder="Информация по оплате"
                className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                rows={2}
              />
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Макс. участников</label>
                  <input
                    type="number"
                    name="max_participants"
                    value={form.max_participants ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, max_participants: Number(e.target.value) || null }))}
                    placeholder="Неограниченно"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">ID участников</label>
                  <input
                    name="participant_ids"
                    value={form.participant_ids}
                    onChange={(e) => setForm((f) => ({ ...f, participant_ids: e.target.value }))}
                    placeholder="Через запятую"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Статус</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="active">Активно</option>
                  <option value="upcoming">Предстоящее</option>
                  <option value="past">Прошедшее</option>
                </select>
              </div>
            </div>
          ) : (
            // Форма для редактирования пользователя
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">ФИО</label>
                <input 
                  type="text" 
                  defaultValue={modal.data?.full_name || ""}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                  placeholder="Введите ФИО"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
                <input 
                  type="email" 
                  defaultValue={modal.data?.email || ""}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                  placeholder="email@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Роль</label>
                <select 
                  defaultValue={modal.data?.role || "USER"}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="USER">Пользователь</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <button
              onClick={handleSave}
              disabled={loading}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                modal.mode === "delete"
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  : "bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <FiLoader className="animate-spin h-4 w-4 text-white" />
                  Обработка...
                </span>
              ) : (
                modal.mode === "delete" ? "Удалить" : "Сохранить"
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
