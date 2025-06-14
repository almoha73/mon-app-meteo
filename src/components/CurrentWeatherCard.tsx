'use client';

import React from 'react';
import Image from 'next/image';
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
        <div>
          <h3>Actuellement :</h3>
          <p>Température : {weather.current.temp}°C</p>
          <p>Ressenti : {weather.current.feels_like}°C</p>
          <p>Humidité : {weather.current.humidity}%</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0' }}>
          <Image
            src={`http://openweathermap.org/img/wn/${weather.current.weather[0].icon}@2x.png`}
            alt={weather.current.weather[0].description}
            width={100} // Taille de l'icône @2x
            height={100} // Taille de l'icône @2x
          />
          <p style={{ textTransform: 'capitalize', marginTop: '5px', fontSize: '0.9em', textAlign: 'center' }}>
            {weather.current.weather[0].description}
          </p>
        </div>
      </div>

      {/* Sous-sections dans la carte principale */}
      {( (weather.minutely && weather.minutely.length > 0) || (rainForecastNextTwoHours) || weekendRainForecast.length > 0) && (
        <div className={styles.subCardContainer}>
          {/* Section Pluie dans l'heure (existante) */}
          {weather.minutely && weather.minutely.length > 0 && (
            <div className={styles.subCard}>
              <h4>Pluie dans l&apos;heure :</h4> {/* L'apostrophe est déjà échappée ici */}
              <p style={{ color: '#007bff', fontWeight: 'bold' }}>{getMinutelyRainForecast(weather.minutely)}</p>
           
            
            </div>
          )}
          {/* Section pour la prévision de pluie dans les 2 prochaines heures */}
          {rainForecastNextTwoHours && (
            <div className={styles.subCard}>
              <h4>Pluie dans les 2h :</h4>
              <p style={{ color: '#28a745', fontWeight: 'bold' }}>{rainForecastNextTwoHours}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default CurrentWeatherCard;