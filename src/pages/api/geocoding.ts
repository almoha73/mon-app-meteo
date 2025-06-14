// src/pages/api/geocoding.ts - Version améliorée avec meilleure gestion d'erreurs
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
  console.log('🗺️ Geocoding API appelée:', {
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  if (req.method !== 'GET') {
    const errorResponse: ErrorResponse = {
      error: 'Method not allowed',
      message: 'Cette route accepte uniquement les requêtes GET'
    };
    return res.status(405).json(errorResponse);
  }

  const { q, lat, lon, limit = 5 } = req.query;

  // Validation : soit une query, soit des coordonnées
  if (!q && (!lat || !lon)) {
    const errorResponse: ErrorResponse = {
      error: 'Missing parameters',
      message: 'Paramètre q (ville) ou lat/lon (coordonnées) requis'
    };
    return res.status(400).json(errorResponse);
  }

  // Validation du limit
  const limitNum = parseInt(limit as string);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 10) {
    const errorResponse: ErrorResponse = {
      error: 'Invalid limit',
      message: 'Le paramètre limit doit être entre 1 et 10'
    };
    return res.status(400).json(errorResponse);
  }

  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Clé API OpenWeatherMap manquante pour le géocodage');
      const errorResponse: ErrorResponse = {
        error: 'Configuration error',
        message: 'Configuration serveur incorrecte - clé API manquante'
      };
      return res.status(500).json(errorResponse);
    }

    console.log('🔑 Clé API trouvée pour géocodage, longueur:', apiKey.length);

    let url: string;

    if (q) {
      // Géocodage direct (ville -> coordonnées)
      const cityQuery = (q as string).trim();
      if (cityQuery.length < 2) {
        const errorResponse: ErrorResponse = {
          error: 'Query too short',
          message: 'Le nom de ville doit contenir au moins 2 caractères'
        };
        return res.status(400).json(errorResponse);
      }

      url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityQuery)}&limit=${limitNum}&appid=${apiKey}`;
      console.log('🔍 Géocodage direct pour ville:', cityQuery);
    } else {
      // Géocodage inverse (coordonnées -> ville)
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
          details: `Lat: ${latitude}, Lon: ${longitude}`
        };
        return res.status(400).json(errorResponse);
      }

      url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=${limitNum}&appid=${apiKey}&lang=fr`;
      console.log('🔍 Géocodage inverse pour coordonnées:', { latitude, longitude });
    }

    console.log('🌐 URL d\'appel géocodage:', url.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(url);
    
    console.log('📡 Réponse API Géocodage:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorBody = await response.text();
        errorDetails = errorBody;
        console.error('❌ Erreur API Géocodage:', errorDetails);
      } catch (e) {
        console.error('❌ Impossible de lire le corps de l\'erreur géocodage');
      }

      if (response.status === 401) {
        const errorResponse: ErrorResponse = {
          error: 'API authentication failed',
          message: 'Clé API OpenWeatherMap invalide pour le géocodage',
          details: errorDetails
        };
        return res.status(500).json(errorResponse);
      }

      if (response.status === 429) {
        const errorResponse: ErrorResponse = {
          error: 'Rate limit exceeded',
          message: 'Limite de requêtes géocodage dépassée',
          details: errorDetails
        };
        return res.status(429).json(errorResponse);
      }

      const errorResponse: ErrorResponse = {
        error: 'Geocoding service error',
        message: 'Service de géocodage temporairement indisponible',
        details: `Status: ${response.status} - ${errorDetails}`
      };
      return res.status(500).json(errorResponse);
    }

    const data = await response.json();
    
    console.log('✅ Données géocodage reçues:', {
      resultCount: data.length,
      firstResult: data[0] ? data[0].name : 'Aucun résultat'
    });
    
    // Ajouter un timestamp et nettoyer les données
    const cleanedData = data.map((location: any) => ({
      name: location.name,
      local_names: location.local_names,
      lat: location.lat,
      lon: location.lon,
      country: location.country,
      state: location.state
    }));

    // Headers de cache (1 heure pour le géocodage)
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200');
    
    return res.status(200).json(cleanedData);

  } catch (error) {
    console.error('❌ Erreur lors du géocodage:', error);
    
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      message: 'Erreur interne du serveur de géocodage',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    };
    
    return res.status(500).json(errorResponse);
  }
}