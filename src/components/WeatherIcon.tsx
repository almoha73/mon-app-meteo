import React from "react";

// Icônes SVG plus réalistes pour météo
const icons: Record<string, JSX.Element> = {
  // Soleil
  "01d": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="16" fill="#FFD93B" />
      <g stroke="#FFD93B" strokeWidth="4">
        <line x1="32" y1="4" x2="32" y2="16"/>
        <line x1="32" y1="48" x2="32" y2="60"/>
        <line x1="4" y1="32" x2="16" y2="32"/>
        <line x1="48" y1="32" x2="60" y2="32"/>
        <line x1="12" y1="12" x2="20" y2="20"/>
        <line x1="44" y1="44" x2="52" y2="52"/>
        <line x1="12" y1="52" x2="20" y2="44"/>
        <line x1="44" y1="20" x2="52" y2="12"/>
      </g>
    </svg>
  ),
  // Lune
  "01n": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <path d="M44 32a16 16 0 1 1-16-16c0 8.84 7.16 16 16 16z" fill="#FFD93B"/>
      <circle cx="32" cy="32" r="16" fill="#FFD93B" fillOpacity="0.5"/>
    </svg>
  ),
  // Peu nuageux jour
  "02d": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <circle cx="22" cy="36" r="10" fill="#FFD93B" />
      <ellipse cx="40" cy="40" rx="16" ry="10" fill="#B0C4DE" />
      <ellipse cx="48" cy="44" rx="8" ry="5" fill="#dbeafe" />
    </svg>
  ),
  // Peu nuageux nuit
  "02n": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="40" cy="40" rx="16" ry="10" fill="#B0C4DE" />
      <ellipse cx="48" cy="44" rx="8" ry="5" fill="#dbeafe" />
      <circle cx="22" cy="36" r="10" fill="#FFD93B" fillOpacity="0.5" />
    </svg>
  ),
  // Nuageux (plusieurs nuages)
  "03d": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="36" cy="40" rx="16" ry="10" fill="#B0C4DE" />
      <ellipse cx="28" cy="44" rx="10" ry="6" fill="#dbeafe" />
      <ellipse cx="44" cy="44" rx="8" ry="5" fill="#e0e7ef" />
    </svg>
  ),
  "03n": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="36" cy="40" rx="16" ry="10" fill="#B0C4DE" />
      <ellipse cx="28" cy="44" rx="10" ry="6" fill="#dbeafe" />
      <ellipse cx="44" cy="44" rx="8" ry="5" fill="#e0e7ef" />
    </svg>
  ),
  // Couvert (gros nuage)
  "04d": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="36" cy="40" rx="18" ry="12" fill="#A0A0A0" />
      <ellipse cx="28" cy="44" rx="12" ry="7" fill="#B0C4DE" />
      <ellipse cx="44" cy="44" rx="10" ry="6" fill="#dbeafe" />
    </svg>
  ),
  "04n": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="36" cy="40" rx="18" ry="12" fill="#A0A0A0" />
      <ellipse cx="28" cy="44" rx="12" ry="7" fill="#B0C4DE" />
      <ellipse cx="44" cy="44" rx="10" ry="6" fill="#dbeafe" />
    </svg>
  ),
  // Pluie (nuage + gouttes)
  "09d": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="36" cy="38" rx="16" ry="10" fill="#B0C4DE" />
      <ellipse cx="28" cy="42" rx="10" ry="6" fill="#dbeafe" />
      <ellipse cx="44" cy="42" rx="8" ry="5" fill="#e0e7ef" />
      <g>
        <ellipse cx="28" cy="54" rx="2" ry="5" fill="#3498db" />
        <ellipse cx="36" cy="56" rx="2" ry="5" fill="#3498db" />
        <ellipse cx="44" cy="54" rx="2" ry="5" fill="#3498db" />
      </g>
    </svg>
  ),
  "09n": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="36" cy="38" rx="16" ry="10" fill="#B0C4DE" />
      <ellipse cx="28" cy="42" rx="10" ry="6" fill="#dbeafe" />
      <ellipse cx="44" cy="42" rx="8" ry="5" fill="#e0e7ef" />
      <g>
        <ellipse cx="28" cy="54" rx="2" ry="5" fill="#3498db" />
        <ellipse cx="36" cy="56" rx="2" ry="5" fill="#3498db" />
        <ellipse cx="44" cy="54" rx="2" ry="5" fill="#3498db" />
      </g>
    </svg>
  ),
  // Pluie + soleil
  "10d": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <circle cx="20" cy="32" r="8" fill="#FFD93B" />
      <ellipse cx="38" cy="38" rx="14" ry="9" fill="#B0C4DE" />
      <ellipse cx="46" cy="42" rx="7" ry="4" fill="#dbeafe" />
      <g>
        <ellipse cx="32" cy="54" rx="2" ry="5" fill="#3498db" />
        <ellipse cx="40" cy="56" rx="2" ry="5" fill="#3498db" />
      </g>
    </svg>
  ),
  "10n": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="38" cy="38" rx="14" ry="9" fill="#B0C4DE" />
      <ellipse cx="46" cy="42" rx="7" ry="4" fill="#dbeafe" />
      <g>
        <ellipse cx="32" cy="54" rx="2" ry="5" fill="#3498db" />
        <ellipse cx="40" cy="56" rx="2" ry="5" fill="#3498db" />
      </g>
    </svg>
  ),
  // Orage
  "11d": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="36" cy="38" rx="16" ry="10" fill="#B0C4DE" />
      <polygon points="32,44 38,54 30,54 36,64" fill="#FFD93B" />
      <polyline points="32,44 36,54 30,54 34,64" fill="none" stroke="#FFD93B" strokeWidth="3"/>
    </svg>
  ),
  "11n": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="36" cy="38" rx="16" ry="10" fill="#B0C4DE" />
      <polygon points="32,44 38,54 30,54 36,64" fill="#FFD93B" />
      <polyline points="32,44 36,54 30,54 34,64" fill="none" stroke="#FFD93B" strokeWidth="3"/>
    </svg>
  ),
  // Neige
  "13d": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="36" cy="38" rx="16" ry="10" fill="#B0C4DE" />
      <g>
        <circle cx="28" cy="54" r="2" fill="#fff" />
        <circle cx="36" cy="56" r="2" fill="#fff" />
        <circle cx="44" cy="54" r="2" fill="#fff" />
      </g>
    </svg>
  ),
  "13n": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="36" cy="38" rx="16" ry="10" fill="#B0C4DE" />
      <g>
        <circle cx="28" cy="54" r="2" fill="#fff" />
        <circle cx="36" cy="56" r="2" fill="#fff" />
        <circle cx="44" cy="54" r="2" fill="#fff" />
      </g>
    </svg>
  ),
  // Brouillard
  "50d": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="32" cy="40" rx="18" ry="10" fill="#b0b0b0" opacity="0.7"/>
      <rect x="16" y="48" width="32" height="4" rx="2" fill="#b0b0b0" opacity="0.5"/>
      <rect x="12" y="54" width="40" height="4" rx="2" fill="#b0b0b0" opacity="0.3"/>
    </svg>
  ),
  "50n": (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <ellipse cx="32" cy="40" rx="18" ry="10" fill="#b0b0b0" opacity="0.7"/>
      <rect x="16" y="48" width="32" height="4" rx="2" fill="#b0b0b0" opacity="0.5"/>
      <rect x="12" y="54" width="40" height="4" rx="2" fill="#b0b0b0" opacity="0.3"/>
    </svg>
  ),
};

export default function WeatherIcon({ icon, size = 64 }: { icon: string; size?: number }) {
  return (
    <span style={{ display: "inline-block", width: size, height: size }}>
      {icons[icon] || icons["01d"]}
    </span>
  );
}