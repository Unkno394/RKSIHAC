"use client";

import React, { useState, useEffect, useRef } from "react";

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

interface CitySelectorProps {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  isDetectingLocation: boolean;
  detectUserLocation: () => void;
  showCityDropdown: boolean;
  setShowCityDropdown: (value: boolean) => void;
  locationStatus: "not_tried" | "detecting" | "success" | "failed";
  locationError: string | null;
}

const CitySelector: React.FC<CitySelectorProps> = ({
  selectedCity,
  setSelectedCity,
  isDetectingLocation,
  detectUserLocation,
  showCityDropdown,
  setShowCityDropdown,
  locationStatus,
  locationError,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
  }, [showCityDropdown, setShowCityDropdown]);

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

  // Автоматическое определение местоположения при загрузке компонента
  useEffect(() => {
    const savedCity = localStorage.getItem("userCity");
    
    if (!savedCity && locationStatus === "not_tried") {
      // Ждем немного перед автоматическим определением
      const timer = setTimeout(() => {
        detectUserLocation();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Фильтрация городов
  const filteredCities = searchQuery
    ? cities.filter(city =>
        city.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : cities.slice(0, 20); // Показываем только топ-20 городов по умолчанию

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setShowCityDropdown(false);
    setSearchQuery("");
    localStorage.setItem("userCity", cityName);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDetectLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    detectUserLocation();
    setShowCityDropdown(false); // Закрываем меню после выбора
  };

  return (
    <div className="mb-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Кнопка выбора города */}
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            className="flex items-center justify-between gap-3 bg-slate-800/70 hover:bg-slate-700/70 px-5 py-3.5 border border-white/15 rounded-xl transition-all duration-300 min-w-[240px] group backdrop-blur-sm"
            disabled={isDetectingLocation}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg
                  className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {locationStatus === "success" && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                )}
              </div>
              <div className="text-left">
                <div className="text-sm text-white/60 font-normal">Ваш город</div>
                <div className="font-semibold text-white text-lg tracking-tight">
                  {isDetectingLocation ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                      Определяем...
                    </span>
                  ) : (
                    selectedCity || "Выберите город"
                  )}
                </div>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-white/60 group-hover:text-white transition-all duration-300 ${
                showCityDropdown ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Выпадающее меню */}
          {showCityDropdown && (
            <div
              ref={menuRef}
              className="absolute top-full left-0 mt-3 w-full sm:w-[420px] bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-[99999] max-h-[500px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок */}
              <div className="p-5 border-b border-white/10 bg-gradient-to-b from-slate-800/80 to-slate-900/80">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg">Выбор города</h3>
                    <p className="text-sm text-white/60 mt-1">
                      {cities.length > 0 ? `${cities.length} городов` : "Загрузка..."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCityDropdown(false);
                      setSearchQuery("");
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Закрыть"
                  >
                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Кнопка определения местоположения */}
                <button
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 border border-blue-500/30 rounded-xl transition-all duration-300 group mb-4"
                >
                  {isDetectingLocation ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></span>
                      <span className="font-medium text-blue-300">Определяем ваше местоположение...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span className="font-medium text-white">Определить моё местоположение</span>
                    </>
                  )}
                </button>

                {/* Поле поиска */}
                <div className="relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Поиск города..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full px-12 py-3 bg-slate-800/60 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur-sm"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
                    >
                      <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Контент с городами */}
              <div className="overflow-y-auto max-h-[320px] custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-3"></div>
                    <p className="text-white/60">Загрузка списка городов...</p>
                  </div>
                ) : apiError ? (
                  <div className="p-5 text-center">
                    <div className="text-red-400 mb-2">⚠️</div>
                    <p className="text-white/70">{apiError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-3 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      Попробовать снова
                    </button>
                  </div>
                ) : filteredCities.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-white/40 text-2xl mb-3">🏙️</div>
                    <h4 className="font-medium text-white mb-1">Город не найден</h4>
                    <p className="text-sm text-white/60">Попробуйте изменить запрос</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {!searchQuery && (
                      <div className="px-4 py-3">
                        <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                          Популярные города
                        </div>
                      </div>
                    )}
                    
                    {filteredCities.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => handleCitySelect(city.name)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg mx-2 mb-1 transition-all duration-200 hover:bg-white/10 group ${
                          selectedCity === city.name ? "bg-blue-500/20 border border-blue-500/30" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 group-hover:bg-white/10">
                            <span className="text-xs font-medium text-white/70">
                              {city.name.charAt(0)}
                            </span>
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-white group-hover:text-blue-300 transition-colors">
                              {city.name}
                            </div>
                            <div className="text-xs text-white/50 flex items-center gap-2 mt-0.5">
                              <span>{city.subject}</span>
                              <span className="w-1 h-1 rounded-full bg-white/30"></span>
                              <span>{city.population.toLocaleString()} чел.</span>
                            </div>
                          </div>
                        </div>
                        {selectedCity === city.name && (
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Статус определения местоположения */}
              {(locationStatus === "success" || locationStatus === "failed" || locationError) && (
                <div className="border-t border-white/10 bg-slate-900/80 p-4">
                  {locationStatus === "success" && (
                    <div className="flex items-center gap-3 text-green-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm">
                        <span className="font-medium">Местоположение определено:</span>
                        <span className="ml-2 text-white/90">{selectedCity}</span>
                      </div>
                    </div>
                  )}
                  {locationStatus === "failed" && (
                    <div className="flex items-center gap-3 text-yellow-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.196 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="text-sm">
                        <span>Не удалось определить город. Используется {selectedCity} по умолчанию.</span>
                      </div>
                    </div>
                  )}
                  {locationError && (
                    <div className="flex items-center gap-3 text-red-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm">{locationError}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Индикатор статуса (вне меню) */}
        {!showCityDropdown && (
          <div className="flex items-center gap-2">
            {locationStatus === "success" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-sm text-green-300">Автоопределен</span>
              </div>
            )}
            {locationStatus === "failed" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className="text-sm text-yellow-300">Ростов по умолчанию</span>
              </div>
            )}
            {isDetectingLocation && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <span className="animate-spin rounded-full h-3 w-3 border-2 border-blue-400 border-t-transparent"></span>
                <span className="text-sm text-blue-300">Определяем...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitySelector;