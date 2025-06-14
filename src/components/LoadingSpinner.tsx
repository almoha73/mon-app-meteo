'use client';

import React from 'react';
import styles from '@/styles/Home.module.css'; // Importer les styles

interface LoadingSpinnerProps {
  isLoading: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isLoading }) => {
  if (!isLoading) {
    return null;
  }
  return (
    <div className={styles.spinner}></div>
  );
};

export default LoadingSpinner;