'use client';

import React from 'react';
import WeatherIcon from './WeatherIcon';
import styles from '@/styles/Home.module.css'; // Importer les styles
import { User } from 'firebase/auth'; // Importer le type User
import { OneCallWeatherData, FavoriteCity} from '@/types/weather'; // Importer les types
import { getMinutelyRainForecast } from '@/utils/weather'; // Importer l'utilitaire

interface CurrentWeatherCardProps {
  weather: OneCallWeatherData | null;
  displayedCityName: string | null;
  location: { latitude: number; longitude: number } | null;
  user: User | null; // Utiliser le type User importé de firebase/auth
  currentCityData: FavoriteCity | null;
  handleAddToFavorites: () => Promise<void>;
  isAddingFavorite: boolean; // État de chargement pour le bouton "Ajouter aux favoris"
  // getMinutelyRainForecast est maintenant importé, plus besoin de le passer en prop
  weekendRainForecast: string[];
    rainForecastNextTwoHours: string | null; // Nouvelle prop pour la prévision pluie dans les 2h (hourly)

}

const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  weather,
  displayedCityName,
  location,
  user,
  currentCityData,
  handleAddToFavorites,
  isAddingFavorite,
  weekendRainForecast,
    rainForecastNextTwoHours, // Récupérer la nouvelle prop pluie 2h

}) => {
  if (!weather) {
    return null; // N'affiche rien si les données météo ne sont pas chargées
  }

  return (
    <section className={`${styles.card} ${styles.weatherInfo}`}>
      <h2>Météo pour {displayedCityName || weather.timezone}</h2>
      {/* Affiche les coordonnées si c'est la météo par géolocalisation et que le nom affiché correspond */}
      {location && displayedCityName === "Votre position actuelle" && (
        <p style={{ fontSize: '0.8em', color: 'gray' }}>
          (Position : Lat: {location.latitude.toFixed(2)}, Lon: {location.longitude.toFixed(2)})
        </p>
      )}
      {/* Bouton Ajouter aux favoris */}
      {user && currentCityData && currentCityData.name !== "Votre position actuelle" && (
        <button 
          onClick={handleAddToFavorites} 
          className={`${styles.actionButton} ${styles.favoriteButton}`}
          disabled={isAddingFavorite} // Désactiver le bouton pendant l'ajout
        >
          {isAddingFavorite ? (
            <>
              Ajout en cours...
              <span className={styles.buttonSpinner}></span>
            </>
          ) : `Ajouter ${currentCityData.name} aux favoris ⭐`}
        </button>
      )}

      <div className={styles.currentWeatherDetails}>
  <div className={styles.currentWeatherInfo}>
    <h3>Actuellement&nbsp;:</h3>
    <p>🌡️ Température&nbsp;: <strong>{weather.current.temp}°C</strong></p>
    <p>🤗 Ressenti&nbsp;: <strong>{weather.current.feels_like}°C</strong></p>
    <p>💧 Humidité&nbsp;: <strong>{weather.current.humidity}%</strong></p>
  </div>
  <div className={styles.currentWeatherIconBlock}>
    <WeatherIcon icon={weather.current.weather[0].icon} size={90} />
    <div className={styles.currentWeatherDescription}>
      {weather.current.weather[0].description}
    </div>
  </div>
</div>

      {/* Résumé de la pluie */}
      {( (weather.minutely && weather.minutely.length > 0) || (rainForecastNextTwoHours) || weekendRainForecast.length > 0) && (
        <div className={styles.rainSummaryContainer}>
          {/* Pluie dans l'heure */}
          <div className={styles.rainSummaryBlock}>
            <span className={styles.rainIcon}>🌦️</span>
            <div>
              <h4>Pluie dans l&apos;heure :</h4>
              <p
                className={`${styles.rainSummaryText} ${
                  getMinutelyRainForecast(weather.minutely).includes('Pas de') ? styles.good : styles.bad
                }`}
              >
                {getMinutelyRainForecast(weather.minutely)}
              </p>
            </div>
          </div>
          {/* Pluie dans les 2h */}
          {rainForecastNextTwoHours && (
            <div className={styles.rainSummaryBlock}>
              <span className={styles.rainIcon}>⏱️</span>
              <div>
                <h4>Pluie dans les 2h :</h4>
                <p
                  className={`${styles.rainSummaryText} ${
                    rainForecastNextTwoHours.includes('Pas de') ? styles.good : styles.bad
                  }`}
                >
                  {rainForecastNextTwoHours}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default CurrentWeatherCard;