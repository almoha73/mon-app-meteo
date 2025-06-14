// Dans votre src/pages/index.tsx, remplacez ces deux fonctions :

// Ancienne fonction fetchCityNameFromCoords (lignes ~42-56)
const fetchCityNameFromCoords = useCallback(async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    // Utiliser votre nouvelle route API au lieu de l'appel direct
    const response = await fetch(`/api/geocoding?lat=${latitude}&lon=${longitude}&limit=1`);
    if (!response.ok) {
      console.warn('Échec du géocodage inverse:', response.status);
      return null; // Retourner null au lieu de throw pour éviter de casser l'app
    }
    const data = await response.json();
    return data && data.length > 0 ? data[0].name : null;
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return null; // Retourner null au lieu de throw
  }
}, []);

// Ancienne fonction fetchWeatherData (lignes ~58-95)
const fetchWeatherData = useCallback(async (latitude: number, longitude: number, cityDisplayName?: string) => {
  setLoading(true);
  setCurrentCityData(null);
  setError(null);
  setWeather(null);
  setWeekendRainForecast([]);
  
  try {
    // Utiliser votre nouvelle route API au lieu de l'appel direct
    const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur API météo (${response.status}): ${response.statusText}`);
    }

    const data: OneCallWeatherData = await response.json();
    setWeather(data);
    setDisplayedCityName(cityDisplayName || data.timezone);
    
    if (cityDisplayName && cityDisplayName !== "Votre position actuelle") {
      setCurrentCityData({ name: cityDisplayName, lat: latitude, lon: longitude });
    }
    
    if (data && data.daily && data.timezone) {
      setWeekendRainForecast(getNextWeekendRainForecast(data.daily, data.timezone));
    }

  } catch (err) {
    if (err instanceof Error) {
      setError({ message: `Erreur lors de la récupération des données météo : ${err.message}`, source: 'api' });
    } else {
      setError({ message: "Erreur inconnue lors de la récupération des données météo.", source: 'api' });
    }
  } finally {
    setLoading(false);
  }
}, []);

// Et dans la fonction handleSearch (lignes ~170-190), remplacez l'appel de géocodage :
const handleSearch = async (event: React.FormEvent) => {
  event.preventDefault();
  if (!searchQuery.trim()) {
    setError({ message: "Veuillez entrer un nom de ville.", source: 'search' });
    return;
  }
  setLoading(true);
  setError(null);

  try {
    // Utiliser votre nouvelle route API
    const geoResponse = await fetch(`/api/geocoding?q=${encodeURIComponent(searchQuery)}&limit=1`);
    
    if (!geoResponse.ok) {
      const errorData = await geoResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur lors du géocodage de la ville (${geoResponse.status}).`);
    }
    
    const geoData = await geoResponse.json();
    if (geoData.length === 0) {
      setError({ message: `Ville "${searchQuery}" non trouvée.`, source: 'search' });
      setLoading(false);
      return;
    }
    const { lat, lon, name: cityNameFromGeo } = geoData[0];
    
    fetchWeatherData(lat, lon, cityNameFromGeo);

  } catch (err) {
    if (err instanceof Error) {
      setError({ message: err.message, source: 'search' });
    } else {
      setError({ message: "Erreur inconnue lors de la recherche de la ville.", source: 'search' });
    }
    setLoading(false);
  }
};