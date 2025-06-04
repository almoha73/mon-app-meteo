import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import { auth, db } from '@/lib/firebase'; // Importer les instances auth et db de Firebase
import { signInAnonymously, User } from 'firebase/auth';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc} from 'firebase/firestore';

// Importer les composants
import SearchBar from '@/components/SearchBar';
import FavoriteCitiesSection from '@/components/FavoriteCitiesSection';
import CurrentWeatherCard from '@/components/CurrentWeatherCard';
import ForecastSection from '@/components/ForecastSection';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ToastNotification from '@/components/ToastNotification';
// Import des utilitaires météo
import {getNextWeekendRainForecast, getHourlyRainForecastNextTwoHours } from '@/utils/weather'; // Assurez-vous que le chemin est correct et importez getHourlyRainForecastNextTwoHours
import { LocationState, OneCallWeatherData, FavoriteCity} from '@/types/weather'; // Importer les types

import styles from '@/styles/Home.module.css'; // Importer les styles

interface ErrorState {
  message: string;
  source?: 'api' | 'geolocation' | 'auth' | 'favorites' | 'search' | 'general';
}

export default function Home() {
  const [isClient, setIsClient] = useState(false); // État pour gérer le rendu côté client
  const [user, setUser] = useState<User | null>(null); // État pour l'utilisateur Firebase
  const [location, setLocation] = useState<LocationState | null>(null);
  const [weather, setWeather] = useState<OneCallWeatherData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayedCityName, setDisplayedCityName] = useState<string | null>(null); // Nom de la ville affichée
  const [currentCityData, setCurrentCityData] = useState<FavoriteCity | null>(null); // Pour stocker les données de la ville affichée (nom, lat, lon)
  const [favoriteCitiesList, setFavoriteCitiesList] = useState<FavoriteCity[]>([]);
  const [error, setError] = useState<ErrorState | null>(null); // État pour les messages d'erreur globaux
  const [loading, setLoading] = useState<boolean>(true); // État de chargement principal (météo, recherche, ajout/suppr favoris)
  const [authLoading, setAuthLoading] = useState<boolean>(true); // État de chargement de l'authentification Firebase
  const [favoritesLoading, setFavoritesLoading] = useState<boolean>(true); // État de chargement de la récupération des favoris
  const [notification, setNotification] = useState<string>(''); // État pour les notifications toast
  const [isAddingFavorite, setIsAddingFavorite] = useState<boolean>(false); // État de chargement pour l'ajout d'un favori
  const [isRemovingFavorite, setIsRemovingFavorite] = useState<string | null>(null); // Stocke l'ID de la ville en cours de suppression, ou null
  const [weekendRainForecast, setWeekendRainForecast] = useState<string[]>([]);
  const [currentFormattedDate, setCurrentFormattedDate] = useState<string>(''); // État pour la date formatée côté client
  const [rainForecastNextTwoHours, setRainForecastNextTwoHours] = useState<string | null>(null); // État pour la pluie dans les 2h (hourly)

   // Fonction pour récupérer le nom de la ville à partir des coordonnées (géocodage inversé)
   const fetchCityNameFromCoords = useCallback(async (latitude: number, longitude: number): Promise<string | null> => {

    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY; 
      const response = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}&lang=fr`);
      if (!response.ok) throw new Error('Failed to fetch city name');
      const data = await response.json();
      return data && data.length > 0 ? data[0].name : null;
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      return null;
    }
 
  }, []);

  // Effect pour indiquer que le composant est monté côté client et formater la date
  useEffect(() => {
    setIsClient(true);
    // Formater la date uniquement côté client pour éviter l'erreur d'hydratation
    setCurrentFormattedDate(getCurrentFormattedDate());
  }, []); // Runs once on mount

   // Effect to check for API key on initial mount and set a global error if missing
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY) {
      setError({ message: "Erreur de configuration : La clé API OpenWeatherMap est manquante. L'application ne pourra pas récupérer les données météo. Veuillez vérifier votre configuration.", source: 'general' });
      setLoading(false); // Stop main loading
      setAuthLoading(false); // Stop auth loading as app is non-functional
      // favoritesLoading depends on user auth, which might not proceed.
    }
  }, []); // Runs once on mount

  // Fonction refactorisée pour récupérer les données météo
  const fetchWeatherData = useCallback(async (latitude: number, longitude: number, cityDisplayName?: string) => {

    setLoading(true);
    setCurrentCityData(null); // Réinitialiser les données de la ville actuelle pour le bouton favori
    setError(null);
    setWeather(null); // Effacer les anciennes données météo avant de charger les nouvelles
    setWeekendRainForecast([]); // Réinitialiser les prévisions du week-end
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
      if (!apiKey) { // This check is redundant if the initial useEffect runs correctly, but kept as a safeguard.
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=alerts&appid=${apiKey}&units=metric&lang=fr`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur API météo (${response.status}): ${response.statusText}`);
      }

      const data: OneCallWeatherData = await response.json();
      setWeather(data);
      setDisplayedCityName(cityDisplayName || data.timezone); // Utilise le nom de ville fourni ou le timezone
      // Stocker les infos de la ville actuelle pour pouvoir l'ajouter aux favoris
      if (cityDisplayName && cityDisplayName !== "Votre position actuelle") {
        setCurrentCityData({ name: cityDisplayName, lat: latitude, lon: longitude });
      }
       // Calculer les prévisions du week-end prochain
      if (data && data.daily && data.timezone) {
        setWeekendRainForecast(getNextWeekendRainForecast(data.daily, data.timezone));
      }

      // Pour la position actuelle, on pourrait essayer de récupérer un nom de ville via reverse geocoding plus tard
    } catch (err) {
      if (err instanceof Error) { // Correction: Utiliser 'err' au lieu de 'error'
        setError({ message: `Erreur lors de la récupération des données météo : ${err.message}`, source: 'api' });
      } else {
        setError({ message: "Erreur inconnue lors de la récupération des données météo.", source: 'api' });
      }
    } finally {
      setLoading(false);
    }
  }, []); // fetchCityNameFromCoords est stable (useCallback avec []), donc pas besoin de l'inclure ici.

  // Fonction pour déclencher la récupération de la météo par géolocalisation
  const triggerGeolocationFetch = useCallback(async () => {
    setLoading(true); // Start loading
    setError(null); // Clear previous errors
    setWeather(null); // Clear previous weather data
    setDisplayedCityName(null); // Clear previous city name
    setCurrentCityData(null); // Clear current city data for favorites
    setWeekendRainForecast([]); // Clear previous forecasts
  

    if (!navigator.geolocation) {
      setError({ message: 'La géolocalisation n\'est pas supportée par votre navigateur.', source: 'geolocation' });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        const cityName = await fetchCityNameFromCoords(latitude, longitude);
        fetchWeatherData(latitude, longitude, cityName || "Votre position actuelle"); // Pass "Votre position actuelle" explicitly here
      },
      (err: GeolocationPositionError) => {
        setError({ message: `Erreur de géolocalisation : ${err.message}`, source: 'geolocation' });
        setLoading(false); // Stop loading on error
      }
    ); // Removed state setters from dependencies as they are stable
  }, [fetchCityNameFromCoords, fetchWeatherData]);

  // Effect pour calculer la prévision pluie 2h après que les données météo soient chargées
  useEffect(() => {
    if (weather && weather.hourly) {
      setRainForecastNextTwoHours(getHourlyRainForecastNextTwoHours(weather.hourly));
    }
  }, [weather]); // Dépend de l'état 'weather'


  // Effect for Authentication
  useEffect(() => {
    const authenticateUser = async () => {
      // Do not proceed if the specific API key error is already set from the initial check.
      if (error && error.source === 'general' && error.message.includes("Clé API OpenWeatherMap est manquante")) {
        // authLoading should have been set to false by the API key check effect.
        return; 
      }

      setAuthLoading(true); // Moved inside try block
      try { // Added missing try block
        const userCredential = await signInAnonymously(auth);
        setUser(userCredential.user);
      } catch (authError) {
        console.error("Erreur d'authentification anonyme:", authError);
        setError({ message: "Impossible de se connecter anonymement.", source: 'auth' });
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }; // End of authenticateUser function definition
    authenticateUser();
}, [error]); // Dependency on 'error'

  // Effect for fetching favorites AFTER user is authenticated
  useEffect(() => {
    if (user) {
      // Fetch favorites
      const fetchUserFavorites = async () => {
        setFavoritesLoading(true);
        try {
          // Ensure db is initialized before use
          if (!db) {
             console.error("Firestore DB is not initialized.");
             setFavoritesLoading(false);
             return;
          }
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data().favoriteCities) {
            setFavoriteCitiesList(userDocSnap.data().favoriteCities as FavoriteCity[]);
          } else {
            setFavoriteCitiesList([]); // No favorites or no document yet
            // Optionally create the user document here if it doesn't exist yet
            // await setDoc(userDocRef, { favoriteCities: [] });
          }
        } catch (e) {
          console.error("Error fetching favorites:", e);
          setError({ message: "Erreur lors du chargement des favoris.", source: 'favorites' });
        } finally {
           setFavoritesLoading(false);
        }
      };
      fetchUserFavorites();
    } else {
      // If user logs out or auth fails, clear favorites
      setFavoriteCitiesList([]);
      setFavoritesLoading(false); // Ensure loading is false if no user
    }
  }, [user]); // Only depends on user

  // Effect for initial geolocation and weather fetch AFTER user is authenticated
  // This effect replaces the duplicate one below it.
  useEffect(() => {
    // Trigger initial weather fetch based on geolocation once the user is authenticated,
   // and API key is present (implied by auth succeeding without the API key error).
    if (user && !authLoading && !weather && !location && 
        !(error && error.source === 'general' && error.message.includes("Clé API OpenWeatherMap est manquante"))) {
      triggerGeolocationFetch(); // Call the function to fetch weather
    }
  }, [user, authLoading, weather, location, triggerGeolocationFetch, error]);

  // Effect to clear notification after a few seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification('');
      }, 3000); // La notification disparaît après 3 secondes
      return () => clearTimeout(timer); // Nettoyer le timer si le composant est démonté ou si la notification change
    }
  }, [notification]);

  // Fonction pour obtenir la date actuelle formatée (appelée via useEffect pour le client)
  const getCurrentFormattedDate = (): string => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
   const dateString = new Date().toLocaleDateString('fr-FR', options);

    // Capitaliser la première lettre du jour de la semaine
    const parts = dateString.split(' ');
    if (parts.length > 0) {
      const weekday = parts[0];
      const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      parts[0] = capitalizedWeekday;
    }
    return parts.join(' ');
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault(); // Empêche le rechargement de la page par le formulaire
    if (!searchQuery.trim()) {
      setError({ message: "Veuillez entrer un nom de ville.", source: 'search' });
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY; // Define apiKey
      // 1. Géocodage : convertir le nom de la ville en lat/lon
      const geoResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=1&appid=${apiKey}` // Use defined apiKey
      );
      if (!geoResponse.ok) {
        throw new Error(`Erreur lors du géocodage de la ville (${geoResponse.status}).`);
      }
      const geoData = await geoResponse.json();
      if (geoData.length === 0) {
        setError({ message: `Ville "${searchQuery}" non trouvée.`, source: 'search' });
        setLoading(false);
        return;
      }
      const { lat, lon, name: cityNameFromGeo } = geoData[0];
      
      // 2. Récupérer la météo pour ces coordonnées
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

  const handleAddToFavorites = async () => {
    if (!user || !currentCityData) {
      setError({ message: "Impossible d'ajouter aux favoris : utilisateur non connecté ou pas de données de ville.", source: 'favorites' });
      return;
    }
    if (currentCityData.name === "Votre position actuelle") {
        setError({ message: "Vous ne pouvez pas ajouter votre position actuelle directement. Recherchez une ville nommée.", source: 'favorites' });
        return;
    }

    setIsAddingFavorite(true);
    setError(null);

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // L'utilisateur a déjà un document, ajouter la ville au tableau
        await updateDoc(userDocRef, {
          favoriteCities: arrayUnion(currentCityData) // arrayUnion évite les doublons si l'objet est identique
        });
      } else {
        // Premier favori pour cet utilisateur, créer le document
        await setDoc(userDocRef, {
          favoriteCities: [currentCityData]
        });
      }
      // Mettre à jour l'état local des favoris
      setFavoriteCitiesList(prevList => {
        const isAlreadyFavorite = prevList.some(
            favCity => favCity.name === currentCityData.name &&
                       favCity.lat === currentCityData.lat &&
                       favCity.lon === currentCityData.lon
        );
        if (!isAlreadyFavorite) return [...prevList, currentCityData];
        return prevList;
      });
     // Remplacer alert par setNotification
      setNotification(`${currentCityData.name} ajoutée aux favoris !`);
    } catch (favError) {
      console.error("Erreur lors de l'ajout aux favoris:", favError);
      setError({ message: `Erreur lors de l'ajout de ${currentCityData.name} aux favoris.`, source: 'favorites' });
    } finally {
      setIsAddingFavorite(false);
    }
  };

  // Fonction pour gérer le clic sur le bouton "Afficher ma position actuelle"
  const handleGoToCurrentLocation = () => {
    setSearchQuery(''); // Clear search bar when going back to current location
    triggerGeolocationFetch();
  };

  const handleFavoriteCityClick = (city: FavoriteCity) => {
    fetchWeatherData(city.lat, city.lon, city.name);
    setSearchQuery(city.name); // Optionnel: remplir la barre de recherche avec le nom du favori
  };

  const handleRemoveFavorite = async (cityToRemove: FavoriteCity) => {
    if (!user) {
      setError({ message: "Utilisateur non connecté. Impossible de supprimer le favori.", source: 'favorites' });
      return;
    }

    setIsRemovingFavorite(`${cityToRemove.name}-${cityToRemove.lat}-${cityToRemove.lon}`);
    setError(null);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        favoriteCities: arrayRemove(cityToRemove) // arrayRemove retire l'élément exact du tableau
      });

      // Mettre à jour l'état local
      setFavoriteCitiesList(prevList => prevList.filter(city => 
        !(city.name === cityToRemove.name && city.lat === cityToRemove.lat && city.lon === cityToRemove.lon)
      ));
      // alert(`${cityToRemove.name} supprimée des favoris.`); // Optionnel
    } catch (removeError) {
      console.error("Erreur lors de la suppression du favori:", removeError);
      setError({ message: `Erreur lors de la suppression de ${cityToRemove.name} des favoris.`, source: 'favorites' });
    } finally {
      setIsRemovingFavorite(null);
    }
  };


  return (
    <>
      <Head>
        <title>Mon App Météo</title>
        <meta name="description" content="Application météo avec Next.js et Firebase" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.container}> {/* Conteneur principal avec fond bleu clair */}
        <main className={styles.main}>
          <h1 className={styles.title}>Application Météo</h1>
          {isClient && <p className={styles.currentDate}>{currentFormattedDate}</p>}

          {/* Utilisation du composant SearchBar (correction: supprimer l'ancien JSX) */}
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
          />

          {/* Bouton pour afficher la météo de la position actuelle */}
          {/* Afficher le bouton si la géolocalisation est supportée */}
          {isClient && typeof navigator !== 'undefined' && navigator.geolocation && (
            <button
              onClick={handleGoToCurrentLocation}
              className={`${styles.actionButton} ${styles.myLocationButton}`} // Vous pouvez ajuster le style
              disabled={loading} // Désactiver le bouton pendant le chargement
            >Afficher ma position actuelle</button>
          )}


          {/* Utilisation du composant FavoriteCitiesSection (correction: supprimer l'ancien JSX) */}
          <FavoriteCitiesSection
            user={user}
            favoritesLoading={favoritesLoading}
            favoriteCitiesList={favoriteCitiesList}
            handleFavoriteCityClick={handleFavoriteCityClick}
            handleRemoveFavorite={handleRemoveFavorite}
            isAddingFavorite={isAddingFavorite} // Passer l'état de chargement
            removingFavoriteId={isRemovingFavorite} // Passer l'ID de la ville en cours de suppression
          /> {/* Correction: Fermer la balise section qui était restée ouverte */}

          {/* Utilisation du composant LoadingSpinner */}
          <LoadingSpinner isLoading={loading || authLoading} />

          {/* Utilisation du composant ErrorMessage */}
          <ErrorMessage error={error} />

          {/* Correction: Supprimer l'ancien paragraphe d'erreur redondant */}

          {/* Affichage du Skeleton Loader UNIQUEMENT si loading est true ET qu'il n'y a AUCUNE donnée météo précédente ET pas d'erreur */}
          {loading && !weather && !error && ( // Afficher le skeleton si loading est true ET weather est null ET pas d'erreur
            <section className={`${styles.card} ${styles.skeletonLoader}`}>
          {/* Le contenu du skeleton reste ici car il est spécifique à la structure de la carte météo */}
            <div className={styles.skeletonLine} style={{ width: '60%', height: '28px', marginBottom: '20px' }}></div> {/* Titre */}
            <div className={styles.skeletonLine} style={{ width: '40%', height: '16px' }}></div>
            <div className={styles.skeletonLine} style={{ width: '50%', height: '16px' }}></div>
            <div className={styles.skeletonLine} style={{ width: '45%', height: '16px' }}></div>
            <div className={styles.skeletonLine} style={{ width: '45%', height: '16px' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px' }}>
              <div className={styles.skeletonLine} style={{ width: '100px', height: '100px', borderRadius: '8px', marginRight: '15px' }}></div> {/* Image */}
              <div style={{ flex: 1 }}>
                <div className={styles.skeletonLine} style={{ width: '70%', height: '16px' }}></div>
              </div>
            </div>
          </section>
        )}

        {/* Utilisation du composant CurrentWeatherCard */}
        {!loading && weather && !error && ( // Afficher les données météo si loading est false ET weather n'est pas null ET pas d'erreur
          <CurrentWeatherCard
              weather={weather}
              displayedCityName={displayedCityName}
              location={location}
              user={user}
              currentCityData={currentCityData}
              isAddingFavorite={isAddingFavorite} // Passer l'état de chargement au bouton "Ajouter aux favoris"
              handleAddToFavorites={handleAddToFavorites}
              weekendRainForecast={weekendRainForecast} // weekendRainForecast est déjà géré
              rainForecastNextTwoHours={rainForecastNextTwoHours} // Passer la prévision pluie 2h
            />
        )}

        {/* Utilisation du composant ForecastSection */}
        {!loading && weather && !error && (
          <ForecastSection
            weather={weather}
            
          />
        )}

        {/* Notification Toast */}
        {/* Utilisation du composant ToastNotification (correction: supprimer l'ancien JSX) */}
          <ToastNotification message={notification} />
        

      </main>
      </div> {/* Cette div ferme styles.container */}
    </>
  )
}