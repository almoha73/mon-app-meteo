import { MinutelyForecast, DailyForecast, HourlyForecast } from '@/types/weather'; // Importer les interfaces

// --- Fonctions Utilitaires Météo ---
// Fonction pour formater les prévisions de pluie à la minute
export const getMinutelyRainForecast = (minutelyData?: MinutelyForecast[]): string => {
  if (!minutelyData || minutelyData.length === 0) {
    return "Pas de données de précipitation pour la prochaine heure.";
  }

  const firstRainMinute = minutelyData.findIndex(minute => minute.precipitation > 0);

  if (firstRainMinute === -1) {
    return "Pas de précipitation prévue dans l'heure.";
  }

  if (firstRainMinute === 0) {
    return "Précipitations en cours ou imminentes !";
  }

  return `Précipitations prévues commençant dans environ ${firstRainMinute} minute(s).`;
};

// Fonction pour formater le timestamp en heure (ex: 14:00)
// Fonction pour formater le timestamp en heure (ex: 14:00)
export const formatHour = (timestamp: number, timezone: string): string => {
  return new Date(timestamp * 1000).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone, // Utiliser le timezone fourni par l'API pour la précision
  });
};

// Fonction pour formater le timestamp en jour de la semaine (ex: Lun.)
// Fonction pour formater le timestamp en jour de la semaine (ex: Lun.)
export const formatDay = (timestamp: number, timezone: string): string => {
  return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
    weekday: 'short', // 'short' pour Lun., 'long' pour Lundi
    timeZone: timezone,
  });
};

// Helper function to check if a weather ID corresponds to rain/drizzle/thunderstorm
const isRainyWeatherId = (weatherId: number): boolean => {
  return (weatherId >= 200 && weatherId < 300) || // Thunderstorm
         (weatherId >= 300 && weatherId < 400) || // Drizzle
         (weatherId >= 500 && weatherId < 600);   // Rain
};


// Fonction pour les prévisions de pluie du week-end prochain
export const getNextWeekendRainForecast = (dailyForecasts: DailyForecast[], timezone: string): string[] => {
  if (!dailyForecasts || dailyForecasts.length === 0) {
    return ["Données de prévisions journalières non disponibles."];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to midnight for date comparison

  const nextSaturdayTargetDate = new Date(today);
  const dayOfWeek = today.getDay(); // 0 (Sunday) - 6 (Saturday)

  const daysToAddForSaturday = (dayOfWeek === 6) ? 7 : (6 - dayOfWeek);
  nextSaturdayTargetDate.setDate(nextSaturdayTargetDate.getDate() + daysToAddForSaturday);

  const nextSundayTargetDate = new Date(nextSaturdayTargetDate);
  nextSundayTargetDate.setDate(nextSaturdayTargetDate.getDate() + 1);

  let saturdayForecastMsg: string | null = null;
  let sundayForecastMsg: string | null = null;

  const formatForecastForDay = (targetDate: Date, dayData: DailyForecast): string | null => {
    const forecastDateObj = new Date(dayData.dt * 1000);
    forecastDateObj.setHours(0, 0, 0, 0); // Normalize for comparison

    if (forecastDateObj.getTime() === targetDate.getTime()) {
      const dayName = targetDate.toLocaleDateString('fr-FR', { weekday: 'long', timeZone: timezone });
      const dateStr = targetDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      const weatherCondition = dayData.weather[0];
      const isRainExpected = isRainyWeatherId(weatherCondition.id);

      let rainInfo = "Pas de pluie prévue.";
      if (isRainExpected) {
        rainInfo = `Pluie prévue (${weatherCondition.description}).`;
      }
      return `${dayName} ${dateStr}: ${rainInfo}`;
    }
    return null;
  };

  for (const dayData of dailyForecasts) {
    if (!saturdayForecastMsg) saturdayForecastMsg = formatForecastForDay(nextSaturdayTargetDate, dayData);
    if (!sundayForecastMsg) sundayForecastMsg = formatForecastForDay(nextSundayTargetDate, dayData);
    if (saturdayForecastMsg && sundayForecastMsg) break;
  }

  const results: string[] = [];
  results.push(saturdayForecastMsg || `Samedi ${nextSaturdayTargetDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: timezone })}: Données non disponibles.`);
  results.push(sundayForecastMsg || `Dimanche ${nextSundayTargetDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: timezone })}: Données non disponibles.`);

  if (results.every(r => r.includes("Données non disponibles."))) {
    return [`Prévisions pour le week-end prochain (${nextSaturdayTargetDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: timezone })} - ${nextSundayTargetDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: timezone })}) non trouvées.`];
  }
  return results;
};

// Nouvelle fonction pour résumer les prévisions de pluie dans les 2 prochaines heures (basé sur les données hourly)
// Regarde les prévisions pour l'heure +1 et +2.
export const getHourlyRainForecastNextTwoHours = (hourlyData: HourlyForecast[] | undefined): string => {
  if (!hourlyData || hourlyData.length < 2) { // Besoin d'au moins les données pour H+1 (index 1)
    return "Prévisions horaires non disponibles pour la prochaine heure.";
  }

  // Regarder les prévisions pour l'heure +1 (index 1) et l'heure +2 (index 2)
  const hour1 = hourlyData[1];
  const hour2 = hourlyData.length >= 3 ? hourlyData[2] : undefined; // Safely get hour2

  // Stricter condition for "Pluie prévue" message: require a rainy weather ID
  const isRainyHour1 = isRainyWeatherId(hour1.weather[0].id);
  const isRainyHour2 = hour2 ? isRainyWeatherId(hour2.weather[0].id) : false;

  // Check for "Pluie prévue" based on rainy weather ID
  if (isRainyHour1 && isRainyHour2) {
    return "Pluie prévue dans la prochaine heure et l'heure suivante.";
  } else if (isRainyHour1) {
    return "Pluie prévue dans la prochaine heure.";
  } else if (isRainyHour2) {
    return "Pluie prévue dans l'heure suivante (entre 1h et 2h).";
  }

  // If no rainy weather ID, check for probability or small rain amount
  const popThresholdForPossible = 0.1; // Lower threshold for "possible" or "faible probabilité"
  const rainAmountThresholdForPossible = 0.1; // mm

  const possibleRainHour1 = hour1.pop > popThresholdForPossible || (hour1.rain && hour1.rain['1h'] > rainAmountThresholdForPossible);
  const possibleRainHour2 = hour2 ? (hour2.pop > popThresholdForPossible || (hour2.rain && hour2.rain['1h'] > rainAmountThresholdForPossible)) : false;

  if (possibleRainHour1 && possibleRainHour2) {
       const maxPop = Math.max(hour1.pop, hour2 ? hour2.pop : 0);
       return `Pluie possible dans les 2 prochaines heures (max ${(maxPop * 100).toFixed(0)}%).`;
  } else if (possibleRainHour1) {
       return `Pluie possible dans la prochaine heure (${(hour1.pop * 100).toFixed(0)}%).`;
  } else if (possibleRainHour2) {
       const popHour2 = hour2 ? hour2.pop : 0; // Safely get pop for the message
       return `Pluie possible dans l'heure suivante (${(popHour2 * 100).toFixed(0)}%).`;
  } else {
    // Vérifier si la probabilité est non nulle même si en dessous du seuil pour l'une des deux heures
    const maxPopNextTwoHours = Math.max(hour1.pop, hour2 ? hour2.pop : 0);
    if (maxPopNextTwoHours > 0) {
       return `Faible probabilité de pluie dans les 2 prochaines heures (max ${(maxPopNextTwoHours * 100).toFixed(0)}%).`;
    }
    return "Pas de pluie significative prévue dans les 2 prochaines heures.";
  }
};

// Nouvelle fonction utilitaire pour obtenir un résumé simple de la pluie dans la prochaine heure
// Note: Les données minutely couvrent 60 minutes.
export const summarizeMinutelyRain = (minutely: MinutelyForecast[] | undefined): string => {
  if (!minutely || minutely.length === 0) {
    return "Données de pluie minute par minute non disponibles.";
  }

  const firstRainMinuteIndex = minutely.findIndex(m => m.precipitation > 0);

  if (firstRainMinuteIndex === -1) {
    return "Pas de pluie significative prévue dans la prochaine heure.";
  }

  if (firstRainMinuteIndex === 0) {
    return "Pluie actuellement ou imminente.";
  }

  return `Pluie possible à partir de ${firstRainMinuteIndex} minute(s).`;
};