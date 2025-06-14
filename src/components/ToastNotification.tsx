'use client';

import React from 'react';
import styles from '@/styles/Home.module.css'; // Importer les styles

interface ToastNotificationProps {
  message: string;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message }) => {
  if (!message) {
    return null;
  }
  return (
    <div className={styles.toastNotification}>
      {message}
    </div>
  );
};

export default ToastNotification;