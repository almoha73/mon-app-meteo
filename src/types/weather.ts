export interface LocationState {
  latitude: number;
  longitude: number;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface MinutelyForecast {
  dt: number; // Timestamp
  precipitation: number; // Volume de précipitation
}

export interface HourlyForecast {
  dt: number;
  temp: number;
  weather: WeatherCondition[];
  pop: number; // Probability of precipitation
  rain?: { "1h": number }; // Rain volume for the last hour (optional)
}

export interface DailyForecast {
  dt: number;
  temp: {
    day: number;
    min: number;
    max: number;
  };
  weather: WeatherCondition[];
}

export interface OneCallWeatherData {
  lat: number;
  lon: number;
  timezone: string;
  current: {
    dt: number;
    temp: number;
    feels_like: number;
    humidity: number;
    weather: WeatherCondition[];
  };
  minutely?: MinutelyForecast[]; // Prévisions à la minute pour 1 heure (peut être absent si pas de précipitation)
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  // Il peut y avoir aussi un champ 'alerts'
}

export interface FavoriteCity {
  name: string;
  lat: number;
  lon: number;
}
