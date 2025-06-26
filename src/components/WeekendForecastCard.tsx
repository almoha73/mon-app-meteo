import React from "react";
import styles from "@/styles/Home.module.css";

interface WeekendForecastCardProps {
  forecasts: string[];
}

const WeekendForecastCard: React.FC<WeekendForecastCardProps> = ({ forecasts }) => {
  if (!forecasts || forecasts.length === 0) return null;

  return (
    <section className={styles.card}>
      <h3 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        Prévisions week-end prochain
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {forecasts.map((msg, idx) => {
          // Déterminer le type de météo pour choisir la couleur appropriée
          const isRain = msg.includes("Pluie") || msg.includes("pluie");
          const isCloudy = msg.includes("couvert") || msg.includes("nuageux") || msg.includes("Couvert");
          const isNoRain = msg.includes("Pas de") || msg.includes("pas de");
          
          // Couleurs avec excellent contraste sur fond violet
          let textColor = "#FFFFFF"; // Blanc par défaut
          let backgroundColor = "rgba(255, 255, 255, 0.15)";
          let borderColor = "rgba(255, 255, 255, 0.3)";
          
          if (isRain) {
            textColor = "#FFFFFF";
            backgroundColor = "rgba(33, 150, 243, 0.8)"; // Bleu foncé avec opacité
            borderColor = "#2196F3";
          } else if (isCloudy) {
            textColor = "#000000";
            backgroundColor = "rgba(255, 193, 7, 0.9)"; // Jaune/orange avec forte opacité
            borderColor = "#FFC107";
          } else if (isNoRain) {
            textColor = "#000000";
            backgroundColor = "rgba(76, 175, 80, 0.9)"; // Vert avec forte opacité
            borderColor = "#4CAF50";
          }
          
          return (
            <li
              key={idx}
              className={styles.weekendForecastItem}
              style={{
                marginBottom: "1em",
                fontWeight: 700,
                textAlign: "center",
                fontSize: "1.15em",
                padding: "1em 1.2em",
                borderRadius: "15px",
                background: backgroundColor,
                backdropFilter: "blur(10px)",
                border: `2px solid ${borderColor}`,
                color: textColor,
                textShadow: textColor === "#FFFFFF" 
                  ? "0 2px 4px rgba(0, 0, 0, 0.5)" 
                  : "0 1px 2px rgba(255, 255, 255, 0.8)",
                boxShadow: `
                  0 4px 15px rgba(0, 0, 0, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3)
                `,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              {msg}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default WeekendForecastCard;