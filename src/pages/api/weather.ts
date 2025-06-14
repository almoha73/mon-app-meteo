// src/pages/api/weather.ts - Version améliorée avec meilleure gestion d'erreurs
import { NextApiRequest, NextApiResponse } from 'next';

// Interface pour une réponse d'erreur standardisée
interface ErrorResponse {
  error: string;
  message: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log de debug pour aider au diagnostic
  console.log('🌤️ Weather API appelée:', {
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Vérifier la méthode HTTP
  if (req.method !== 'GET') {
    const errorResponse: ErrorResponse = {
      error: 'Method not allowed',
      message: 'Cette route accepte uniquement les requêtes GET'
    };
    return res.status(405).json(errorResponse);
  }

  const { lat, lon } = req.query;

  // Validation des paramètres
  if (!lat || !lon) {
    const errorResponse: ErrorResponse = {
      error: 'Missing parameters',
      message: 'Les paramètres lat et lon sont requis'
    };
    return res.status(400).json(errorResponse);
  }

  // Validation des valeurs de coordonnées
  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lon as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    const errorResponse: ErrorResponse = {
      error: 'Invalid coordinates',
      message: 'Les coordonnées doivent être des nombres valides',
      details: `Reçu: lat=${lat}, lon=${lon}`
    };
    return res.status(400).json(errorResponse);
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    const errorResponse: ErrorResponse = {
      error: 'Invalid coordinate range',
      message: 'Les coordonnées sont en dehors des plages valides',
      details: `Lat doit être entre -90 et 90, Lon entre -180 et 180. Reçu: ${latitude}, ${longitude}`
    };
    return res.status(400).json(errorResponse);
  }

  try {
    // Récupérer la clé API depuis les variables d'environnement serveur
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Clé API OpenWeatherMap manquante dans les variables d\'environnement');
      const errorResponse: ErrorResponse = {
        error: 'Configuration error',
        message: 'Configuration serveur incorrecte - clé API manquante'
      };
      return res.status(500).json(errorResponse);
    }

    console.log('🔑 Clé API trouvée, longueur:', apiKey.length);

    // Construire l'URL pour l'API OpenWeatherMap
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=alerts&appid=${apiKey}&units=metric&lang=fr`;
    
    console.log('🌐 Appel API OpenWeatherMap pour:', { latitude, longitude });

    const response = await fetch(weatherUrl);

    console.log('📡 Réponse API OpenWeatherMap:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorBody = await response.text();
        errorDetails = errorBody;
        console.error('❌ Erreur API OpenWeatherMap:', errorDetails);
      } catch (e) {
        console.error('❌ Impossible de lire le corps de l\'erreur API');
      }

      if (response.status === 401) {
        const errorResponse: ErrorResponse = {
          error: 'API authentication failed',
          message: 'Clé API OpenWeatherMap invalide ou expirée',
          details: errorDetails
        };
        return res.status(500).json(errorResponse);
      }
      
      if (response.status === 404) {
        const errorResponse: ErrorResponse = {
          error: 'Location not found',
          message: 'Aucune donnée météo disponible pour ces coordonnées',
          details: errorDetails
        };
        return res.status(404).json(errorResponse);
      }

      if (response.status === 429) {
        const errorResponse: ErrorResponse = {
          error: 'Rate limit exceeded',
          message: 'Limite de requêtes API dépassée. Réessayez plus tard.',
          details: errorDetails
        };
        return res.status(429).json(errorResponse);
      }

      const errorResponse: ErrorResponse = {
        error: 'Weather service error',
        message: 'Service météo temporairement indisponible',
        details: `Status: ${response.status} - ${errorDetails}`
      };
      return res.status(500).json(errorResponse);
    }

    const weatherData = await response.json();
    
    console.log('✅ Données météo reçues avec succès:', {
      timezone: weatherData.timezone,
      hasCurrentData: !!weatherData.current,
      hasHourlyData: !!weatherData.hourly,
      hasDailyData: !!weatherData.daily
    });
    
    // Ajouter un timestamp pour le cache
    weatherData.fetchedAt = new Date().toISOString();
    
    // Définir les headers de cache (5 minutes)
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    return res.status(200).json(weatherData);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données météo:', error);
    
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      message: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    };
    
    return res.status(500).json(errorResponse);
  }
}