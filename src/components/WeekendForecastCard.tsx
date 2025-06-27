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
          // Améliorer la détection de pluie/pas de pluie
          const isRain = msg.includes("Pluie prévue") || 
                        msg.includes("pluie prévue") || 
                        msg.includes("Pluie possible") ||
                        msg.includes("pluie possible");
          
          const isNoRain = msg.includes("Pas de pluie prévue") || 
                          msg.includes("pas de pluie prévue") ||
                          msg.includes("Pas de pluie") ||
                          msg.includes("pas de pluie");
          
          // Utiliser les mêmes couleurs que pour les prévisions de pluie
          let textColor = "rgba(255, 255, 255, 0.9)"; // Blanc par défaut
          
          if (isRain) {
            textColor = "#FF3D00"; // Rouge-orange foncé pour la pluie
          } else if (isNoRain) {
            textColor = "#2E7D32"; // Vert foncé pour pas de pluie
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
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: textColor,
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
                boxShadow: `
                  0 4px 15px rgba(0, 0, 0, 0.1),
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