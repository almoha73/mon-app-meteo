// src/pages/index.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where
} from 'firebase/firestore';

import styles from '@/styles/Home.module.css';
import { auth, db, getFirebaseErrorMessage } from '@/lib/firebase';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWeatherData } from '@/hooks/useWeatherData';

// Components
import SearchBar from '@/components/SearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import CurrentWeatherCard from '@/components/CurrentWeatherCard';
import ForecastSection from '@/components/ForecastSection';
import FavoriteCitiesSection from '@/components/FavoriteCitiesSection';
import ToastNotification from '@/components/ToastNotification';
import WeekendForecastCard from '@/components/WeekendForecastCard';

// Types
import { FavoriteCity } from '@/types/weather';
import { getNextWeekendRainForecast, getHourlyRainForecastNextTwoHours } from '@/utils/weather';

interface ErrorState {
  message: string;
  source?: 'api' | 'geolocation' | 'auth' | 'favorites' | 'search' | 'general';
}

export default function Home() {
  // États principaux
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  
  // États pour les favoris
  const [favoriteCitiesList, setFavoriteCitiesList] = useState<FavoriteCity[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState<boolean>(false);
  const [isAddingFavorite, setIsAddingFavorite] = useState<boolean>(false);
  const [removingFavoriteId, setRemovingFavoriteId] = useState<string | null>(null);
  
  // États pour les notifications
  const [toastMessage, setToastMessage] = useState<string>('');
  const [weekendRainForecast, setWeekendRainForecast] = useState<string[]>([]);

  // États pour les erreurs
  const [error, setError] = useState<ErrorState | null>(null);
  const clearError = useCallback(() => setError(null), []);

  // Hooks personnalisés
  const { 
    location, 
    isGettingLocation, 
    isSupported: isGeolocationSupported, 
    requestLocation 
  } = useGeolocation();

  const {
    weather,
    loading: weatherLoading,
    error: weatherError,
    fetchWeatherData,
    displayedCityName,
    fetchCityNameFromCoords,
    currentCityData,
    searchCityByName,
  } = useWeatherData();

  // Fonction pour afficher un toast temporaire
  const showToast = useCallback((message: string, duration = 3000) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), duration);
  }, []);

  // Charger les villes favorites depuis Firestore
  const loadFavoriteCities = useCallback(async (userId: string) => {
    setFavoritesLoading(true);
    try {
      const favoritesRef = collection(db, 'favorites');
      // Requête simplifiée sans orderBy pour éviter l'index composite
      const q = query(
        favoritesRef, 
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const cities: FavoriteCity[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        cities.push({
          name: data.name,
          lat: data.lat,
          lon: data.lon
        });
      });
      
      // Trier côté client par nom
      cities.sort((a, b) => a.name.localeCompare(b.name));
      
      setFavoriteCitiesList(cities);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      setError({ 
        message: `Erreur lors du chargement des favoris : ${getFirebaseErrorMessage(error)}`, 
        source: 'favorites' 
      });
    } finally {
      setFavoritesLoading(false);
    }
  }, [setError]);

  // Gestion de l'authentification Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
      if (user) {
        loadFavoriteCities(user.uid);
      } else {
        setFavoriteCitiesList([]);
      }
    });

    return () => unsubscribe();
  }, [loadFavoriteCities]);

  // Connexion anonyme automatique
  const handleAnonymousSignIn = useCallback(async () => {
    if (user) return;
    
    try {
      setAuthLoading(true);
      await signInAnonymously(auth);
      showToast('Connexion réussie ! Vous pouvez maintenant sauvegarder vos favoris.');
    } catch (error) {
      console.error('Erreur lors de la connexion anonyme:', error);
      setError({ 
        message: `Erreur de connexion : ${getFirebaseErrorMessage(error)}`, 
        source: 'auth' 
      });
    } finally {
      setAuthLoading(false);
    }
  }, [user, showToast, setError]);

  // Déconnexion
  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      setFavoriteCitiesList([]);
      showToast('Déconnexion réussie.');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setError({ 
        message: `Erreur de déconnexion : ${getFirebaseErrorMessage(error)}`, 
        source: 'auth' 
      });
    }
  }, [showToast, setError]);

  // Ajouter une ville aux favoris
  const handleAddToFavorites = useCallback(async () => {
    if (!user || !currentCityData) return;

    // Vérifier si la ville n'est pas déjà dans les favoris
    const cityExists = favoriteCitiesList.some(
      city => city.name === currentCityData.name && 
               Math.abs(city.lat - currentCityData.lat) < 0.01 && 
               Math.abs(city.lon - currentCityData.lon) < 0.01
    );

    if (cityExists) {
      showToast(`${currentCityData.name} est déjà dans vos favoris.`);
      return;
    }

    setIsAddingFavorite(true);
    try {
      const favoritesRef = collection(db, 'favorites');
      await addDoc(favoritesRef, {
        userId: user.uid,
        name: currentCityData.name,
        lat: currentCityData.lat,
        lon: currentCityData.lon,
        createdAt: new Date()
      });

      setFavoriteCitiesList(prev => [...prev, currentCityData].sort((a, b) => a.name.localeCompare(b.name)));
      showToast(`${currentCityData.name} ajoutée aux favoris !`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      setError({ 
        message: `Erreur lors de l'ajout aux favoris : ${getFirebaseErrorMessage(error)}`, 
        source: 'favorites' 
      });
    } finally {
      setIsAddingFavorite(false);
    }
  }, [user, currentCityData, favoriteCitiesList, showToast, setError]);

  // Supprimer une ville des favoris
  const handleRemoveFavorite = useCallback(async (cityToRemove: FavoriteCity) => {
    if (!user) return;

    const cityId = `${cityToRemove.name}-${cityToRemove.lat}-${cityToRemove.lon}`;
    setRemovingFavoriteId(cityId);

    try {
      const favoritesRef = collection(db, 'favorites');
      // Requête simplifiée pour éviter les index composites
      const q = query(
        favoritesRef,
        where('userId', '==', user.uid),
        where('name', '==', cityToRemove.name)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Filtrer côté client pour trouver la correspondance exacte
      const matchingDoc = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return Math.abs(data.lat - cityToRemove.lat) < 0.01 && 
               Math.abs(data.lon - cityToRemove.lon) < 0.01;
      });
      
      if (matchingDoc) {
        await deleteDoc(doc(db, 'favorites', matchingDoc.id));
        
        setFavoriteCitiesList(prev => 
          prev.filter(city => 
            !(city.name === cityToRemove.name && 
              Math.abs(city.lat - cityToRemove.lat) < 0.01 && 
              Math.abs(city.lon - cityToRemove.lon) < 0.01)
          )
        );
        
        showToast(`${cityToRemove.name} supprimée des favoris.`);
      } else {
        showToast(`Ville non trouvée dans les favoris.`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
      setError({ 
        message: `Erreur lors de la suppression : ${getFirebaseErrorMessage(error)}`, 
        source: 'favorites' 
      });
    } finally {
      setRemovingFavoriteId(null);
    }
  }, [user, showToast, setError]);

  // Cliquer sur une ville favorite
  const handleFavoriteCityClick = useCallback(async (favCity: FavoriteCity) => {
    await fetchWeatherData(favCity.lat, favCity.lon, favCity.name);
  }, [fetchWeatherData]);

  // Géolocalisation
  const handleGeolocation = useCallback(async () => {
    console.log('[Geolocation] Début handleGeolocation');
    if (!isGeolocationSupported) {
      console.error('[Geolocation] Géolocalisation non supportée par le navigateur.');
      setError({
        message: "La géolocalisation n'est pas supportée par votre navigateur.",
        source: 'geolocation'
      });
      return;
    }

    try {
      clearError(); // Efface l'erreur locale de l'UI
      console.log('[Geolocation] Demande de la position...');
      const position = await requestLocation(); // De useGeolocation
      console.log('[Geolocation] Position obtenue:', position);

      if (!position || !position.latitude || !position.longitude) {
        console.error('[Geolocation] Coordonnées de position invalides ou non obtenues.');
        setError({ message: 'Impossible d\'obtenir les coordonnées GPS.', source: 'geolocation' });
        return;
      }

      console.log(`[Geolocation] Récupération du nom de la ville pour lat: ${position.latitude}, lon: ${position.longitude}`);
      // fetchCityNameFromCoords vient de useWeatherData
      const cityName = await fetchCityNameFromCoords(position.latitude, position.longitude);
      console.log('[Geolocation] Nom de la ville obtenu:', cityName);

      const finalCityName = cityName || "Votre position actuelle";
      console.log(`[Geolocation] Appel de fetchWeatherData avec lat: ${position.latitude}, lon: ${position.longitude}, ville: ${finalCityName}`);
      // fetchWeatherData vient de useWeatherData
      await fetchWeatherData(position.latitude, position.longitude, finalCityName);
      console.log('[Geolocation] fetchWeatherData terminé.');

    } catch (err) {
      console.error('[Geolocation] Erreur dans handleGeolocation:', err);
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue lors de la géolocalisation.";
      setError({ // Met à jour l'erreur locale de l'UI
        message: errorMessage,
        source: 'geolocation'
      });
    } finally {
      console.log('[Geolocation] Fin handleGeolocation');
    }
  }, [
    isGeolocationSupported,
    requestLocation,
    fetchWeatherData,
    fetchCityNameFromCoords,
    clearError, // local
    setError    // local
  ]);

  useEffect(() => {
    handleGeolocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recherche de ville
  const handleSearch = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      setError({ message: "Veuillez entrer un nom de ville.", source: 'search' });
      return;
    }

    clearError();
    await searchCityByName(searchQuery.trim());
    setSearchQuery(''); // Vider le champ après la recherche
  }, [searchQuery, searchCityByName, clearError, setError]);

  // Calculer les prévisions de pluie quand les données météo changent
  useEffect(() => {
    if (weather?.daily && weather?.timezone) {
      setWeekendRainForecast(getNextWeekendRainForecast(weather.daily, weather.timezone));
    } else {
      setWeekendRainForecast([]);
    }
  }, [weather]);

  // Calculer la prévision de pluie pour les 2 prochaines heures
  const rainForecastNextTwoHours = weather?.hourly ? 
    getHourlyRainForecastNextTwoHours(weather.hourly) : null;

  const isLoading = weatherLoading || isGettingLocation;

  // Nouvel état pour la date côté client
  const [clientDate, setClientDate] = useState<string>("");

  // useEffect pour définir la date au format souhaité
  useEffect(() => {
    setClientDate(
      new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  }, []);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.headerHero}>
          <h1 className={styles.heroTitle}>Météo & Tendance du Jour</h1>
          <div className={styles.heroDate}>
            {clientDate}
          </div>
          <div className={styles.heroSub}>
            🌦️ Consultez la météo en temps réel, où que vous soyez !
          </div>
        </div>

        {/* Section d'authentification */}
        <section className={styles.card}>
          <h3>Compte Utilisateur</h3>
          {authLoading ? (
            <p>Vérification du statut de connexion...</p>
          ) : user ? (
            <div>
              <p style={{ color: 'green', marginBottom: '10px' }}>
                ✅ Connecté (ID: {user.uid.substring(0, 8)}...)
              </p>
              <button onClick={handleSignOut} className={styles.actionButton}>
                Se déconnecter
              </button>
            </div>
          ) : (
            <div>
              <p style={{ color: 'orange', marginBottom: '10px' }}>
                ⚠️ Non connecté - Les favoris ne seront pas sauvegardés
              </p>
              <button onClick={handleAnonymousSignIn} className={styles.actionButton}>
                Se connecter pour sauvegarder les favoris
              </button>
            </div>
          )}
        </section>

        {/* Barre de recherche */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
        />

        {/* Bouton de géolocalisation */}
        <button 
          onClick={handleGeolocation} 
          className={styles.actionButton}
          disabled={isLoading}
          style={{ marginBottom: '25px' }}
        >
          {isGettingLocation ? 'Localisation en cours...' : 'Utiliser ma position actuelle 📍'}
        </button>

        {/* Villes favorites */}
        <FavoriteCitiesSection
          user={user}
          favoritesLoading={favoritesLoading}
          favoriteCitiesList={favoriteCitiesList}
          handleFavoriteCityClick={handleFavoriteCityClick}
          handleRemoveFavorite={handleRemoveFavorite}
          isAddingFavorite={isAddingFavorite}
          removingFavoriteId={removingFavoriteId}
        />

        {/* Spinner de chargement */}
        <LoadingSpinner isLoading={isLoading} />

        {/* Messages d'erreur */}
        <ErrorMessage error={weatherError || error} />

        {/* Carte météo actuelle */}
        <CurrentWeatherCard
          weather={weather}
          displayedCityName={displayedCityName}
          location={location}
          user={user}
          currentCityData={currentCityData}
          handleAddToFavorites={handleAddToFavorites}
          isAddingFavorite={isAddingFavorite}
          weekendRainForecast={weekendRainForecast}
          rainForecastNextTwoHours={rainForecastNextTwoHours}
        />

        <WeekendForecastCard forecasts={weekendRainForecast} />

        {/* Prévisions */}
        <ForecastSection weather={weather} />

        {/* Toast notifications */}
        <ToastNotification message={toastMessage} />
      </main>
    </div>
  );
}