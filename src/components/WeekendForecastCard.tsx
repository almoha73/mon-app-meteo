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
          const isNoRain = msg.includes("Pas de") || msg.includes("pas de");
          
          // Utiliser les mêmes couleurs que pour les prévisions de pluie
          let textColor = "rgba(255, 255, 255, 0.9)"; // Blanc par défaut
          
          if (isRain) {
            textColor = "#FF3D00"; // Rouge-orange foncé très visible pour la pluie
          } else if (isNoRain) {
            textColor = "#2E7D32"; // Vert foncé très visible pour pas de pluie (même que rainSummaryText.good)
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