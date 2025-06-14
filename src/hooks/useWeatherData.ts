// src/hooks/useWeatherData.ts
import { useState, useCallback } from 'react';
import { OneCallWeatherData, FavoriteCity } from '@/types/weather';

interface ErrorState {
  message: string;
  source?: 'api' | 'geolocation' | 'auth' | 'favorites' | 'search' | 'general';
}

export const useWeatherData = () => {
  const [weather, setWeather] = useState<OneCallWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [displayedCityName, setDisplayedCityName] = useState<string | null>(null);
  const [currentCityData, setCurrentCityData] = useState<FavoriteCity | null>(null);

  const fetchWeatherData = useCallback(async (
    latitude: number, 
    longitude: number, 
    cityDisplayName?: string
  ) => {
    setLoading(true);
    setError(null);
    setWeather(null);
    setCurrentCityData(null);

    try {
      // Utiliser notre API route sécurisée
      const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur API météo (${response.status})`);
      }

      const data: OneCallWeatherData = await response.json();
      setWeather(data);
      setDisplayedCityName(cityDisplayName || data.timezone);
      
      // Préparer les données de la ville pour les favoris
      if (cityDisplayName && cityDisplayName !== "Votre position actuelle") {
        setCurrentCityData({ 
          name: cityDisplayName, 
          lat: latitude, 
          lon: longitude 
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError({ 
        message: `Erreur lors de la récupération des données météo : ${errorMessage}`, 
        source: 'api' 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCityNameFromCoords = useCallback(async (
    latitude: number, 
    longitude: number
  ): Promise<string | null> => {
    try {
      const response = await fetch(`/api/geocoding?lat=${latitude}&lon=${longitude}&limit=1`);
      
      if (!response.ok) {
        console.warn('Échec du géocodage inverse:', response.status);
        return null;
      }
      
      const data = await response.json();
      return data && data.length > 0 ? data[0].name : null;
    } catch (error) {
      console.error("Erreur lors du géocodage inverse:", error);
      return null;
    }
  }, []);

  const searchCityByName = useCallback(async (cityName: string) => {
    if (!cityName.trim()) {
      setError({ message: "Veuillez entrer un nom de ville.", source: 'search' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Géocodage : convertir le nom de la ville en coordonnées
      const geoResponse = await fetch(`/api/geocoding?q=${encodeURIComponent(cityName.trim())}&limit=1`);
      
      if (!geoResponse.ok) {
        const errorData = await geoResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur lors du géocodage de la ville`);
      }

      const geoData = await geoResponse.json();
      
      if (geoData.length === 0) {
        setError({ 
          message: `Ville "${cityName}" non trouvée.`, 
          source: 'search' 
        });
        setLoading(false);
        return;
      }

      const { lat, lon, name: cityNameFromGeo } = geoData[0];
      
      // Récupérer la météo pour ces coordonnées
      await fetchWeatherData(lat, lon, cityNameFromGeo);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError({ 
        message: `Erreur lors de la recherche : ${errorMessage}`, 
        source: 'search' 
      });
      setLoading(false);
    }
  }, [fetchWeatherData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearData = useCallback(() => {
    setWeather(null);
    setDisplayedCityName(null);
    setCurrentCityData(null);
    setError(null);
  }, []);

  return {
    // États
    weather,
    loading,
    error,
    displayedCityName,
    currentCityData,
    
    // Actions
    fetchWeatherData,
    fetchCityNameFromCoords,
    searchCityByName,
    clearError,
    clearData,
    setError
  };
};