// src/components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import styles from '@/styles/Home.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Met à jour l'état pour afficher l'UI de fallback au prochain rendu
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log de l'erreur pour le debugging
    console.error('ErrorBoundary a capturé une erreur:', error, errorInfo);
    
    this.setState({ errorInfo });

    // Appeler le callback onError si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // En production, vous pourriez envoyer l'erreur à un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      // Exemple : Sentry.captureException(error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé ou l'UI par défaut
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={`${styles.card} ${styles.errorBoundaryContainer}`}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>
              Oops ! Une erreur inattendue s'est produite
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              Nous sommes désolés pour la gêne occasionnée. Cette erreur a été signalée à notre équipe.
            </p>
            
            {/* Afficher les détails de l'erreur en développement */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ 
                marginBottom: '1.5rem', 
                textAlign: 'left', 
                background: '#f8f9fa', 
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid #dee2e6'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Détails de l'erreur (développement)
                </summary>
                <pre style={{ 
                  fontSize: '0.8rem', 
                  overflow: 'auto', 
                  whiteSpace: 'pre-wrap',
                  margin: 0
                }}>
                  <strong>Erreur:</strong> {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      {'\n\n'}<strong>Stack trace:</strong>
                      {'\n'}{this.state.error.stack}
                    </>
                  )}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}<strong>Component stack:</strong>
                      {'\n'}{this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                className={`${styles.actionButton}`}
                style={{ backgroundColor: '#007bff' }}
              >
                Réessayer
              </button>
              <button
                onClick={() => window.location.reload()}
                className={`${styles.actionButton}`}
                style={{ backgroundColor: '#6c757d' }}
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;