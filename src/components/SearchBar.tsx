import React from 'react';
import styles from '@/styles/Home.module.css'; // Importer les styles

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (event: React.FormEvent) => Promise<void>;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, handleSearch }) => {
  return (
    <form onSubmit={handleSearch} className={styles.searchForm}>
      <input
        type="text"
        placeholder="Entrez un nom de ville"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={styles.searchInput}
      />
      <button type="submit" className={styles.searchButton}>Rechercher</button>
    </form>
  );
};

export default SearchBar;