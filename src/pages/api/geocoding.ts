// pages/api/geocoding.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Cette route accepte uniquement les requêtes GET' 
    });
  }

  const { q, lat, lon, limit = 5 } = req.query;

  // Validation : soit une query, soit des coordonnées
  if (!q && (!lat || !lon)) {
    return res.status(400).json({ 
      error: 'Missing parameters',
      message: 'Paramètre q (ville) ou lat/lon (coordonnées) requis' 
    });
  }

  // Validation du limit
  const limitNum = parseInt(limit as string);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 10) {
    return res.status(400).json({ 
      error: 'Invalid limit',
      message: 'Le paramètre limit doit être entre 1 et 10' 
    });
  }

  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    
    if (!apiKey) {
      console.error('Clé API OpenWeatherMap manquante');
      return res.status(500).json({ 
        error: 'Configuration error',
        message: 'Configuration serveur incorrecte' 
      });
    }

    let url: string;

    if (q) {
      // Géocodage direct (ville -> coordonnées)
      const cityQuery = (q as string).trim();
      if (cityQuery.length < 2) {
        return res.status(400).json({ 
          error: 'Query too short',
          message: 'Le nom de ville doit contenir au moins 2 caractères' 
        });
      }

      url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityQuery)}&limit=${limitNum}&appid=${apiKey}`;
    } else {
      // Géocodage inverse (coordonnées -> ville)
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ 
          error: 'Invalid coordinates',
          message: 'Les coordonnées doivent être des nombres valides' 
        });
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ 
          error: 'Invalid coordinate range',
          message: 'Les coordonnées sont en dehors des plages valides' 
        });
      }

      url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=${limitNum}&appid=${apiKey}&lang=fr`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Erreur API Géocodage: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        return res.status(500).json({ 
          error: 'API authentication failed',
          message: 'Problème d\'authentification avec le service de géocodage' 
        });
      }

      return res.status(500).json({ 
        error: 'Geocoding service error',
        message: 'Service de géocodage temporairement indisponible' 
      });
    }

    const data = await response.json();
    
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
    console.error('Erreur lors du géocodage:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Erreur interne du serveur' 
    });
  }
}