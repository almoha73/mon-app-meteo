// src/hooks/useGeolocation.ts
import { useState, useCallback } from 'react';

interface LocationState {
  latitude: number;
  longitude: number;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);

  // Vérifier si la géolocalisation est supportée
  const isSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        reject(new Error('La géolocalisation n\'est pas supportée par votre navigateur.'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,  // Utiliser GPS si disponible
        timeout: 30000,           // Timeout de 30 secondes (augmenté de 15 à 30)
        maximumAge: 300000        // Cache de 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          let message: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Accès à la géolocalisation refusé. Veuillez autoriser l\'accès à votre position.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Position indisponible. Vérifiez que votre GPS est activé.';
              break;
            case error.TIMEOUT:
              message = 'Délai d\'attente dépassé pour obtenir votre position.';
              break;
            default:
              message = `Erreur de géolocalisation : ${error.message}`;
              break;
          }
          reject(new Error(message));
        },
        options
      );
    });
  }, [isSupported]);

  const requestLocation = useCallback(async (): Promise<LocationState> => {
    setIsGettingLocation(true);
    
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      const newLocation = { latitude, longitude };
      setLocation(newLocation);
      
      return newLocation;
    } catch (error) {
      throw error;
    } finally {
      setIsGettingLocation(false);
    }
  }, [getCurrentPosition]);

  const clearLocation = useCallback(() => {
    setLocation(null);
  }, []);

  // Fonction utilitaire pour formater les coordonnées
  const formatCoordinates = useCallback((loc: LocationState | null) => {
    if (!loc) return null;
    return {
      lat: parseFloat(loc.latitude.toFixed(6)),
      lon: parseFloat(loc.longitude.toFixed(6)),
      display: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
    };
  }, []);

  return {
    // États
    location,
    isGettingLocation,
    isSupported,
    
    // Actions
    requestLocation,
    clearLocation,
    
    // Utilitaires
    formatCoordinates
  };
};