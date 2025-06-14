// pages/api/weather.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Vérifier la méthode HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Cette route accepte uniquement les requêtes GET' 
    });
  }

  const { lat, lon } = req.query;

  // Validation des paramètres
  if (!lat || !lon) {
    return res.status(400).json({ 
      error: 'Missing parameters',
      message: 'Les paramètres lat et lon sont requis' 
    });
  }

  // Validation des valeurs de coordonnées
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

  try {
    // Récupérer la clé API depuis les variables d'environnement serveur
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    
    if (!apiKey) {
      console.error('Clé API OpenWeatherMap manquante');
      return res.status(500).json({ 
        error: 'Configuration error',
        message: 'Configuration serveur incorrecte' 
      });
    }

    // Appel à l'API OpenWeatherMap
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=alerts&appid=${apiKey}&units=metric&lang=fr`;
    
    const response = await fetch(weatherUrl);

    if (!response.ok) {
      console.error(`Erreur API OpenWeatherMap: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        return res.status(500).json({ 
          error: 'API authentication failed',
          message: 'Problème d\'authentification avec le service météo' 
        });
      }
      
      if (response.status === 404) {
        return res.status(404).json({ 
          error: 'Location not found',
          message: 'Aucune donnée météo disponible pour ces coordonnées' 
        });
      }

      return res.status(500).json({ 
        error: 'Weather service error',
        message: 'Service météo temporairement indisponible' 
      });
    }

    const weatherData = await response.json();
    
    // Ajouter un timestamp pour le cache
    weatherData.fetchedAt = new Date().toISOString();
    
    // Définir les headers de cache (5 minutes)
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    return res.status(200).json(weatherData);

  } catch (error) {
    console.error('Erreur lors de la récupération des données météo:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Erreur interne du serveur' 
    });
  }
}