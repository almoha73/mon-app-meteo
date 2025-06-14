import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //output: 'export',
  images: {
    domains: ['openweathermap.org'],
    unoptimized: true, // Ajoutez cette ligne si vous utilisez <Image> et n'avez pas de fournisseur cloud
  },
};

export default nextConfig;

