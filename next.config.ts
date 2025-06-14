/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['openweathermap.org'],
    unoptimized: true,
  },
  eslint: {
    // Temporairement ignorer les erreurs ESLint en production
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Temporairement ignorer les erreurs TypeScript en production
    ignoreBuildErrors: false,
  },
  experimental: {
    // Désactiver le strict mode si nécessaire
    esmExternals: true,
  },
}

module.exports = nextConfig