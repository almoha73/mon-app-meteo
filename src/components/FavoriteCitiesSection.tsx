'use client';

import React from 'react';
import styles from '@/styles/Home.module.css'; // Importer les styles
import { User } from 'firebase/auth'; // Importer le type User
import { FavoriteCity } from '@/types/weather'; // Importer le type

interface FavoriteCitiesSectionProps {
  user: User | null; // Utiliser le type User importé de firebase/auth
  favoritesLoading: boolean;
  favoriteCitiesList: FavoriteCity[];
  handleFavoriteCityClick: (city: FavoriteCity) => void;
  handleRemoveFavorite: (city: FavoriteCity) => Promise<void>;
  isAddingFavorite: boolean; // Pour potentiellement désactiver les actions pendant l'ajout
  removingFavoriteId: string | null; // ID de la ville en cours de suppression
}

const FavoriteCitiesSection: React.FC<FavoriteCitiesSectionProps> = ({
  user,
  favoritesLoading,
  favoriteCitiesList,
  handleFavoriteCityClick,
  handleRemoveFavorite,
  isAddingFavorite,
  removingFavoriteId,
}) => {
  if (!user) {
    return null; // N'affiche rien si l'utilisateur n'est pas connecté
  }

  return (
    <section className={`${styles.card} ${styles.favoritesSection}`}>
      <h3 className={styles.favoritesTitle}>Vos Villes Favorites :</h3>

      {favoritesLoading && <p>Chargement des favoris...</p>}
      {!favoritesLoading && favoriteCitiesList.length > 0 ? (
        <ul className={styles.favoritesList}>
          {favoriteCitiesList.map(favCity => {
            const cityId = `${favCity.name}-${favCity.lat}-${favCity.lon}`;
            const isCurrentlyRemoving = removingFavoriteId === cityId;
            return (
            <li key={cityId} className={styles.favoriteItem}>
              <button
                onClick={() => handleFavoriteCityClick(favCity)}
                className={styles.favoriteCityButton}
                disabled={isAddingFavorite || !!removingFavoriteId}
              >
                {favCity.name}
              </button>
              <button
                onClick={() => handleRemoveFavorite(favCity)}
                className={styles.removeFavoriteButton}
                title={`Supprimer ${favCity.name} des favoris`}
                disabled={isAddingFavorite || !!removingFavoriteId || isCurrentlyRemoving}
              >
                {isCurrentlyRemoving ? (
                  <span className={styles.buttonSpinner}></span>
                ) : (
                  <>&times;</>
                )}
              </button>
            </li>
          )})}
        </ul>
      ) : !favoritesLoading && <p>Vous n&apos;avez pas encore de villes favorites.</p>}
    </section>
  );
};

export default FavoriteCitiesSection;