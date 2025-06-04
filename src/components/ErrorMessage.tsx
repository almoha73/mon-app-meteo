import React from 'react';

interface ErrorState {
  message: string;
  source?: 'api' | 'geolocation' | 'auth' | 'favorites' | 'search' | 'general';
}

interface ErrorMessageProps {
  error: ErrorState | null;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  if (!error) {
    return null;
  }

  // Vous pouvez ajouter une logique ici pour styliser différemment en fonction de error.source
  // Par exemple: const errorStyle = error.source === 'api' ? { color: 'darkred' } : { color: 'red' };

  return (
    <p style={{ color: 'red', textAlign: 'center', marginTop: '20px', fontWeight: 'bold' }}>{error.message}</p>
  );
};

export default ErrorMessage;