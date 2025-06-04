import React from "react";
import Image from "next/image";
import styles from "@/styles/Home.module.css"; // Importer les styles

import { HourlyForecast, DailyForecast } from "@/types/weather"; // Importer les types
import { formatHour, formatDay } from "@/utils/weather"; // Importer les utilitaires
interface ForecastSectionProps {
  weather: {
    hourly: HourlyForecast[];
    daily: DailyForecast[];
    timezone: string;
  } | null;
}

const ForecastSection: React.FC<ForecastSectionProps> = ({ weather }) => {
  // Ne plus recevoir formatHour et formatDay en props
  if (!weather) {
    return null; // N'affiche rien si les données météo ne sont pas chargées
  }

  return (
    <>
      {weather.hourly && weather.hourly.length > 0 ? (
        <section className={`${styles.card} ${styles.hourlyForecastSection}`}>
          <h3 className={styles.forecastTitle}>
            Prévisions pour les prochaines heures
          </h3>
          <div className={styles.forecastList}>
            {weather.hourly.slice(1, 9).map(
              (
                hour // Afficher 8 prochaines heures
              ) => (
                <div key={hour.dt} className={styles.forecastItem}>
                  <p className={styles.forecastTime}>
                    {formatHour(hour.dt, weather.timezone)}
                  </p>
                  <Image
                    src={`http://openweathermap.org/img/wn/${hour.weather[0].icon}.png`}
                    alt={hour.weather[0].description}
                    width={50}
                    height={50}
                  />
                  <p className={styles.forecastDescription}>
                    {hour.weather[0].description}
                  </p>
                  <p className={styles.forecastTemp}>
                    {Math.round(hour.temp)}°C
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      ) : (
        <section className={`${styles.card} ${styles.hourlyForecastSection}`}>
          <h3 className={styles.forecastTitle}>
            Prévisions pour les prochaines heures
          </h3>
          <p className={styles.emptyStateMessage}>
            Aucune prévision horaire disponible pour le moment.
          </p>
        </section>
      )}
      {weather.daily && weather.daily.length > 0 ? (
        <section className={`${styles.card} ${styles.dailyForecastSection}`}>
          <h3 className={styles.forecastTitle}>
            Prévisions pour les prochains jours
          </h3>
          <div className={styles.forecastList}>
            {weather.daily.slice(1, 8).map(
              (
                day // Afficher les 7 prochains jours
              ) => (
                <div key={day.dt} className={styles.forecastItem}>
                  <p className={styles.forecastTime}>
                    {formatDay(day.dt, weather.timezone)}
                  </p>
                  <Image
                    src={`http://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                    alt={day.weather[0].description}
                    width={50}
                    height={50}
                  />
                  <p className={styles.forecastDescription}>
                    {day.weather[0].description}
                  </p>
                  <p className={styles.forecastTemp}>
                    {Math.round(day.temp.max)}° / {Math.round(day.temp.min)}°
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      ) : (
        <section className={`${styles.card} ${styles.dailyForecastSection}`}>
          <h3 className={styles.forecastTitle}>
            Prévisions pour les prochains jours
          </h3>
          <p className={styles.emptyStateMessage}>
            Aucune prévision journalière disponible pour le moment.
          </p>
        </section>
      )}
    </>
  );
};

export default ForecastSection;
